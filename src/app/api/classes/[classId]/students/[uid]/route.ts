// Sửa tên / tổ / mức tiếng Anh của một học sinh, hoặc xoá học sinh khỏi lớp
import { normalizeName } from "@/lib/class-utils";
import { isELevel } from "@/lib/live/elevel";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { deleteStudents } from "@/lib/server/students";

type Ctx = RouteContext<"/api/classes/[classId]/students/[uid]">;

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { classId, uid } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, cls } = await getClassForStaff(classId, user);
  const body = await readJson<{ fullName?: string; team?: number; eLevel?: string }>(req);

  const studentRef = ref.collection(COL.students).doc(uid);
  if (!(await studentRef.get()).exists) throw new HttpError(404, "Không tìm thấy học sinh.");

  const update: Record<string, unknown> = {};
  if (body.fullName !== undefined) {
    const fullName = normalizeName(String(body.fullName));
    if (fullName.length < 2 || fullName.length > 60) throw new HttpError(400, "Họ tên không hợp lệ.");
    update.fullName = fullName;
  }
  if (body.team !== undefined) {
    const team = Math.round(Number(body.team));
    if (!(team >= 1 && team <= (cls.settings?.teams ?? 4))) throw new HttpError(400, "Tổ không hợp lệ.");
    update.team = team;
  }
  // Đợt C — GV xác nhận mức tiếng Anh của em
  if (body.eLevel !== undefined) {
    if (!isELevel(body.eLevel)) throw new HttpError(400, "Mức tiếng Anh không hợp lệ.");
    update.eLevel = body.eLevel;
  }
  if (Object.keys(update).length) await studentRef.update(update);
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  const { classId, uid } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref } = await getClassForStaff(classId, user);
  if (!(await ref.collection(COL.students).doc(uid).get()).exists) throw new HttpError(404, "Không tìm thấy học sinh.");
  await deleteStudents(classId, [uid]);
  return ok({ ok: true });
});
