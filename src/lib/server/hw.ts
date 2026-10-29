// Bài tập về nhà phía máy chủ: đọc bài + kiểm em có được giao bài không
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, type AuthedUser } from "@/lib/server/api";
import type { AssignmentDoc } from "@/lib/study/types";

export async function loadAssignmentForStudent(aid: unknown, user: AuthedUser) {
  if (typeof aid !== "string" || !aid || aid.length > 64) throw new HttpError(400, "Thiếu bài tập.");
  const ref = adminDb().collection(COL.assignments).doc(aid);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy bài tập (có thể thầy cô đã xoá).");
  const a = { id: snap.id, ...snap.data() } as AssignmentDoc;
  if (!a.toUids?.includes(user.uid) || !user.classIds?.includes(a.classId)) throw new HttpError(403, "Bài này không giao cho em.");
  return { ref, a, subRef: ref.collection(COL.submissions).doc(user.uid) };
}

/** Lớp của HS (mỗi em thuộc một lớp) */
export function studentClassId(user: AuthedUser): string {
  const c = user.classIds?.[0];
  if (!c) throw new HttpError(403, "Tài khoản chưa thuộc lớp nào.");
  return c;
}
