// Tạo một bài về nhà (dùng chung: GV tự chọn câu, và Đợt D — giao từ câu sai của tiết).
// Đáp án KHÔNG chép vào bài — máy chủ chấm bằng lsn_lessons/{id}/teacher/*.
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, type AuthedUser } from "@/lib/server/api";
import { createMessage } from "@/lib/server/messages";
import { buildItems } from "@/lib/study/hw";
import { fmtDue } from "@/lib/format";
import type { Bi, LessonDoc, Slide, TeacherKey } from "@/lib/live/types";
import type { ClassDoc } from "@/lib/types";

const DAY = 86_400_000;
// Firestore không nhận giá trị undefined → bỏ đi
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

export function checkDue(dueAt: number, now = Date.now()) {
  if (!Number.isFinite(dueAt) || dueAt < now + 10 * 60_000) throw new HttpError(400, "Hạn nộp phải sau thời điểm hiện tại ít nhất 10 phút.");
  if (dueAt > now + 60 * DAY) throw new HttpError(400, "Hạn nộp tối đa 60 ngày.");
}

export async function teacherNameOf(user: AuthedUser) {
  return user.name || ((await adminDb().collection(COL.users).doc(user.uid).get()).get("displayName") as string | undefined) || "Thầy cô";
}

export async function createAssignment(a: {
  cls: ClassDoc;
  user: AuthedUser;
  teacherName: string;
  lesson: LessonDoc;
  picked: Slide[];
  keys: Map<string, TeacherKey>;
  uids: string[];
  toLabel: string;
  title: Bi;
  dueAt: number;
  /** Trường thêm, vd fromSessionId của bài giao từ câu sai */
  extra?: Record<string, unknown>;
}) {
  const db = adminDb();
  const ref = db.collection(COL.assignments).doc();
  await ref.set({
    classId: a.cls.id,
    schoolId: a.cls.schoolId,
    teacherId: a.user.uid,
    teacherName: a.teacherName,
    title: { en: a.title.en || a.lesson.title.en, vi: a.title.vi || a.lesson.title.vi },
    lessonId: a.lesson.id,
    items: clean(buildItems(a.picked, a.keys, a.lesson.terms ?? [])),
    toUids: a.uids,
    toLabel: a.toLabel,
    dueAt: Timestamp.fromMillis(a.dueAt),
    createdAt: FieldValue.serverTimestamp(),
    remindedAt: null,
    closedAt: null,
    ...(a.extra ?? {}),
  });

  // Báo bài mới (Thông báo = im lặng, chỉ hiện trong hộp tin; bấm vào mở bài)
  await createMessage({
    cls: a.cls,
    uids: a.uids,
    toLabel: a.toLabel,
    kind: "notice",
    text: {
      vi: `Bài tập mới: ${a.title.vi || a.lesson.title.vi} · ${a.picked.length} câu · hạn ${fmtDue(a.dueAt)}`,
      en: `New homework: ${a.title.en || a.lesson.title.en} · due ${fmtDue(a.dueAt, "en")}`,
    },
    fromUid: a.user.uid,
    fromName: a.teacherName,
    assignmentId: ref.id,
  }).catch((e) => console.error("hw notice:", (e as Error).message));
  return ref.id;
}
