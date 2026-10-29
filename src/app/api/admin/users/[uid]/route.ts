// Quản trị: duyệt tài khoản thành GV / quản trị, hoặc thu hồi quyền (chỉ quyền Lớp Song Ngữ)
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { setLsnClaims } from "@/lib/server/claims";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/users/[uid]">) => {
  const { uid } = await ctx.params;
  const me = await requireAuth(req, ["admin"]);
  const { role } = await readJson<{ role?: string }>(req);
  if (role !== "teacher" && role !== "admin" && role !== "pending") throw new HttpError(400, "Vai trò không hợp lệ.");
  if (uid === me.uid) throw new HttpError(400, "Không thể tự đổi quyền của chính mình.");

  const ref = adminDb().collection(COL.users).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tài khoản.");
  const current = snap.data()!;
  if (current.schoolId && current.schoolId !== me.schoolId) throw new HttpError(403, "Tài khoản thuộc trường khác.");

  // Tài khoản đăng nhập đã bị xóa → gỡ hồ sơ còn sót, báo rõ thay vì lỗi 500
  try {
    await adminAuth().getUser(uid);
  } catch (e) {
    if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
    await ref.delete();
    throw new HttpError(404, "Tài khoản này đã bị xóa. Bấm Tải lại để cập nhật danh sách.");
  }

  if (role === "pending") {
    await setLsnClaims(uid, null);
    await ref.update({ role: "pending", schoolId: null });
  } else {
    await setLsnClaims(uid, { role, schoolId: me.schoolId, classIds: [] });
    await ref.update({ role, schoolId: me.schoolId });
  }
  // Buộc tải lại token để quyền mới có hiệu lực ngay
  await adminAuth().revokeRefreshTokens(uid);
  return ok({ ok: true });
});
