"use client";

// Thẻ từ vựng: mặt trước tiếng Anh + IPA + nghe; lật xem nghĩa + câu ví dụ; tự đánh giá → lịch ôn lặp ngắt quãng
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Layers, Loader2, RotateCcw, Snail, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Tam } from "@/components/brand/tam";
import { FullScreenLoader } from "@/components/common";
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { api, errorMessage } from "@/lib/api-client";
import { useNow } from "@/lib/hooks/use-class-history";
import { say } from "@/lib/live/speech";
import { useMyCards, useTerms } from "@/lib/study/hooks";
import { GRADE_LABEL, NEW_PER_DAY, buildQueue, isMastered, newToday, type Grade } from "@/lib/study/srs";
import { useStudyTimer } from "@/lib/study/use-study-timer";
import { ALL_LESSONS, groupByLesson, termsOfLesson, type LessonGroup } from "@/lib/lessons/by-lesson";
import type { CardState, TermDoc } from "@/lib/study/types";

export default function CardsPage() {
  return (
    <StudentShell nav={false}>
      <Cards />
    </StudentShell>
  );
}

const GRADE_STYLE: Record<Grade, string> = {
  again: "bg-coral text-white shadow-[0_4px_0_var(--color-coral-dk)]",
  hard: "bg-sun text-ink shadow-[0_4px_0_var(--color-sun-dk)]",
  good: "bg-blue text-white shadow-[0_4px_0_var(--color-blue-dk)]",
  easy: "bg-teal text-white shadow-[0_4px_0_var(--color-teal-dk)]",
};

function Cards() {
  const { uid, cls } = useStudent();
  const { data: allTerms, loading } = useTerms(cls?.grade);
  const { data: cards, loading: loadingCards } = useMyCards(uid);
  const now = useNow();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  // Ôn theo bài: "" = tất cả các bài; mã bài vd "k8-15" (mở từ Vở ghi: /s/cards?bai=k8-15)
  const [lesson, setLesson] = useState("");
  useStudyTimer("cards");

  useEffect(() => {
    const bai = new URLSearchParams(window.location.search).get("bai");
    const l = ALL_LESSONS.find((x) => x.id === bai);
    if (!l) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLesson(l.id);
    setQueue(null);
  }, []);

  // Bài nào từ vựng bài đó: "Tất cả" vẫn xếp từ theo thứ tự bài (bài đầu trước) để thẻ mới đến lần lượt từng bài
  const groups = groupByLesson(allTerms);
  const terms = lesson ? termsOfLesson(allTerms, lesson) : [...new Map(groups.flatMap((g) => g.terms).map((t) => [t.id, t])).values()];
  const pickLesson = (id: string) => {
    setLesson(id);
    setQueue(null);
    setFlipped(false);
  };

  // Lập hàng đợi một lần khi dữ liệu đã tải (thẻ "Chưa nhớ" được đưa xuống cuối hàng).
  // Ôn theo một bài: được học hết từ mới của bài trong hôm nay.
  const ready = !loading && !loadingCards && !!cls && now > 0;
  if (ready && queue === null) setQueue(buildQueue(terms.map((t) => t.id), cards, now, lesson ? newToday(cards, now) + terms.length : undefined));

  if (!ready || queue === null) return <FullScreenLoader label="Đang lấy thẻ từ…" />;
  const byId = new Map(terms.map((t) => [t.id, t]));
  const term = queue.length ? byId.get(queue[0]) : undefined;

  async function grade(g: Grade) {
    if (!term) return;
    setBusy(true);
    try {
      await api("/api/study/cards", { body: { termId: term.id, grade: g } });
      setReviewed((n) => n + 1);
      setQueue((q) => (q ? (g === "again" ? [...q.slice(1), q[0]] : q.slice(1)) : q));
      setFlipped(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const left = terms.filter((t) => !cards[t.id]).length;
  const mastered = terms.filter((t) => isMastered(cards[t.id])).length;

  return (
    <>
      <StudentHeader
        en="Vocabulary cards"
        vi="Ôn từ vựng"
        right={
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold ring-2 ring-line">
            {queue.length} <span className="text-ink-2">thẻ</span>
          </span>
        }
      />

      <main className="flex flex-1 flex-col gap-4 px-5 pt-5 pb-8">
        {groups.length > 0 && <LessonPicker groups={groups} cards={cards} lesson={lesson} onPick={pickLesson} />}
        {terms.length === 0 ? (
          <p className="card-lsn p-5 text-sm text-ink-2">Chưa có thuật ngữ nào cho {lesson ? "bài này" : `khối ${cls?.grade}`}. Thầy cô cần nạp bài học trước.</p>
        ) : term ? (
          <>
            <Flashcard term={term} card={cards[term.id]} flipped={flipped} onFlip={() => setFlipped(true)} />
            {flipped ? (
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(GRADE_LABEL) as Grade[]).map((g) => (
                  <button
                    key={g}
                    disabled={busy}
                    onClick={() => grade(g)}
                    className={cn("flex min-h-16 flex-col items-center justify-center rounded-2xl font-bold transition-transform active:translate-y-[3px] active:shadow-none disabled:opacity-60", GRADE_STYLE[g])}
                  >
                    {busy ? <Loader2 className="size-5 animate-spin" /> : GRADE_LABEL[g].vi}
                    <span className="text-[11px] font-semibold opacity-80">{GRADE_LABEL[g].en}</span>
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setFlipped(true)} className="h-14 rounded-2xl bg-ink font-bold text-white shadow-[0_4px_0_#000] active:translate-y-[3px] active:shadow-none">
                Lật thẻ xem nghĩa
              </button>
            )}
            <p className="text-center text-xs text-ink-2">Nhớ chắc → thẻ quay lại sau vài ngày. Chưa nhớ → ôn lại ngay trong lượt này.</p>
          </>
        ) : (
          <div className="card-lsn flex flex-col items-center gap-3 p-6 text-center">
            <Tam mood="cheer" className="size-24" />
            <p className="font-display text-2xl font-extrabold">{lesson ? "Xong từ vựng của bài!" : "Xong lượt ôn hôm nay!"}</p>
            <p className="text-sm text-ink-2">
              Em đã ôn {reviewed} thẻ · đã thuộc {mastered}/{terms.length} từ{lesson ? " của bài" : ""}.
            </p>
            {left > 0 && (
              <button
                onClick={() => {
                  // Thêm 5 thẻ mới ngoài giới hạn mỗi ngày (em tự muốn học thêm)
                  const t = Date.now();
                  setQueue(buildQueue(terms.map((x) => x.id), cards, t, newToday(cards, t) + NEW_PER_DAY));
                }}
                className="flex h-12 items-center gap-2 rounded-2xl border-2 border-line-2 px-4 font-bold"
              >
                <RotateCcw className="size-4" /> Học thêm {Math.min(NEW_PER_DAY, left)} thẻ mới
              </button>
            )}
            <Link href="/s/learn" className="font-bold text-blue">
              Về Tự học
            </Link>
          </div>
        )}

        {terms.length > 0 && <WordList groups={lesson ? groups.filter((g) => g.lesson?.id === lesson) : groups} total={terms.length} cards={cards} />}
      </main>
    </>
  );
}

/** Chọn ôn từ vựng theo bài (chỉ hiện bài đã có từ) */
function LessonPicker({ groups, cards, lesson, onPick }: { groups: LessonGroup<TermDoc>[]; cards: Record<string, CardState>; lesson: string; onPick: (id: string) => void }) {
  const cur = groups.find((g) => g.lesson?.id === lesson)?.lesson;
  const chip = (on: boolean) => cn("flex h-11 shrink-0 flex-col items-center justify-center rounded-2xl border-2 px-3 text-xs font-bold leading-tight", on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2");
  return (
    <section>
      <p className="mb-2 text-xs font-bold tracking-wide text-ink-2 uppercase">Ôn theo bài · Learn by lesson</p>
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
        <button className={chip(!lesson)} onClick={() => onPick("")}>
          Tất cả
        </button>
        {groups
          .filter((g) => g.lesson)
          .map((g) => {
            const done = g.terms.filter((t) => isMastered(cards[t.id])).length;
            return (
              <button key={g.lesson!.id} className={chip(lesson === g.lesson!.id)} onClick={() => onPick(g.lesson!.id)} title={g.lesson!.vi}>
                Bài {g.lesson!.no}
                <span className="text-[10px] font-semibold opacity-75">
                  {done}/{g.terms.length}
                </span>
              </button>
            );
          })}
      </div>
      {cur && (
        <p className="mt-2 text-sm">
          <b>
            Bài {cur.no}. {cur.vi}
          </b>{" "}
          <span className="text-en">· {cur.en}</span>
        </p>
      )}
    </section>
  );
}

function Flashcard({ term, card, flipped, onFlip }: { term: TermDoc; card?: CardState; flipped: boolean; onFlip: () => void }) {
  return (
    <div onClick={onFlip} className="card-lsn relative flex min-h-72 cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="absolute top-3 left-3 rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-2">{card ? "Ôn lại" : "Thẻ mới"}</span>
      <p className="text-en font-display text-3xl font-extrabold">{term.en}</p>
      <p className="text-ink-2">{term.ipa}</p>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => say(term.en, 0.85)} className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-line-2 px-3 text-sm font-bold">
          <Volume2 className="size-4 text-blue" /> Nghe
        </button>
        <button onClick={() => say(term.en, 0.55)} className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-line-2 px-3 text-sm font-bold">
          <Snail className="size-4 text-blue" /> Chậm
        </button>
      </div>
      {flipped && (
        <div className="animate-in fade-in slide-in-from-bottom-2 mt-2 w-full border-t-2 border-dashed border-line pt-4 duration-200">
          <p className="text-vi text-2xl font-bold">{term.vi}</p>
          {term.example && (
            <button onClick={(e) => (e.stopPropagation(), say(term.example!.en, 0.85))} className="mt-3 w-full rounded-2xl bg-paper p-3 text-left">
              <span className="text-en flex items-start gap-1.5 font-semibold">
                <Volume2 className="mt-0.5 size-4 shrink-0" /> {term.example.en}
              </span>
              <span className="text-vi block pl-5.5 text-sm">{term.example.vi}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Danh sách từ, chia theo bài */
function WordList({ groups, total, cards }: { groups: LessonGroup<TermDoc>[]; total: number; cards: Record<string, CardState> }) {
  return (
    <details className="card-lsn p-4" open={groups.length === 1}>
      <summary className="flex cursor-pointer items-center gap-2 font-bold">
        <Layers className="size-4 text-teal" /> {groups.length === 1 ? "Từ vựng của bài" : "Tất cả từ theo bài"} ({total})
      </summary>
      {groups.map((g) => (
        <div key={g.lesson?.id ?? "none"} className="mt-3">
          {groups.length > 1 && <p className="mb-1 text-xs font-extrabold text-ink-2">{g.lesson ? `Bài ${g.lesson.no}. ${g.lesson.vi}` : "Từ khác"}</p>}
          <ul className="flex flex-col gap-1.5">
            {g.terms.map((t) => {
              const c = cards[t.id];
              const st = isMastered(c) ? { l: "Đã thuộc", cls: "bg-teal-soft text-[#0E6377]" } : c ? { l: "Đang học", cls: "bg-blue-soft text-blue-dk" } : { l: "Chưa học", cls: "bg-paper text-ink-2" };
              return (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <button onClick={() => say(t.en, 0.85)} className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-paper" aria-label={`Nghe ${t.en}`}>
                    <Volume2 className="size-4 text-blue" />
                  </button>
                  <span className="min-w-0">
                    <span className="text-en block font-semibold">{t.en}</span>
                    <span className="text-vi block text-xs">{t.vi}</span>
                  </span>
                  <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", st.cls)}>
                    {isMastered(c) && <Check className="size-3" />}
                    {st.l}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </details>
  );
}
