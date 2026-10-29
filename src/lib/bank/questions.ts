// Ngân hàng câu hỏi (lsn_questions): câu hỏi song ngữ gắn bài SGK, YCCĐ, mức độ (Thông tư 22/2021).
// Mỗi câu lưu sẵn ở dạng "trang" (Slide) + đáp án (TeacherKey) như tiết học → giao bài về nhà dùng lại
// toàn bộ phần chấm điểm + gợi ý 3 tầng có sẵn. Hàm thuần (máy chủ + trình duyệt), có test trong tests/bank.test.ts
import type { Bi, Skill, Slide, TeacherKey } from "@/lib/live/types";
import { curLesson, isCurLessonId, isGrade, outcome } from "@/lib/curriculum";

export type BankType = "mcq" | "tf" | "number" | "text" | "speak";
export type BankLevel = "know" | "understand" | "apply";
export type BankStatus = "draft" | "pending" | "approved";

export const BANK_TYPES: Record<BankType, { vi: string; en: string }> = {
  mcq: { vi: "Trắc nghiệm 4 lựa chọn", en: "Multiple choice" },
  tf: { vi: "Đúng / Sai", en: "True / False" },
  number: { vi: "Nhập số", en: "Number" },
  text: { vi: "Gõ chữ (tiếng Anh)", en: "Short answer" },
  speak: { vi: "Luyện nói", en: "Speaking" },
};

/** Mức độ nhận thức theo Thông tư 22/2021 */
export const BANK_LEVELS: Record<BankLevel, { vi: string; en: string; color: string }> = {
  know: { vi: "Biết", en: "Remember", color: "#0E9F8A" },
  understand: { vi: "Hiểu", en: "Understand", color: "#C99A1F" },
  apply: { vi: "Vận dụng", en: "Apply", color: "#E8492E" },
};

export const TF_OPTIONS: Bi[] = [
  { en: "True", vi: "Đúng" },
  { en: "False", vi: "Sai" },
];

/** Mã "tiết" giả của bài tập giao từ ngân hàng (lsn_assignments.lessonId) */
export const BANK_LESSON_ID = "bank";

export interface BankInput {
  type: BankType;
  level: BankLevel;
  skill: Skill;
  grade: number;
  curLessonId: string | null;
  outcomeIds: string[];
  prompt: Bi;
  /** mcq: 4 phương án; tf: tự điền Đúng/Sai */
  options: Bi[];
  /** mcq/tf: chỉ số đáp án đúng; number: đáp số */
  answer: number | null;
  unit: string;
  /** text: các câu trả lời chấp nhận (máy cho phép sai chính tả nhẹ) */
  accept: string[];
  /** speak: câu HS đọc to */
  speakTarget: string;
  /** Tầng 2: cách làm (không lộ đáp án) */
  method: Bi;
  /** Tầng 3: lời giải */
  explain: Bi;
}

export interface BankDoc extends BankInput {
  id: string;
  slide: Slide;
  key: TeacherKey;
  status: BankStatus;
  /** Câu AI đề xuất, GV chưa kiểm tra (chưa giao bài được) */
  aiDraft?: boolean;
  createdBy: string;
  createdByName: string;
  schoolId: string | null;
  createdAt?: { toMillis(): number } | null;
  updatedAt?: { toMillis(): number } | null;
}

export const emptyBankInput = (grade = 8, curLessonId: string | null = null): BankInput => ({
  type: "mcq",
  level: "know",
  skill: "Toán",
  grade,
  curLessonId,
  outcomeIds: [],
  prompt: { en: "", vi: "" },
  options: [0, 1, 2, 3].map(() => ({ en: "", vi: "" })),
  answer: 0,
  unit: "",
  accept: [],
  speakTarget: "",
  method: { en: "", vi: "" },
  explain: { en: "", vi: "" },
});

const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");
const bi = (x: unknown, max: number): Bi => {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  return { en: str(o.en, max), vi: str(o.vi, max) };
};

/** Làm sạch câu GV gửi lên; trả chuỗi lỗi tiếng Việt nếu không hợp lệ */
export function sanitizeBankInput(x: unknown): BankInput | string {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const type = o.type as BankType;
  if (!(type in BANK_TYPES)) return "Loại câu hỏi không hợp lệ.";
  const level = (o.level as BankLevel) in BANK_LEVELS ? (o.level as BankLevel) : "know";
  const skill: Skill = o.skill === "Ngôn ngữ" ? "Ngôn ngữ" : "Toán";
  const grade = Math.round(Number(o.grade));
  if (!isGrade(grade)) return "Khối lớp phải từ 6 đến 9.";
  const curLessonId = isCurLessonId(o.curLessonId) ? o.curLessonId : null;
  if (curLessonId && curLesson(curLessonId)!.grade !== grade) return "Bài SGK không thuộc khối đã chọn.";
  const outcomeIds = (Array.isArray(o.outcomeIds) ? o.outcomeIds : [])
    .filter((id): id is string => typeof id === "string" && !!outcome(id) && (!curLessonId || outcome(id)!.lessonId === curLessonId))
    .slice(0, 6);

  const prompt = bi(o.prompt, 600);
  const speakTarget = str(o.speakTarget, 200);
  if (type === "speak") {
    if (speakTarget.split(/\s+/).filter(Boolean).length < 2) return "Câu luyện nói cần ít nhất 2 từ tiếng Anh.";
  } else if (!prompt.en && !prompt.vi) return "Cần nhập đề bài.";

  let options: Bi[] = [];
  let answer: number | null = null;
  let accept: string[] = [];
  const unit = type === "number" ? str(o.unit, 20) : "";
  if (type === "mcq") {
    options = (Array.isArray(o.options) ? o.options : []).slice(0, 4).map((x) => bi(x, 200));
    if (options.length < 2 || options.some((p) => !p.en && !p.vi)) return "Câu trắc nghiệm cần đủ nội dung các phương án.";
    answer = Math.round(Number(o.answer));
    if (!(answer >= 0 && answer < options.length)) return "Hãy chọn đáp án đúng.";
  } else if (type === "tf") {
    options = TF_OPTIONS;
    answer = Number(o.answer) === 1 ? 1 : 0;
  } else if (type === "number") {
    answer = typeof o.answer === "number" ? o.answer : parseFloat(String(o.answer ?? "").replace(",", "."));
    if (!Number.isFinite(answer)) return "Đáp số phải là một số.";
  } else if (type === "text") {
    accept = (Array.isArray(o.accept) ? o.accept : [])
      .map((a) => str(a, 120))
      .filter(Boolean)
      .slice(0, 8);
    if (!accept.length) return "Cần ít nhất 1 câu trả lời được chấp nhận.";
  }
  return {
    type,
    level,
    skill: type === "speak" ? "Ngôn ngữ" : skill,
    grade,
    curLessonId,
    outcomeIds,
    prompt: type === "speak" && !prompt.en && !prompt.vi ? { en: "Read aloud.", vi: "Đọc to câu sau." } : prompt,
    options,
    answer,
    unit,
    accept,
    speakTarget: type === "speak" ? speakTarget : "",
    method: bi(o.method, 400),
    explain: bi(o.explain, 800),
  };
}

/** Câu → "trang" cho bài tập về nhà (không chứa đáp án) */
export function toSlide(id: string, b: BankInput): Slide {
  const title = { en: BANK_TYPES[b.type].en, vi: BANK_TYPES[b.type].vi };
  if (b.type === "speak") {
    return {
      id,
      order: 0,
      type: "speak",
      title,
      blocks: [{ kind: "text", step: 0, text: b.prompt }],
      speak: { target: b.speakTarget, time: 60 },
      outcomeIds: b.outcomeIds,
    };
  }
  const qtype = b.type === "tf" ? "mcq" : b.type;
  return {
    id,
    order: 0,
    type: qtype,
    title,
    blocks: [],
    question: { type: qtype, time: 90, skill: b.skill, prompt: b.prompt, ...(b.options.length ? { options: b.options } : {}), ...(b.unit ? { unit: b.unit } : {}) },
    outcomeIds: b.outcomeIds,
  };
}

/** Đáp án + gợi ý của câu (chỉ máy chủ / GV đọc) */
export function toKey(b: BankInput): TeacherKey {
  const key: TeacherKey = { notes: [] };
  if (b.type === "mcq" || b.type === "tf" || b.type === "number") key.answer = b.answer ?? undefined;
  if (b.type === "text") key.accept = b.accept;
  if (b.explain.en || b.explain.vi) key.explain = b.explain;
  if (b.method.en || b.method.vi) key.method = b.method;
  // Firestore không nhận undefined
  return JSON.parse(JSON.stringify(key));
}

/** Đáp án dạng chữ (danh sách, xuất Word) */
export function answerText(b: Pick<BankInput, "type" | "options" | "answer" | "unit" | "accept" | "speakTarget">): string {
  if (b.type === "mcq") return `${"ABCD"[b.answer ?? 0]}. ${b.options[b.answer ?? 0]?.en || b.options[b.answer ?? 0]?.vi || ""}`;
  if (b.type === "tf") return b.answer === 1 ? "False / Sai" : "True / Đúng";
  if (b.type === "number") return `${b.answer}${b.unit ? ` ${b.unit}` : ""}`;
  if (b.type === "text") return b.accept.join(" / ");
  return `Đọc đúng: “${b.speakTarget}”`;
}

/** Chữ để tìm kiếm */
export const bankSearchText = (b: BankInput) => [b.prompt.en, b.prompt.vi, b.speakTarget, ...b.options.flatMap((o) => [o.en, o.vi]), curLesson(b.curLessonId)?.vi ?? ""].join(" ");
