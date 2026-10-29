// Nghiệp vụ học sinh phía máy chủ: tạo, đặt lại PIN (bcrypt), xoá
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH } from "@/lib/class-utils";
import { COL } from "@/lib/namespace";
import type { PinSlip, StudentDoc } from "@/lib/types";

const BCRYPT_ROUNDS = 9;

export function generatePin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export const hashPin = (pin: string) => bcrypt.hash(pin, BCRYPT_ROUNDS);
export const checkPin = (pin: string, hash: string) => bcrypt.compare(pin, hash);

/** Tài liệu bí mật chứa hash PIN — client không đọc được (security rules chặn private/**) */
export const authItemRef = (uid: string) =>
  adminDb().collection(COL.private).doc("studentAuth").collection("items").doc(uid);

export async function generateUniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    let code = "";
    for (let j = 0; j < JOIN_CODE_LENGTH; j++) code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
    const dup = await adminDb().collection(COL.classes).where("joinCode", "==", code).limit(1).get();
    if (dup.empty) return code;
  }
  throw new Error("Không tạo được mã lớp duy nhất.");
}

/** Thêm nhiều học sinh vào lớp, trả về phiếu có PIN rõ (chỉ hiện 1 lần để in) */
export async function createStudents(
  classId: string,
  list: { fullName: string; team: number }[],
  opts: { isSample?: boolean } = {}
): Promise<PinSlip[]> {
  const db = adminDb();
  const classRef = db.collection(COL.classes).doc(classId);
  const last = await classRef.collection(COL.students).orderBy("number", "desc").limit(1).get();
  let number = last.empty ? 0 : (last.docs[0].data().number as number);

  const slips: PinSlip[] = list.map((s) => {
    number += 1;
    const uid = "st_" + db.collection("_").doc().id;
    return { uid, fullName: s.fullName, team: s.team, number, pin: generatePin() };
  });
  const hashes = await Promise.all(slips.map((s) => hashPin(s.pin)));

  // Firestore giới hạn 500 thao tác/lô → chia nhỏ
  for (let i = 0; i < slips.length; i += 200) {
    const batch = db.batch();
    slips.slice(i, i + 200).forEach((s, k) => {
      const student: Omit<StudentDoc, "uid"> & { isSample?: boolean } = {
        fullName: s.fullName,
        number: s.number,
        team: s.team,
        ...(opts.isSample ? { isSample: true } : {}),
      };
      batch.set(classRef.collection(COL.students).doc(s.uid), student);
      batch.set(authItemRef(s.uid), {
        classId,
        pinHash: hashes[i + k],
        failedCount: 0,
        lockedUntil: null,
      });
    });
    batch.update(classRef, { studentCount: FieldValue.increment(Math.min(200, slips.length - i)) });
    await batch.commit();
  }
  return slips;
}

/** Đặt lại PIN (và mở khoá) cho các em được chọn */
export async function resetPins(classId: string, students: StudentDoc[]): Promise<PinSlip[]> {
  const slips = students.map((s) => ({ ...s, pin: generatePin() }));
  const hashes = await Promise.all(slips.map((s) => hashPin(s.pin)));
  const db = adminDb();
  for (let i = 0; i < slips.length; i += 400) {
    const batch = db.batch();
    slips.slice(i, i + 400).forEach((s, k) => {
      batch.set(authItemRef(s.uid), { classId, pinHash: hashes[i + k], failedCount: 0, lockedUntil: null });
    });
    await batch.commit();
  }
  // Thu hồi phiên cũ để thiết bị lạ phải đăng nhập lại bằng PIN mới
  await Promise.all(slips.map((s) => adminAuth().revokeRefreshTokens(s.uid).catch(() => undefined)));
  return slips;
}

export async function deleteStudents(classId: string, uids: string[]) {
  const db = adminDb();
  const classRef = db.collection(COL.classes).doc(classId);
  for (let i = 0; i < uids.length; i += 200) {
    const part = uids.slice(i, i + 200);
    const batch = db.batch();
    part.forEach((uid) => {
      batch.delete(classRef.collection(COL.students).doc(uid));
      batch.delete(authItemRef(uid));
    });
    batch.update(classRef, { studentCount: FieldValue.increment(-part.length) });
    await batch.commit();
  }
  // Xoá mã thiết bị nhận thông báo của các em
  await Promise.all(uids.map((uid) => db.recursiveDelete(db.collection(COL.fcmTokens).doc(uid)).catch(() => undefined)));
  // Xoá dữ liệu tự học của các em (thẻ từ, thời gian học theo ngày)
  await Promise.all(
    uids.map(async (uid) => {
      await db.collection(COL.cards).doc(uid).delete().catch(() => undefined);
      const daily = await db.collection(COL.studyDaily).where("uid", "==", uid).select().get().catch(() => null);
      await Promise.all((daily?.docs ?? []).map((d) => d.ref.delete()));
    })
  );
  // Xoá tài khoản đăng nhập (nếu em đã từng đăng nhập)
  for (let i = 0; i < uids.length; i += 1000) {
    await adminAuth().deleteUsers(uids.slice(i, i + 1000)).catch(() => undefined);
  }
}
