// GV xoá bài tập (kèm bài làm của HS). Điểm đã cộng vào thống kê vẫn giữ.
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, requireAuth } from "@/lib/server/api";

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/assignments/[id]">) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { id } = await ctx.params;
  const db = adminDb();
  const ref = db.collection(COL.assignments).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy bài tập.");
  await getClassForStaff(snap.get("classId"), user);
  await db.recursiveDelete(ref);
  return ok({ deleted: true });
});
