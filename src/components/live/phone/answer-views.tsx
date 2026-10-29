"use client";

// Màn trả lời trên điện thoại: 4 ô đáp án màu + hình, nhập số, gõ chữ; màn công bố đúng/sai
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "cn";
import { SHAPE_COLORS, ShapeIcon } from "@/components/brand/shapes";
import { Tam } from "@/components/brand/tam";
import { BiText } from "@/components/live/slide-view";
import { SHAPES } from "@/components/live/tv-screen";
import { useResultFx } from "@/lib/feedback";
import { parseLabels } from "@/lib/live/grading";
import type { Lang, LiveState, MyAnswer, Question } from "@/lib/live/types";

export function QuestionCard({ q, lang }: { q: Question; lang: Lang }) {
  return (
    <div className="rounded-3xl bg-white p-4 text-ink shadow-[0_6px_0_rgba(0,0,0,.25)]">
      <p className="text-[11px] font-bold tracking-wider text-ink-2 uppercase">{q.skill === "Ngôn ngữ" ? "Ngôn ngữ · Language" : "Toán · Maths"}</p>
      {/* E1 (lang "vi"): tiếng Việt to, tiếng Anh nhỏ bên dưới để em làm quen dần */}
      {lang === "vi" ? (
        <>
          <p className="mt-1 text-xl leading-snug font-semibold">{q.prompt.vi}</p>
          <p className="font-present text-sm text-ink-2">{q.prompt.en}</p>
        </>
      ) : (
        <>
          <p className="mt-1 font-present text-xl leading-snug font-semibold">{q.prompt.en}</p>
          {lang !== "en" && <p className="text-vi text-sm">{q.prompt.vi}</p>}
        </>
      )}
    </div>
  );
}

export function AnswerInput({
  q,
  lang,
  mine,
  pendingValue,
  open,
  busy,
  onSend,
}: {
  q: Question;
  lang: Lang;
  mine?: MyAnswer;
  pendingValue?: string | number;
  open: boolean;
  busy: boolean;
  onSend: (v: string | number) => void;
}) {
  const [text, setText] = useState("");
  const sent = mine?.value ?? pendingValue;

  if (q.type === "mcq") {
    return (
      <div className={cn("grid gap-3", (q.options?.length ?? 0) > 2 ? "grid-cols-2" : "grid-cols-1")}>
        {(q.options ?? []).map((o, i) => {
          const kind = SHAPES[i];
          const c = SHAPE_COLORS[kind];
          const chosen = sent != null && Number(sent) === i;
          const dim = sent != null && !chosen;
          return (
            <button
              key={i}
              disabled={!open || sent != null || busy}
              onClick={() => onSend(i)}
              className={cn(
                "flex min-h-28 flex-col items-start justify-between gap-2 rounded-[20px] p-3 text-left transition-all active:translate-y-[4px] active:shadow-none disabled:active:translate-y-0",
                dim && "opacity-30",
                chosen && "ring-4 ring-white"
              )}
              style={{ background: c.bg, color: c.text, boxShadow: `0 6px 0 ${c.dk}` }}
            >
              <ShapeIcon kind={kind} color={c.text} className="size-7" />
              {lang === "vi" && o.vi !== o.en ? (
                <span className="text-base leading-tight font-semibold">
                  {o.vi}
                  <span className="block font-present text-xs font-bold opacity-80">{o.en}</span>
                </span>
              ) : (
                <span className="font-present text-base leading-tight font-semibold">
                  {o.en}
                  {lang !== "en" && o.vi !== o.en && <span className="block text-xs font-normal italic opacity-80">{o.vi}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === "label") return <LabelInput q={q} lang={lang} sent={sent} open={open} busy={busy} onSend={onSend} />;

  if (sent != null) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center">
        <p className="text-sm text-[var(--chalk-dim)]">Em đã gửi</p>
        <p className="font-present text-2xl font-bold text-[var(--hi)]">
          {String(sent)}
          {q.type === "number" ? q.unit : ""}
        </p>
      </div>
    );
  }
  if (!open) return null;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const v = text.trim();
        if (v) onSend(q.type === "number" ? v.replace(",", ".") : v);
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        inputMode={q.type === "number" ? "decimal" : "text"}
        autoComplete="off"
        autoCapitalize="off"
        maxLength={q.type === "number" ? 12 : 200}
        placeholder={q.type === "number" ? "Nhập số, ví dụ 65" : "Type in English…"}
        aria-label="Câu trả lời"
        className="h-14 w-full rounded-2xl border-2 border-white/20 bg-white/10 px-4 font-present text-xl text-white outline-none placeholder:text-white/40 focus:border-[var(--hi)]"
        autoFocus
      />
      <button
        type="submit"
        disabled={busy || !text.trim()}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-sun font-bold text-ink shadow-[0_5px_0_var(--color-sun-dk)] active:translate-y-[3px] active:shadow-none disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />} Gửi câu trả lời
      </button>
    </form>
  );
}

/** Kéo nhãn kiểu "chạm": chọn ô → chạm nhãn để gắn; chạm lại ô đã gắn để gỡ. Mỗi nhãn dùng một lần. */
function LabelInput({ q, lang, sent, open, busy, onSend }: { q: Question; lang: Lang; sent?: string | number; open: boolean; busy: boolean; onSend: (v: string) => void }) {
  const targets = q.targets ?? [];
  const labels = q.options ?? [];
  const [pick, setPick] = useState<number[]>(() => (sent != null ? parseLabels(sent) : targets.map(() => -1)));
  const [active, setActive] = useState(0);
  const locked = sent != null || !open;
  const used = new Set(pick.filter((x) => x >= 0));

  const place = (li: number) => {
    const next = [...pick];
    next[active] = li;
    setPick(next);
    const empty = next.findIndex((x, i) => x < 0 && i !== active);
    if (empty >= 0) setActive(empty);
  };

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {targets.map((t, i) => {
          const l = labels[pick[i]];
          return (
            <li key={i}>
              <button
                disabled={locked}
                onClick={() => {
                  if (pick[i] >= 0) setPick(pick.map((x, j) => (j === i ? -1 : x)));
                  setActive(i);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 bg-white/5 p-3 text-left",
                  !locked && active === i ? "border-[var(--hi)]" : "border-white/15"
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">{i + 1}</span>
                <BiText text={t} lang={lang} className="min-w-0 flex-1 text-[15px]" />
                <span className={cn("shrink-0 rounded-xl px-3 py-1.5 font-present font-semibold", l ? "bg-sun text-ink" : "border border-dashed border-white/30 text-white/40")}>
                  {l ? l.en : "?"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {!locked && (
        <>
          <div className="flex flex-wrap gap-2">
            {labels.map((l, li) =>
              used.has(li) ? null : (
                <button key={li} onClick={() => place(li)} className="rounded-xl bg-white px-3 py-2 font-present font-semibold text-ink shadow-[0_4px_0_rgba(0,0,0,.25)] active:translate-y-[3px] active:shadow-none">
                  {l.en}
                  {lang !== "en" && l.vi && l.vi !== l.en && <span className="block text-[11px] font-normal text-ink-2 italic">{l.vi}</span>}
                </button>
              )
            )}
          </div>
          <button
            onClick={() => onSend(pick.join(","))}
            disabled={busy || pick.some((x) => x < 0)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-sun font-bold text-ink shadow-[0_5px_0_var(--color-sun-dk)] active:translate-y-[3px] active:shadow-none disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />} Gửi câu trả lời
          </button>
        </>
      )}
      {sent != null && <p className="text-center text-sm text-[var(--chalk-dim)]">Em đã gửi câu trả lời.</p>}
    </div>
  );
}

/** Màn công bố: đúng → nền xanh nhạt + Tam reo mừng; sai/không trả lời → giải thích */
export function RevealView({ state, q, mine, lang, total }: { state: LiveState; q: Question; mine?: MyAnswer; lang: Lang; total: number }) {
  const rv = state.reveal;
  const explain = rv?.explain;
  // Kết quả vừa về → tiếng reo + pháo giấy (đúng) hoặc tiếng "bùm" + rung (sai)
  useResultFx(mine?.correct);
  // Đã gửi nhưng kết quả chưa về tới máy (máy chủ đang chép sau khi GV công bố) → không báo nhầm "chưa đúng"
  if (mine && mine.correct == null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <Tam mood="calm" className="size-20" />
        <p className="font-display text-xl font-extrabold">Đang chấm…</p>
        <p className="text-sm text-[var(--chalk-dim)]">Checking your answer</p>
      </div>
    );
  }
  if (mine?.correct) {
    return (
      <div className="animate-in fade-in zoom-in-95 -mx-4 flex flex-1 flex-col items-center rounded-t-[32px] bg-success-bg px-5 pt-6 pb-8 text-center text-ink duration-300">
        <Tam mood="cheer" className="size-28" />
        <p className="mt-1 font-display text-3xl font-extrabold text-success-fg">Correct!</p>
        <p className="text-vi">Chính xác!</p>
        <div className="mt-4 flex gap-3">
          <span className="rounded-2xl bg-white px-4 py-2 font-display text-2xl font-extrabold shadow-[0_4px_0_#cfeee0]">+{mine.points}</span>
          <span className="rounded-2xl bg-white px-4 py-2 text-left text-xs font-semibold text-ink-2 shadow-[0_4px_0_#cfeee0]">
            Tổng điểm
            <b className="block font-display text-lg text-ink">{total}</b>
          </span>
        </div>
        {explain && (
          <div className="mt-5 w-full rounded-2xl bg-white p-4 text-left">
            <p className="text-xs font-bold tracking-wider text-success-fg uppercase">Vì sao? · Why</p>
            <p className="mt-1 font-semibold">{explain.en}</p>
            {lang !== "en" && <p className="text-vi text-sm">{explain.vi}</p>}
          </div>
        )}
      </div>
    );
  }
  const answerText =
    q.type === "mcq" && rv?.answer != null ? `${"ABCD"[rv.answer]}. ${q.options?.[rv.answer]?.en ?? ""}` : (rv?.show ?? "");
  return (
    <div className={cn("rounded-3xl border-2 border-coral/60 bg-coral/15 p-4", mine && "animate-shake")}>
      <p className="font-display text-xl font-extrabold">{mine ? "Chưa đúng rồi" : "Em chưa trả lời"}</p>
      <p className="text-sm text-[var(--chalk-dim)]">{mine ? "Không sao, xem lời giải nhé." : "Lần sau nhanh tay hơn nhé!"}</p>
      {answerText && (
        <p className="mt-3 text-sm">
          Đáp án: <b className="font-present text-lg text-[var(--hi)]">{answerText}</b>
        </p>
      )}
      {explain && <BiText text={explain} lang={lang} className="mt-2 text-[15px]" />}
    </div>
  );
}
