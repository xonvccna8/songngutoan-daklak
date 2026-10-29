// Ôn lặp ngắt quãng (SM-2 rút gọn) — hàm thuần, có test trong tests/study.test.ts
// Nhớ tốt → giãn khoảng ôn (1 → 4 → 10 → 25 ngày…); quên → ôn lại sau 10 phút và giảm hệ số dễ.
import type { CardState } from "@/lib/study/types";

export type Grade = "again" | "hard" | "good" | "easy";

const DAY = 86_400_000;
const VN = 7 * 3600_000;
export const NEW_PER_DAY = 5;
export const MAX_INTERVAL = 180;

/** 0:00 giờ Việt Nam của ngày chứa thời điểm ms */
export const vnDayStart = (ms: number) => ms - ((ms + VN) % DAY);

export function review(prev: CardState | undefined, g: Grade, now: number): CardState {
  const s: CardState = prev ?? { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now, first: now, last: 0 };
  if (g === "again") {
    return { ...s, ease: Math.max(1.3, +(s.ease - 0.2).toFixed(2)), interval: 0, reps: 0, lapses: s.lapses + (s.reps > 0 ? 1 : 0), due: now + 10 * 60_000, last: now };
  }
  const ease = Math.min(3, Math.max(1.3, +(s.ease + (g === "hard" ? -0.15 : g === "easy" ? 0.15 : 0)).toFixed(2)));
  let interval: number;
  if (s.reps === 0) interval = g === "easy" ? 3 : 1;
  else if (s.reps === 1) interval = g === "hard" ? 2 : g === "easy" ? 6 : 4;
  else interval = Math.round(s.interval * (g === "hard" ? 1.2 : g === "easy" ? ease * 1.3 : ease));
  interval = Math.min(MAX_INTERVAL, Math.max(1, interval));
  // Đến hạn từ 0:00 của ngày ôn (để buổi sáng hôm đó đã thấy thẻ)
  return { ...s, ease, interval, reps: s.reps + 1, due: vnDayStart(now) + interval * DAY, last: now };
}

/** Số thẻ mới đã học hôm nay */
export const newToday = (cards: Record<string, CardState>, now: number) => Object.values(cards).filter((c) => c.first >= vnDayStart(now)).length;

/** Hàng đợi ôn: thẻ đến hạn (cũ trước) rồi tới thẻ mới (tối đa NEW_PER_DAY thẻ mới mỗi ngày) */
export function buildQueue(termIds: string[], cards: Record<string, CardState>, now: number, newLimit = NEW_PER_DAY): string[] {
  const due = termIds.filter((id) => cards[id] && cards[id].due <= now).sort((a, b) => cards[a].due - cards[b].due);
  const fresh = termIds.filter((id) => !cards[id]).slice(0, Math.max(0, newLimit - newToday(cards, now)));
  return [...due, ...fresh];
}

/** Thẻ đã "thuộc" (khoảng ôn ≥ 21 ngày) */
export const isMastered = (c: CardState | undefined) => !!c && c.interval >= 21;

/** Thẻ đã "nhớ" (tự đánh giá Nhớ/Dễ ít nhất 2 lần liên tiếp) — dùng cho điều kiện lên hạng */
export const isLearned = (c: CardState | undefined) => !!c && c.reps >= 2;

export const GRADE_LABEL: Record<Grade, { vi: string; en: string }> = {
  again: { vi: "Chưa nhớ", en: "Again" },
  hard: { vi: "Khó", en: "Hard" },
  good: { vi: "Nhớ", en: "Good" },
  easy: { vi: "Dễ", en: "Easy" },
};

export const isGrade = (g: unknown): g is Grade => g === "again" || g === "hard" || g === "good" || g === "easy";
