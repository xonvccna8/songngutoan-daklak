// Chấm câu gõ chữ có AI hỗ trợ: máy so khớp trước (nhanh, miễn phí); chỉ khi máy chấm SAI mới hỏi AI xem
// em có viết đúng ý bằng cách diễn đạt khác không. Kết quả AI được đệm (lsn_aiGrade) → cùng câu trả lời không gọi lại.
// AI lỗi / hết lượt / quá chậm → giữ kết quả của máy (không làm hỏng việc chấm).
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { aiEnabled, aiJson, reserveQuota } from "@/lib/server/ai";
import { evaluate } from "@/lib/live/grading";
import { GRADE_SCHEMA, GRADE_SYSTEM, STUDENT_AI_LIMITS, gradeCacheKey, gradeUserPrompt, shouldAskAi, type AiGrade } from "@/lib/ai/student-ai";
import type { Bi, Slide, TeacherKey } from "@/lib/live/types";

export const AI_GRADE_COL = "lsn_aiGrade";

export interface TextGrade {
  correct: boolean;
  /** AI đã xét câu này (đúng hoặc sai) */
  ai: boolean;
  feedback?: Bi;
}

export async function gradeWithAi(slide: Slide, key: TeacherKey, value: unknown, schoolId: string | null | undefined): Promise<TextGrade> {
  const q = slide.question;
  const machine = !!q && evaluate(q, key, value);
  // Chỉ câu gõ chữ, máy chấm sai, có đáp án mẫu, câu trả lời hợp lệ
  if (!q || q.type !== "text" || machine || !key.accept?.length || !aiEnabled()) return { correct: machine, ai: false };
  const answer = String(value ?? "").trim();
  if (!shouldAskAi(answer)) return { correct: false, ai: false };

  const ref = adminDb().collection(AI_GRADE_COL).doc(gradeCacheKey(slide.id, answer));
  try {
    const hit = await ref.get();
    if (hit.exists) return { correct: hit.get("correct") === true, ai: true, feedback: hit.get("feedback") as Bi };
    if (!(await reserveQuota([[`grade_school_${schoolId ?? "none"}`, STUDENT_AI_LIMITS.gradePerSchool]]))) return { correct: false, ai: false };
    const r = await aiJson<AiGrade>({ name: "grade_text", schema: GRADE_SCHEMA, system: GRADE_SYSTEM, user: gradeUserPrompt(q, key.accept, answer), maxTokens: 600, timeoutMs: 9_000 });
    const out = { correct: r.data.correct === true, feedback: { en: String(r.data.feedback?.en ?? "").slice(0, 300), vi: String(r.data.feedback?.vi ?? "").slice(0, 300) } };
    await ref.set({ ...out, slideId: slide.id, answer: answer.slice(0, 200), at: FieldValue.serverTimestamp() });
    return { ...out, ai: true };
  } catch (e) {
    console.error("aiGrade:", (e as Error).message);
    return { correct: false, ai: false };
  }
}
