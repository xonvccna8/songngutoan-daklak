"use client";

// Âm báo tạo bằng Web Audio (không cần file âm thanh). Trình duyệt chỉ cho phát sau một lần chạm của người dùng,
// nên gọi unlockAudio() trong sự kiện bấm (nút "Bật âm thanh thông báo" hoặc bất kỳ cú chạm nào).
import type { MessageKind } from "@/lib/messages/types";

let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {}
}

export const audioReady = () => !!ctx && ctx.state === "running";

function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.35) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Chú ý: "ding-dong" ×2 · Nhắc nhở: 2 tiếng bíp vừa · Khen ngợi: 3 nốt vui · Thông báo: im lặng */
export function playKind(kind: MessageKind) {
  if (!ctx || kind === "notice") return;
  if (ctx.state === "suspended") void ctx.resume();
  if (kind === "attention") {
    [0, 1.1].forEach((s) => {
      tone(988, s, 0.55, "triangle", 0.5);
      tone(784, s + 0.45, 0.7, "triangle", 0.5);
    });
  } else if (kind === "reminder") {
    tone(660, 0, 0.18, "sine", 0.3);
    tone(660, 0.28, 0.18, "sine", 0.3);
  } else {
    tone(523, 0, 0.16, "sine", 0.32);
    tone(659, 0.15, 0.16, "sine", 0.32);
    tone(784, 0.3, 0.32, "sine", 0.32);
  }
}

export function vibrateKind(kind: MessageKind) {
  if (!("vibrate" in navigator)) return;
  const pattern = kind === "attention" ? [400, 150, 400, 150, 400] : kind === "reminder" ? [250, 120, 250] : kind === "praise" ? [120, 80, 120] : 0;
  try {
    navigator.vibrate(pattern);
  } catch {}
}
