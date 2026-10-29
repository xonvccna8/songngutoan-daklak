// Bài tập AI: AI đề xuất câu hỏi song ngữ cho một bài SGK (theo YCCĐ) → vào ngân hàng ở dạng "Nháp AI".
// GV kiểm tra, sửa, bấm Lưu thì mới giao bài được. Hàm thuần, có test trong tests/bank.test.ts
import type { CurLesson } from "@/lib/curriculum";
import { sanitizeBankInput, type BankInput, type BankLevel, type BankType } from "@/lib/bank/questions";

export const AI_BANK = { min: 3, max: 10, maxNote: 1500 };

export interface AiQuestion {
  type: BankType;
  level: BankLevel;
  skill: "Toán" | "Ngôn ngữ";
  outcome_index: number;
  prompt: { en: string; vi: string };
  options: { en: string; vi: string }[];
  answer_index: number;
  answer_number: number | null;
  unit: string;
  accept: string[];
  speak_target: string;
  method: { en: string; vi: string };
  explain: { en: string; vi: string };
}

const S = { type: "string" } as const;
const BI = { type: "object", additionalProperties: false, required: ["en", "vi"], properties: { en: S, vi: S } } as const;
const obj = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });

export const AI_BANK_SCHEMA = obj({
  questions: {
    type: "array",
    items: obj({
      type: { type: "string", enum: ["mcq", "tf", "number", "text", "speak"] },
      level: { type: "string", enum: ["know", "understand", "apply"] },
      skill: { type: "string", enum: ["Toán", "Ngôn ngữ"] },
      outcome_index: { type: "integer" },
      prompt: BI,
      options: { type: "array", items: BI },
      answer_index: { type: "integer" },
      answer_number: { type: ["number", "null"] },
      unit: S,
      accept: { type: "array", items: S },
      speak_target: S,
      method: BI,
      explain: BI,
    }),
  },
});

export function bankSystemPrompt(grade: number): string {
  return [
    `Bạn là giáo viên Toán THCS Việt Nam dạy song ngữ Việt–Anh (CLIL), ra câu hỏi luyện tập cho lớp ${grade}, sách Kết nối tri thức với cuộc sống.`,
    "Quy tắc:",
    "- Chỉ hỏi kiến thức thuộc bài và yêu cầu cần đạt được cho; không bịa số liệu, không dùng kiến thức ngoài chương trình.",
    "- Mọi chữ có cả en (tiếng Anh A2–B1, câu ngắn, đúng thuật ngữ toán học) và vi (tiếng Việt đúng thuật ngữ SGK). Kí hiệu toán viết bằng Unicode (x², √, ∠, °, ≠, ≤). Tự kiểm tra lại đáp số trước khi trả lời.",
    "- Trộn mức độ theo Thông tư 22: khoảng 40% know (Biết), 40% understand (Hiểu), 20% apply (Vận dụng, gắn đời sống).",
    "- Dạng câu: chủ yếu mcq (đúng 4 phương án, 1 đáp án đúng, phương án nhiễu hợp lí); có 1–2 câu tf (options để trống, answer_index 0 = True, 1 = False); nên có 1–3 câu number (đáp số trong answer_number, đơn vị trong unit) nếu bài có tính toán; có thể có 1 câu text (accept là 1–3 từ/cụm tiếng Anh ngắn chấp nhận được) và 1 câu speak (speak_target là một câu tiếng Anh 5–12 từ về nội dung bài để HS đọc to).",
    "- skill = \"Ngôn ngữ\" cho câu hỏi về thuật ngữ / câu tiếng Anh (text, speak, câu hỏi nghĩa của từ); còn lại \"Toán\".",
    "- outcome_index = số thứ tự (bắt đầu từ 1) của yêu cầu cần đạt mà câu đo; 0 nếu không rõ.",
    "- method: gợi ý cách làm, KHÔNG lộ đáp án. explain: lời giải ngắn 1–2 câu.",
    "- Trường không dùng thì để rỗng: options [], accept [], unit \"\", speak_target \"\", answer_number null, answer_index 0.",
    "- Không dùng tên học sinh hay thông tin cá nhân.",
  ].join("\n");
}

export function bankUserPrompt(l: CurLesson, count: number, note: string): string {
  const outs = l.outcomes.length ? l.outcomes.map((o, i) => `${i + 1}. ${o.vi} (${o.en})`).join("\n") : "(chưa có YCCĐ — bám theo tên bài)";
  return [
    `Bài ${l.no}: ${l.vi} (${l.en}) — lớp ${l.grade}.`,
    `Yêu cầu cần đạt:\n${outs}`,
    note ? `Ghi chú của giáo viên:\n${note}` : "",
    `Hãy ra đúng ${count} câu hỏi.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Kết quả AI → câu hợp lệ cho ngân hàng (câu lỗi bị bỏ qua) */
export function aiToBank(list: AiQuestion[], l: CurLesson): BankInput[] {
  const out: BankInput[] = [];
  for (const q of list) {
    const o = l.outcomes[q.outcome_index - 1];
    const b = sanitizeBankInput({
      type: q.type,
      level: q.level,
      skill: q.skill,
      grade: l.grade,
      curLessonId: l.id,
      outcomeIds: o ? [o.id] : [],
      prompt: q.prompt,
      options: q.options,
      answer: q.type === "number" ? q.answer_number : q.answer_index,
      unit: q.unit,
      accept: q.accept,
      speakTarget: q.speak_target,
      method: q.method,
      explain: q.explain,
    });
    if (typeof b !== "string") out.push(b);
  }
  return out;
}
