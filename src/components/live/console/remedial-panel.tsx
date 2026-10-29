"use client";

// Đợt D — Báo cáo tiết: tự tạo bài về nhà từ câu sai (xem trước → chọn cả lớp / từng em → hạn nộp → giao).
// Xem trước tính trên laptop; máy chủ tính lại khi giao.
import { useState } from "react";
import { BookOpenCheck, Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/messages/compose-dialog";
import { defaultDue } from "@/components/teacher/assign-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { isHomeworkSlide } from "@/lib/study/hw";
import { classRemedial, eachRemedial } from "@/lib/study/remedial";
import type { LessonData } from "@/lib/live/hooks";
import type { ParticipantDoc, ResponseDoc, SessionDoc } from "@/lib/live/types";

export function RemedialPanel({ session, lesson, responses, participants, name }: { session: SessionDoc; lesson: LessonData; responses: ResponseDoc[]; participants: ParticipantDoc[]; name: (uid: string) => string }) {
  const [mode, setMode] = useState<"class" | "each">("each");
  const [due, setDue] = useState(defaultDue);
  const [busy, setBusy] = useState(false);
  const qIds = lesson.slides.filter((s) => s.question && isHomeworkSlide(s)).map((s) => s.id);
  const joined = participants.map((p) => p.uid);
  const title = (id: string) => {
    const s = lesson.slides.find((x) => x.id === id);
    return s?.question?.prompt.vi || s?.title.vi || id;
  };
  const cls = classRemedial(responses, joined, qIds);
  const each = eachRemedial(responses, joined, qIds);
  const dueMs = new Date(`${due.date}T${due.time}`).getTime();
  const done = !!session.remedialIds?.length;
  const empty = mode === "class" ? !cls.length : !each.length;

  async function submit() {
    setBusy(true);
    try {
      const r = await api<{ assignments: number; recipients: number }>(`/api/live/sessions/${session.id}/remedial`, { body: { mode, dueAt: dueMs } });
      toast.success(`Đã giao ${r.assignments} bài cho ${r.recipients} em. Học sinh nhận thông báo trong hộp tin.`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-lsn p-4 lg:col-span-2">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink-2 uppercase">
        <BookOpenCheck className="size-4" /> Giao bài về nhà từ câu sai
      </h3>
      {done ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-success-fg">
          <Check className="size-4" /> Đã giao {session.remedialIds!.length} bài từ câu sai của tiết này. Xem ở trang lớp → Bài về nhà.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={mode === "each"} onClick={() => setMode("each")}>
              Riêng từng em ({each.reduce((n, g) => n + g.uids.length, 0)} em)
            </Chip>
            <Chip on={mode === "class"} onClick={() => setMode("class")}>
              Cả lớp ({cls.length} câu sai từ 40%)
            </Chip>
          </div>
          <div className="mt-3 max-h-56 overflow-y-auto rounded-xl bg-paper p-3 text-sm">
            {empty ? (
              <p className="text-ink-2">{mode === "class" ? "Không có câu nào lớp sai từ 40% trở lên." : "Em nào vào tiết cũng đã đúng hết."}</p>
            ) : mode === "class" ? (
              <ul className="space-y-1">
                {cls.map((x) => (
                  <li key={x.slideId}>
                    <b>{title(x.slideId)}</b> · sai hoặc bỏ trống {Math.round(x.wrongPct * 100)}%
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-1.5">
                {each.map((g) => (
                  <li key={g.slideIds.join("|")}>
                    <b>{g.slideIds.length} câu</b>: {g.slideIds.map(title).join(" · ")}
                    <span className="block text-xs text-ink-2">{g.uids.map(name).join(", ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-ink-2">Hạn nộp — ngày</span>
              <input type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} className="mt-1 h-10 rounded-xl border-2 border-line-2 bg-white px-3 outline-none focus:border-blue" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-2">Giờ</span>
              <input type="time" value={due.time} onChange={(e) => setDue({ ...due, time: e.target.value })} className="mt-1 h-10 rounded-xl border-2 border-line-2 bg-white px-3 outline-none focus:border-blue" />
            </label>
            <Button onClick={submit} disabled={busy || empty || !Number.isFinite(dueMs)}>
              {busy ? <Loader2 className="animate-spin" /> : <Send />} Giao bài
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-2">Chỉ tính câu hỏi đã mở trong tiết; em bỏ trống tính như chưa làm được. Bài có gợi ý 3 tầng như bài về nhà thường. Mỗi tiết giao một lần.</p>
        </>
      )}
    </section>
  );
}
