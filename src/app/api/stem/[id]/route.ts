// Dự án STEM — GV sửa nội dung / đóng – mở lại dự án / xoá (xoá cả nhật kí các tổ)
import { adminDb } from "@/lib/firebase/admin";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadProjectForStaff } from "@/lib/server/stem";
import { sanitizeProject } from "@/lib/stem/projects";

export const PUT = handle(async (req: Request, ctx: RouteContext<"/api/stem/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref } = await loadProjectForStaff(id, user);
  const body = await readJson<Record<string, unknown> & { status?: string }>(req);
  if (body.status && !body.title) {
    if (body.status !== "open" && body.status !== "closed") throw new HttpError(400, "Trạng thái không hợp lệ.");
    await ref.update({ status: body.status });
    return ok({ ok: true });
  }
  const p = sanitizeProject(body);
  if (typeof p === "string") throw new HttpError(400, p);
  await ref.update({ ...p });
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/stem/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref } = await loadProjectForStaff(id, user);
  await adminDb().recursiveDelete(ref);
  return ok({ ok: true });
});
