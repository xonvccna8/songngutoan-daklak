// Ngân hàng câu hỏi phía máy chủ: quyền sửa, đọc đáp án để chấm bài về nhà giao từ ngân hàng
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, type AuthedUser } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { BANK_LESSON_ID, type BankDoc } from "@/lib/bank/questions";
import type { TeacherKey } from "@/lib/live/types";

export async function loadQuestion(id: string, user: AuthedUser) {
  const ref = adminDb().collection(COL.questions).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy câu hỏi.");
  const q = { id: snap.id, ...snap.data() } as BankDoc;
  const admin = user.role === "admin" && (!q.schoolId || q.schoolId === user.schoolId);
  const mine = q.createdBy === user.uid && q.status !== "approved";
  return { ref, q, admin, mine };
}

/** Đáp án của các câu (đọc thẳng, không đệm: GV sửa đáp án thì bài đang làm chấm theo đáp án mới) */
export async function loadBankKeys(ids: string[]): Promise<Map<string, TeacherKey>> {
  const db = adminDb();
  const snaps = ids.length ? await db.getAll(...ids.map((id) => db.collection(COL.questions).doc(id))) : [];
  return new Map(snaps.filter((s) => s.exists).map((s) => [s.id, s.get("key") as TeacherKey]));
}

/** Đáp án để chấm một bài về nhà: bài giao từ tiết học hoặc từ ngân hàng câu hỏi */
export async function loadAssignmentKeys(a: { lessonId: string; items: { slideId: string }[] }): Promise<Map<string, TeacherKey>> {
  if (a.lessonId === BANK_LESSON_ID) return loadBankKeys(a.items.map((it) => it.slideId));
  return (await loadLessonForGrading(a.lessonId)).keys;
}
