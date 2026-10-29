// Tính điểm kiểu Quizizz + chấm đáp án + power-up + xếp hạng — hàm thuần, có test (tests/games.test.ts)
// Đúng: 600 + tốc độ 0–400 (không tính giờ → 1000) · chuỗi đúng 3–4: +100, 5–6: +200, ≥7: +300 · song ngữ (E3): +100
// Sai: 0 điểm, KHÔNG trừ. Câu cứu điểm: tối đa 300.
import { norm, similarity } from "@/lib/live/grading";
import type { BoardRow, GameKey, GameQ, PowerKind } from "@/lib/games/types";

export const SCORE = { base: 600, speed: 400, noTimer: 1000, bilingual: 100, redeemMax: 300, matchPenalty: 100, maxInv: 3 } as const;

export const streakBonus = (streak: number) => (streak >= 7 ? 300 : streak >= 5 ? 200 : streak >= 3 ? 100 : 0);

export interface ScoreInput {
  ok: boolean;
  elapsedMs: number;
  /** giây mỗi câu; 0 = không tính giờ */
  limitSec: number;
  streakBefore: number;
  double?: boolean;
  powerPlay?: boolean;
  bilingual?: boolean;
  /** Đóng băng thời gian: luôn được thưởng tốc độ tối đa */
  frozen?: boolean;
  /** Câu cứu điểm */
  redeem?: boolean;
  /** Ghép bộ ba: số lần ghép sai trước khi đúng */
  wrongTries?: number;
}

export function scoreAnswer(i: ScoreInput): { pts: number; streak: number } {
  if (!i.ok) return { pts: 0, streak: 0 };
  const speedFrac = i.frozen || i.limitSec <= 0 ? 1 : Math.max(0, Math.min(1, 1 - i.elapsedMs / (i.limitSec * 1000)));
  if (i.redeem) return { pts: Math.round(SCORE.redeemMax / 2 + (SCORE.redeemMax / 2) * speedFrac), streak: i.streakBefore };
  const streak = i.streakBefore + 1;
  let pts = i.limitSec <= 0 && !i.frozen ? SCORE.noTimer : SCORE.base + Math.round(SCORE.speed * speedFrac);
  pts = Math.max(200, pts - SCORE.matchPenalty * (i.wrongTries ?? 0));
  pts += streakBonus(streak) + (i.bilingual ? SCORE.bilingual : 0);
  if (i.double) pts *= 2;
  if (i.powerPlay) pts = Math.round(pts * 1.5);
  return { pts, streak };
}

/** Chấm đáp án; Ghép bộ ba trả thêm các nhóm còn sai để em ghép lại */
export function gradeGame(q: GameQ, key: GameKey, value: unknown): { ok: boolean; wrongGroups?: number } {
  if (q.kind === "mcq") return { ok: Number(value) === key.answer };
  if (q.kind === "number") {
    const v = parseFloat(String(value ?? "").replace(",", "."));
    return { ok: Number.isFinite(v) && key.num != null && Math.abs(v - key.num) < 1e-6 };
  }
  if (q.kind === "text") {
    const v = norm(value);
    return { ok: !!v && (key.accept ?? []).some((a) => norm(a) === v || similarity(v, norm(a)) >= 0.85) };
  }
  // match: value = JSON [[id,id,id], …]
  let groups: string[][] = [];
  try {
    const p = JSON.parse(String(value ?? "[]"));
    if (Array.isArray(p)) groups = p.filter(Array.isArray).map((g) => g.map(String).sort());
  } catch {}
  const want = new Set((key.groups ?? []).map((g) => [...g].sort().join("|")));
  const good = groups.filter((g) => want.has(g.join("|"))).length;
  return { ok: want.size > 0 && good === want.size && groups.length === want.size, wrongGroups: want.size - good };
}

/** Xếp hạng (bằng điểm cùng hạng) */
export function ranking(rows: Record<string, Pick<BoardRow, "s">>): Map<string, number> {
  const list = Object.entries(rows).sort((a, b) => b[1].s - a[1].s);
  const out = new Map<string, number>();
  list.forEach(([uid, r], i) => out.set(uid, i > 0 && list[i - 1][1].s === r.s ? out.get(list[i - 1][0])! : i + 1));
  return out;
}

/** Điểm còn thiếu để vượt bạn ngay trên (null = đang dẫn đầu) */
export function gapAbove(rows: Record<string, Pick<BoardRow, "s">>, uid: string): number | null {
  const me = rows[uid]?.s ?? 0;
  const above = Object.entries(rows)
    .filter(([u, r]) => u !== uid && r.s > me)
    .map(([, r]) => r.s);
  return above.length ? Math.min(...above) - me + 1 : null;
}

// ---------------- Power-up ----------------

export const POWER_META: Record<PowerKind, { icon: string; vi: string; en: string; hint: string }> = {
  fifty: { icon: "✂️", vi: "50-50", en: "50-50", hint: "Bỏ một nửa số đáp án sai" },
  eraser: { icon: "🧽", vi: "Cục tẩy", en: "Eraser", hint: "Bỏ 1 đáp án sai" },
  double: { icon: "✖️2", vi: "Nhân đôi", en: "Double", hint: "Câu này được gấp đôi điểm" },
  freeze: { icon: "⏸️", vi: "Đóng băng", en: "Time Freeze", hint: "Dừng đồng hồ — luôn được thưởng tốc độ tối đa" },
  saver: { icon: "🛡️", vi: "Giữ chuỗi", en: "Streak Saver", hint: "Sai 1 câu vẫn giữ chuỗi" },
  immunity: { icon: "🔁", vi: "Làm lại", en: "Immunity", hint: "Sai được làm lại câu này 1 lần" },
  powerplay: { icon: "🎉", vi: "Power Play", en: "Power Play", hint: "Cả lớp +50% điểm trong 20 giây" },
  hint: { icon: "📖", vi: "Gợi ý thuật ngữ", en: "Term Hint", hint: "Hiện nghĩa tiếng Việt của từ khó" },
  slow: { icon: "🎧", vi: "Nghe chậm", en: "Slow Listen", hint: "Đọc lại đề tiếng Anh thật chậm" },
  flip: { icon: "🔤", vi: "Lật đề", en: "Flip", hint: "Đổi đề sang tiếng Việt (mất thưởng song ngữ)" },
};

/** Power-up "dùng cho câu hiện tại" cần máy chủ xử lí; hint / slow chỉ hiện ở điện thoại */
export const SERVER_POWERS: PowerKind[] = ["fifty", "eraser", "double", "freeze", "saver", "immunity", "powerplay"];

const WEIGHTS_BEHIND: Partial<Record<PowerKind, number>> = { double: 3, saver: 3, immunity: 3, freeze: 2, fifty: 2, powerplay: 1, hint: 2, eraser: 1 };
const WEIGHTS_AHEAD: Partial<Record<PowerKind, number>> = { fifty: 3, eraser: 3, hint: 2, slow: 2, double: 1, freeze: 1 };

/**
 * Có nhận power-up sau câu đúng không, nhận loại nào.
 * Chạm chuỗi 3, 6, 9… → chắc chắn nhận; ngoài ra 15% cơ hội.
 * "Cơ hội lật ngược": em ở nửa dưới bảng dễ nhận loại mạnh (×2, Giữ chuỗi, Làm lại).
 */
export function drawPower(streak: number, rankFrac: number, rnd: () => number): PowerKind | null {
  if (!(streak > 0 && streak % 3 === 0) && rnd() >= 0.15) return null;
  const w = rankFrac > 0.5 ? WEIGHTS_BEHIND : WEIGHTS_AHEAD;
  const entries = Object.entries(w) as [PowerKind, number][];
  let x = rnd() * entries.reduce((s, [, v]) => s + v, 0);
  for (const [k, v] of entries) if ((x -= v) < 0) return k;
  return entries[0][0];
}

/** Các phương án sai bị ẩn: 50-50 bỏ một nửa số đáp án sai (làm tròn lên) · Cục tẩy bỏ 1 */
export function hiddenOptions(nOptions: number, answer: number, kind: "fifty" | "eraser", rnd: () => number): number[] {
  const pool = Array.from({ length: nOptions }, (_, i) => i).filter((i) => i !== answer);
  const k = kind === "eraser" ? 1 : Math.ceil(pool.length / 2);
  const pick: number[] = [];
  while (pick.length < k && pool.length) pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return pick.sort((a, b) => a - b);
}

// ---------------- Tên nhà toán học (ẩn tên trên tivi) ----------------

export const SCIENTISTS = [
  "Pythagoras", "Euclid", "Archimedes", "Thales", "Hypatia", "Fibonacci", "Descartes", "Fermat", "Pascal", "Newton",
  "Leibniz", "Euler", "Gauss", "Lagrange", "Laplace", "Fourier", "Galois", "Riemann", "Cantor", "Noether",
  "Hilbert", "Poincaré", "Ramanujan", "Turing", "Lovelace", "Kovalevskaya", "Al-Khwarizmi", "Brahmagupta", "Viète", "Napier",
  "Mirzakhani", "Tao", "Lương Thế Vinh", "Vũ Hữu", "Lê Văn Thiêm", "Hoàng Tuỵ", "Tạ Quang Bửu", "Ngô Bảo Châu", "Nguyễn Cảnh Toàn", "Phan Đình Diệu",
];
export const alias = (index: number) => SCIENTISTS[index % SCIENTISTS.length] + (index >= SCIENTISTS.length ? ` ${Math.floor(index / SCIENTISTS.length) + 1}` : "");

// ---------------- Sticker động viên (tự vẽ bằng emoji, không dùng meme có bản quyền) ----------------

export const STICKERS = {
  ok: [
    { e: "🤩", en: "Awesome!", vi: "Tuyệt vời!" },
    { e: "🧠", en: "Maths genius!", vi: "Thiên tài Toán!" },
    { e: "🚀", en: "You're on fire!", vi: "Bùng cháy quá!" },
    { e: "🎯", en: "Bullseye!", vi: "Trúng phóc!" },
    { e: "🏆", en: "Champion move!", vi: "Đỉnh của chóp!" },
    { e: "⚡", en: "Lightning fast!", vi: "Nhanh như chớp!" },
  ],
  no: [
    { e: "💪", en: "Nice try!", vi: "Cố lên!" },
    { e: "🌱", en: "Almost there!", vi: "Gần đúng rồi!" },
    { e: "🙌", en: "Keep going!", vi: "Tiếp tục nào!" },
    { e: "🧩", en: "You'll get the next one!", vi: "Câu sau sẽ đúng!" },
  ],
} as const;
