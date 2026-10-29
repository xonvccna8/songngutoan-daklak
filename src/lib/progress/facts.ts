// Lấy dữ kiện tính cấp từ thống kê (dùng chung cho máy chủ, trang HS và GV — cùng một cách tính)
import type { StatsDoc } from "@/lib/analytics";
import { longestStreak } from "@/lib/study/gamify";
import { starCounts, type MasteryCell } from "@/lib/curriculum";
import { computeLevel, nextStep, type Facts } from "@/lib/progress/levels";
import { xpTotal } from "@/lib/progress/xp";

export function factsOf(
  s: Partial<StatsDoc> | null | undefined,
  o: { termsAvailable?: number; termsLearned?: number; speakGood?: number; days?: Record<string, boolean>; mastery?: Record<string, MasteryCell> } = {}
): Facts {
  const st = starCounts(o.mastery ?? s?.mastery);
  return {
    termsLearned: o.termsLearned ?? s?.termsLearned ?? 0,
    termsAvailable: o.termsAvailable ?? s?.termsAvail ?? 0,
    speakGood: o.speakGood ?? s?.speakGood ?? 0,
    bestStreak: longestStreak(o.days ?? s?.days),
    outcomesSeen: st.seen,
    stars1: st.s1,
    stars2: st.s2,
    stars3: st.s3,
  };
}

/** Tóm tắt hành trình của em: XP, cấp, bước tiếp theo */
export function journeyOf(s: StatsDoc | null | undefined) {
  const xp = xpTotal(s);
  const f = factsOf(s);
  // Chưa được máy chủ tính cấp lần nào (dữ liệu cũ) → tính tạm theo cùng công thức
  const level = s?.level ?? computeLevel(xp, f);
  return { xp, level, step: nextStep(xp, f, level) };
}
