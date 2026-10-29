// GĐ 6 — Tạo tiết mới (trống) hoặc nhân bản một tiết có sẵn: POST { fromId? }
import { emptyMeta, metaOf, newSlide } from "@/lib/lessons/editor";
import { handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { createLesson, getLesson, loadEditorSlides } from "@/lib/server/lesson-store";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { fromId } = await readJson<{ fromId?: string }>(req);

  if (fromId) {
    const { ref, lesson } = await getLesson(String(fromId));
    const meta = metaOf(lesson);
    meta.title = { en: meta.title.en, vi: `${meta.title.vi} (bản sao)` };
    const id = await createLesson(user, meta, await loadEditorSlides(ref, lesson.slideIds), lesson.id);
    return ok({ id }, 201);
  }

  const meta = emptyMeta();
  meta.title = { en: "New lesson", vi: "Bài mới" };
  const first = newSlide("content", 1);
  first.title = { en: "Warm-up", vi: "Khởi động" };
  const id = await createLesson(user, meta, [first], null);
  return ok({ id }, 201);
});
