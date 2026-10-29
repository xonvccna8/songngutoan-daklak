// Đặt lại PIN (cho 1 em, vài em hoặc cả lớp) → trả phiếu mới để in. Đồng thời mở khoá.
import { COL } from "@/lib/namespace";
import { getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { resetPins } from "@/lib/server/students";
import type { StudentDoc } from "@/lib/types";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/classes/[classId]/pins">) => {
  const { classId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref } = await getClassForStaff(classId, user);
  const body = await readJson<{ uids?: string[] }>(req);

  const snap = await ref.collection(COL.students).orderBy("number").get();
  let students = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as StudentDoc);
  if (Array.isArray(body.uids) && body.uids.length) {
    const wanted = new Set(body.uids);
    students = students.filter((s) => wanted.has(s.uid));
  }
  const slips = await resetPins(classId, students);
  return ok({ slips });
});
