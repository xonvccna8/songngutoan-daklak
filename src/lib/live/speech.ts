"use client";

// Giọng đọc mẫu (speechSynthesis) & chấm phát âm: AI (OpenAI nhận dạng giọng nói, /api/speech/assess)
// hoặc trình duyệt (Web Speech API) khi AI chưa bật / hết lượt / máy không ghi âm được.
// Không lưu ghi âm: đoạn ghi âm chỉ được chuyển tiếp để nhận dạng rồi bỏ; lớp học chỉ nhận điểm + câu nhận dạng được.
import { scoreSpeech, type SpeechResult } from "@/lib/live/grading";
import { auth } from "@/lib/firebase/client";
import { STUDENT_AI_LIMITS } from "@/lib/ai/student-ai";
import { AI_LOCKED, notifyAiLocked } from "@/lib/api-client";

/** Giọng tiếng Anh: ưu tiên giọng có sẵn trên máy. Giọng "Google US English" đọc qua mạng — mạng yếu thì im. */
export function pickEnglishVoice<T extends { lang: string; localService?: boolean }>(voices: readonly T[]): T | undefined {
  const en = voices.filter((v) => /^en([_-]|$)/i.test(v.lang));
  return (
    en.find((v) => /en[_-]US/i.test(v.lang) && v.localService) ??
    en.find((v) => v.localService) ??
    en.find((v) => /en[_-]US/i.test(v.lang)) ??
    en[0]
  );
}

/**
 * Chrome trên Android nuốt câu đọc nếu gọi cancel() khi không có gì đang phát.
 * Chỉ chờ một nhịp sau cancel trên các máy đó; iPhone phải đọc ngay trong cú bấm.
 */
export function cancelGapsSpeak(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Chrome|Chromium|SamsungBrowser/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua);
}

// Giữ câu đọc còn sống tới khi nói xong. Chrome xoá utterance nếu không còn chỗ nào trỏ tới → im thin.
const held: SpeechSynthesisUtterance[] = [];
function hold(u: SpeechSynthesisUtterance) {
  held.push(u);
  if (held.length > 8) held.splice(0, held.length - 8);
  const release = () => {
    const i = held.indexOf(u);
    if (i >= 0) held.splice(i, 1);
  };
  u.addEventListener("end", release);
  u.addEventListener("error", release);
}

function sayErrorText(code: string): string {
  if (code === "not-allowed") return "Trình duyệt đang chặn tiếng đọc. Em bấm Nghe thêm một lần.";
  if (code === "language-unavailable" || code === "voice-unavailable") {
    return "Máy chưa có giọng tiếng Anh. Vào phần Chuyển văn bản thành giọng nói, tải English (United States), rồi bấm Nghe lại.";
  }
  if (code === "network") return "Giọng đọc trên mạng không tải được. Em tải giọng English về máy, hoặc bấm Nghe lại khi mạng khoẻ hơn.";
  return "Chưa phát được tiếng. Em tăng âm lượng rồi bấm Nghe lại.";
}

const RETRYABLE = new Set(["network", "synthesis-failed", "synthesis-unavailable", "voice-unavailable", "language-unavailable", "audio-busy"]);

let saySeq = 0;

/** Đọc một câu. `gap` = true thì sau cancel() đợi một nhịp (Chrome Android). */
export function speakOn(synth: SpeechSynthesis, text: string, rate = 0.9, gap = cancelGapsSpeak()) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;
  const mine = ++saySeq;
  const later = (fn: () => void) => {
    setTimeout(fn, 80);
  };

  const choose = () => {
    const voices = synth.getVoices();
    const voice = pickEnglishVoice(voices);
    if (voice && voice.localService === false && typeof navigator !== "undefined" && navigator.onLine === false) {
      return pickEnglishVoice(voices.filter((v) => v.localService));
    }
    return voice;
  };

  const attempt = (voice: SpeechSynthesisVoice | undefined, canRetry: boolean) => {
    if (mine !== saySeq) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.volume = 1;
    u.rate = rate;
    u.lang = voice?.lang || "en-US";
    if (voice) u.voice = voice;
    hold(u);
    u.onerror = (ev) => {
      if (mine !== saySeq) return;
      const code = ev.error;
      if (code === "canceled" || code === "interrupted") return;
      // Giọng qua mạng lỗi (mạng yếu) → đọc lại bằng giọng có sẵn trên máy, chỉ một lần.
      if (canRetry && voice && voice.localService === false && RETRYABLE.has(code)) {
        const local = pickEnglishVoice(synth.getVoices().filter((v) => v.localService));
        later(() => attempt(local, false));
        return;
      }
      void import("sonner").then(({ toast }) => toast.error(sayErrorText(code)));
    };
    try {
      synth.resume();
    } catch {
      // Một số máy không có resume.
    }
    synth.speak(u);
  };

  const start = () => attempt(choose(), true);

  if (synth.getVoices().length === 0) {
    const onVoices = () => {
      synth.removeEventListener("voiceschanged", onVoices);
      if (mine !== saySeq || synth.speaking || synth.pending) return;
      start();
    };
    synth.addEventListener("voiceschanged", onVoices);
    setTimeout(() => synth.removeEventListener("voiceschanged", onVoices), 2000);
  }

  // Không cancel() khi hàng đợi trống — chính lệnh đó làm Chrome Android im hoàn toàn.
  if (synth.speaking || synth.pending) {
    synth.cancel();
    if (gap) later(start);
    else start();
    return;
  }
  start();
}

export function say(text: string, rate = 0.9) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  speakOn(window.speechSynthesis, text, rate);
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => window.speechSynthesis.getVoices());
}

export type SpeechError = "unsupported" | "not-allowed" | "network" | "no-speech" | "busy" | "quota";

export interface PronunciationScorer {
  readonly supported: boolean;
  /** Bắt đầu nghe; trả về hàm dừng. onProcessing: đã nghe xong, đang chấm (AI) */
  start(target: string, done: (r: SpeechResult) => void, fail: (e: SpeechError) => void, onProcessing?: () => void): () => void;
}

type SR = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>> }) => void;
  onerror: (e: { error: string }) => void;
  onend: () => void;
  start(): void;
  stop(): void;
};

export class WebSpeechScorer implements PronunciationScorer {
  private Ctor = typeof window !== "undefined"
    ? ((window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition)
    : undefined;

  get supported() {
    return !!this.Ctor;
  }

  start(target: string, done: (r: SpeechResult) => void, fail: (e: SpeechError) => void) {
    if (!this.Ctor) {
      fail("unsupported");
      return () => {};
    }
    const r = new this.Ctor();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 3;
    let finished = false;
    r.onresult = (e) => {
      if (finished) return;
      finished = true;
      const res = e.results[0];
      const alts = Array.from({ length: res.length }, (_, i) => ({ t: res[i].transcript, c: res[i].confidence }));
      const best = scoreSpeech(target, alts);
      if (best) done({ ...best, engine: "device" });
      else fail("no-speech");
    };
    r.onerror = (e) => {
      if (finished) return;
      finished = true;
      fail(e.error === "not-allowed" || e.error === "service-not-allowed" ? "not-allowed" : e.error === "network" ? "network" : "no-speech");
    };
    r.onend = () => {
      if (finished) return;
      finished = true;
      fail("no-speech");
    };
    try {
      r.start();
    } catch {
      finished = true;
      fail("busy");
    }
    return () => {
      try {
        r.stop();
      } catch {}
    };
  }
}

/** Chọn định dạng ghi âm điện thoại hỗ trợ (Android: webm/opus · iPhone: mp4/aac) */
function pickMime(): string {
  const MR = typeof window !== "undefined" ? window.MediaRecorder : undefined;
  if (!MR?.isTypeSupported) return "";
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((m) => MR.isTypeSupported(m)) ?? "";
}

/**
 * Chấm bằng AI: ghi âm ngắn trên điện thoại (tự dừng khi em đọc xong — im lặng ~1,3 giây — hoặc sau 12 giây,
 * hoặc khi bấm lại micro) → gửi /api/speech/assess. Dùng được cả trên iPhone / Firefox (không cần Web Speech).
 */
export class AiSpeechScorer implements PronunciationScorer {
  get supported() {
    return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== "undefined";
  }

  start(target: string, done: (r: SpeechResult) => void, fail: (e: SpeechError) => void, onProcessing?: () => void) {
    let finished = false;
    let rec: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let timer = 0;
    let raf = 0;
    const end = (e?: SpeechError) => {
      if (finished) return;
      finished = true;
      if (e) fail(e);
    };
    const cleanup = () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => undefined);
    };
    const stop = () => {
      if (rec && rec.state === "recording") rec.stop();
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch (e) {
        cleanup();
        return end((e as Error).name === "NotAllowedError" ? "not-allowed" : "unsupported");
      }
      if (finished) return cleanup();
      const mime = pickMime();
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      rec.onstop = async () => {
        cleanup();
        if (finished) return;
        onProcessing?.();
        const blob = new Blob(chunks, { type: rec?.mimeType || mime || "audio/webm" });
        if (blob.size < 1000) return end("no-speech");
        try {
          const form = new FormData();
          form.append("audio", blob, "speech");
          form.append("target", target);
          const token = await auth().currentUser?.getIdToken();
          const res = await fetch("/api/speech/assess", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
          // Hết lượt AI dùng thử → hiện hộp nhập mật khẩu; lần này chấm trên điện thoại
          if (res.status === 402) {
            const j = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
            if (j.code === AI_LOCKED) notifyAiLocked(j.error);
            return end("quota");
          }
          if (res.status === 429 || res.status === 503) return end("quota");
          if (!res.ok) return end("network");
          const r = (await res.json()) as SpeechResult;
          if (!r.transcript) return end("no-speech");
          finished = true;
          done({ ...r, engine: "ai" });
        } catch {
          end("network");
        }
      };
      rec.start();
      timer = window.setTimeout(stop, STUDENT_AI_LIMITS.speechMaxSeconds * 1000);

      // Tự dừng khi em đọc xong: đã có tiếng nói rồi im lặng ~1,3 giây
      try {
        ctx = new AudioContext();
        const an = ctx.createAnalyser();
        an.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        let spoke = false;
        let quietSince = 0;
        const tick = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += (v - 128) ** 2;
          const rms = Math.sqrt(sum / buf.length);
          const now = performance.now();
          if (rms > 8) {
            spoke = true;
            quietSince = 0;
          } else if (spoke) {
            quietSince ||= now;
            if (now - quietSince > 1300) return stop();
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Không đo được âm lượng → em bấm lại micro để dừng (hoặc tự dừng sau 12 giây)
      }
    })();

    return () => {
      if (rec) stop();
      else {
        end("no-speech");
        cleanup();
      }
    };
  }
}

/** Đọc một lần: máy chủ có bật AI chấm phát âm không */
let aiStatus: Promise<boolean> | null = null;
let aiOff = false;
function aiSpeechOn(): Promise<boolean> {
  if (aiOff) return Promise.resolve(false);
  aiStatus ??= (async () => {
    try {
      const token = await auth().currentUser?.getIdToken();
      const res = await fetch("/api/speech/assess", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return res.ok && ((await res.json()) as { enabled?: boolean }).enabled === true;
    } catch {
      return false;
    }
  })();
  return aiStatus;
}

/** Hết lượt AI trong phiên này → chuyển hẳn sang chấm trên điện thoại */
export const disableAiSpeech = () => {
  aiOff = true;
};

/** Chọn cách chấm: AI nếu bật và điện thoại ghi âm được; nếu không thì trình duyệt (Web Speech) */
export async function pickScorer(): Promise<PronunciationScorer> {
  const ai = new AiSpeechScorer();
  if (ai.supported && (await aiSpeechOn())) return ai;
  return new WebSpeechScorer();
}

export const SPEECH_ERRORS: Record<SpeechError, string> = {
  quota: "Hôm nay đã hết lượt chấm bằng AI — từ giờ máy chấm ngay trên điện thoại. Em bấm micro đọc lại nhé.",
  unsupported: "Trình duyệt này chưa hỗ trợ nhận giọng nói. Hãy mở bằng Chrome (Android) hoặc Safari mới.",
  "not-allowed": "Em cần cho phép trang web dùng micro rồi bấm lại.",
  network: "Nhận giọng nói cần mạng Internet. Kiểm tra kết nối rồi thử lại.",
  "no-speech": "Máy chưa nghe rõ. Đưa điện thoại gần miệng và đọc to hơn nhé.",
  busy: "Micro đang bận, thử lại sau giây lát.",
};
