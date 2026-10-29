// Giao bài về nhà từ ngân hàng câu hỏi: máy tự chấm, gợi ý 3 tầng như bài giao từ tiết học.
// Chỉ giao được câu đã duyệt hoặc câu của chính GV (câu "Nháp AI" phải được GV kiểm tra, lưu lại trước).
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { resolveRecipients, type Recipients } from "@/lib/server/messages";
import { checkDue, createAssignment, teacherNameOf } from "@/lib/server/assignments";
import { cleanText } from "@/lib/messages/rules";
import { BANK_LESSON_ID, type BankDoc } from "@/lib/bank/questions";
import type { LessonDoc, TeacherKey } from "@/lib/live/types";

interface Body {
  classId?: string;
  questionIds?: string[];
  title?: { en?: string; vi?: string };
  dueAt?: number;
  to?: Recipients;
}

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const b = await readJson<Body>(req);
  if (!b.classId) throw new HttpError(400, "Thiếu lớp.");
  const { cls } = await getClassForStaff(b.classId, user);
  const dueAt = Number(b.dueAt);
  checkDue(dueAt);

  const ids = [...new Set((Array.isArray(b.questionIds) ? b.questionIds : []).filter((x): x is string => typeof x === "string" && x.length <= 64))];
  if (!ids.length) throw new HttpError(400, "Hãy chọn ít nhất 1 câu.");
  if (ids.length > 30) throw new HttpError(400, "Một bài tối đa 30 câu.");
  const db = adminDb();
  const snaps = await db.getAll(...ids.map((id) => db.collection(COL.questions).doc(id)));
  const qs = snaps.filter((s) => s.exists).map((s) => ({ id: s.id, ...s.data() }) as BankDoc);
  if (qs.length !== ids.length) throw new HttpError(404, "Có câu hỏi đã bị xoá, hãy tải lại trang.");
  const bad = qs.find((q) => q.aiDraft || (q.status !== "approved" && q.createdBy !== user.uid));
  if (bad) throw new HttpError(400, bad.aiDraft ? "Có câu “Nháp AI” chưa được kiểm tra. Hãy mở, sửa nếu cần rồi bấm Lưu trước khi giao." : "Chỉ giao được câu đã duyệt hoặc câu của chính thầy cô.");

  const { uids, toLabel } = await resolveRecipients(cls, b.to);
  if (!uids.length) throw new HttpError(400, "Chưa chọn học sinh nhận bài.");

  const title = cleanText(b.title) ?? { vi: "Bài tập từ ngân hàng câu hỏi", en: "Question bank practice" };
  // "Tiết" giả: bài giao từ ngân hàng không gắn tiết học nào
  const lesson = { id: BANK_LESSON_ID, title: { vi: title.vi || "Bài tập từ ngân hàng câu hỏi", en: title.en || "Question bank practice" }, terms: [] } as unknown as LessonDoc;
  const keys = new Map<string, TeacherKey>(qs.map((q) => [q.id, q.key]));
  const id = await createAssignment({ cls, user, teacherName: await teacherNameOf(user), lesson, picked: qs.map((q) => q.slide), keys, uids, toLabel, title, dueAt, extra: { source: "bank" } });
  return ok({ id, recipients: uids.length, items: qs.length }, 201);
});
