// GV gửi tin cho 1 em / nhiều em / 1 tổ / cả lớp. Chỉ máy chủ tạo tin (để kiểm giới hạn & giờ yên lặng).
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { createMessage, resolveRecipients } from "@/lib/server/messages";
import { cleanPoints, cleanText, isKind, overAttentionLimit } from "@/lib/messages/rules";
import { DEFAULT_CLASS_SETTINGS } from "@/lib/types";

interface Body {
  classId?: string;
  kind?: string;
  text?: { en?: string; vi?: string };
  to?: { all?: boolean; team?: number; uids?: string[] };
  points?: number;
  sessionId?: string | null;
}

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const b = await readJson<Body>(req);
  if (!b.classId) throw new HttpError(400, "Thiếu lớp.");
  if (!isKind(b.kind)) throw new HttpError(400, "Loại tin không hợp lệ.");
  const kind = b.kind;
  const text = cleanText(b.text);
  if (!text) throw new HttpError(400, "Hãy nhập nội dung tin.");
  const { cls } = await getClassForStaff(b.classId, user);
  const db = adminDb();

  // Người nhận (chỉ trong lớp)
  const resolved = await resolveRecipients(cls, b.to);
  let uids = resolved.uids;
  const toLabel = resolved.toLabel;
  if (!uids.length) throw new HttpError(400, "Chưa chọn học sinh nhận tin.");

  // Tiết đang dạy (nếu có) — dùng cho giới hạn tin "Chú ý" mỗi tiết
  let sessionId: string | null = null;
  if (b.sessionId) {
    const s = await db.collection(COL.sessions).doc(b.sessionId).get();
    if (s.exists && s.get("classId") === cls.id) sessionId = s.id;
  }
  const settings = { ...DEFAULT_CLASS_SETTINGS, ...cls.settings };
  let skipped: string[] = [];
  if (kind === "attention" && sessionId) {
    const prev = await db.collection(COL.messages).where("classId", "==", cls.id).where("sessionId", "==", sessionId).where("kind", "==", "attention").get();
    skipped = overAttentionLimit(prev.docs.map((d) => d.get("toUids") as string[]), uids, settings.maxAttention);
    uids = uids.filter((u) => !skipped.includes(u));
    if (!uids.length) throw new HttpError(429, `Em đã nhận đủ ${settings.maxAttention} tin “Chú ý” trong tiết này.`);
  }

  const points = cleanPoints(kind, b.points);
  const fromName = user.name || (await db.collection(COL.users).doc(user.uid).get()).get("displayName") || "Thầy cô";
  const r = await createMessage({ cls, uids, toLabel, kind, text, fromUid: user.uid, fromName, sessionId, points });
  return ok({ id: r.id, recipients: uids.length, skipped: skipped.length, pushed: r.pushed, silent: r.silent }, 201);
});
