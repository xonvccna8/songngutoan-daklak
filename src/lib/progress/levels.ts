// Cấp độ kiểu game: 8 hạng × 3 bậc = 24 cấp (docs/KE-HOACH-TRANG-GIAO-VIEN.md §C3) — hàm thuần, có test
// Muốn lên hạng mới cần đủ XP VÀ đủ điều kiện của hạng đó (để cấp độ phản ánh năng lực thật, không chỉ chăm bấm).
// Điều kiện: thuật ngữ đã nhớ, câu nói đạt yêu cầu, chuỗi ngày dài nhất, Sao theo yêu cầu cần đạt (GĐ 4).
// GĐ 9 sẽ thêm thử thách thăng hạng.

export interface Rank {
  id: string;
  icon: string;
  vi: string;
  en: string;
  minXp: number;
  /** Màu nhấn của huy hiệu hạng */
  color: string;
}

export const RANKS: Rank[] = [
  { id: "novice", icon: "🌱", vi: "Nhập môn", en: "Novice", minXp: 0, color: "#0E6377" },
  { id: "apprentice", icon: "📘", vi: "Tập sự", en: "Apprentice", minXp: 300, color: "#2B59C3" },
  { id: "explorer", icon: "🧭", vi: "Khám phá", en: "Explorer", minXp: 800, color: "#0E7C86" },
  { id: "skilled", icon: "🔧", vi: "Thành thạo", en: "Skilled", minXp: 1600, color: "#6A4C93" },
  { id: "expert", icon: "💎", vi: "Tinh anh", en: "Expert", minXp: 3000, color: "#1971C2" },
  { id: "master", icon: "🏅", vi: "Bậc thầy", en: "Master", minXp: 5000, color: "#C2410C" },
  { id: "grandmaster", icon: "🧠", vi: "Đại sư", en: "Grandmaster", minXp: 8000, color: "#9C36B5" },
  { id: "legend", icon: "👑", vi: "Huyền thoại", en: "Legend", minXp: 12000, color: "#B8860B" },
];

const TIERS = ["I", "II", "III"] as const;
export const MAX_LEVEL = RANKS.length * TIERS.length - 1; // 23
/** Khoảng XP của hạng cuối (Huyền thoại I → III) */
const LEGEND_SPAN = 6000;

/** XP tối thiểu của cấp i (0…23) */
export function levelXp(i: number): number {
  const lv = Math.max(0, Math.min(MAX_LEVEL, i));
  const r = Math.floor(lv / 3);
  const start = RANKS[r].minXp;
  const end = RANKS[r + 1]?.minXp ?? start + LEGEND_SPAN;
  return start + Math.round(((end - start) * (lv % 3)) / 30) * 10;
}

/** Cấp cao nhất mà XP cho phép (chưa xét điều kiện) */
export function levelFromXp(xp: number): number {
  let i = 0;
  while (i < MAX_LEVEL && xp >= levelXp(i + 1)) i++;
  return i;
}

export interface LevelInfo {
  level: number;
  rank: Rank;
  rankIndex: number;
  tier: (typeof TIERS)[number];
  vi: string;
  en: string;
}

export function levelInfo(level: number): LevelInfo {
  const lv = Math.max(0, Math.min(MAX_LEVEL, Math.floor(level || 0)));
  const rankIndex = Math.floor(lv / 3);
  const rank = RANKS[rankIndex];
  const tier = TIERS[lv % 3];
  return { level: lv, rank, rankIndex, tier, vi: `${rank.vi} ${tier}`, en: `${rank.en} ${tier}` };
}

// ---------- Điều kiện thăng hạng ----------

export interface Facts {
  /** Số thuật ngữ đã nhớ (thẻ ôn đạt "Nhớ" ít nhất 2 lần) */
  termsLearned: number;
  /** Số thuật ngữ đã duyệt trong ngân hàng (để không đòi nhiều hơn số đang có) */
  termsAvailable: number;
  /** Số câu nói đạt yêu cầu (≥ 80 điểm) */
  speakGood: number;
  /** Chuỗi ngày học dài nhất */
  bestStreak: number;
  /** GĐ 4 — Sao thành thạo: số YCCĐ đã gặp, số YCCĐ đạt từ 1 / 2 / 3 Sao */
  outcomesSeen?: number;
  stars1?: number;
  stars2?: number;
  stars3?: number;
}

type FactKey = "termsLearned" | "speakGood" | "bestStreak" | "stars1" | "stars2" | "stars3";
const STAR_KEYS: FactKey[] = ["stars1", "stars2", "stars3"];

interface Gate {
  key: FactKey;
  goal: number;
}

/** Điều kiện để VÀO hạng r (chỉ số trong RANKS) */
const GATES: Record<number, Gate[]> = {
  1: [{ key: "termsLearned", goal: 10 }],
  2: [{ key: "termsLearned", goal: 20 }, { key: "speakGood", goal: 3 }, { key: "stars1", goal: 5 }],
  3: [{ key: "termsLearned", goal: 30 }, { key: "speakGood", goal: 10 }, { key: "stars2", goal: 10 }],
  4: [{ key: "bestStreak", goal: 7 }],
  5: [{ key: "termsLearned", goal: 50 }, { key: "bestStreak", goal: 14 }, { key: "stars3", goal: 15 }],
  6: [{ key: "termsLearned", goal: 80 }, { key: "speakGood", goal: 30 }],
  7: [{ key: "bestStreak", goal: 30 }, { key: "speakGood", goal: 50 }],
};

const FACT_LABEL: Record<FactKey, (n: number) => { vi: string; en: string }> = {
  termsLearned: (n) => ({ vi: `Nhớ ${n} thuật ngữ`, en: `Learn ${n} terms` }),
  speakGood: (n) => ({ vi: `Nói đạt yêu cầu ${n} câu`, en: `Speak ${n} sentences well` }),
  bestStreak: (n) => ({ vi: `Chuỗi ${n} ngày học`, en: `${n}-day streak` }),
  stars1: (n) => ({ vi: `Đạt 1⭐ ở ${n} yêu cầu cần đạt`, en: `1 star in ${n} learning outcomes` }),
  stars2: (n) => ({ vi: `Đạt 2⭐ ở ${n} yêu cầu cần đạt`, en: `2 stars in ${n} learning outcomes` }),
  stars3: (n) => ({ vi: `Đạt 3⭐ ở ${n} yêu cầu cần đạt`, en: `3 stars in ${n} learning outcomes` }),
};

/**
 * Không đòi nhiều hơn những gì đang có: ngân hàng ít thuật ngữ / em mới gặp ít YCCĐ → chỉ đòi 80%.
 * null = bỏ điều kiện (chưa học bài nào có gắn YCCĐ thì chưa xét Sao).
 */
function goalOf(g: Gate, f: Facts): number | null {
  if (STAR_KEYS.includes(g.key)) {
    const seen = f.outcomesSeen ?? 0;
    return seen > 0 ? Math.min(g.goal, Math.max(1, Math.ceil(seen * 0.8))) : null;
  }
  if (g.key === "termsLearned" && f.termsAvailable > 0) return Math.min(g.goal, Math.max(1, Math.ceil(f.termsAvailable * 0.8)));
  return g.goal;
}

export interface Requirement {
  vi: string;
  en: string;
  have: number;
  goal: number;
  met: boolean;
}

/** Danh sách điều kiện của hạng r kèm tiến độ hiện tại */
export function requirements(rankIndex: number, f: Facts): Requirement[] {
  return (GATES[rankIndex] ?? []).flatMap((g) => {
    const goal = goalOf(g, f);
    if (goal == null) return [];
    const have = f[g.key] ?? 0;
    return [{ ...FACT_LABEL[g.key](goal), have: Math.min(have, goal), goal, met: have >= goal }];
  });
}

/**
 * Cấp hiện tại: theo XP nhưng bị chặn ở hạng đầu tiên chưa đủ điều kiện.
 * Không bao giờ thấp hơn cấp đã đạt (stored) — em không bị "rớt hạng".
 */
export function computeLevel(xp: number, f: Facts, stored = 0): number {
  let lv = levelFromXp(xp);
  for (let r = 1; r < RANKS.length; r++) {
    if (!requirements(r, f).every((q) => q.met)) {
      lv = Math.min(lv, r * 3 - 1);
      break;
    }
  }
  return Math.max(stored, lv);
}

export interface NextStep {
  /** null = đã ở cấp cao nhất */
  next: LevelInfo | null;
  /** XP còn thiếu */
  xpNeeded: number;
  /** Tiến độ trong cấp hiện tại 0…1 */
  progress: number;
  /** Điều kiện của hạng mới (chỉ khi cấp kế tiếp là hạng mới) */
  requirements: Requirement[];
  /** Đủ XP nhưng còn thiếu điều kiện */
  blocked: boolean;
}

export function nextStep(xp: number, f: Facts, level: number): NextStep {
  const lv = Math.max(0, Math.min(MAX_LEVEL, level));
  if (lv >= MAX_LEVEL) return { next: null, xpNeeded: 0, progress: 1, requirements: [], blocked: false };
  const from = levelXp(lv);
  const to = levelXp(lv + 1);
  const xpNeeded = Math.max(0, to - xp);
  const reqs = (lv + 1) % 3 === 0 ? requirements((lv + 1) / 3, f) : [];
  return {
    next: levelInfo(lv + 1),
    xpNeeded,
    progress: Math.max(0, Math.min(1, (xp - from) / (to - from))),
    requirements: reqs,
    blocked: xpNeeded === 0 && reqs.some((q) => !q.met),
  };
}
