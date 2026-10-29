// Bài tập AI: POST { curLessonId, count, note? } → AI đề xuất câu hỏi song ngữ, lưu vào ngân hàng ở dạng "Nháp AI".
// Dùng chung giới hạn lượt AI với trợ lý soạn bài (20 lượt/GV/ngày). Chỉ gửi tên bài + YCCĐ, không gửi dữ liệu học sinh.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { aiJson, finishAiUse, reserveAiUse } from "@/lib/server/ai";
import { assertAiAllowed, countAiUse } from "@/lib/server/ai-gate";
import { displayNameOf } from "@/lib/server/lesson-store";
import { AI_BANK, AI_BANK_SCHEMA, aiToBank, bankSystemPrompt, bankUserPrompt, type AiQuestion } from "@/lib/bank/ai";
import { toKey, toSlide } from "@/lib/bank/questions";
import { curLesson } from "@/lib/curriculum";

export const maxDuration = 90;

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const b = await readJson<{ curLessonId?: string; count?: number; note?: string }>(req);
  const l = curLesson(b.curLessonId);
  if (!l) throw new HttpError(400, "Hãy chọn bài trong SGK.");
  const count = Math.max(AI_BANK.min, Math.min(AI_BANK.max, Math.round(Number(b.count) || 6)));
  const note = String(b.note ?? "").trim().slice(0, AI_BANK.maxNote);

  await assertAiAllowed(user.uid, user.role);
  const day = await reserveAiUse(user);
  let result;
  try {
    result = await aiJson<{ questions: AiQuestion[] }>({ name: "question_bank", schema: AI_BANK_SCHEMA, system: bankSystemPrompt(l.grade), user: bankUserPrompt(l, count, note), maxTokens: 8000, timeoutMs: 80_000 });
  } catch (e) {
    await finishAiUse(user, day, { ok: false });
    throw e;
  }
  await finishAiUse(user, day, { ok: true, ...result.usage });
  await countAiUse(user.uid);

  const list = aiToBank(result.data.questions ?? [], l).slice(0, count);
  if (!list.length) throw new HttpError(422, "AI chưa tạo được câu hợp lệ, thử lại nhé.");
  const db = adminDb();
  const name = await displayNameOf(user);
  const batch = db.batch();
  list.forEach((q) => {
    const ref = db.collection(COL.questions).doc();
    batch.set(ref, {
      ...q,
      slide: JSON.parse(JSON.stringify(toSlide(ref.id, q))),
      key: toKey(q),
      status: "draft",
      aiDraft: true,
      createdBy: user.uid,
      createdByName: name,
      schoolId: user.schoolId ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  return ok({ created: list.length }, 201);
});
