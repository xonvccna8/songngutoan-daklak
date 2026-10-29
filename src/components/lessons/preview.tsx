"use client";

// Xem trước một trang như trên tivi (dùng đúng màn tivi thật) và trên điện thoại học sinh
import { useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { BOARD_VARS, SlideView } from "@/components/live/slide-view";
import { AnswerInput, QuestionCard, RevealView } from "@/components/live/phone/answer-views";
import { TvScreen } from "@/components/live/tv-screen";
import { revealQ } from "@/lib/live/controller";
import { isInteractive, maxStep } from "@/lib/live/grading";
import type { LessonMeta, EditorSlide } from "@/lib/lessons/editor";
import type { LessonData } from "@/lib/live/hooks";
import { INITIAL_STATE, type Lang, type LiveState, type Phase } from "@/lib/live/types";

export function SlidePreview({ meta, slides, index }: { meta: LessonMeta; slides: EditorSlide[]; index: number }) {
  const [device, setDevice] = useState<"tv" | "phone">("tv");
  const [stepPick, setStep] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lang, setLang] = useState<Lang>("bi");
  const [shownIndex, setShownIndex] = useState(index);
  // Đổi trang thì về bước cuối + chế độ trình bày
  if (shownIndex !== index) {
    setShownIndex(index);
    setStep(null);
    setPhase("idle");
  }

  const slide = slides[index];
  const data: LessonData = useMemo(
    () => ({
      lesson: { id: "preview", title: meta.title, subtitle: meta.subtitle, subject: meta.subject, grade: meta.grade, status: "draft", slideIds: slides.map((s) => s.id), terms: meta.terms },
      slides: slides.map((s, i) => ({ ...s, order: i })),
      keys: Object.fromEntries(slides.map((s) => [s.id, s.key])),
    }),
    [meta, slides]
  );
  if (!slide) return null;
  const top = maxStep(slide);
  const step = Math.min(stepPick ?? top, top);
  const interactive = isInteractive(slide);
  let state: LiveState = { ...INITIAL_STATE, slideIndex: index, step, lang, phase: interactive ? phase : "idle" };
  if (state.phase === "reveal") state = { ...revealQ(state, data), step };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-paper p-1 ring-1 ring-line-2">
          {(
            [
              ["tv", Monitor, "Tivi"],
              ["phone", Smartphone, "Điện thoại"],
            ] as const
          ).map(([d, Icon, label]) => (
            <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold", device === d ? "bg-white shadow-sm" : "text-ink-2")}>
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="h-8 rounded-lg border-2 border-line-2 bg-white px-2 text-xs font-semibold" aria-label="Ngôn ngữ hiển thị">
          <option value="bi">Song ngữ</option>
          <option value="en">Chỉ tiếng Anh</option>
          <option value="vi">Tiếng Việt chính</option>
        </select>
        {interactive && (
          <div className="flex rounded-xl bg-paper p-1 ring-1 ring-line-2">
            {(
              [
                ["idle", "Trình bày"],
                ["open", "Mở câu hỏi"],
                ["reveal", "Công bố"],
              ] as const
            ).map(([p, label]) => (
              <button key={p} type="button" onClick={() => setPhase(p)} aria-pressed={phase === p} className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", phase === p ? "bg-white shadow-sm" : "text-ink-2")}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {top > 0 && (
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-2">
          Bước {step}/{top}
          <input type="range" min={0} max={top} value={step} onChange={(e) => setStep(Number(e.target.value))} className="flex-1 accent-blue" />
        </label>
      )}

      {device === "tv" ? (
        <TvScreen state={state} lesson={data} responses={[]} participants={[]} roster={new Map()} join={{ code: "ABC123", host: typeof location !== "undefined" ? location.host : "" }} left={state.phase === "open" ? (slide.question?.time ?? slide.speak?.time ?? 30) * 1000 : null} className="rounded-2xl" />
      ) : (
        <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[32px] border-[6px] border-ink bg-ink-tv font-present text-[var(--chalk)] shadow-xl" style={BOARD_VARS}>
          <div className="flex max-h-[600px] min-h-[480px] flex-col gap-4 overflow-y-auto p-4">
            {state.phase === "idle" || !interactive ? (
              <SlideView slide={slide} step={step} lang={lang} variant="phone" />
            ) : slide.question ? (
              <>
                <QuestionCard q={slide.question} lang={lang} />
                {state.phase === "open" ? (
                  <AnswerInput key={slide.id + slide.question.type} q={slide.question} lang={lang} open busy={false} onSend={() => toast.info("Đây là bản xem trước — không gửi câu trả lời.")} />
                ) : (
                  <RevealView state={state} q={slide.question} lang={lang} total={0} />
                )}
              </>
            ) : (
              <div className="rounded-3xl bg-white p-4 text-ink">
                <p className="text-xs font-bold text-ink-2 uppercase">Luyện nói · Speaking</p>
                <p className="mt-1 font-present text-xl font-semibold">{slide.speak?.target || "(chưa có câu mẫu)"}</p>
                <p className="mt-2 text-xs text-ink-2">Học sinh bấm micro, đọc to; máy chấm phát âm từng từ.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
