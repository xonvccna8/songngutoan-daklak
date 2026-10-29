// Đăng nhập học sinh: mã lớp + chọn tên + PIN 6 số → custom token
// Sai 5 lần → khoá 15 phút. Hash PIN lưu ở lsn_private/studentAuth/items/{uid} (chỉ máy chủ đọc).
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COL, toClaims } from "@/lib/namespace";
import { isValidJoinCode, isValidPin, LOCK_MINUTES, MAX_PIN_FAILS, nextFailState, normalizeJoinCode } from "@/lib/class-utils";
import { HttpError, handle, ok, readJson } from "@/lib/server/api";
import { authItemRef, checkPin } from "@/lib/server/students";

export const POST = handle(async (req: Request) => {
  const body = await readJson<{ code?: string; uid?: string; pin?: string }>(req);
  const code = normalizeJoinCode(body.code ?? "");
  const uid = String(body.uid ?? "");
  const pin = String(body.pin ?? "");
  if (!isValidJoinCode(code) || !uid.startsWith("st_") || !isValidPin(pin)) {
    throw new HttpError(400, "Thông tin đăng nhập chưa đúng.");
  }

  const db = adminDb();
  const found = await db.collection(COL.classes).where("joinCode", "==", code).limit(1).get();
  if (found.empty) throw new HttpError(404, "Không tìm thấy lớp với mã này.");
  const cls = found.docs[0];

  const student = await cls.ref.collection(COL.students).doc(uid).get();
  if (!student.exists) throw new HttpError(404, "Không tìm thấy tên em trong lớp.");

  const itemRef = authItemRef(uid);
  // Giao dịch để đếm số lần sai chính xác khi bấm liên tục
  const result = await db.runTransaction(async (tx) => {
    const item = await tx.get(itemRef);
    if (!item.exists || item.get("classId") !== cls.id) return { ok: false as const, reason: "missing" };
    const now = Date.now();
    const lockedUntil = (item.get("lockedUntil") as number | null) ?? 0;
    if (lockedUntil > now) return { ok: false as const, reason: "locked", minutes: Math.ceil((lockedUntil - now) / 60000) };

    const match = await checkPin(pin, item.get("pinHash") as string);
    if (match) {
      tx.update(itemRef, { failedCount: 0, lockedUntil: null, lastLoginAt: now });
      return { ok: true as const };
    }
    const next = nextFailState((item.get("failedCount") as number) ?? 0, now);
    tx.update(itemRef, next);
    return next.lockedUntil
      ? { ok: false as const, reason: "locked", minutes: LOCK_MINUTES }
      : { ok: false as const, reason: "wrong", left: MAX_PIN_FAILS - next.failedCount };
  });

  if (!result.ok) {
    if (result.reason === "locked") {
      throw new HttpError(423, `Nhập sai quá ${MAX_PIN_FAILS} lần. Em đợi ${result.minutes} phút hoặc nhờ thầy cô đặt lại PIN.`);
    }
    if (result.reason === "wrong") throw new HttpError(401, `PIN chưa đúng. Em còn ${result.left} lần thử.`);
    throw new HttpError(401, "Tài khoản chưa có PIN, em nhờ thầy cô đặt lại PIN.");
  }

  const token = await adminAuth().createCustomToken(
    uid,
    toClaims({ role: "student", schoolId: cls.get("schoolId"), classIds: [cls.id] })
  );
  return ok({ token });
});
