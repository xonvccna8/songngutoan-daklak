"use client";

// Trò chơi ôn tập cho HS: chọn bài (mặc định bài lớp đang học) → chơi ghép từ / đố vui. Đếm thời gian tự học.
import { useEffect, useState } from "react";
import { cn } from "cn";
import { FullScreenLoader } from "@/components/common";
import { ReviewGame } from "@/components/review/review-game";
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { lessonByParam, noteLessonsOf, noteOf, noteTitle, vocabOf } from "@/lib/notebook";
import { useTerms } from "@/lib/study/hooks";
import { sendStudy, useStudyTimer } from "@/lib/study/use-study-timer";

export default function StudentPlayPage() {
  return (
    <StudentShell nav={false}>
      <Play />
    </StudentShell>
  );
}

function Play() {
  const { cls } = useStudent();
  const { data: terms, loading } = useTerms(cls?.grade);
  const [picked, setPicked] = useState<string | null>(null);
  useStudyTimer("game");

  // Mở từ vở ghi: /s/play?bai=k8-15
  useEffect(() => {
    const l = lessonByParam(new URLSearchParams(window.location.search).get("bai"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l) setPicked(l.id);
  }, []);

  if (!cls || loading) return <FullScreenLoader label="Đang mở trò chơi…" />;
  const lessonId = picked ?? (noteOf(cls.curLessonId) ? cls.curLessonId! : noteLessonsOf(cls.grade)[0].id);

  return (
    <>
      <StudentHeader en="Review games" vi="Trò chơi ôn tập" />
      <main className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-8">
        <LessonTabs grade={cls.grade} value={lessonId} onChange={setPicked} />
        <ReviewGame
          key={lessonId}
          lessonId={lessonId}
          title={noteTitle(lessonId)}
          vocab={vocabOf(lessonId, terms)}
          // Chơi xong 1 lượt → báo thầy cô (đếm lượt chơi, tính ngày học cho chuỗi)
          onFinish={() => sendStudy({ activity: "game", event: true, ref: lessonId }).catch(() => {})}
        />
      </main>
    </>
  );
}

function LessonTabs({ grade, value, onChange }: { grade: number; value: string; onChange: (id: string) => void }) {
  return (
    <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Chọn bài">
      {noteLessonsOf(grade).map((l) => (
        <button
          key={l.id}
          role="tab"
          aria-selected={l.id === value}
          title={l.vi}
          onClick={() => onChange(l.id)}
          className={cn("h-10 shrink-0 rounded-2xl border-2 px-3 text-sm font-bold", l.id === value ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2")}
        >
          Bài {l.no}
        </button>
      ))}
    </div>
  );
}
