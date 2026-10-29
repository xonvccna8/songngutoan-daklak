"use client";

// Xem lại tiết đã học: từng trang bài giảng (hiện đủ các bước), câu trả lời của em, đáp án + lời giải
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import { EmptyState, FullScreenLoader } from "@/components/common";
import { BiText, SlideView } from "@/components/live/slide-view";
import { Board, LangSwitch } from "@/components/student/board";
import { StudentShell, useStudent } from "@/components/student/student-shell";
import { api } from "@/lib/api-client";
import { fmtAnswer, maxStep } from "@/lib/live/grading";
import { useLesson, useMyResponses, useSession } from "@/lib/live/hooks";
import { useStudyTimer } from "@/lib/study/use-study-timer";
import type { Lang } from "@/lib/live/types";
import type { HwAnswer } from "@/lib/study/types";

type Solution = Pick<HwAnswer, "answer" | "show" | "explain">;

export default function ReviewPage() {
  return (
    <StudentShell nav={false}>
      <Review />
    </StudentShell>
  );
}

function Review() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { uid } = useStudent();
  const { data: s, loading } = useSession(sessionId);
  const { data: lesson } = useLesson(s?.lessonId, false);
  const mine = useMyResponses(sessionId, uid);
  const [sols, setSols] = useState<Record<string, Solution>>({});
  const [i, setI] = useState(0);
  const [lang, setLang] = useState<Lang>("bi");
  useStudyTimer("review", undefined, !!s);

  useEffect(() => {
    if (s?.status !== "ended") return;
    api<{ solutions: Record<string, Solution> }>(`/api/s/review?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => setSols(r.solutions))
      .catch(() => {});
  }, [s?.status, sessionId]);

  if (loading || (s && !lesson)) return <FullScreenLoader label="Đang mở tiết học…" />;
  if (!s || !lesson) {
    return (
      <div className="p-5">
        <EmptyState title="Không tìm thấy tiết học" mood="alert" action={<Link href="/s/learn" className="font-bold text-blue">← Về Tự học</Link>} />
      </div>
    );
  }
  const slides = lesson.slides;
  const slide = slides[Math.min(i, slides.length - 1)];
  const r = mine.find((x) => x.slideId === slide.id);
  const sol = sols[slide.id];
  const q = slide.question;
  const myResult = uid ? s.results?.[uid] : undefined;

  return (
    <Board>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-ink-tv/90 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur">
        <Link href="/s/learn" className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20" aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1 text-xs text-[var(--chalk-dim)]">
          <b className="block truncate text-sm text-[var(--chalk)]">{s.lessonTitle?.vi}</b>
          {new Date(s.createdAt?.toMillis() ?? 0).toLocaleDateString("vi-VN")}
          {myResult && ` · ${myResult.points} điểm · đúng ${myResult.correct}/${myResult.answered}`}
        </div>
        <LangSwitch lang={lang} onChange={setLang} />
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-6">
        <p className="text-xs font-bold tracking-wider text-[var(--chalk-dim)] uppercase">
          Trang {i + 1}/{slides.length}
        </p>
        <div className="rounded-3xl border border-white/10 bg-[var(--board-2)] p-4">
          <SlideView slide={slide} step={maxStep(slide)} lang={lang} variant="phone" />
        </div>

        {q && (
          <div className="rounded-3xl bg-white p-4 text-ink">
            <p className="font-present text-lg font-semibold">{q.prompt.en}</p>
            {lang !== "en" && <p className="text-vi text-sm">{q.prompt.vi}</p>}
            <p className="mt-3 text-sm">
              Em trả lời:{" "}
              {r ? (
                <>
                  <b>{fmtAnswer(q, r.value)}</b>{" "}
                  <b className={r.correct ? "text-success-fg" : "text-coral-dk"}>{r.correct ? `✓ Đúng (+${r.points})` : "✗ Chưa đúng"}</b>
                </>
              ) : (
                <span className="text-ink-2">em chưa trả lời câu này</span>
              )}
            </p>
            {sol && (
              <div className="mt-3 rounded-2xl bg-paper p-3">
                <p className="text-sm">
                  Đáp án: <b className="text-en">{q.type === "mcq" && sol.answer != null ? `${"ABCD"[sol.answer]}. ${q.options?.[sol.answer]?.en ?? ""}` : sol.show}</b>
                </p>
                {sol.explain && (
                  <p className="mt-1 text-sm">
                    <span className="text-en font-semibold">{sol.explain.en}</span>
                    {lang !== "en" && <span className="text-vi block">{sol.explain.vi}</span>}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {slide.speak && (
          <div className="rounded-3xl border border-white/10 p-4 text-sm">
            <BiText text={{ en: slide.speak.target, vi: "" }} lang="en" className="font-present text-lg" />
            <p className="mt-1 text-[var(--chalk-dim)]">
              {r ? `Điểm phát âm của em: ${r.score} (${r.attempts} lần thử)` : "Em chưa luyện câu này trong tiết."}{" "}
              <Link href="/s/speak" className="font-bold text-[var(--hi)]">
                Luyện lại →
              </Link>
            </p>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <button onClick={() => setI(i - 1)} disabled={i === 0} className="flex h-12 items-center justify-center gap-1 rounded-2xl border-2 border-white/20 font-bold disabled:opacity-30">
            <ChevronLeft className="size-5" /> Trang trước
          </button>
          <button
            onClick={() => setI(i + 1)}
            disabled={i >= slides.length - 1}
            className={cn("flex h-12 items-center justify-center gap-1 rounded-2xl bg-sun font-bold text-ink shadow-[0_4px_0_var(--color-sun-dk)] disabled:opacity-30")}
          >
            Trang sau <ChevronRight className="size-5" />
          </button>
        </div>
      </main>
    </Board>
  );
}
