"use client";

// Phản hồi khi HS trả lời: đúng → tiếng "ting" + rung nhẹ + pháo giấy; sai → tiếng "bùm" + rung 2 nhịp.
// Dùng chung cho vở ghi, bài về nhà, tiết học trực tiếp và trò chơi ôn tập.
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { sfx, unlock } from "@/lib/games/sound";

// Trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên → mở khoá âm thanh ở lần chạm bất kì
if (typeof window !== "undefined") {
  const prime = () => unlock();
  window.addEventListener("pointerdown", prime, { once: true, capture: true });
  window.addEventListener("keydown", prime, { once: true, capture: true });
}

const vibrate = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p);
  } catch {}
};

/** Pháo giấy nhỏ — từ vị trí phần tử vừa bấm (nếu có) */
export function burst(from?: Element | null, big = false) {
  const r = from?.getBoundingClientRect();
  const origin = r ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight } : { x: 0.5, y: 0.6 };
  confetti({ particleCount: big ? 120 : 40, spread: big ? 100 : 60, startVelocity: big ? 45 : 28, scalar: 0.8, ticks: 120, origin, disableForReducedMotion: true });
}

export function cheer(from?: Element | null, big = false) {
  unlock();
  sfx.correct();
  vibrate(30);
  burst(from, big);
}

export function buzz() {
  unlock();
  sfx.wrong();
  vibrate([60, 40, 60]);
}

/** Bấm chọn xong: phát đúng/sai (dùng ở onClick, truyền e.currentTarget để pháo giấy bay ra từ nút) */
export const answerFx = (ok: boolean, from?: Element | null) => (ok ? cheer(from) : buzz());

/** Phát một lần khi kết quả vừa về (màn công bố, bài về nhà). at = lúc chấm (ms): quá 15 giây → đang xem lại câu cũ, không phát. */
export function useResultFx(correct: boolean | null | undefined, at?: number) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || correct == null || (at != null && Date.now() - at > 15_000)) return;
    done.current = true;
    if (correct) cheer(null, true);
    else buzz();
  }, [correct, at]);
}
