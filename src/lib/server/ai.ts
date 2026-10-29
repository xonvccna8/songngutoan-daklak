// GĐ 6b — Gọi OpenAI (Responses API + structured output) và giới hạn số lần dùng mỗi ngày.
// Khoá chỉ nằm ở máy chủ (OPENAI_API_KEY); không gửi dữ liệu học sinh.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, type AuthedUser } from "@/lib/server/api";
import { vnDayKey } from "@/lib/live/summary";
import { AI_LIMITS } from "@/lib/lessons/ai-draft";

const MODEL = () => process.env.OPENAI_MODEL || "gpt-5.4-mini";

export interface AiResult<T> {
  data: T;
  usage: { input: number; output: number };
}

/** Gọi model, buộc trả JSON đúng khuôn `schema`. Lỗi → HttpError tiếng Việt. */
export async function aiJson<T>(opts: {
  name: string;
  schema: object;
  system: string;
  user: string;
  /** Các lượt hội thoại trước (Trợ lý học tập) — chèn giữa system và user */
  history?: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<AiResult<T>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new HttpError(503, "Chưa cấu hình trợ lý AI (thiếu OPENAI_API_KEY).");
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 110_000),
      body: JSON.stringify({
        model: MODEL(),
        reasoning: { effort: "low" },
        max_output_tokens: opts.maxTokens ?? 16_000,
        input: [{ role: "system", content: opts.system }, ...(opts.history ?? []), { role: "user", content: opts.user }],
        text: { format: { type: "json_schema", name: opts.name, strict: true, schema: opts.schema } },
      }),
    });
  } catch (e) {
    const timeout = (e as Error).name === "TimeoutError";
    throw new HttpError(504, timeout ? "AI trả lời quá lâu, thử lại với giáo án ngắn hơn." : "Không kết nối được tới dịch vụ AI.");
  }
  const j = (await res.json().catch(() => ({}))) as {
    status?: string;
    error?: { message?: string; code?: string };
    output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  if (!res.ok) {
    // Ghi mã lỗi để chẩn đoán trên Vercel Logs (không ghi khoá)
    console.error("openai:", res.status, j.error?.code, j.error?.message?.slice(0, 200));
    if (res.status === 429) throw new HttpError(429, "Dịch vụ AI đang quá tải hoặc hết hạn mức, thử lại sau.");
    if (res.status === 401) throw new HttpError(503, "Khoá AI không hợp lệ, báo quản trị kiểm tra.");
    throw new HttpError(502, "Dịch vụ AI báo lỗi, thử lại sau.");
  }
  const content = j.output?.find((o) => o.type === "message")?.content ?? [];
  if (content.some((c) => c.type === "refusal")) throw new HttpError(422, "AI từ chối yêu cầu này. Kiểm tra lại nội dung giáo án.");
  const text = content.find((c) => c.type === "output_text")?.text;
  if (j.status === "incomplete" || !text) throw new HttpError(502, "AI trả lời chưa trọn vẹn, thử lại với giáo án ngắn hơn.");
  try {
    return { data: JSON.parse(text) as T, usage: { input: j.usage?.input_tokens ?? 0, output: j.usage?.output_tokens ?? 0 } };
  } catch {
    throw new HttpError(502, "AI trả về dữ liệu không đọc được, thử lại.");
  }
}

// ---------- Giới hạn lượt dùng: lsn_aiUsage/{uid}_{ngày} và school_{id}_{ngày} ----------
const usageRefs = (user: AuthedUser, day: string) => {
  const col = adminDb().collection(COL.aiUsage);
  return { mine: col.doc(`${user.uid}_${day}`), school: col.doc(`school_${user.schoolId ?? "none"}_${day}`) };
};

/** Giữ chỗ 1 lượt (trước khi gọi AI). Hết lượt → 429. */
export async function reserveAiUse(user: AuthedUser, now = Date.now()) {
  const day = vnDayKey(now);
  const { mine, school } = usageRefs(user, day);
  await adminDb().runTransaction(async (tx) => {
    const [a, b] = await Promise.all([tx.get(mine), tx.get(school)]);
    if ((a.get("count") ?? 0) >= AI_LIMITS.perTeacherPerDay) throw new HttpError(429, `Hôm nay bạn đã dùng hết ${AI_LIMITS.perTeacherPerDay} lượt AI. Mai dùng tiếp nhé.`);
    if ((b.get("count") ?? 0) >= AI_LIMITS.perSchoolPerDay) throw new HttpError(429, "Trường đã dùng hết lượt AI hôm nay.");
    tx.set(mine, { uid: user.uid, schoolId: user.schoolId ?? null, day, count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(school, { schoolId: user.schoolId ?? null, day, count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return day;
}

/** Ghi số token (theo dõi chi phí), hoặc trả lại lượt nếu lỗi phía AI */
export async function finishAiUse(user: AuthedUser, day: string, r: { ok: true; input: number; output: number } | { ok: false }) {
  const { mine, school } = usageRefs(user, day);
  const batch = adminDb().batch();
  if (r.ok) {
    const inc = { inputTokens: FieldValue.increment(r.input), outputTokens: FieldValue.increment(r.output) };
    batch.set(mine, inc, { merge: true });
    batch.set(school, inc, { merge: true });
  } else {
    batch.set(mine, { count: FieldValue.increment(-1) }, { merge: true });
    batch.set(school, { count: FieldValue.increment(-1) }, { merge: true });
  }
  await batch.commit().catch((e) => console.error("aiUsage:", (e as Error).message));
}

// ---------- AI cho học sinh: bộ đếm lượt chung, nhận dạng giọng nói, lọc nội dung ----------

export const aiEnabled = () => !!process.env.OPENAI_API_KEY;

/**
 * Giữ 1 lượt cho các bộ đếm (vd [`tutor_${uid}`, 20], [`tutor_school_${id}`, 1500]) trong ngày — hết lượt → false.
 * Lưu ở lsn_aiUsage/{khoá}_{ngày} (chỉ máy chủ đọc / ghi).
 */
export async function reserveQuota(counters: [string, number][], now = Date.now()): Promise<boolean> {
  const day = vnDayKey(now);
  const col = adminDb().collection(COL.aiUsage);
  const refs = counters.map(([k]) => col.doc(`${k}_${day}`));
  return adminDb().runTransaction(async (tx) => {
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    if (snaps.some((s, i) => ((s.get("count") as number | undefined) ?? 0) >= counters[i][1])) return false;
    refs.forEach((r, i) => tx.set(r, { key: counters[i][0], day, count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true }));
    return true;
  });
}

/** Trả lại lượt đã giữ (khi gọi AI lỗi) */
export async function refundQuota(keys: string[], now = Date.now()) {
  const day = vnDayKey(now);
  const batch = adminDb().batch();
  keys.forEach((k) => batch.set(adminDb().collection(COL.aiUsage).doc(`${k}_${day}`), { count: FieldValue.increment(-1) }, { merge: true }));
  await batch.commit().catch(() => undefined);
}

/** Nhận dạng giọng nói tiếng Anh (OpenAI). Chỉ chuyển tiếp, KHÔNG lưu file ghi âm. */
export async function aiTranscribe(audio: Blob, filename: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new HttpError(503, "Chưa cấu hình AI.");
  const models = [process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe", "whisper-1"];
  for (const model of models) {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("model", model);
    form.append("language", "en");
    form.append("response_format", "json");
    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(25_000) });
    } catch {
      throw new HttpError(504, "Nhận giọng nói quá lâu, thử lại nhé.");
    }
    const j = (await res.json().catch(() => ({}))) as { text?: string; error?: { message?: string; code?: string } };
    if (res.ok) return String(j.text ?? "").trim();
    console.error("transcribe:", model, res.status, j.error?.code, j.error?.message?.slice(0, 160));
    // Mô hình chưa mở cho tài khoản → thử mô hình dự phòng
    if ((res.status === 404 || res.status === 400 || res.status === 403) && model !== models[models.length - 1]) continue;
    if (res.status === 429) throw new HttpError(429, "Dịch vụ AI đang quá tải, thử lại sau.");
    throw new HttpError(502, "Không nhận được giọng nói, thử lại nhé.");
  }
  throw new HttpError(502, "Không nhận được giọng nói, thử lại nhé.");
}

/** Lọc nội dung (OpenAI Moderation, miễn phí). Lỗi mạng → coi như KHÔNG an toàn (chặn) để bảo vệ HS. */
export async function aiModerate(text: string): Promise<{ flagged: boolean; selfHarm: boolean }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { flagged: true, selfHarm: false };
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text.slice(0, 4000) }),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await res.json()) as { results?: { flagged: boolean; categories: Record<string, boolean> }[] };
    const r = j.results?.[0];
    if (!res.ok || !r) return { flagged: true, selfHarm: false };
    const selfHarm = Object.entries(r.categories ?? {}).some(([k, v]) => v && k.startsWith("self-harm"));
    return { flagged: r.flagged, selfHarm };
  } catch {
    return { flagged: true, selfHarm: false };
  }
}

export async function aiUsageToday(user: AuthedUser, now = Date.now()) {
  const snap = await usageRefs(user, vnDayKey(now)).mine.get();
  return { used: (snap.get("count") as number | undefined) ?? 0, limit: AI_LIMITS.perTeacherPerDay };
}
