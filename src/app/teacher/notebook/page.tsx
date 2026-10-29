"use client";

// Vở ghi bài học Toán 6–9: lý thuyết + từ vựng + câu tiếng Anh + bài tập.
// GV xem từng bài, bật đáp án, xuất Word (bản HS / bản GV) cho một bài hoặc cả quyển, in / lưu PDF.
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookA, Eye, EyeOff, FileDown, Gamepad2, Loader2, NotebookPen, Presentation, Printer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { INPUT } from "@/components/lessons/fields";
import { NotebookView } from "@/components/notebook/notebook-view";
import { useTermBank } from "@/lib/lessons/hooks";
import { NOTE_CHAPTERS, NOTE_LESSONS, lessonByParam, vocabOf } from "@/lib/notebook";
import { downloadNotebook } from "@/lib/notebook/word";
import { downloadLessonPptx } from "@/lib/notebook/pptx";

export default function NotebookPage() {
  const { data: bank } = useTermBank();
  const approved = bank.filter((t) => t.status === "approved");
  const [lessonId, setLessonId] = useState(NOTE_LESSONS[0]?.id ?? "");
  const [answers, setAnswers] = useState(false);
  const [busy, setBusy] = useState<"one" | "all" | "pptx" | null>(null);
  // In cả quyển: dựng tất cả bài rồi mới mở hộp in
  const [printAll, setPrintAll] = useState(false);

  // Mở từ trang thuật ngữ: /teacher/notebook?bai=k8-15
  useEffect(() => {
    const l = lessonByParam(new URLSearchParams(window.location.search).get("bai"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l) setLessonId(l.id);
  }, []);

  useEffect(() => {
    if (!printAll) return;
    const done = () => setPrintAll(false);
    window.addEventListener("afterprint", done, { once: true });
    const t = setTimeout(() => window.print(), 300);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
    };
  }, [printAll]);

  async function exportWord(scope: "one" | "all") {
    setBusy(scope);
    try {
      await downloadNotebook(scope === "one" ? [lessonId] : NOTE_LESSONS.map((l) => l.id), { answers, vocab: (id) => vocabOf(id, approved) });
      toast.success(`Đã tạo file Word ${answers ? "bản giáo viên (có đáp án)" : "bản học sinh"}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được file Word.");
    } finally {
      setBusy(null);
    }
  }

  async function exportPptx() {
    setBusy("pptx");
    try {
      await downloadLessonPptx(lessonId, vocabOf(lessonId, approved));
      toast.success("Đã tạo bài giảng PowerPoint song ngữ (có ghi chú lời giảng + đáp án ở phần Notes).");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được file PowerPoint.");
    } finally {
      setBusy(null);
    }
  }

  const current = NOTE_LESSONS.find((l) => l.id === lessonId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="no-print flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
            <NotebookPen className="size-8 text-blue" /> Vở ghi bài học
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Vở ghi song ngữ Toán cho các bài trọng tâm lớp 6–9: mục tiêu, từ vựng của bài, lý thuyết, ghi nhớ, câu tiếng Anh cần nhớ và 4 dạng bài tập. Xuất Word để phát cho học sinh hoặc in thành quyển. Bấm <b>PowerPoint bài này</b> để có bài giảng song ngữ trình chiếu (trang đề → trang đáp án, lời giảng gợi ý trong phần Notes).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="teal" onClick={exportPptx} disabled={!!busy}>
            {busy === "pptx" ? <Loader2 className="animate-spin" /> : <Presentation />} PowerPoint bài này
          </Button>
          <Link href={`/teacher/play?bai=${current?.id ?? ""}`} className={buttonVariants({ variant: "sun" })}>
            <Gamepad2 /> Trò chơi ôn tập
          </Link>
          <Button variant={answers ? "teal" : "outline"} onClick={() => setAnswers((a) => !a)} aria-pressed={answers}>
            {answers ? <Eye /> : <EyeOff />} {answers ? "Đang hiện đáp án" : "Hiện đáp án"}
          </Button>
          <Button onClick={() => exportWord("one")} disabled={!!busy}>
            {busy === "one" ? <Loader2 className="animate-spin" /> : <FileDown />} Word bài này
          </Button>
          <Button variant="outline" onClick={() => exportWord("all")} disabled={!!busy}>
            {busy === "all" ? <Loader2 className="animate-spin" /> : <FileDown />} Word cả quyển
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> In bài này
          </Button>
          <Button variant="ghost" onClick={() => setPrintAll(true)}>
            <Printer /> In cả quyển
          </Button>
        </div>
      </div>
      <p className="no-print mt-2 text-xs text-ink-2">
        {answers ? "Xuất / in bản GIÁO VIÊN: kèm đáp án và gợi ý trả lời." : "Xuất / in bản HỌC SINH: có chỗ trống để làm bài. Bật “Hiện đáp án” để có bản giáo viên."} Từ vựng lấy từ Ngân hàng thuật ngữ (đã duyệt) theo từng bài.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Danh sách bài */}
        <nav className="no-print lg:sticky lg:top-6 lg:self-start" aria-label="Chọn bài">
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={`${INPUT} h-11 lg:hidden`} aria-label="Chọn bài">
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
          <div className="card-lsn hidden max-h-[calc(100dvh-8rem)] overflow-y-auto p-2 lg:block">
            {NOTE_CHAPTERS.map((c) => (
              <div key={c.id} className="mb-2">
                <p className="px-2 pt-2 pb-1 text-[11px] font-extrabold tracking-wider text-ink-2 uppercase">
                  Lớp {c.grade} · Chương {c.no}. {c.vi}
                </p>
                {c.lessons.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLessonId(l.id)}
                    aria-current={l.id === lessonId ? "page" : undefined}
                    className={cn("flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left text-sm", l.id === lessonId ? "bg-ink text-white" : "hover:bg-paper")}
                  >
                    <b className="w-12 shrink-0">Bài {l.no}</b>
                    <span className="leading-snug">{l.vi}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0">
          {current && (
            <div className="no-print mb-3 flex flex-wrap items-center gap-2 text-sm">
              <Link href="/teacher/terms" className="inline-flex items-center gap-1 font-semibold text-blue hover:underline">
                <BookA className="size-4" /> Sửa / thêm từ vựng của bài trong Ngân hàng thuật ngữ
              </Link>
            </div>
          )}
          {printAll ? (
            NOTE_LESSONS.map((l, i) => (
              <div key={l.id} className={cn(i > 0 && "print-break mt-6")}>
                <NotebookView lessonId={l.id} vocab={vocabOf(l.id, approved)} answers={answers} />
              </div>
            ))
          ) : (
            <NotebookView key={lessonId} lessonId={lessonId} vocab={vocabOf(lessonId, approved)} answers={answers} />
          )}
        </div>
      </div>
    </div>
  );
}
