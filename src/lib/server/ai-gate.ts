// Giới hạn dùng thử AI: mỗi tài khoản (GV hoặc HS) được AI_FREE_LIMIT lượt (mặc định 10, cộng dồn, không làm mới theo ngày).
// Hết lượt → máy chủ trả mã "AI_LOCKED" → trang hiện hộp nhập mật khẩu. Mật khẩu (AI_UNLOCK_PASSWORD) chỉ chủ phần mềm biết,
// gửi cho khách; nhập đúng → tài khoản đó dùng tiếp (vẫn theo giới hạn lượt/ngày sẵn có).
// Lưu ở lsn_aiUsage/free_{uid} (chỉ máy chủ đọc / ghi). Đoán sai quá AI_UNLOCK_MAX_WRONG lần/ngày → khoá thử đến hôm sau.
import { createHash, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError } from "@/lib/server/api";
import { vnDayKey } from "@/lib/live/summary";

export const AI_LOCKED = "AI_LOCKED";
export const AI_UNLOCK_MAX_WRONG = 5;
export const aiFreeLimit = () => Math.max(0, Math.round(Number(process.env.AI_FREE_LIMIT ?? 10))) || 10;

const ref = (uid: string) => adminDb().collection(COL.aiUsage).doc(`free_${uid}`);

export interface AiFreeStatus {
  used: number;
  limit: number;
  unlocked: boolean;
  /** Số lượt dùng thử còn lại (null = đã mở khoá, không giới hạn dùng thử) */
  remaining: number | null;
}

export async function aiFreeStatus(uid: string): Promise<AiFreeStatus> {
  const s = await ref(uid).get();
  const used = (s.get("used") as number | undefined) ?? 0;
  const unlocked = s.get("unlocked") === true;
  const limit = aiFreeLimit();
  return { used, limit, unlocked, remaining: unlocked ? null : Math.max(0, limit - used) };
}

export const lockedError = () =>
  new HttpError(402, `Bạn đã dùng hết ${aiFreeLimit()} lượt AI dùng thử. Nhập mật khẩu do người cung cấp phần mềm gửi để dùng tiếp.`, AI_LOCKED);

/** Gọi TRƯỚC khi dùng AI: hết lượt dùng thử mà chưa mở khoá → lỗi AI_LOCKED */
export async function assertAiAllowed(uid: string) {
  const st = await aiFreeStatus(uid);
  if (!st.unlocked && st.used >= st.limit) throw lockedError();
}

/** Gọi SAU khi AI trả lời thành công: tính 1 lượt (lỗi phía AI thì không tính) */
export async function countAiUse(uid: string) {
  await ref(uid)
    .set({ uid, used: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    .catch((e) => console.error("aiFree:", (e as Error).message));
}

const digest = (s: string) => createHash("sha256").update(s.normalize("NFC")).digest();

/** So mật khẩu (thời gian so sánh không đổi, không phân biệt khoảng trắng 2 đầu) */
export function passwordMatches(input: string, secret: string | undefined): boolean {
  if (!secret) return false;
  return timingSafeEqual(digest(input.trim()), digest(secret.trim()));
}

/** Nhập mật khẩu mở khoá AI cho tài khoản */
export async function unlockAi(uid: string, password: unknown, now = Date.now()): Promise<AiFreeStatus> {
  const secret = process.env.AI_UNLOCK_PASSWORD;
  if (!secret) throw new HttpError(503, "Máy chủ chưa đặt mật khẩu mở khoá AI. Liên hệ người cung cấp phần mềm.");
  const pw = typeof password === "string" ? password.slice(0, 100) : "";
  if (!pw.trim()) throw new HttpError(400, "Hãy nhập mật khẩu.");
  const day = vnDayKey(now);
  const r = ref(uid);
  const snap = await r.get();
  const wrong = snap.get("wrongDay") === day ? ((snap.get("wrong") as number | undefined) ?? 0) : 0;
  if (wrong >= AI_UNLOCK_MAX_WRONG) throw new HttpError(429, `Bạn đã nhập sai ${AI_UNLOCK_MAX_WRONG} lần hôm nay. Ngày mai thử lại nhé.`);
  if (!passwordMatches(pw, secret)) {
    await r.set({ uid, wrong: wrong + 1, wrongDay: day, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const left = AI_UNLOCK_MAX_WRONG - wrong - 1;
    throw new HttpError(403, left > 0 ? `Mật khẩu chưa đúng. Còn ${left} lần thử hôm nay.` : `Mật khẩu chưa đúng. Bạn đã hết lượt thử hôm nay.`);
  }
  await r.set({ uid, unlocked: true, unlockedAt: FieldValue.serverTimestamp(), wrong: 0, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return aiFreeStatus(uid);
}
