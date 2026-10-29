"use client";

// Làm bài tập về nhà: từng câu (đề + hình như trên lớp), gợi ý 3 tầng, chấm ngay, xem lời giải.
// Thời gian làm bài thật được đếm bằng useStudyTimer (chỉ khi trang hiển thị + có tương tác).
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookA, CheckCircle2, ChevronLeft, Clock, KeyRound, Lightbulb, Loader2, Sparkles, Volume2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Tam } from "@/components/brand/tam";
import { EmptyState, FullScreenLoader } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { BiText, SlideView } from "@/components/live/slide-view";
import { AnswerInput, QuestionCard } from "@/components/live/phone/answer-views";
import { SpeakView } from "@/components/live/phone/speak-view";
import { Board, LangSwitch } from "@/components/student/board";
import { StudentShell, useStudent } from "@/components/student/student-shell";
import { api, errorMessage } from "@/lib/api-client";
import { fmtDue } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-class-history";
import { maxStep } from "@/lib/live/grading";
import { say } from "@/lib/live/speech";
import { HW_POINTS_AFTER_SOLUTION } from "@/lib/study/hw";
import { useAssignment, useSubmissionsOf } from "@/lib/study/hooks";
import { useStudyTimer } from "@/lib/study/use-study-timer";
import { useResultFx } from "@/lib/feedback";
import type { Lang, ResponseDoc } from "@/lib/live/types";
import type { AssignmentDoc, HwAnswer, HwItem } from "@/lib/study/types";

type Solution = Pick<HwAnswer, "answer" | "show" | "explain">;

export default function HomeworkPage() {
  return (
    <StudentShell nav={false}>
      <Homework />
    </StudentShell>
  );
}

function Homework() {
  const { id } = useParams<{ id: string }>();
  const { uid } = useStudent();
  const { data: a, loading } = useAssignment(id);
  const sub = useSubmissionsOf(a ? [a.id] : [], uid)[id];
  const [idx, setIdx] = useState<number | null>(null);
  const [lang, setLang] = useState<Lang>("bi");
  // Kết quả vừa nhận từ máy chủ (hiện ngay, không chờ Firestore đồng bộ)
  const [local, setLocal] = useState<Record<string, HwAnswer>>({});
  const [sols, setSols] = useState<Record<string, Solution>>({});
  const now = useNow(30_000);
  useStudyTimer("hw", id, !!a);

  if (loading) return <FullScreenLoader label="Đang mở bài…" />;
  if (!a) {
    return (
      <div className="p-5">
        <EmptyState title="Không tìm thấy bài" mood="alert" action={<Link href="/s/learn" className="font-bold text-blue">← Về Tự học</Link>}>
          Bài có thể đã bị thầy cô xoá.
        </EmptyState>
      </div>
    );
  }

  const answers = { ...(sub?.answers ?? {}), ...local };
  const firstOpen = a.items.findIndex((it) => !answers[it.slideId]);
  const cur = idx ?? (firstOpen === -1 ? a.items.length : firstOpen);
  const due = a.dueAt.toMillis();
  const overdue = now > due && !sub?.completedAt;

  return (
    <Board>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-ink-tv/90 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur">
        <Link href="/s/learn" className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20" aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1 text-xs text-[var(--chalk-dim)]">
          <b className="block truncate text-sm text-[var(--chalk)]">{a.title.vi}</b>
          Hạn {fmtDue(due)}
        </div>
        <LangSwitch lang={lang} onChange={setLang} />
      </header>

      {/* Tiến độ: mỗi câu một chấm (đúng = xanh ✓, sai = đỏ ✗) */}
      <nav className="flex flex-wrap gap-1.5 px-4 pt-3" aria-label="Các câu">
        {a.items.map((it, i) => {
          const r = answers[it.slideId];
          const good = r && (r.correct || (r.score ?? 0) >= 60);
          return (
            <button
              key={it.slideId}
              onClick={() => setIdx(i)}
              aria-label={`Câu ${i + 1}${r ? (good ? " — đúng" : " — chưa đúng") : ""}`}
              className={cn(
                "grid size-9 place-items-center rounded-xl text-sm font-bold",
                r ? (good ? "bg-teal text-white" : "bg-coral text-white") : "border border-white/25 text-[var(--chalk-dim)]",
                cur === i && "ring-3 ring-sun"
              )}
            >
              {r ? good ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" /> : i + 1}
            </button>
          );
        })}
        <button
          onClick={() => setIdx(a.items.length)}
          className={cn("h-9 rounded-xl border border-white/25 px-3 text-xs font-bold", cur === a.items.length && "ring-3 ring-sun")}
        >
          Kết quả
        </button>
      </nav>

      {overdue && (
        <p className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-sun/60 bg-sun/10 p-3 text-sm">
          <Clock className="size-4 shrink-0 text-sun" /> Đã quá hạn — em vẫn làm được, bài sẽ tính là nộp trễ.
        </p>
      )}

      <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-8">
        {cur >= a.items.length ? (
          <Summary a={a} answers={answers} late={!!sub?.late} complete={firstOpen === -1} onOpen={setIdx} />
        ) : (
          <ItemView
            key={a.items[cur].slideId}
            a={a}
            item={a.items[cur]}
            index={cur}
            lang={lang}
            ans={answers[a.items[cur].slideId]}
            solution={sols[a.items[cur].slideId] ?? sub?.solutionViewed?.[a.items[cur].slideId]}
            onAnswer={(r) => setLocal((m) => ({ ...m, [a.items[cur].slideId]: r }))}
            onSolution={(s) => setSols((m) => ({ ...m, [a.items[cur].slideId]: s }))}
            onPrev={cur > 0 ? () => setIdx(cur - 1) : undefined}
            onNext={() => setIdx(cur + 1)}
          />
        )}
      </main>
    </Board>
  );
}

function ItemView({
  a,
  item,
  index,
  lang,
  ans,
  solution,
  onAnswer,
  onSolution,
  onPrev,
  onNext,
}: {
  a: AssignmentDoc;
  item: HwItem;
  index: number;
  lang: Lang;
  ans?: HwAnswer;
  solution?: Solution;
  onAnswer: (r: HwAnswer) => void;
  onSolution: (s: Solution) => void;
  onPrev?: () => void;
  onNext: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | number | undefined>();
  const [tier, setTier] = useState(0);
  const [confirmEl, confirm] = useConfirm();
  const q = item.slide.question;
  const speak = item.slide.speak;

  async function send(body: { value?: string | number; score?: number; transcript?: string }) {
    setBusy(true);
    if (body.value != null) setPending(body.value);
    try {
      const r = await api<{ answer: HwAnswer; completed: boolean; late: boolean; tally: { score: number } }>("/api/hw/answer", { body: { aid: a.id, slideId: item.slideId, ...body } });
      onAnswer(r.answer);
      if (r.completed) toast.success(r.late ? `Em đã nộp bài (trễ hạn) · ${r.tally.score} điểm` : `Em đã hoàn thành bài · ${r.tally.score} điểm`);
    } catch (e) {
      setPending(undefined);
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function showSolution() {
    if (!solution) {
      const ok = await confirm({
        title: "Xem lời giải?",
        description: `Nếu xem lời giải trước khi trả lời, câu này đúng chỉ được ${HW_POINTS_AFTER_SOLUTION} điểm thay vì 100. Em đã thử gợi ý 1 và 2 chưa?`,
        confirmText: "Xem lời giải",
      });
      if (!ok) return;
      try {
        onSolution(await api<Solution>("/api/hw/solution", { body: { aid: a.id, slideId: item.slideId } }));
      } catch (e) {
        toast.error(errorMessage(e));
        return;
      }
    }
    setTier(3);
  }

  const sol: Solution | undefined = ans && !speak ? { answer: ans.answer, show: ans.show, explain: ans.explain } : solution;

  return (
    <>
      <p className="text-xs font-bold tracking-wider text-[var(--chalk-dim)] uppercase">
        Câu {index + 1}/{a.items.length}
      </p>
      <div className="rounded-3xl border border-white/10 bg-[var(--board-2)] p-4">
        <SlideView slide={item.slide} step={maxStep(item.slide)} lang={lang} variant="phone" />
      </div>

      {q && (
        <>
          <QuestionCard q={q} lang={lang} />
          <AnswerInput key={item.slideId} q={q} lang={lang} pendingValue={ans?.value ?? pending} open={!ans} busy={busy} onSend={(v) => send({ value: v })} />
        </>
      )}
      {speak && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <SpeakView
            target={speak.target}
            phase="open"
            mine={ans ? ({ score: ans.score, attempts: ans.attempts } as ResponseDoc) : undefined}
            onScore={(r) => send({ score: r.score, transcript: r.transcript })}
          />
        </div>
      )}

      {/* Kết quả câu hỏi */}
      {ans && q && <Feedback ans={ans} lang={lang} q={q} sol={sol} />}

      {/* Gợi ý 3 tầng (ẩn khi đã trả lời câu hỏi) */}
      {!(ans && q) && (
        <section className="rounded-3xl border border-white/10 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <Lightbulb className="size-4 text-sun" /> Gợi ý
          </p>
          <div className="grid grid-cols-3 gap-2">
            <HintBtn on={tier >= 1} onClick={() => setTier(Math.max(tier, 1))} icon={BookA} label="1 · Từ vựng" />
            <HintBtn on={tier >= 2} onClick={() => setTier(Math.max(tier, 2))} icon={Lightbulb} label="2 · Cách làm" />
            {q ? <HintBtn on={tier >= 3} onClick={showSolution} icon={KeyRound} label="3 · Lời giải" /> : <span />}
          </div>
          {tier >= 1 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {item.vocab.length === 0 && <li className="text-sm text-[var(--chalk-dim)]">Câu này không có từ mới.</li>}
              {item.vocab.map((v) => (
                <li key={v.en}>
                  <button onClick={() => say(v.en, 0.8)} className="flex w-full items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-left">
                    <Volume2 className="size-4 shrink-0 text-[var(--hi)]" />
                    <span className="font-present font-semibold">{v.en}</span>
                    <span className="text-xs text-[var(--chalk-dim)]">{v.ipa}</span>
                    <span className="ml-auto text-sm text-[var(--chalk-dim)] italic">{v.vi}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tier >= 2 && <BiText text={item.method} lang={lang === "en" ? "en" : "bi"} className="mt-3 rounded-xl bg-white/5 p-3 text-[15px]" />}
          {tier >= 3 && sol && <SolutionBox q={q!} sol={sol} lang={lang} />}
        </section>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <button onClick={onPrev} disabled={!onPrev} className="flex h-12 items-center justify-center gap-1 rounded-2xl border-2 border-white/20 font-bold disabled:opacity-30">
          <ChevronLeft className="size-5" /> Câu trước
        </button>
        <button onClick={onNext} className={cn("flex h-12 items-center justify-center gap-1 rounded-2xl font-bold", ans ? "bg-sun text-ink shadow-[0_4px_0_var(--color-sun-dk)]" : "border-2 border-white/20")}>
          {busy ? <Loader2 className="size-5 animate-spin" /> : null}
          {index + 1 < a.items.length ? (ans ? "Câu tiếp" : "Bỏ qua") : "Xem kết quả"} <ArrowRight className="size-5" />
        </button>
      </div>
      {confirmEl}
    </>
  );
}

function HintBtn({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-bold", on ? "bg-sun text-ink" : "border border-white/20 text-[var(--chalk)]")}>
      <Icon className="size-4" /> {label}
    </button>
  );
}

function SolutionBox({ q, sol, lang }: { q: NonNullable<HwItem["slide"]["question"]>; sol: Solution; lang: Lang }) {
  const text = q.type === "mcq" && sol.answer != null ? `${"ABCD"[sol.answer]}. ${q.options?.[sol.answer]?.en ?? ""}` : sol.show;
  return (
    <div className="mt-3 rounded-xl border border-white/15 p-3">
      {text && (
        <p className="text-sm">
          Đáp án: <b className="font-present text-lg text-[var(--hi)]">{text}</b>
        </p>
      )}
      {sol.explain && <BiText text={sol.explain} lang={lang} className="mt-1 text-[15px]" />}
    </div>
  );
}

/** Nhận xét của AI cho câu gõ chữ (khi máy so khớp chấm sai, AI xét lại xem em có viết đúng ý không) */
function AiNote({ ans }: { ans: HwAnswer }) {
  if (!ans.aiGraded) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-white/60 p-2 text-sm text-ink">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-[#7A4CC2]" />
      <span>
        <b>AI chấm{ans.correct ? ": đúng ý" : ""}.</b> {ans.aiFeedback?.en} <i className="text-ink-2">{ans.aiFeedback?.vi}</i>
      </span>
    </p>
  );
}

function Feedback({ ans, q, sol, lang }: { ans: HwAnswer; q: NonNullable<HwItem["slide"]["question"]>; sol?: Solution; lang: Lang }) {
  useResultFx(!!ans.correct, ans.at);
  if (ans.correct) {
    return (
      <div className="animate-in fade-in zoom-in-95 flex items-center gap-3 rounded-3xl bg-success-bg p-4 text-ink duration-300">
        <Tam mood="cheer" className="size-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-extrabold text-success-fg">Correct! +{ans.points}</p>
          <p className="text-vi text-sm">Chính xác!{ans.usedSolution ? " (đã xem lời giải)" : ""}</p>
          {sol?.explain && <p className="mt-1 text-sm font-semibold">{lang === "vi" ? sol.explain.vi : sol.explain.en}</p>}
          <AiNote ans={ans} />
        </div>
      </div>
    );
  }
  return (
    <div className="animate-shake rounded-3xl border-2 border-coral/60 bg-coral/15 p-4">
      <p className="font-display text-xl font-extrabold">Chưa đúng rồi</p>
      <p className="text-sm text-[var(--chalk-dim)]">Không sao, xem lời giải rồi làm câu tiếp nhé.</p>
      {ans.aiGraded && (
        <p className="mt-2 flex items-start gap-1.5 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--hi)]" />
          <span>
            {ans.aiFeedback?.en} <i className="text-[var(--chalk-dim)]">{ans.aiFeedback?.vi}</i>
          </span>
        </p>
      )}
      {sol && <SolutionBox q={q} sol={sol} lang={lang} />}
    </div>
  );
}

function Summary({ a, answers, late, complete, onOpen }: { a: AssignmentDoc; answers: Record<string, HwAnswer>; late: boolean; complete: boolean; onOpen: (i: number) => void }) {
  const done = a.items.filter((it) => answers[it.slideId]);
  const score = done.reduce((s, it) => s + (answers[it.slideId].points ?? 0), 0);
  const good = done.filter((it) => answers[it.slideId].correct || (answers[it.slideId].score ?? 0) >= 60).length;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Tam mood={complete ? "cheer" : "happy"} className="size-28" />
      <p className="font-display text-3xl font-extrabold">{complete ? "Hoàn thành!" : "Chưa xong"}</p>
      <p className="text-[var(--chalk-dim)]">{complete ? (late ? "Em đã nộp bài (trễ hạn)." : "Em đã nộp bài đúng hạn. Giỏi lắm!") : `Còn ${a.items.length - done.length} câu chưa làm.`}</p>
      <div className="flex gap-3">
        <span className="rounded-2xl bg-white px-4 py-2 text-ink">
          <b className="block font-display text-2xl">{score}</b>
          <span className="text-xs text-ink-2">điểm</span>
        </span>
        <span className="rounded-2xl bg-white px-4 py-2 text-ink">
          <b className="block font-display text-2xl">
            {good}/{a.items.length}
          </b>
          <span className="text-xs text-ink-2">câu đúng</span>
        </span>
      </div>
      <ul className="mt-2 flex w-full flex-col gap-1.5 text-left">
        {a.items.map((it, i) => {
          const r = answers[it.slideId];
          return (
            <li key={it.slideId}>
              <button onClick={() => onOpen(i)} className="flex w-full items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm">
                <b className="w-6 text-[var(--chalk-dim)]">{i + 1}</b>
                <span className="min-w-0 flex-1 truncate">{it.slide.question?.prompt.en ?? it.slide.speak?.target ?? it.slide.title.en}</span>
                {r ? <b className={r.correct || (r.score ?? 0) >= 60 ? "text-teal" : "text-coral"}>{r.points}</b> : <span className="text-xs text-[var(--chalk-dim)]">chưa làm</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <Link href="/s/learn" className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-sun font-bold text-ink shadow-[0_4px_0_var(--color-sun-dk)]">
        Về trang Tự học
      </Link>
    </div>
  );
}
