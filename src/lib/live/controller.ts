// Chuyển trạng thái của nút Tiếp / Lùi (hàm thuần, có test) — giống luồng của bản mẫu:
// hiện bước → mở câu hỏi → khoá → công bố → sang trang
import { defaultShow, isInteractive, maxStep } from "@/lib/live/grading";
import type { Lang, LiveState, Slide, TeacherKey } from "@/lib/live/types";

export interface Ctx {
  slides: Slide[];
  keys: Record<string, TeacherKey>;
}

const reset = (s: LiveState, slideIndex: number, step = 0): LiveState => ({
  ...s,
  slideIndex,
  step,
  phase: "idle",
  timerMs: null,
  called: null,
  reveal: null,
});

export function goSlide(s: LiveState, i: number, c: Ctx): LiveState {
  if (i < 0 || i >= c.slides.length) return s;
  return reset(s, i);
}

export function openQ(s: LiveState, c: Ctx): LiveState {
  const sl = c.slides[s.slideIndex];
  if (!sl || !isInteractive(sl)) return s;
  const time = (sl.question?.time ?? sl.speak?.time ?? 30) * 1000;
  return { ...s, step: maxStep(sl), phase: "open", timerMs: time, reveal: null };
}

export const lockQ = (s: LiveState): LiveState => ({ ...s, phase: "locked", timerMs: null });

/** Công bố: đưa đáp án + lời giải vào state để điện thoại hiển thị */
export function revealQ(s: LiveState, c: Ctx): LiveState {
  const sl = c.slides[s.slideIndex];
  const k = sl ? c.keys[sl.id] : undefined;
  return {
    ...s,
    phase: "reveal",
    timerMs: null,
    reveal: sl ? { slideId: sl.id, answer: k?.answer, show: k?.show ?? (k ? defaultShow(sl.question, k) : undefined), explain: k?.explain } : null,
  };
}

export function next(s: LiveState, c: Ctx): LiveState {
  const sl = c.slides[s.slideIndex];
  if (!sl) return s;
  if (s.step < maxStep(sl) && s.phase === "idle") return { ...s, step: s.step + 1 };
  if (isInteractive(sl)) {
    if (s.phase === "idle") return openQ(s, c);
    if (s.phase === "open") return lockQ(s);
    if (s.phase === "locked") return revealQ(s, c);
  }
  return s.slideIndex < c.slides.length - 1 ? goSlide(s, s.slideIndex + 1, c) : s;
}

export function prev(s: LiveState, c: Ctx): LiveState {
  const sl = c.slides[s.slideIndex];
  if (!sl) return s;
  if (isInteractive(sl) && s.phase !== "idle") {
    return s.phase === "reveal" ? { ...s, phase: "locked", reveal: null } : { ...s, phase: "idle", timerMs: null };
  }
  if (s.step > 0) return { ...s, step: s.step - 1 };
  if (s.slideIndex > 0) {
    const i = s.slideIndex - 1;
    return reset(s, i, maxStep(c.slides[i]));
  }
  return s;
}

/** Dòng gợi ý "Bấm Tiếp để …" */
export function nextLabel(s: LiveState, c: Ctx): string {
  const sl = c.slides[s.slideIndex];
  if (!sl) return "";
  const ms = maxStep(sl);
  if (s.step < ms && s.phase === "idle") return `hiện bước ${s.step + 2}/${ms + 1}`;
  if (isInteractive(sl)) {
    if (s.phase === "idle") return sl.speak ? "mở lượt luyện nói trên điện thoại" : "mở câu hỏi trên điện thoại";
    if (s.phase === "open") return "khoá, ngừng nhận câu trả lời";
    if (s.phase === "locked") return "công bố đáp án lên tivi";
  }
  return s.slideIndex < c.slides.length - 1 ? `sang trang ${s.slideIndex + 2}: ${c.slides[s.slideIndex + 1].title.vi}` : "đã hết bài — bấm Kết thúc tiết";
}

export const cycleLang = (l: Lang): Lang => (l === "bi" ? "en" : l === "en" ? "vi" : "bi");

/** Gọi tên ngẫu nhiên, ưu tiên em chưa được gọi */
export function pickName(pool: { uid: string; name: string }[], called: string[], rnd = Math.random) {
  if (!pool.length) return null;
  const fresh = pool.filter((p) => !called.includes(p.uid));
  const list = fresh.length ? fresh : pool;
  const p = list[Math.floor(rnd() * list.length)];
  return { pick: p, calledUids: fresh.length ? [...called, p.uid] : [p.uid] };
}

/** Giữ đồng hồ chạy đúng khi ghi state mới: tính lại thời gian còn lại tại thời điểm ghi */
export function stamp(nextS: LiveState, prevS: LiveState, receivedAt: number, now = Date.now()): LiveState {
  let timerMs = nextS.timerMs;
  if (timerMs != null && timerMs === prevS.timerMs) timerMs = Math.max(0, timerMs - (now - receivedAt));
  return { ...nextS, timerMs, writtenAt: now };
}
