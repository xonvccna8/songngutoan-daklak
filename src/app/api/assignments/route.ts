// GV giao bài tập về nhà: chọn câu từ một tiết, hạn nộp, giao cả lớp / tổ / từng em.
// Đáp án KHÔNG chép vào bài — máy chủ chấm bằng lsn_lessons/{id}/teacher/*.
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { resolveRecipients, type Recipients } from "@/lib/server/messages";
import { checkDue, createAssignment, teacherNameOf } from "@/lib/server/assignments";
import { isHomeworkSlide } from "@/lib/study/hw";
import { cleanText } from "@/lib/messages/rules";
import type { LessonDoc, Slide } from "@/lib/live/types";

interface Body {
  classId?: string;
  lessonId?: string;
  slideIds?: string[];
  title?: { en?: string; vi?: string };
  dueAt?: number;
  to?: Recipients;
}

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const b = await readJson<Body>(req);
  if (!b.classId || !b.lessonId) throw new HttpError(400, "Thiếu lớp hoặc tiết học.");
  const { cls } = await getClassForStaff(b.classId, user);
  const dueAt = Number(b.dueAt);
  checkDue(dueAt);

  const lessonSnap = await adminDb().collection(COL.lessons).doc(b.lessonId).get();
  if (!lessonSnap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const lesson = { id: lessonSnap.id, ...lessonSnap.data() } as LessonDoc;
  const { slides, keys } = await loadLessonForGrading(lesson.id);
  const wanted = Array.isArray(b.slideIds) ? new Set(b.slideIds) : null;
  const picked = lesson.slideIds
    .map((id) => slides.get(id))
    .filter((s): s is Slide => !!s && isHomeworkSlide(s) && (!wanted || wanted.has(s.id)));
  if (!picked.length) throw new HttpError(400, "Hãy chọn ít nhất 1 câu.");
  if (picked.length > 30) throw new HttpError(400, "Một bài tối đa 30 câu.");

  const { uids, toLabel } = await resolveRecipients(cls, b.to);
  if (!uids.length) throw new HttpError(400, "Chưa chọn học sinh nhận bài.");

  const title = cleanText(b.title) ?? lesson.title;
  const id = await createAssignment({ cls, user, teacherName: await teacherNameOf(user), lesson, picked, keys, uids, toLabel, title, dueAt });
  return ok({ id, recipients: uids.length, items: picked.length }, 201);
});
