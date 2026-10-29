// Đợt C — GV xác nhận mức tiếng Anh (E1/E2/E3) cho nhiều em cùng lúc (vd "Áp dụng gợi ý cho cả lớp")
import { COL } from "@/lib/namespace";
import { adminDb } from "@/lib/firebase/admin";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { isELevel } from "@/lib/live/elevel";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/classes/[classId]/levels">) => {
  const { classId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref } = await getClassForStaff(classId, user);
  const { levels } = await readJson<{ levels?: Record<string, unknown> }>(req);
  const entries = Object.entries(levels ?? {});
  if (!entries.length || entries.length > 200) throw new HttpError(400, "Danh sách mức không hợp lệ.");
  if (!entries.every(([, l]) => isELevel(l))) throw new HttpError(400, "Mức tiếng Anh không hợp lệ.");

  // Chỉ ghi cho em có trong lớp (không tạo hồ sơ mới)
  const refs = entries.map(([uid]) => ref.collection(COL.students).doc(uid));
  const snaps = await adminDb().getAll(...refs);
  const batch = adminDb().batch();
  let n = 0;
  snaps.forEach((s, i) => {
    if (!s.exists) return;
    batch.update(s.ref, { eLevel: entries[i][1] });
    n++;
  });
  if (!n) throw new HttpError(404, "Không tìm thấy học sinh nào trong lớp.");
  await batch.commit();
  return ok({ updated: n });
});
