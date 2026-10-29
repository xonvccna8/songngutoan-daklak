"use client";

// Trò chơi ôn tập (bản GV): chơi thử hoặc chiếu lên tivi để cả lớp cùng ôn cuối tiết.
import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { INPUT } from "@/components/lessons/fields";
import { ReviewGame } from "@/components/review/review-game";
import { useTermBank } from "@/lib/lessons/hooks";
import { NOTE_CHAPTERS, NOTE_LESSONS, lessonByParam, noteTitle, vocabOf } from "@/lib/notebook";

export default function TeacherPlayPage() {
  const { data: bank } = useTermBank();
  const approved = bank.filter((t) => t.status === "approved");
  const [lessonId, setLessonId] = useState(NOTE_LESSONS[0]?.id ?? "");

  useEffect(() => {
    const l = lessonByParam(new URLSearchParams(window.location.search).get("bai"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l) setLessonId(l.id);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
        <Gamepad2 className="size-8 text-blue" /> Trò chơi ôn tập
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        Câu hỏi lấy từ Vở ghi và từ vựng (đã duyệt) của từng bài. Học sinh chơi ở mục <b>Tự học → Trò chơi ôn tập</b>; thầy cô có thể chiếu trang này lên tivi để cả lớp cùng chơi cuối tiết.
      </p>
      <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={`${INPUT} mt-4 h-11`} aria-label="Chọn bài">
        {NOTE_CHAPTERS.map((c) => (
          <optgroup key={c.id} label={`Lớp ${c.grade} · Chương ${c.no}. ${c.vi}`}>
            {c.lessons.map((l) => (
              <option key={l.id} value={l.id}>
                Bài {l.no}. {l.vi}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="mt-5">
        <ReviewGame key={lessonId} lessonId={lessonId} title={noteTitle(lessonId)} vocab={vocabOf(lessonId, approved)} />
      </div>
    </div>
  );
}
