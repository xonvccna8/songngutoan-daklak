// GĐ 4 — Sửa / duyệt / xoá học liệu (giống thuật ngữ).
// GV chỉ sửa, xoá học liệu mình thêm và chưa duyệt; sửa xong quay lại "Chờ duyệt". Quản trị làm được tất cả.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth, type AuthedUser } from "@/lib/server/api";
import { sanitizeResource, type ResourceDoc } from "@/lib/library/resources";

async function load(id: string, user: AuthedUser) {
  const ref = adminDb().collection(COL.resources).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy học liệu.");
  const r = snap.data() as ResourceDoc;
  const admin = user.role === "admin" && (!r.schoolId || r.schoolId === user.schoolId);
  const mine = r.createdBy === user.uid && r.status !== "approved";
  return { ref, admin, mine };
}

export const PUT = handle(async (req: Request, ctx: RouteContext<"/api/resources/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, admin, mine } = await load(id, user);
  const body = await readJson<Record<string, unknown> & { status?: string }>(req);

  // Chỉ đổi trạng thái (quản trị duyệt / gỡ duyệt)
  if (body.status && !body.url) {
    if (!admin) throw new HttpError(403, "Chỉ quản trị duyệt học liệu.");
    if (body.status !== "approved" && body.status !== "draft") throw new HttpError(400, "Trạng thái không hợp lệ.");
    await ref.update({ status: body.status, updatedAt: FieldValue.serverTimestamp() });
    return ok({ ok: true });
  }

  if (!admin && !mine) throw new HttpError(403, "Bạn chỉ sửa được học liệu mình thêm (khi chưa duyệt).");
  const r = sanitizeResource(body);
  if (typeof r === "string") throw new HttpError(400, r);
  await ref.update({ ...r, status: admin ? "approved" : "pending", updatedAt: FieldValue.serverTimestamp() });
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/resources/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, admin, mine } = await load(id, user);
  if (!admin && !mine) throw new HttpError(403, "Bạn chỉ xoá được học liệu mình thêm (khi chưa duyệt).");
  await ref.delete();
  return ok({ ok: true });
});
