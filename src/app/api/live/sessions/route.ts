// GV mở tiết học: tạo phiên dạy cho một lớp (tự kết thúc phiên cũ còn mở của lớp đó)
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { INITIAL_STATE } from "@/lib/live/types";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { classId, lessonId } = await readJson<{ classId?: string; lessonId?: string }>(req);
  if (!classId || !lessonId) throw new HttpError(400, "Thiếu lớp hoặc tiết học.");
  const { cls } = await getClassForStaff(classId, user);

  const db = adminDb();
  const lesson = await db.collection(COL.lessons).doc(lessonId).get();
  if (!lesson.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  // Học sinh chỉ đọc được tiết đã duyệt → chỉ cho dạy tiết đã duyệt
  if (lesson.get("status") !== "approved") throw new HttpError(409, "Tiết này chưa được duyệt nên chưa dạy được.");

  // Mỗi lớp chỉ một tiết đang dạy
  const live = await db.collection(COL.sessions).where("classId", "==", classId).where("status", "==", "live").get();
  const batch = db.batch();
  live.docs.forEach((d) => batch.update(d.ref, { status: "ended", endedAt: FieldValue.serverTimestamp() }));

  const ref = db.collection(COL.sessions).doc();
  batch.set(ref, {
    classId,
    schoolId: cls.schoolId,
    lessonId,
    lessonTitle: lesson.get("title"),
    teacherId: user.uid,
    status: "live",
    // HS chỉ biết đúng/sai khi GV công bố (đọc phiếu "mine"); tiết của trang Toán cũ không có cờ này → rules giữ như cũ
    hideUntilReveal: true,
    slideIds: lesson.get("slideIds") ?? [],
    state: { ...INITIAL_STATE, writtenAt: Date.now() },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return ok({ id: ref.id }, 201);
});
