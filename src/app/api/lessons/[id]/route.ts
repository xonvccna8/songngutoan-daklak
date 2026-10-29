// GĐ 6 — Lưu nội dung tiết (PUT { meta, slides }) hoặc xoá tiết chưa duyệt (DELETE)
import { isSanitizeError, sanitizeLesson } from "@/lib/lessons/editor";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { assertCanEdit, deleteLesson, getLesson, isOwner, isSchoolAdmin, writeLesson } from "@/lib/server/lesson-store";

export const PUT = handle(async (req: Request, ctx: RouteContext<"/api/lessons/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, lesson } = await getLesson(id);
  assertCanEdit(lesson, user);
  let data;
  try {
    data = sanitizeLesson(await readJson(req));
  } catch (e) {
    if (isSanitizeError(e)) throw new HttpError(400, e.message);
    throw e;
  }
  if (!data.slides.length) throw new HttpError(400, "Tiết cần ít nhất một trang.");
  await writeLesson(ref, data.meta, data.slides);
  return ok({ ok: true, slides: data.slides.length });
});

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/lessons/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, lesson } = await getLesson(id);
  if (!isOwner(lesson, user) && !isSchoolAdmin(lesson, user)) throw new HttpError(403, "Bạn chỉ xoá được bài của mình.");
  if (lesson.status === "approved") throw new HttpError(409, "Bài đã duyệt không xoá được (lịch sử tiết dạy còn dùng).");
  await deleteLesson(ref);
  return ok({ ok: true });
});
