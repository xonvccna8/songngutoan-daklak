// Chấm điểm (dùng chung máy chủ + trình duyệt) — có test trong tests/grading.test.ts
import type { Block, Question, Slide, TeacherKey } from "@/lib/live/types";

export const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function lev(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}

export const similarity = (a: string, b: string) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

/** Câu kéo nhãn gửi lên dạng "2,0,1" (nhãn cho từng ô); ô bỏ trống = -1 */
export const parseLabels = (value: unknown): number[] =>
  String(value ?? "")
    .split(",")
    .map((x) => (x.trim() === "" ? -1 : Number(x)))
    .map((n) => (Number.isInteger(n) ? n : -1));

/** Đúng/sai cho câu chọn đáp án, nhập số, gõ chữ (gõ chữ cho phép sai chính tả nhẹ), kéo nhãn */
export function evaluate(q: Question, key: TeacherKey, value: unknown): boolean {
  if (q.type === "mcq") return Number(value) === key.answer;
  if (q.type === "label") {
    const got = parseLabels(value);
    const want = key.order ?? [];
    return want.length > 0 && got.length === want.length && want.every((w, i) => got[i] === w);
  }
  if (q.type === "number") {
    const v = parseFloat(String(value).replace(",", "."));
    return Number.isFinite(v) && Math.abs(v - Number(key.answer)) < 1e-6;
  }
  const v = norm(value);
  return (key.accept ?? []).some((a) => {
    const b = norm(a);
    return v === b || similarity(v, b) >= 0.85;
  });
}

/** Hiển thị câu trả lời của HS (bảng điều khiển, xem lại, hồ sơ) */
export function fmtAnswer(q: Pick<Question, "type" | "options" | "targets" | "unit"> | undefined, value: unknown): string {
  if (!q) return String(value ?? "");
  if (q.type === "mcq") return `${"ABCD"[Number(value)] ?? value}. ${q.options?.[Number(value)]?.en ?? ""}`;
  if (q.type === "label") return labelPairs(q, parseLabels(value));
  if (q.type === "number") return `${value}${q.unit ?? ""}`;
  return String(value ?? "");
}

/** "A → vertex · B → base" (ô bỏ trống hiện "?") */
export function labelPairs(q: Pick<Question, "options" | "targets">, order: number[]): string {
  return (q.targets ?? []).map((t, i) => `${t.vi || t.en} → ${q.options?.[order[i]]?.en ?? "?"}`).join(" · ");
}

/** Đáp án hiển thị khi công bố, nếu GV không tự ghi "show" */
export function defaultShow(q: Question | undefined, key: TeacherKey): string | undefined {
  if (!q) return undefined;
  if (q.type === "number" && key.answer != null) return `${key.answer}${q.unit ?? ""}`;
  if (q.type === "text") return key.accept?.[0];
  if (q.type === "label" && key.order?.length) return labelPairs(q, key.order);
  return undefined;
}

/** Đúng: 100 + thưởng tốc độ (tối đa 50, giảm 4 theo mỗi thứ hạng đúng) */
export const pointsFor = (correct: boolean, rankAmongCorrect: number) =>
  correct ? 100 + Math.max(0, 50 - rankAmongCorrect * 4) : 0;

/** So khớp từng từ giữa câu mẫu và câu nhận được (cho phép sai nhẹ) */
export function matchWords(tw: string[], sw: string[]): boolean[] {
  const n = tw.length,
    m = sw.length;
  const eq = (a: string, b: string) => a === b || (a.length > 3 && similarity(a, b) >= 0.75);
  const d = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) d[i][j] = eq(tw[i - 1], sw[j - 1]) ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
  const ok = new Array<boolean>(n).fill(false);
  let i = n,
    j = m;
  while (i > 0 && j > 0) {
    if (eq(tw[i - 1], sw[j - 1]) && d[i][j] === d[i - 1][j - 1] + 1) {
      ok[i - 1] = true;
      i--;
      j--;
    } else if (d[i - 1][j] >= d[i][j - 1]) i--;
    else j--;
  }
  return ok;
}

export interface SpeechResult {
  score: number;
  ok: boolean[];
  transcript: string;
  /** Lời khuyên song ngữ của AI (khi chấm bằng AI) */
  tip?: { en: string; vi: string } | null;
  /** "ai" = OpenAI nhận dạng giọng nói; "device" = trình duyệt (Web Speech) */
  engine?: "ai" | "device";
}

/** Điểm phát âm 0–100 từ các phương án nhận dạng (t = câu, c = độ tin cậy) */
export function scoreSpeech(target: string, alts: { t: string; c?: number }[]): SpeechResult | null {
  const tw = norm(target).split(" ");
  let best: SpeechResult | null = null;
  for (const a of alts) {
    const sw = norm(a.t).split(" ").filter(Boolean);
    const ok = matchWords(tw, sw);
    const ratio = ok.filter(Boolean).length / tw.length;
    const c = a.c && a.c > 0 && a.c <= 1 ? a.c : null;
    const score = Math.round(100 * (c == null ? ratio : 0.85 * ratio + 0.15 * c));
    if (!best || score > best.score) best = { score, ok, transcript: a.t };
  }
  return best;
}

/** Bước lớn nhất của một trang (để biết lúc nào hết "hiện bước") */
export function maxStep(slide: Pick<Slide, "blocks">): number {
  let m = 0;
  const walk = (bs: Block[]) =>
    bs.forEach((b) => {
      if (b.kind === "cols") {
        walk(b.left);
        walk(b.right);
      } else if (b.kind === "steps") b.items.forEach((it) => (m = Math.max(m, it.step)));
      else if (b.kind === "figure") m = Math.max(m, b.step, FIGURE_STEPS[b.figure] ?? 0);
      else m = Math.max(m, b.step);
    });
  walk(slide.blocks);
  return m;
}

/** Hình vẽ tự có các bước hiện dần bên trong */
export const FIGURE_STEPS: Record<string, number> = { "triangle-abc": 0, "right-triangle": 3, "pythagoras-squares": 3, "coordinate-plane": 2, "similar-triangles": 2 };

export const isInteractive = (s: Pick<Slide, "question" | "speak">) => !!(s.question || s.speak);
