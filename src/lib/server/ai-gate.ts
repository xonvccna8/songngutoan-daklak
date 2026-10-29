// Giới hạn dùng AI: mỗi tài khoản GV / HS được AI_FREE_LIMIT lượt (mặc định 5, cộng dồn, không làm mới theo ngày).
// Tài khoản QUẢN TRỊ không bị giới hạn.
// Hết lượt → máy chủ trả mã "AI_LOCKED" → trang hiện hộp nhập mật khẩu. Mật khẩu mở khoá CHỈ quản trị xem / đổi được
// (trang Quản trị trường), lưu ở lsn_private/toan_ai_unlock (client không đọc được); chưa đặt thì dùng AI_UNLOCK_PASSWORD.
// Nhập đúng → tài khoản đó dùng tiếp (vẫn theo giới hạn lượt/ngày sẵn có).
// Lượt dùng lưu ở lsn_aiUsage/free_{uid} (chỉ máy chủ đọc / ghi). Đoán sai quá AI_UNLOCK_MAX_WRONG lần/ngày → khoá thử đến hôm sau.
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError } from "@/lib/server/api";
import { vnDayKey } from "@/lib/live/summary";

export const AI_LOCKED = "AI_LOCKED";
export const AI_UNLOCK_MAX_WRONG = 5;
export const aiFreeLimit = () => Math.max(0, Math.round(Number(process.env.AI_FREE_LIMIT ?? 5))) || 5;

const ref = (uid: string) => adminDb().collection(COL.aiUsage).doc(`free_${uid}`);
/** Mật khẩu mở khoá của trang Toán (id riêng → không đụng dữ liệu trang KHTN dùng chung Firebase) */
const secretRef = () => adminDb().collection(COL.private).doc("toan_ai_unlock");

/** Mật khẩu mở khoá hiện hành: quản trị đặt trong app, chưa đặt thì lấy biến môi trường */
export async function unlockSecret(): Promise<string | undefined> {
  const p = (await secretRef().get()).get("password");
  return typeof p === "string" && p.trim() ? p.trim() : process.env.AI_UNLOCK_PASSWORD?.trim() || undefined;
}

/** Mật khẩu ngẫu nhiên dễ đọc (bỏ các kí tự dễ nhầm O/0, I/1), vd TOAN-K7PQ-2M9X */
export function generateUnlockPassword(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => A[randomInt(A.length)]).join("");
  return `TOAN-${part()}-${part()}`;
}

/** Làm sạch mật khẩu quản trị tự đặt; trả chuỗi lỗi nếu không hợp lệ */
export function cleanUnlockPassword(x: unknown): string | { error: string } {
  const p = typeof x === "string" ? x.trim() : "";
  if (p.length < 6 || p.length > 40) return { error: "Mật khẩu cần từ 6 đến 40 kí tự." };
  if (/\s/.test(p)) return { error: "Mật khẩu không được có khoảng trắng." };
  return p;
}

/** Quản trị đặt mật khẩu mở khoá mới */
export async function setUnlockSecret(password: string, byUid: string) {
  await secretRef().set({ password, updatedBy: byUid, updatedAt: FieldValue.serverTimestamp() });
}

export interface AiFreeStatus {
  used: number;
  limit: number;
  unlocked: boolean;
  /** Số lượt dùng thử còn lại (null = đã mở khoá, không giới hạn dùng thử) */
  remaining: number | null;
}

export async function aiFreeStatus(uid: string, role?: string | null): Promise<AiFreeStatus> {
  const s = await ref(uid).get();
  const used = (s.get("used") as number | undefined) ?? 0;
  // Quản trị: không giới hạn
  const unlocked = role === "admin" || s.get("unlocked") === true;
  const limit = aiFreeLimit();
  return { used, limit, unlocked, remaining: unlocked ? null : Math.max(0, limit - used) };
}

export const lockedError = () =>
  new HttpError(402, `Bạn đã dùng hết ${aiFreeLimit()} lượt AI. Nhập mật khẩu do quản trị nhà trường cung cấp để dùng tiếp.`, AI_LOCKED);

/** Gọi TRƯỚC khi dùng AI: hết lượt mà chưa mở khoá (và không phải quản trị) → lỗi AI_LOCKED */
export async function assertAiAllowed(uid: string, role?: string | null) {
  if (role === "admin") return;
  const st = await aiFreeStatus(uid, role);
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
  const secret = await unlockSecret();
  if (!secret) throw new HttpError(503, "Quản trị nhà trường chưa đặt mật khẩu mở khoá AI. Hãy liên hệ quản trị.");
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
