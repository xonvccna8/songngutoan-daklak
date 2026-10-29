import { afterEach, describe, expect, it, vi } from "vitest";
import { pickEnglishVoice, speakOn } from "@/lib/live/speech";

interface Voice {
  lang: string;
  localService?: boolean;
  name: string;
}
interface Utt {
  text: string;
  lang: string;
  rate: number;
  volume: number;
  voice?: Voice;
  onerror: ((ev: { error: string }) => void) | null;
  addEventListener: () => void;
}

function utteranceClass() {
  return class {
    text: string;
    lang = "";
    rate = 1;
    volume = 1;
    voice?: Voice;
    onerror: ((ev: { error: string }) => void) | null = null;
    constructor(text?: string) {
      this.text = text ?? "";
    }
    addEventListener() {}
  };
}

function synth(voices: Voice[], speaking = false) {
  const spoken: Utt[] = [];
  const cancel = vi.fn();
  const resume = vi.fn();
  const api = {
    speaking,
    pending: false,
    getVoices: () => voices,
    cancel,
    resume,
    speak(u: Utt) {
      spoken.push(u);
      if (u.voice && u.voice.localService === false) u.onerror?.({ error: "network" });
    },
    addEventListener() {},
    removeEventListener() {},
  };
  return { api, spoken, cancel, resume };
}

const remote: Voice = { lang: "en-US", localService: false, name: "Google US English" };
const local: Voice = { lang: "en-US", localService: true, name: "English United States" };
const vietnamese: Voice = { lang: "vi-VN", localService: true, name: "Vietnamese" };

describe("giọng đọc nút Nghe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("chọn giọng tiếng Anh có sẵn trên máy, không chọn giọng Google qua mạng đứng trước", () => {
    expect(pickEnglishVoice([remote, vietnamese, local])?.name).toBe("English United States");
    expect(pickEnglishVoice([vietnamese])?.name).toBeUndefined();
    expect(pickEnglishVoice([remote])?.name).toBe("Google US English");
  });

  it("máy đang rảnh thì đọc ngay, không gọi cancel (cancel làm Chrome Android mất tiếng)", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", utteranceClass());
    const s = synth([remote, local]);
    speakOn(s.api as unknown as SpeechSynthesis, "organ system", 0.85, true);
    expect(s.cancel).not.toHaveBeenCalled();
    expect(s.resume).toHaveBeenCalled();
    expect(s.spoken).toHaveLength(1);
    expect(s.spoken[0].text).toBe("organ system");
    expect(s.spoken[0].voice?.name).toBe("English United States");
    expect(s.spoken[0].volume).toBe(1);
    expect(s.spoken[0].rate).toBe(0.85);
  });

  it("đang đọc thì huỷ rồi đợi một nhịp mới đọc tiếp", () => {
    vi.useFakeTimers();
    vi.stubGlobal("SpeechSynthesisUtterance", utteranceClass());
    const s = synth([local], true);
    speakOn(s.api as unknown as SpeechSynthesis, "cell", 0.55, true);
    expect(s.cancel).toHaveBeenCalledOnce();
    expect(s.spoken).toHaveLength(0);
    vi.advanceTimersByTime(80);
    expect(s.spoken.map((u) => u.text)).toEqual(["cell"]);
    expect(s.spoken[0].rate).toBe(0.55);
  });

  it("giọng qua mạng báo lỗi thì đọc lại không ép giọng đó", () => {
    vi.useFakeTimers();
    vi.stubGlobal("SpeechSynthesisUtterance", utteranceClass());
    const s = synth([remote]);
    speakOn(s.api as unknown as SpeechSynthesis, "organ", 0.85, false);
    expect(s.spoken[0].voice?.name).toBe("Google US English");
    vi.advanceTimersByTime(80);
    expect(s.spoken).toHaveLength(2);
    expect(s.spoken[1].voice).toBeUndefined();
    expect(s.spoken[1].lang).toBe("en-US");
  });
});
