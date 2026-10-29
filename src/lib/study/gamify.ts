// Trò chơi hoá: huy hiệu — hàm thuần, có test
import type { StatsDoc } from "@/lib/analytics";
import { xpTotal } from "@/lib/progress/xp";

const DAY = 86_400_000;
const keyToMs = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8));

/** Chuỗi ngày học dài nhất từ trước tới nay */
export function longestStreak(days: Record<string, boolean> | undefined): number {
  const list = Object.keys(days ?? {})
    .filter((k) => days![k])
    .map(keyToMs)
    .sort((a, b) => a - b);
  let best = 0,
    cur = 0;
  list.forEach((ms, i) => {
    cur = i > 0 && ms - list[i - 1] === DAY ? cur + 1 : 1;
    best = Math.max(best, cur);
  });
  return best;
}

export interface Badge {
  id: string;
  icon: "flame" | "rocket" | "book" | "clock" | "cards" | "mic" | "zap" | "star";
  title: { vi: string; en: string };
  desc: string;
  have: number;
  goal: number;
  earned: boolean;
}

export function badges(s: StatsDoc | undefined | null): Badge[] {
  const pron = s?.pronCount && s.pronCount >= 3 ? Math.round((s.pronSum ?? 0) / s.pronCount) : 0;
  const ls = longestStreak(s?.days);
  const onTime = Math.max(0, (s?.hwDone ?? 0) - (s?.hwLate ?? 0));
  const defs: Omit<Badge, "earned">[] = [
    { id: "first", icon: "rocket", title: { vi: "Bước đầu tiên", en: "First step" }, desc: "Có ngày học đầu tiên", have: Object.keys(s?.days ?? {}).length ? 1 : 0, goal: 1 },
    { id: "streak3", icon: "flame", title: { vi: "Chuỗi 3 ngày", en: "3-day streak" }, desc: "Học 3 ngày liên tiếp", have: ls, goal: 3 },
    { id: "streak7", icon: "flame", title: { vi: "Chuỗi 7 ngày", en: "7-day streak" }, desc: "Học 7 ngày liên tiếp", have: ls, goal: 7 },
    { id: "hw5", icon: "book", title: { vi: "Chăm chỉ", en: "Hard worker" }, desc: "Nộp 5 bài về nhà", have: s?.hwDone ?? 0, goal: 5 },
    { id: "ontime", icon: "clock", title: { vi: "Đúng hẹn", en: "On time" }, desc: "3 bài nộp đúng hạn", have: onTime, goal: 3 },
    { id: "cards50", icon: "cards", title: { vi: "Nhà từ vựng", en: "Word collector" }, desc: "50 lượt ôn thẻ từ", have: s?.cardReviews ?? 0, goal: 50 },
    { id: "speaker", icon: "mic", title: { vi: "Giọng chuẩn", en: "Clear speaker" }, desc: "Phát âm trung bình từ 85 điểm (ít nhất 3 lần trong tiết)", have: pron, goal: 85 },
    { id: "xp1000", icon: "zap", title: { vi: "1000 XP", en: "1,000 XP" }, desc: "Đạt tổng 1000 XP", have: xpTotal(s), goal: 1000 },
  ];
  return defs.map((d) => ({ ...d, have: Math.min(d.have, d.goal), earned: d.have >= d.goal }));
}
// Bảng xếp hạng tuần: xem src/lib/progress/boards.ts
