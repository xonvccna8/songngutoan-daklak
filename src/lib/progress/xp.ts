// Bảng tích XP (docs/KE-HOACH-TRANG-GIAO-VIEN.md §C2) — hàm thuần, có test trong tests/progress.test.ts
// XP = công sức học, cộng dồn, không bao giờ mất. Chỉ máy chủ cộng (src/lib/server/xp.ts).

/** Nơi kiếm XP → bảng xếp hạng tuần tương ứng */
export type XpScope = "class" | "home";

export type XpKind = "live" | "hw" | "hw_done" | "speak" | "cards" | "praise" | "streak" | "levelup" | "prep" | "game" | "stem" | "community";

export const XP = {
  // Trên lớp
  liveAnswer: 2, // trả lời 1 câu (dù sai) — thưởng tham gia
  liveCorrect: 10,
  liveEnglish: 5, // câu ngôn ngữ đúng / nói đạt yêu cầu
  // Ở nhà
  hwCorrect: 5,
  hwNoHint: 2, // đúng mà không mở lời giải
  hwDone: 20,
  hwOnTime: 10,
  speakGood: 5, // luyện nói đạt từ SPEAK_GOOD điểm
  card: 1,
  cardDailyCap: 30,
  prep: 5, // xem trước bài (mỗi bài SGK một lần)
  // Trò chơi (GĐ 5): điểm trận ÷ 1000, tối đa 30; tổ thắng +10; phá kỉ lục cá nhân +5
  gameMax: 30,
  gameTeamWin: 10,
  gameBest: 5,
  // Dự án STEM: GV chấm rubric → mỗi em trong tổ nhận tối đa 50 XP (một lần cho mỗi dự án)
  stemMax: 50,
  // Cộng đồng: câu trả lời được GV chọn là hay nhất
  communityBest: 10,
  homeDailyCap: 200, // chống "cày điểm", khuyến khích học đều mỗi ngày
} as const;

/** Điểm phát âm được coi là "đạt yêu cầu" */
export const SPEAK_GOOD = 80;

/** Thưởng chuỗi ngày học (đúng ngày đạt mốc) */
export const STREAK_BONUS: Record<number, number> = { 3: 10, 7: 30, 30: 100 };
export const streakBonus = (len: number) => STREAK_BONUS[len] ?? 0;

/** Điểm cũ ("Tổng điểm" trước GĐ 3) quy đổi: 10 điểm = 1 XP. totalPoints không còn được cộng thêm. */
export const LEGACY_RATE = 10;

export const KIND_LABEL: Record<XpKind, string> = {
  live: "Tiết học trên lớp",
  hw: "Câu bài về nhà",
  hw_done: "Nộp bài về nhà",
  speak: "Luyện nói đạt yêu cầu",
  cards: "Ôn thẻ từ vựng",
  praise: "Thầy cô khen",
  streak: "Thưởng chuỗi ngày học",
  levelup: "Lên cấp",
  prep: "Xem trước bài",
  game: "Trò chơi trên lớp",
  stem: "Dự án STEM",
  community: "Trả lời hay nhất (Cộng đồng)",
};

/** XP của một trận: điểm ÷ 1000 (tối đa 30) + tổ thắng + phá kỉ lục cá nhân */
export const gameXp = (score: number, teamWin: boolean, newBest: boolean) =>
  Math.min(XP.gameMax, Math.round(score / 1000)) + (teamWin ? XP.gameTeamWin : 0) + (newBest && score > 0 ? XP.gameBest : 0);

/** Một sự kiện học tập trong lsn_events (chỉ máy chủ ghi) */
export interface XpEvent {
  id: string;
  uid: string;
  classId: string;
  kind: XpKind;
  scope: XpScope;
  xp: number;
  at: number;
  day: string;
  week: string;
  note?: string | null;
  /** Lên cấp: từ cấp nào → cấp nào */
  from?: number;
  to?: number;
}

/** Tổng XP hiển thị = XP mới + điểm cũ quy đổi */
export function xpTotal(s: { xp?: number; totalPoints?: number } | null | undefined): number {
  return (s?.xp ?? 0) + Math.round((s?.totalPoints ?? 0) / LEGACY_RATE);
}

/** XP một tiết học: kết quả tóm tắt của em + số câu nói đạt yêu cầu */
export function liveXp(r: { answered: number; correct: number; langC: number; pronN: number }, speakGood = 0): number {
  return (r.answered + r.pronN) * XP.liveAnswer + r.correct * XP.liveCorrect + (r.langC + speakGood) * XP.liveEnglish;
}

/** XP một câu bài về nhà (lần trả lời đầu) */
export const hwAnswerXp = (correct: boolean, usedSolution: boolean) => (correct ? XP.hwCorrect + (usedSolution ? 0 : XP.hwNoHint) : 0);

/** XP khi nộp xong bài */
export const hwDoneXp = (late: boolean) => XP.hwDone + (late ? 0 : XP.hwOnTime);

/** Số câu nói đạt yêu cầu của từng em trong một tiết */
export function speakGoodCounts(responses: { uid: string; qtype?: string; score?: number | null }[]): Record<string, number> {
  const m: Record<string, number> = {};
  responses.forEach((r) => {
    if (r.qtype === "speak" && (r.score ?? 0) >= SPEAK_GOOD) m[r.uid] = (m[r.uid] ?? 0) + 1;
  });
  return m;
}

/**
 * Số câu làm / đúng theo YCCĐ của từng em trong một tiết (để tính Sao thành thạo).
 * outcomesOf(slideId) = các YCCĐ GV đã gắn cho trang. Luyện nói: "đúng" khi đạt từ SPEAK_GOOD điểm.
 */
export function masteryByUid(
  responses: { uid: string; slideId: string; qtype?: string; correct?: boolean; score?: number | null }[],
  outcomesOf: (slideId: string) => string[] | undefined
): Record<string, Record<string, { a: number; c: number }>> {
  const out: Record<string, Record<string, { a: number; c: number }>> = {};
  responses.forEach((r) => {
    const ok = r.qtype === "speak" ? (r.score ?? 0) >= SPEAK_GOOD : !!r.correct;
    (outcomesOf(r.slideId) ?? []).forEach((o) => {
      const m = ((out[r.uid] ??= {})[o] ??= { a: 0, c: 0 });
      m.a++;
      if (ok) m.c++;
    });
  });
  return out;
}

/** Bộ đếm trong ngày (giới hạn XP ở nhà, XP thẻ từ) */
export interface XpToday {
  day: string;
  home: number;
  cards: number;
}

/** Áp giới hạn ngày: trả XP thực nhận + bộ đếm mới. Thưởng chuỗi không bị giới hạn. */
export function capXp(xp: number, scope: XpScope, kind: XpKind, today: XpToday | null | undefined, day: string): { xp: number; today: XpToday } {
  const t: XpToday = today?.day === day ? { ...today } : { day, home: 0, cards: 0 };
  let x = Math.max(0, Math.round(xp));
  if (kind === "cards") x = Math.min(x, Math.max(0, XP.cardDailyCap - t.cards));
  if (scope === "home" && kind !== "streak") x = Math.min(x, Math.max(0, XP.homeDailyCap - t.home));
  if (kind === "cards") t.cards += x;
  if (scope === "home" && kind !== "streak") t.home += x;
  return { xp: x, today: t };
}
