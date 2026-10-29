// Dự án STEM phía máy chủ: đọc dự án + kiểm quyền GV / HS, tìm tổ của HS
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, type AuthedUser } from "@/lib/server/api";
import type { ProjectDoc } from "@/lib/stem/projects";
import type { StudentDoc } from "@/lib/types";

export async function loadProject(id: string) {
  if (!id || id.length > 64) throw new HttpError(400, "Thiếu dự án.");
  const ref = adminDb().collection(COL.projects).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy dự án (có thể thầy cô đã xoá).");
  return { ref, p: { id: snap.id, ...snap.data() } as ProjectDoc };
}

export async function loadProjectForStaff(id: string, user: AuthedUser) {
  const r = await loadProject(id);
  const { cls } = await getClassForStaff(r.p.classId, user);
  return { ...r, cls };
}

/** HS của lớp → tổ của em (lấy từ hồ sơ lớp, HS không tự khai được) */
export async function loadProjectForStudent(id: string, user: AuthedUser) {
  const r = await loadProject(id);
  if (!user.classIds?.includes(r.p.classId)) throw new HttpError(403, "Dự án này không thuộc lớp của em.");
  const st = await adminDb().collection(COL.classes).doc(r.p.classId).collection(COL.students).doc(user.uid).get();
  if (!st.exists) throw new HttpError(403, "Không tìm thấy em trong danh sách lớp.");
  const me = { uid: st.id, ...st.data() } as StudentDoc;
  return { ...r, me, teamRef: r.ref.collection(COL.projectTeams).doc(String(me.team)) };
}
