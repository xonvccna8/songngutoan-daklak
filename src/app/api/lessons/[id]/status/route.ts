// GĐ 6 — Chuyển trạng thái tiết: Nháp → Chờ duyệt → Đã duyệt (POST { status, note? })
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { changeStatus } from "@/lib/server/lesson-store";
import type { LessonStatus } from "@/lib/live/types";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/lessons/[id]/status">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { status, note } = await readJson<{ status?: string; note?: string }>(req);
  if (status !== "draft" && status !== "pending" && status !== "approved") throw new HttpError(400, "Trạng thái không hợp lệ.");
  await changeStatus(id, user, status as LessonStatus, typeof note === "string" ? note.trim().slice(0, 500) || null : null);
  return ok({ ok: true });
});
