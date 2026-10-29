"use client";

// Luyện phát âm tự học: câu then chốt của tiết đã học + thuật ngữ. Nghe mẫu / nghe chậm, đọc to, máy chấm từng từ.
// Không lưu ghi âm — chỉ đếm số lần luyện (tính là hoạt động học).
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ChevronRight, Mic } from "lucide-react";
import { cn } from "cn";
import { FullScreenLoader } from "@/components/common";
import { SpeakView } from "@/components/live/phone/speak-view";
import { BOARD_VARS } from "@/components/live/slide-view";
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { isMathLesson } from "@/lib/subject";
import { ended } from "@/lib/analytics";
import { useClassSessions } from "@/lib/hooks/use-class-history";
import { useLesson } from "@/lib/live/hooks";
import { useTerms } from "@/lib/study/hooks";
import { curLesson } from "@/lib/curriculum";
import { noteLessonsOf, noteOf, vocabOf } from "@/lib/notebook";
import { sendStudy, useStudyTimer } from "@/lib/study/use-study-timer";
import type { Block, LessonDoc, Slide } from "@/lib/live/types";

export default function SpeakPage() {
  return (
    <StudentShell nav={false}>
      <Speak />
    </StudentShell>
  );
}

/** Câu luyện nói của một tiết: câu ở trang luyện nói + các khung định nghĩa / định lí */
function sentencesOf(slides: Slide[]): { en: string; vi: string }[] {
  const out: { en: string; vi: string }[] = [];
  const walk = (bs: Block[]) =>
    bs.forEach((b) => {
      if (b.kind === "cols") {
        walk(b.left);
        walk(b.right);
      } else if ((b.kind === "box" && b.highlight) || b.kind === "say") out.push(b.text);
    });
  slides.forEach((s) => {
    if (s.speak) out.push({ en: s.speak.target, vi: "" });
    walk(s.blocks);
  });
  // Bỏ câu trùng, câu có chỗ trống "____"
  const seen = new Set<string>();
  return out.filter((t) => {
    const k = t.en.toLowerCase();
    if (seen.has(k) || /_{3,}/.test(t.en)) return false;
    seen.add(k);
    return true;
  });
}

function useGradeLessons(grade: number | undefined) {
  const [list, setList] = useState<LessonDoc[] | null>(null);
  useEffect(() => {
    if (!grade) return;
    getDocs(query(collection(db(), COL.lessons), where("status", "==", "approved")))
      .then((s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as LessonDoc).filter((l) => l.grade === grade && isMathLesson(l))))
      .catch(() => setList([]));
  }, [grade]);
  return list;
}

function Speak() {
  const { classId, cls } = useStudent();
  const { data: sessions } = useClassSessions(classId, 30);
  const lessons = useGradeLessons(cls?.grade);
  // Ưu tiên tiết lớp đã học gần nhất
  const ordered = useMemo(() => {
    if (!lessons) return [];
    const taught = [...new Set(ended(sessions).reverse().map((s) => s.lessonId))];
    return [...lessons].sort((a, b) => (taught.indexOf(a.id) + 1 || 999) - (taught.indexOf(b.id) + 1 || 999));
  }, [lessons, sessions]);
  const [pick, setPick] = useState<string | null>(null);
  // Không có tiết đã duyệt → luyện theo vở ghi (bài lớp đang học, chưa chọn thì bài đầu của khối)
  const fallback = noteOf(cls?.curLessonId) ? cls!.curLessonId! : noteLessonsOf(cls?.grade)[0]?.id;
  const lessonId = pick ?? ordered[0]?.id ?? fallback;
  const note = noteOf(lessonId);
  const { data: lesson } = useLesson(note ? undefined : lessonId, false);
  const { data: terms } = useTerms(cls?.grade);
  const [open, setOpen] = useState<string | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  useStudyTimer("speak");

  if (lessons === null) return <FullScreenLoader label="Đang tải bài luyện…" />;
  const sentences = note ? note.sentences : lesson ? sentencesOf(lesson.slides) : [];
  const words = note
    ? vocabOf(lessonId!, terms).map((v) => ({ en: v.en, vi: v.vi }))
    : terms.filter((t) => !lessonId || (t.lessonIds ?? []).includes(lessonId)).map((t) => ({ en: t.en, vi: t.vi }));
  const chips = [...ordered.map((l) => ({ id: l.id, label: l.title.vi })), ...noteLessonsOf(cls?.grade).map((l) => ({ id: l.id, label: `Bài ${l.no}. ${l.vi}` }))];

  const row = (t: { en: string; vi: string }) => (
    <SpeakRow
      key={t.en}
      t={t}
      open={open === t.en}
      best={best[t.en]}
      onToggle={() => setOpen(open === t.en ? null : t.en)}
      onScore={(score) => {
        setBest((b) => ({ ...b, [t.en]: Math.max(b[t.en] ?? 0, score) }));
        sendStudy({ activity: "speak", event: true }).catch(() => {});
      }}
    />
  );

  return (
    <>
      <StudentHeader en="Pronunciation practice" vi="Luyện phát âm" />
      <main className="flex flex-col gap-5 px-5 pt-5 pb-10">
        {chips.length > 1 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {chips.map((l) => (
              <button
                key={l.id}
                onClick={() => setPick(l.id)}
                className={cn("h-10 shrink-0 rounded-full border-2 px-4 text-sm font-bold", l.id === lessonId ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2")}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
        {!lessonId ? (
          <p className="card-lsn p-5 text-sm text-ink-2">Chưa có bài học nào để luyện.</p>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-extrabold">Câu then chốt</h2>
              <p className="text-vi text-sm">Key sentences — {note ? `Lesson ${curLesson(lessonId)?.no}. ${curLesson(lessonId)?.en}` : (lesson?.lesson.title.en ?? "…")}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {sentences.map(row)}
              </ul>
            </section>
            {words.length > 0 && (
              <section>
                <h2 className="text-lg font-extrabold">Thuật ngữ</h2>
                <p className="text-vi text-sm">Key words</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {words.map(row)}
                </ul>
              </section>
            )}
          </>
        )}
        <p className="text-center text-xs text-ink-2">
          Khi chấm bằng AI, đoạn đọc ngắn được gửi tới máy chủ AI (OpenAI) để nhận giọng nói rồi bỏ đi — trang web không lưu giọng nói của em.
        </p>
      </main>
    </>
  );
}

function SpeakRow({ t, open, best, onToggle, onScore }: { t: { en: string; vi: string }; open: boolean; best?: number; onToggle: () => void; onScore: (score: number) => void }) {
  return (
    <li>
      <button onClick={onToggle} className={cn("card-lsn flex w-full items-center gap-3 p-3 text-left", open && "border-blue")}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-soft text-[#A3301B]">
          <Mic className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-en block font-semibold">{t.en}</span>
          {t.vi && <span className="text-vi block text-sm">{t.vi}</span>}
        </span>
        {best != null ? (
          <b className={cn("font-display text-lg", best >= 85 ? "text-success-fg" : best >= 60 ? "text-[#8A5A00]" : "text-coral-dk")}>{best}</b>
        ) : (
          <ChevronRight className="size-5 text-ink-2" />
        )}
      </button>
      {open && (
        <div className="mt-2 rounded-3xl bg-ink-tv p-4 text-[var(--chalk)]" style={BOARD_VARS}>
          <SpeakView target={t.en} phase="open" onScore={(r) => onScore(r.score)} />
        </div>
      )}
    </li>
  );
}
