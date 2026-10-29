// GĐ 6b — Trợ lý AI soạn bài: giáo án tiếng Việt → tiết song ngữ ở trạng thái Nháp (luôn chờ GV kiểm tra + quản trị duyệt).
// GET: số lượt còn lại hôm nay. POST { plan, grade, title? } → { id } của tiết nháp mới.
import { AI_DRAFT_SCHEMA, AI_LIMITS, draftToLesson, systemPrompt, userPrompt, type AiDraft } from "@/lib/lessons/ai-draft";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { aiJson, aiUsageToday, finishAiUse, reserveAiUse } from "@/lib/server/ai";
import { createLesson } from "@/lib/server/lesson-store";
import { aiFreeStatus, assertAiAllowed, countAiUse } from "@/lib/server/ai-gate";
import { DEFAULT_GRADE, isGrade } from "@/lib/curriculum";

// Soạn cả tiết có thể mất 30–90 giây
export const maxDuration = 120;

export const GET = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  return ok({ ...(await aiUsageToday(user)), enabled: !!process.env.OPENAI_API_KEY, free: await aiFreeStatus(user.uid) });
});

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const b = await readJson<{ plan?: string; grade?: number; title?: string }>(req);
  const plan = String(b.plan ?? "").trim();
  const title = String(b.title ?? "").trim().slice(0, 200);
  const grade = isGrade(Number(b.grade)) ? Number(b.grade) : DEFAULT_GRADE;
  if (plan.length < AI_LIMITS.minPlanChars) throw new HttpError(400, "Giáo án quá ngắn — hãy dán nội dung chi tiết hơn.");
  if (plan.length > AI_LIMITS.maxPlanChars) throw new HttpError(400, `Giáo án dài quá ${AI_LIMITS.maxPlanChars.toLocaleString("vi-VN")} kí tự — hãy dán từng phần.`);

  await assertAiAllowed(user.uid);
  const day = await reserveAiUse(user);
  let result;
  try {
    result = await aiJson<AiDraft>({ name: "lesson_draft", schema: AI_DRAFT_SCHEMA, system: systemPrompt(grade), user: userPrompt(plan, title) });
  } catch (e) {
    await finishAiUse(user, day, { ok: false });
    throw e;
  }
  await finishAiUse(user, day, { ok: true, ...result.usage });
  await countAiUse(user.uid);

  let lesson;
  try {
    lesson = draftToLesson(result.data, grade);
  } catch (e) {
    throw new HttpError(422, e instanceof Error ? e.message : "Không dựng được bài từ kết quả AI.");
  }
  if (!lesson.meta.title.vi) lesson.meta.title = { en: lesson.meta.title.en || "AI draft", vi: title || "Bài soạn bằng AI" };
  const id = await createLesson(user, lesson.meta, lesson.slides, null, { aiDraft: true });
  return ok({ id, slides: lesson.slides.length }, 201);
});
