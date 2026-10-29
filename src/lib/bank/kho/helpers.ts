// Hàm dựng câu hỏi gọn cho bộ ngân hàng câu hỏi dựng sẵn (kho). Mỗi câu → BankInput (cùng khuôn với câu GV soạn).
import type { BankInput, BankLevel } from "@/lib/bank/questions";

type L = "K" | "U" | "A";
const LV: Record<L, BankLevel> = { K: "know", U: "understand", A: "apply" };
type Pair = [string, string];

export interface KhoQuestion extends BankInput {
  /** Mã ổn định trong bài (để nạp lại không trùng) */
  key: string;
}

const base = (lesson: string, level: L, o: number): Pick<BankInput, "level" | "grade" | "curLessonId" | "outcomeIds" | "unit" | "accept" | "speakTarget" | "method" | "options" | "answer"> => ({
  level: LV[level],
  grade: Number(lesson.match(/^k(\d)/)![1]),
  curLessonId: lesson,
  outcomeIds: o > 0 ? [`${lesson}-${o}`] : [],
  unit: "",
  accept: [],
  speakTarget: "",
  method: { en: "", vi: "" },
  options: [],
  answer: null,
});

/** Xáo trộn cố định theo mã câu (nạp lại vẫn cùng thứ tự) → đáp án đúng rải đều A/B/C/D, HS không đoán theo vị trí */
export function shuffleFixed<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rand = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Trắc nghiệm 4 lựa chọn: q = [en, vi]; opts = [[en, vi] × 4]; answer = chỉ số đáp án đúng trong opts (0–3) — thứ tự hiển thị được xáo trộn */
export const mc = (lesson: string, key: string, level: L, o: number, q: Pair, opts: Pair[], answer: number, explain: Pair, skill: "Toán" | "Ngôn ngữ" = "Toán"): KhoQuestion => {
  const order = shuffleFixed(opts.map((_, i) => i), `${lesson}-${key}`);
  return {
    ...base(lesson, level, o),
    key,
    type: "mcq",
    skill,
    prompt: { en: q[0], vi: q[1] },
    options: order.map((i) => ({ en: opts[i][0], vi: opts[i][1] })),
    answer: order.indexOf(answer),
    explain: { en: explain[0], vi: explain[1] },
  };
};

/** Đúng / Sai: isTrue = mệnh đề đúng */
export const tf = (lesson: string, key: string, level: L, o: number, q: Pair, isTrue: boolean, explain: Pair): KhoQuestion => ({
  ...base(lesson, level, o),
  key,
  type: "tf",
  skill: "Toán",
  prompt: { en: q[0], vi: q[1] },
  answer: isTrue ? 0 : 1,
  explain: { en: explain[0], vi: explain[1] },
});

/** Nhập số: đáp số + đơn vị (có thể trống); method = gợi ý cách làm (tầng 2) */
export const nu = (lesson: string, key: string, level: L, o: number, q: Pair, answer: number, unit: string, method: Pair, explain: Pair): KhoQuestion => ({
  ...base(lesson, level, o),
  key,
  type: "number",
  skill: "Toán",
  prompt: { en: q[0], vi: q[1] },
  answer,
  unit,
  method: { en: method[0], vi: method[1] },
  explain: { en: explain[0], vi: explain[1] },
});

/** Gõ thuật ngữ tiếng Anh (phần Ngôn ngữ) */
export const tx = (lesson: string, key: string, level: L, o: number, q: Pair, accept: string[], explain: Pair): KhoQuestion => ({
  ...base(lesson, level, o),
  key,
  type: "text",
  skill: "Ngôn ngữ",
  prompt: { en: q[0], vi: q[1] },
  accept,
  explain: { en: explain[0], vi: explain[1] },
});

/** Luyện nói: đọc to một câu toán học bằng tiếng Anh */
export const sp = (lesson: string, key: string, o: number, target: string, vi: string): KhoQuestion => ({
  ...base(lesson, "U", o),
  key,
  type: "speak",
  skill: "Ngôn ngữ",
  prompt: { en: "Read the sentence aloud clearly.", vi: `Đọc to, rõ câu sau (nghĩa: ${vi})` },
  speakTarget: target,
  explain: { en: "", vi: "" },
});
