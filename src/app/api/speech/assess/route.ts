// Chấm phát âm bằng AI: điện thoại gửi đoạn ghi âm ngắn (≤ 12 giây) → OpenAI nhận dạng giọng nói tiếng Anh →
// so khớp từng từ với câu mẫu (cùng cách chấm như trước) → AI viết 1 lời khuyên song ngữ.
// KHÔNG lưu ghi âm: file chỉ được chuyển tiếp tới OpenAI rồi bỏ. Không gửi tên HS.
// GET: AI chấm phát âm có bật không (điện thoại chọn cách chấm). POST (multipart): audio + target.
import { HttpError, handle, ok, requireAuth } from "@/lib/server/api";
import { aiEnabled, aiJson, aiTranscribe, refundQuota, reserveQuota } from "@/lib/server/ai";
import { assertAiAllowed, countAiUse } from "@/lib/server/ai-gate";
import { scoreSpeech } from "@/lib/live/grading";
import { SPEECH_TIP_SCHEMA, SPEECH_TIP_SYSTEM, STUDENT_AI_LIMITS, speechTipPrompt } from "@/lib/ai/student-ai";
import type { Bi } from "@/lib/live/types";

export const maxDuration = 60;

export const GET = handle(async (req: Request) => {
  await requireAuth(req, ["student", "teacher", "admin"]);
  return ok({ enabled: aiEnabled() });
});

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  if (!aiEnabled()) throw new HttpError(503, "Chưa bật AI chấm phát âm.");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Dữ liệu ghi âm không hợp lệ.");
  }
  const audio = form.get("audio");
  const target = String(form.get("target") ?? "").trim().slice(0, 300);
  if (!(audio instanceof Blob) || audio.size < 1000) throw new HttpError(400, "Máy chưa nghe rõ. Đọc to hơn nhé.");
  if (audio.size > STUDENT_AI_LIMITS.speechMaxBytes) throw new HttpError(413, "Đoạn ghi âm dài quá, em đọc lại ngắn gọn nhé.");
  if (!/^(audio|video)\//.test(audio.type || "audio/webm")) throw new HttpError(415, "Định dạng ghi âm không hỗ trợ.");
  if (target.split(/\s+/).filter(Boolean).length < 1) throw new HttpError(400, "Thiếu câu mẫu.");

  await assertAiAllowed(user.uid);
  const keys: [string, number][] = [
    [`speech_${user.uid}`, STUDENT_AI_LIMITS.speechPerStudent],
    [`speech_school_${user.schoolId ?? "none"}`, STUDENT_AI_LIMITS.speechPerSchool],
  ];
  if (!(await reserveQuota(keys))) throw new HttpError(429, "Hôm nay em đã dùng hết lượt chấm phát âm bằng AI. Máy sẽ chấm trên điện thoại.");

  let transcript: string;
  try {
    const ext = audio.type.includes("mp4") || audio.type.includes("aac") ? "m4a" : audio.type.includes("ogg") ? "ogg" : audio.type.includes("wav") ? "wav" : "webm";
    transcript = await aiTranscribe(audio, `speech.${ext}`);
  } catch (e) {
    await refundQuota(keys.map(([k]) => k));
    throw e;
  }
  await countAiUse(user.uid);
  const r = scoreSpeech(target, [{ t: transcript }]) ?? { score: 0, ok: target.split(" ").map(() => false), transcript };
  if (!transcript) return ok({ ...r, transcript: "", tip: null, engine: "ai" });

  // Lời khuyên song ngữ (lỗi thì bỏ qua, vẫn trả điểm)
  let tip: Bi | null = null;
  try {
    const words = target.split(" ");
    const missed = words.filter((_, i) => !r.ok[i]).map((w) => w.replace(/[^\w'-]/g, ""));
    const t = await aiJson<{ tip: Bi }>({ name: "speech_tip", schema: SPEECH_TIP_SCHEMA, system: SPEECH_TIP_SYSTEM, user: speechTipPrompt(target, transcript, r.score, missed), maxTokens: 400, timeoutMs: 8_000 });
    tip = { en: String(t.data.tip?.en ?? "").slice(0, 200), vi: String(t.data.tip?.vi ?? "").slice(0, 200) };
  } catch (e) {
    console.error("speechTip:", (e as Error).message);
  }
  return ok({ score: r.score, ok: r.ok, transcript: r.transcript, tip, engine: "ai" });
});
