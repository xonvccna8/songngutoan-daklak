// Đợt A — Đèn hiểu bài + chẩn đoán "vướng tiếng Anh hay vướng kiến thức" (hàm thuần, có test trong tests/diagnose.test.ts).
// Chỉ là GỢI Ý cho GV theo luật rõ ràng; GV quyết định.
import type { ExitTicket, Light, ParticipantDoc, ResponseDoc } from "@/lib/live/types";

// ---------------- Đèn hiểu bài ----------------

export const lightKey = (slideId: string, step: number) => `${slideId}:${step}`;

/** Đỏ từ 30% trở lên → gợi ý GV giảng lại bằng tiếng Việt */
export const LIGHT_ALERT = 0.3;

export interface LightTally {
  g: number;
  y: number;
  r: number;
  total: number;
  /** Tỉ lệ đỏ trên số em đã bấm */
  redPct: number;
  /** uid các em bấm đỏ / vàng (GV xem, tivi không hiện) */
  red: string[];
  yellow: string[];
  alert: boolean;
}

export function tallyLights(participants: Pick<ParticipantDoc, "uid" | "lights">[], key: string): LightTally {
  const t: LightTally = { g: 0, y: 0, r: 0, total: 0, redPct: 0, red: [], yellow: [], alert: false };
  for (const p of participants) {
    const v: Light | undefined = p.lights?.[key];
    if (!v) continue;
    t[v]++;
    t.total++;
    if (v === "r") t.red.push(p.uid);
    if (v === "y") t.yellow.push(p.uid);
  }
  t.redPct = t.total ? t.r / t.total : 0;
  // Cần ít nhất 3 em bấm mới cảnh báo (tránh 1/2 em đỏ = 50%)
  t.alert = t.total >= 3 && t.redPct >= LIGHT_ALERT;
  return t;
}

// ---------------- Chẩn đoán ----------------

export type Barrier = "ok" | "language" | "content" | "both" | "unknown";

export const BARRIER_LABEL: Record<Barrier, { vi: string; hint: string; tone: "teal" | "sun" | "coral" | "ink" }> = {
  ok: { vi: "Ổn", hint: "Hiểu kiến thức và theo kịp tiếng Anh", tone: "teal" },
  language: { vi: "Vướng tiếng Anh", hint: "Hiểu kiến thức nhưng chưa hiểu đề / thuật ngữ tiếng Anh → ôn từ vựng, cho xem song ngữ", tone: "sun" },
  content: { vi: "Vướng kiến thức", hint: "Sai cả khi có tiếng Việt → giảng lại nội dung bằng tiếng Việt", tone: "coral" },
  both: { vi: "Vướng cả hai", hint: "Cần kèm riêng: giảng lại bằng tiếng Việt rồi mới tăng tiếng Anh", tone: "coral" },
  unknown: { vi: "Chưa đủ dữ liệu", hint: "Em trả lời quá ít câu để kết luận", tone: "ink" },
};

const rate = (c: number, a: number) => (a ? c / a : 0);
/** Cần ít nhất 2 câu mỗi nhóm mới dùng để kết luận */
const MIN = 2;

export interface StudentDiagnosis {
  barrier: Barrier;
  sci: { a: number; c: number };
  lang: { a: number; c: number };
  /** Trả lời khi chỉ có tiếng Anh / khi có xem tiếng Việt */
  en: { a: number; c: number };
  vi: { a: number; c: number };
}

/** Chẩn đoán một em từ các câu trả lời (không tính luyện nói) */
export function diagnoseStudent(resps: Pick<ResponseDoc, "qtype" | "skill" | "correct" | "vi">[]): StudentDiagnosis {
  const d: StudentDiagnosis = { barrier: "unknown", sci: { a: 0, c: 0 }, lang: { a: 0, c: 0 }, en: { a: 0, c: 0 }, vi: { a: 0, c: 0 } };
  for (const r of resps) {
    if (r.qtype === "speak") continue;
    const ok = r.correct ? 1 : 0;
    const part = r.skill === "Ngôn ngữ" ? d.lang : d.sci;
    part.a++;
    part.c += ok;
    const how = r.vi ? d.vi : d.en;
    how.a++;
    how.c += ok;
  }
  const sci = d.sci.a >= MIN ? rate(d.sci.c, d.sci.a) : null;
  const lang = d.lang.a >= MIN ? rate(d.lang.c, d.lang.a) : null;
  // Dấu hiệu rõ nhất: chỉ tiếng Anh thì sai, có tiếng Việt thì đúng
  const flipGap = d.en.a >= MIN && d.vi.a >= MIN ? rate(d.vi.c, d.vi.a) - rate(d.en.c, d.en.a) : null;

  if (sci != null && lang != null) {
    if (sci >= 0.6 && lang < 0.5) d.barrier = "language";
    else if (sci < 0.5 && lang >= 0.5) d.barrier = "content";
    else if (sci < 0.5 && lang < 0.5) d.barrier = "both";
    else d.barrier = "ok";
  } else if (sci != null) {
    d.barrier = sci >= 0.6 ? "ok" : "content";
  } else if (lang != null) {
    d.barrier = lang >= 0.5 ? "ok" : "language";
  }
  // Lật sang tiếng Việt thì đúng hẳn hơn → nghiêng về vướng tiếng Anh
  if (flipGap != null && flipGap >= 0.4 && (d.barrier === "ok" || d.barrier === "unknown")) d.barrier = "language";
  if (flipGap != null && flipGap >= 0.4 && d.barrier === "both") d.barrier = "language";
  return d;
}

export type QVerdict = "ok" | "language" | "content" | "few";

export interface QuestionDiagnosis {
  answered: number;
  wrongPct: number;
  /** Tỉ lệ sai khi chỉ đọc tiếng Anh / khi có tiếng Việt (null = quá ít em) */
  enWrongPct: number | null;
  viWrongPct: number | null;
  verdict: QVerdict;
  /** Đáp án sai hay gặp nhất */
  topWrong: string | null;
}

/** Chẩn đoán một câu hỏi từ câu trả lời của cả lớp */
export function diagnoseQuestion(resps: Pick<ResponseDoc, "correct" | "vi" | "value">[], skill?: string): QuestionDiagnosis {
  const answered = resps.length;
  const wrong = resps.filter((r) => !r.correct);
  const en = resps.filter((r) => !r.vi);
  const vi = resps.filter((r) => r.vi);
  const wr = (xs: typeof resps) => (xs.length >= MIN ? xs.filter((r) => !r.correct).length / xs.length : null);
  const counts = new Map<string, number>();
  wrong.forEach((r) => counts.set(String(r.value ?? ""), (counts.get(String(r.value ?? "")) ?? 0) + 1));
  const topWrong = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const q: QuestionDiagnosis = { answered, wrongPct: answered ? wrong.length / answered : 0, enWrongPct: wr(en), viWrongPct: wr(vi), verdict: "few", topWrong };
  if (answered < 3) return q;
  if (q.wrongPct < 0.4) q.verdict = "ok";
  // Vướng tiếng Anh chỉ khi: có tiếng Việt thì phần lớn làm đúng (sai < 40%) VÀ chỉ tiếng Anh thì sai nhiều hơn hẳn
  else if (q.enWrongPct != null && q.viWrongPct != null) q.verdict = q.viWrongPct < 0.4 && q.enWrongPct - q.viWrongPct >= 0.3 ? "language" : "content";
  else q.verdict = skill === "Ngôn ngữ" ? "language" : "content";
  return q;
}

export const VERDICT_LABEL: Record<QVerdict, string> = {
  ok: "Lớp nắm được",
  language: "Có thể vướng tiếng Anh: nhiều em sai khi chỉ đọc tiếng Anh, đúng khi có tiếng Việt",
  content: "Vướng kiến thức: sai cả khi có tiếng Việt → giảng lại nội dung",
  few: "Chưa đủ câu trả lời để kết luận",
};

// ---------------- Phiếu ra về 3-2-1 ----------------

export interface ExitSummary {
  count: number;
  /** Từ mới được chọn nhiều nhất */
  words: { word: string; n: number }[];
  ideas: { uid: string; text: string }[];
  questions: { uid: string; text: string }[];
}

export function summarizeExits(participants: Pick<ParticipantDoc, "uid" | "exit">[]): ExitSummary {
  const words = new Map<string, number>();
  const s: ExitSummary = { count: 0, words: [], ideas: [], questions: [] };
  for (const p of participants) {
    if (!p.exit) continue;
    s.count++;
    p.exit.words.forEach((w) => words.set(w, (words.get(w) ?? 0) + 1));
    p.exit.ideas.filter(Boolean).forEach((t) => s.ideas.push({ uid: p.uid, text: t }));
    if (p.exit.question) s.questions.push({ uid: p.uid, text: p.exit.question });
  }
  s.words = [...words.entries()].map(([word, n]) => ({ word, n })).sort((a, b) => b.n - a.n || a.word.localeCompare(b.word));
  return s;
}

/** Làm sạch phiếu HS gửi (dùng ở máy chủ): từ phải có trong thuật ngữ của tiết */
export function cleanExit(raw: { words?: unknown; ideas?: unknown; question?: unknown }, termWords: string[], now: number): ExitTicket | string {
  const allowed = new Map(termWords.map((w) => [w.toLowerCase(), w]));
  const words = [...new Set((Array.isArray(raw.words) ? raw.words : []).map((w) => allowed.get(String(w).toLowerCase())).filter((w): w is string => !!w))].slice(0, 3);
  const ideas = (Array.isArray(raw.ideas) ? raw.ideas : []).map((t) => String(t ?? "").trim().slice(0, 150)).filter(Boolean).slice(0, 2);
  const question = String(raw.question ?? "").trim().slice(0, 200);
  if (!words.length && !ideas.length && !question) return "Em chưa điền gì vào phiếu.";
  return { words, ideas, question, at: now };
}
