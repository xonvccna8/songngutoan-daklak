// Trò chơi ôn tập theo bài (các bài có Vở ghi Toán): dựng câu hỏi từ vở ghi + từ vựng của bài.
// Chạy hoàn toàn trên máy (không gửi điểm lên máy chủ), điểm cao nhất lưu trên máy.
import { noteOf, plain, type VocabRow } from "@/lib/notebook";

export type GameMode = "match" | "vocab" | "science" | "final";

export const MODES: { id: GameMode; vi: string; en: string; desc: string }[] = [
  { id: "match", vi: "Ghép cặp từ vựng", en: "Word match", desc: "Nối từ tiếng Anh với nghĩa tiếng Việt càng nhanh càng tốt" },
  { id: "vocab", vi: "Thử thách từ vựng", en: "Vocabulary challenge", desc: "Dịch Anh ↔ Việt, nghe chọn từ, điền từ vào câu" },
  { id: "science", vi: "Đố vui kiến thức", en: "Maths quiz", desc: "Trắc nghiệm và Đúng / Sai về nội dung bài học" },
  { id: "final", vi: "Về đích", en: "Final challenge", desc: "Trộn tất cả — 3 mạng, hết mạng là dừng" },
];

export interface GameQ {
  /** Nhãn nhỏ phía trên câu hỏi */
  tag: string;
  prompt: string;
  /** Dòng phụ (nghĩa tiếng Việt của câu điền, gợi ý…) */
  sub?: string;
  /** Câu hỏi nghe: đọc to từ này thay cho chữ */
  listen?: string;
  /** Lời nhắc / đáp án là tiếng Anh → hiện màu tiếng Anh */
  enPrompt?: boolean;
  enOptions?: boolean;
  options: string[];
  answer: number;
  /** "tf" = 2 nút Đúng / Sai */
  layout?: "tf";
}

export interface MatchPair {
  id: string;
  en: string;
  vi: string;
}

export const QUIZ_SECONDS = 20;
export const LIVES = 3;

type Rand = () => number;

export function shuffle<T>(arr: readonly T[], rand: Rand = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Trộn đáp án đúng với tối đa 3 phương án nhiễu (không trùng) → { options, answer } */
function withDistractors(right: string, pool: string[], rand: Rand) {
  const others = shuffle(
    [...new Set(pool)].filter((x) => x && x.toLowerCase() !== right.toLowerCase()),
    rand
  ).slice(0, 3);
  const options = shuffle([right, ...others], rand);
  return { options, answer: options.indexOf(right) };
}

/** Bỏ phần giải thích trong ngoặc của nghĩa tiếng Việt: "mô (tissue)" → "mô" */
const short = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, " ").trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Câu từ vựng: Anh → Việt, Việt → Anh, nghe chọn từ, điền từ vào câu tiếng Anh */
export function vocabQuestions(lessonId: string, vocab: VocabRow[], rand: Rand = Math.random): GameQ[] {
  const n = noteOf(lessonId);
  const ens = vocab.map((v) => v.en);
  const vis = vocab.map((v) => short(v.vi));
  const out: GameQ[] = [];
  if (vocab.length >= 2) {
    shuffle(vocab, rand).forEach((v, i) => {
      const k = i % 3;
      if (k === 0) out.push({ tag: "Anh → Việt", prompt: v.en, sub: v.ipa, enPrompt: true, ...withDistractors(short(v.vi), vis, rand) });
      else if (k === 1) out.push({ tag: "Việt → Anh", prompt: short(v.vi), enOptions: true, ...withDistractors(v.en, ens, rand) });
      else out.push({ tag: "Nghe và chọn từ · Listen", prompt: "Bấm loa để nghe, rồi chọn từ em nghe được", listen: v.en, enOptions: true, ...withDistractors(v.en, ens, rand) });
    });
  }
  // Điền từ: bài điền từ của vở ghi + câu tiếng Anh cần nhớ có chứa từ của bài
  if (!n) return out;
  const fillWords = n.fill.map((x) => x.answer);
  n.fill.forEach((f) => out.push({ tag: "Điền từ · Fill in", prompt: f.q, sub: f.vi, enPrompt: true, enOptions: true, ...withDistractors(f.answer, [...fillWords, ...ens], rand) }));
  n.sentences.forEach((s) => {
    const hit = [...vocab].sort((a, b) => b.en.length - a.en.length).find((v) => new RegExp(`\\b${escapeRe(v.en)}\\b`, "i").test(s.en));
    if (!hit) return;
    out.push({
      tag: "Điền từ · Fill in",
      prompt: s.en.replace(new RegExp(`\\b${escapeRe(hit.en)}\\b`, "i"), "___"),
      sub: s.vi,
      enPrompt: true,
      enOptions: true,
      ...withDistractors(hit.en, ens, rand),
    });
  });
  return out.filter((q) => q.options.length >= 2);
}

/** Câu kiến thức: trắc nghiệm + Đúng/Sai của vở ghi */
export function scienceQuestions(lessonId: string, rand: Rand = Math.random): GameQ[] {
  const n = noteOf(lessonId);
  if (!n) return [];
  const mcq: GameQ[] = n.mcq.map((q) => {
    const right = plain(q.options[q.answer]);
    const options = shuffle(q.options.map(plain), rand);
    // Câu bỏ lửng ("Tiêm vaccine giúp cơ thể") → thêm "…" cho rõ là chọn ý hoàn thành câu
    const prompt = plain(q.q).trim();
    return { tag: "Trắc nghiệm · Quiz", prompt: /[?.:!…]$/.test(prompt) ? prompt : `${prompt} …`, options, answer: options.indexOf(right) };
  });
  const tf: GameQ[] = n.tf.map((t) => ({ tag: "Đúng hay sai? · True or false?", prompt: plain(t.q), options: ["Đúng", "Sai"], answer: t.answer ? 0 : 1, layout: "tf" }));
  return [...mcq, ...tf];
}

/** Bộ câu hỏi cho một lượt chơi */
export function buildRound(mode: Exclude<GameMode, "match">, lessonId: string, vocab: VocabRow[], rand: Rand = Math.random): GameQ[] {
  if (mode === "vocab") return shuffle(vocabQuestions(lessonId, vocab, rand), rand).slice(0, 12);
  if (mode === "science") return shuffle(scienceQuestions(lessonId, rand), rand).slice(0, 12);
  return shuffle([...shuffle(vocabQuestions(lessonId, vocab, rand), rand).slice(0, 8), ...scienceQuestions(lessonId, rand)], rand).slice(0, 15);
}

/** Các lượt ghép cặp: mỗi lượt 5 cặp, tối đa 3 lượt */
export function matchRounds(vocab: VocabRow[], rand: Rand = Math.random): MatchPair[][] {
  const pairs = shuffle(vocab, rand)
    .slice(0, 15)
    .map((v) => ({ id: v.id, en: v.en, vi: short(v.vi) }));
  const rounds: MatchPair[][] = [];
  for (let i = 0; i < pairs.length; i += 5) rounds.push(pairs.slice(i, i + 5));
  // Lượt cuối quá ít cặp → gộp vào lượt trước
  if (rounds.length > 1 && rounds[rounds.length - 1].length < 3) rounds[rounds.length - 2].push(...rounds.pop()!);
  return rounds;
}

/** Điểm một câu: 100 + thưởng thời gian, nhân hệ số chuỗi đúng (tối đa ×1.5) */
export const quizPoints = (secondsLeft: number, streak: number) => Math.round((100 + Math.max(0, secondsLeft) * 5) * (1 + Math.min(streak, 5) * 0.1));

/** Số sao theo tỉ lệ đúng */
export const starsOf = (correct: number, total: number) => {
  const r = total ? correct / total : 0;
  return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0;
};

// Điểm cao nhất của từng bài + chế độ (lưu trên máy)
const bestKey = (lessonId: string, mode: GameMode) => `lsn:best:${lessonId}:${mode}`;
export function getBest(lessonId: string, mode: GameMode): number {
  try {
    return Number(localStorage.getItem(bestKey(lessonId, mode))) || 0;
  } catch {
    return 0;
  }
}
export function saveBest(lessonId: string, mode: GameMode, score: number): boolean {
  if (score <= getBest(lessonId, mode)) return false;
  try {
    localStorage.setItem(bestKey(lessonId, mode), String(score));
  } catch {}
  return true;
}
