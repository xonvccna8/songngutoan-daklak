// Đợt D — Tự tạo bài về nhà từ câu sai của tiết (sau khi kết thúc).
// mode "class": câu lớp sai từ 40% → một bài cho cả lớp; "each": mỗi em câu mình sai/bỏ trống (em giống nhau chung một bài).
// Máy chủ tính lại từ câu trả lời thật; mỗi tiết chỉ giao một lần.
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { resolveRecipients } from "@/lib/server/messages";
import { checkDue, createAssignment, teacherNameOf } from "@/lib/server/assignments";
import { isHomeworkSlide } from "@/lib/study/hw";
import { classRemedial, eachRemedial } from "@/lib/study/remedial";
import type { LessonDoc, ResponseDoc, SessionDoc, Slide } from "@/lib/live/types";

const MAX_ITEMS = 30;

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/live/sessions/[sessionId]/remedial">) => {
  const { sessionId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { mode, dueAt } = await readJson<{ mode?: string; dueAt?: number }>(req);
  if (mode !== "class" && mode !== "each") throw new HttpError(400, "Chọn giao cả lớp hoặc riêng từng em.");
  checkDue(Number(dueAt));

  const db = adminDb();
  const ref = db.collection(COL.sessions).doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const sess = snap.data() as SessionDoc;
  const { cls } = await getClassForStaff(sess.classId, user);
  if (sess.status !== "ended") throw new HttpError(409, "Kết thúc tiết rồi mới giao bài từ câu sai.");
  if (sess.remedialIds?.length) throw new HttpError(409, "Đã giao bài từ câu sai của tiết này rồi.");

  const [lessonSnap, responses, participants, { slides, keys }] = await Promise.all([
    db.collection(COL.lessons).doc(sess.lessonId).get(),
    ref.collection(COL.responses).get(),
    ref.collection(COL.participants).get(),
    loadLessonForGrading(sess.lessonId),
  ]);
  if (!lessonSnap.exists) throw new HttpError(404, "Không tìm thấy bài giảng.");
  const lesson = { id: lessonSnap.id, ...lessonSnap.data() } as LessonDoc;
  const resp = responses.docs.map((d) => d.data() as ResponseDoc);
  const joined = participants.docs.map((d) => d.id);
  const bySlide = (ids: string[]) => ids.map((id) => slides.get(id)).filter((s): s is Slide => !!s).slice(0, MAX_ITEMS);
  // Câu hỏi giao được về nhà, theo thứ tự trong bài
  const questionIds = lesson.slideIds.filter((id) => {
    const s = slides.get(id);
    return !!s?.question && isHomeworkSlide(s);
  });

  const teacherName = await teacherNameOf(user);
  const title = { vi: `Ôn câu sai · ${lesson.title.vi}`, en: `Review · ${lesson.title.en}` };
  const base = { cls, user, teacherName, lesson, keys, title, dueAt: Number(dueAt), extra: { fromSessionId: sessionId } };
  const ids: string[] = [];
  let recipients = 0;

  if (mode === "class") {
    const picks = classRemedial(resp, joined, questionIds);
    if (!picks.length) throw new HttpError(400, "Không có câu nào lớp sai từ 40% trở lên.");
    // Giữ thứ tự câu như trong bài
    const order = questionIds.filter((id) => picks.some((p) => p.slideId === id));
    const { uids, toLabel } = await resolveRecipients(cls, { all: true });
    if (!uids.length) throw new HttpError(400, "Lớp chưa có học sinh.");
    ids.push(await createAssignment({ ...base, picked: bySlide(order), uids, toLabel }));
    recipients = uids.length;
  } else {
    const groups = eachRemedial(resp, joined, questionIds);
    if (!groups.length) throw new HttpError(400, "Em nào vào tiết cũng đã đúng hết, không cần giao bài.");
    // Đọc danh sách lớp một lần; chỉ giao cho em còn trong lớp
    const { roster } = await resolveRecipients(cls, { all: true });
    const nameOf = new Map(roster.map((s) => [s.uid, s.fullName]));
    for (const g of groups) {
      const uids = g.uids.filter((u) => nameOf.has(u));
      if (!uids.length) continue;
      const toLabel = uids.length === 1 ? nameOf.get(uids[0])! : `${uids.length} em · lớp ${cls.name}`;
      ids.push(await createAssignment({ ...base, picked: bySlide(g.slideIds), uids, toLabel }));
      recipients += uids.length;
    }
  }
  await ref.update({ remedialIds: ids });
  return ok({ ids, assignments: ids.length, recipients }, 201);
});
