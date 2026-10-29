// GV tạo lớp mới (mã lớp duy nhất do máy chủ sinh)
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { generateUniqueJoinCode } from "@/lib/server/students";
import { DEFAULT_CLASS_SETTINGS } from "@/lib/types";
import { isGrade } from "@/lib/curriculum";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const body = await readJson<{ name?: string; grade?: number; teams?: number }>(req);
  const name = String(body.name ?? "").trim().slice(0, 40);
  const grade = Math.round(Number(body.grade));
  if (!name) throw new HttpError(400, "Hãy nhập tên lớp, ví dụ 8A.");
  if (!isGrade(grade)) throw new HttpError(400, "Khối lớp phải từ 6 đến 9.");
  if (!user.schoolId) throw new HttpError(400, "Tài khoản chưa được gắn với trường.");
  const teams = Math.min(8, Math.max(1, Math.round(Number(body.teams) || 4)));

  const db = adminDb();
  const ref = db.collection(COL.classes).doc();
  await ref.set({
    name,
    grade,
    schoolId: user.schoolId,
    teacherIds: [user.uid],
    joinCode: await generateUniqueJoinCode(),
    settings: { ...DEFAULT_CLASS_SETTINGS, teams },
    studentCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection(COL.users).doc(user.uid).set({ classIds: FieldValue.arrayUnion(ref.id) }, { merge: true });
  return ok({ id: ref.id }, 201);
});
