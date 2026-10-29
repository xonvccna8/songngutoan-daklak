"use client";

// Vở ghi bài học cho HS: chọn bài → đọc lý thuyết, nghe từ vựng, tự làm bài tập (bấm chọn để kiểm tra), tải về Word.
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileDown, Gamepad2, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { FullScreenLoader } from "@/components/common";
import { NotebookView } from "@/components/notebook/notebook-view";
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { lessonByParam, noteLessonsOf, noteOf, vocabOf } from "@/lib/notebook";
import { downloadNotebook } from "@/lib/notebook/word";
import { useTerms } from "@/lib/study/hooks";
import { useStudyTimer } from "@/lib/study/use-study-timer";

export default function StudentNotebookPage() {
  return (
    <StudentShell nav={false}>
      <Notebook />
    </StudentShell>
  );
}

function Notebook() {
  const { cls } = useStudent();
  const { data: terms, loading } = useTerms(cls?.grade);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useStudyTimer("home");

  useEffect(() => {
    const l = lessonByParam(new URLSearchParams(window.location.search).get("bai"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l) setPicked(l.id);
  }, []);

  if (!cls) return <FullScreenLoader label="Đang mở vở ghi…" />;
  // Mặc định: bài lớp đang học (thầy cô chọn trong Cài đặt lớp), chưa có thì bài đầu
  const lessons = noteLessonsOf(cls.grade);
  const lessonId = picked ?? (noteOf(cls.curLessonId) ? cls.curLessonId! : lessons[0].id);
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];

  async function download() {
    setBusy(true);
    try {
      await downloadNotebook([lessonId], { answers: false, vocab: (id) => vocabOf(id, terms) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StudentHeader en="Lesson notebook" vi="Vở ghi bài học" />
      <main className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-8">
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Chọn bài">
          {lessons.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={l.id === lessonId}
              title={l.vi}
              onClick={() => setPicked(l.id)}
              className={cn("h-10 shrink-0 rounded-2xl border-2 px-3 text-sm font-bold", l.id === lessonId ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2")}
            >
              Bài {l.no}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/s/play?bai=${lesson.id}`} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-sun text-sm font-bold text-ink shadow-[0_4px_0_var(--color-sun-dk)] active:translate-y-[3px] active:shadow-none">
            <Gamepad2 className="size-4" /> Chơi ôn tập bài {lesson.no}
          </Link>
          <Link href={`/s/cards?bai=${lesson.id}`} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal-soft text-sm font-bold text-[#0E6377]">
            <Layers className="size-4" /> Ôn từ của bài
          </Link>
          <button onClick={download} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-line-2 bg-white text-sm font-bold disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4 text-blue" />} Tải vở (Word)
          </button>
        </div>

        {loading ? <FullScreenLoader label="Đang lấy từ vựng…" /> : <NotebookView key={lessonId} lessonId={lessonId} vocab={vocabOf(lessonId, terms)} interactive compact />}
      </main>
    </>
  );
}
