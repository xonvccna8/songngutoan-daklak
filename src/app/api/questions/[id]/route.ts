// Ngân hàng câu hỏi — sửa / duyệt / xoá (giống học liệu).
// GV chỉ sửa, xoá câu mình thêm khi chưa duyệt; sửa xong quay lại "Chờ duyệt" và bỏ dấu "Nháp AI". Quản trị làm được tất cả.
import { FieldValue } from "firebase-admin/firestore";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadQuestion } from "@/lib/server/bank";
import { sanitizeBankInput, toKey, toSlide } from "@/lib/bank/questions";

export const PUT = handle(async (req: Request, ctx: RouteContext<"/api/questions/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, admin, mine } = await loadQuestion(id, user);
  const body = await readJson<Record<string, unknown> & { status?: string }>(req);

  // Chỉ đổi trạng thái (quản trị duyệt / gỡ duyệt)
  if (body.status && !body.type) {
    if (!admin) throw new HttpError(403, "Chỉ quản trị duyệt câu hỏi.");
    if (body.status !== "approved" && body.status !== "draft") throw new HttpError(400, "Trạng thái không hợp lệ.");
    await ref.update({ status: body.status, ...(body.status === "approved" ? { aiDraft: false } : {}), updatedAt: FieldValue.serverTimestamp() });
    return ok({ ok: true });
  }

  if (!admin && !mine) throw new HttpError(403, "Bạn chỉ sửa được câu mình thêm (khi chưa duyệt).");
  const b = sanitizeBankInput(body);
  if (typeof b === "string") throw new HttpError(400, b);
  await ref.update({
    ...b,
    slide: JSON.parse(JSON.stringify(toSlide(id, b))),
    key: toKey(b),
    status: admin ? "approved" : "pending",
    aiDraft: false,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/questions/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, admin, mine } = await loadQuestion(id, user);
  if (!admin && !mine) throw new HttpError(403, "Bạn chỉ xoá được câu mình thêm (khi chưa duyệt).");
  await ref.delete();
  return ok({ ok: true });
});
