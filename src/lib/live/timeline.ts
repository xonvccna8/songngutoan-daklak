// Đợt B — Thanh thời gian 4 hoạt động (CV 5512) + Tổng kết: kế hoạch so với thực tế (hàm thuần, test trong tests/assistant.test.ts)
import { activityOf } from "@/lib/lessons/editor";
import type { LiveState, Slide } from "@/lib/live/types";

/** 5 chặng của tiết: 4 hoạt động CV 5512 + Tổng kết (trang "final") */
export const PHASES = [
  { id: 1, vi: "Mở đầu", en: "Warm-up" },
  { id: 2, vi: "Hình thành kiến thức", en: "New knowledge" },
  { id: 3, vi: "Luyện tập", en: "Practice" },
  { id: 4, vi: "Vận dụng", en: "Application" },
  { id: 5, vi: "Tổng kết", en: "Summary" },
] as const;
export type PhaseId = (typeof PHASES)[number]["id"];

/** Phân bổ mặc định cho tiết 45 phút (docs/QUY-TRINH-TIET-SONG-NGU.md mục 3.2) */
export const DEFAULT_SPLIT = [5, 15, 12, 10, 3];

/** Số phút từng chặng: theo GV soạn (timing) hoặc co giãn mặc định theo số phút của tiết */
export function planMinutes(duration = 45, timing?: number[]): number[] {
  if (timing?.length === 5 && timing.some((m) => m > 0)) return timing.map((m) => Math.max(0, Math.round(m)));
  const total = DEFAULT_SPLIT.reduce((a, b) => a + b, 0);
  return DEFAULT_SPLIT.map((m) => Math.max(1, Math.round((m * duration) / total)));
}

/** Chặng của trang thứ i: trang Tổng kết = 5, còn lại theo hoạt động đã gắn (tiết cũ chưa gắn → suy theo vị trí) */
export function phaseOf(slides: Pick<Slide, "type" | "activity">[], i: number): PhaseId {
  const s = slides[i];
  if (!s) return 1;
  return s.type === "final" ? 5 : activityOf(s, i, slides.length);
}

/** Ghi mốc bắt đầu chặng lần đầu GV chiếu tới (lùi lại chặng cũ không ghi đè) */
export function markPhase(s: LiveState, slides: Pick<Slide, "type" | "activity">[], now: number): LiveState {
  const p = phaseOf(slides, s.slideIndex);
  if (s.actStarts?.[p] != null) return s;
  return { ...s, actStarts: { ...(s.actStarts ?? {}), [p]: now } };
}

export interface PhaseView {
  id: PhaseId;
  vi: string;
  plannedMs: number;
  /** Đã dùng (chặng đang chạy tính tới bây giờ) */
  usedMs: number;
  status: "done" | "current" | "upcoming";
  over: boolean;
}

/** Kế hoạch so với thực tế; chặng xong = từ mốc của nó tới mốc chặng kế tiếp đã bắt đầu */
export function timelineView(plan: number[], actStarts: Partial<Record<PhaseId, number>> | undefined, current: PhaseId, now: number): PhaseView[] {
  const starts = actStarts ?? {};
  return PHASES.map((ph, i) => {
    const start = starts[ph.id];
    const begun = start != null;
    const nextStart = PHASES.slice(i + 1)
      .map((x) => starts[x.id])
      .filter((t): t is number => t != null && begun && t > start)
      .sort((a, b) => a - b)[0];
    const status: PhaseView["status"] = ph.id === current ? "current" : begun ? "done" : "upcoming";
    const end = status === "current" ? now : (nextStart ?? start ?? now);
    const usedMs = begun ? Math.max(0, end - start) : 0;
    const plannedMs = (plan[i] ?? 0) * 60_000;
    // Vượt quá kế hoạch hơn 1 phút mới báo (tránh nhắc vụn)
    return { id: ph.id, vi: ph.vi, plannedMs, usedMs, status, over: plannedMs > 0 && usedMs > plannedMs + 60_000 };
  });
}
