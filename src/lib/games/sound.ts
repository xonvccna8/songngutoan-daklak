"use client";

// Âm thanh trò chơi tự tạo bằng Web Audio (không cần file, không vướng bản quyền).
// Trình duyệt chỉ cho phát âm thanh sau một lần chạm/bấm của người dùng → gọi unlock() khi bấm nút.
let ctx: AudioContext | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;

// Tắt/bật tiếng hiệu ứng (nhớ trên máy)
const MUTE_KEY = "lsn:mute";
export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
export function setMuted(on: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, on ? "1" : "0");
  } catch {}
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  return ctx;
}

export function unlock() {
  ac()
    ?.resume()
    .catch(() => {});
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  const a = ac();
  if (!a || a.state !== "running" || isMuted()) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = a.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  correct: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.07, 0.18, "triangle")),
  wrong: () => [220, 185].forEach((f, i) => tone(f, i * 0.12, 0.22, "sawtooth", 0.08)),
  tick: () => tone(880, 0, 0.05, "square", 0.05),
  power: () => [660, 880, 1100, 1320].forEach((f, i) => tone(f, i * 0.05, 0.12, "triangle", 0.1)),
  pass: () => [784, 988].forEach((f, i) => tone(f, i * 0.08, 0.14, "triangle", 0.1)),
  fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, "triangle", 0.14)),
  /** Chuỗi đúng liên tiếp: nốt cao dần theo số câu */
  combo: (n: number) => [0, 4, 7, 12].forEach((s, i) => tone(523 * 2 ** ((s + Math.min(n, 8)) / 12), i * 0.06, 0.16, "triangle", 0.12)),
  pop: () => tone(1320, 0, 0.06, "sine", 0.08),
  /** Hết thời gian / hết mạng */
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.3, "triangle", 0.1)),
};

/** Nhạc nền nhẹ (vòng hợp âm) — GV bật/tắt ở tivi */
export function music(on: boolean) {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (!on) return;
  const chords = [
    [262, 330, 392],
    [220, 262, 330],
    [175, 220, 262],
    [196, 247, 294],
  ];
  let i = 0;
  const play = () => {
    chords[i % chords.length].forEach((f, k) => tone(f, k * 0.18, 0.5, "sine", 0.035));
    i++;
  };
  play();
  musicTimer = setInterval(play, 1600);
}
