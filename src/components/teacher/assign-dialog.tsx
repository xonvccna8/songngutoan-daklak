"use client";

// GV giao bài tập về nhà: chọn tiết → chọn câu → hạn nộp → người nhận (cả lớp / tổ / từng em)
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Check, Loader2, Mic, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, teamColor } from "@/components/common";
import { Chip } from "@/components/messages/compose-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { isMathLesson } from "@/lib/subject";
import { useLesson } from "@/lib/live/hooks";
import { isHomeworkSlide } from "@/lib/study/hw";
import type { LessonDoc } from "@/lib/live/types";
import type { ClassDoc, StudentDoc } from "@/lib/types";

type Target = { mode: "all" } | { mode: "team"; team: number } | { mode: "pick"; uids: string[] };

const pad = (n: number) => String(n).padStart(2, "0");
/** Mặc định: 2 ngày nữa, 20:00 (giờ máy GV) */
export function defaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: "20:00" };
}

const TYPE_LABEL: Record<string, string> = { mcq: "Trắc nghiệm", number: "Nhập số", text: "Gõ chữ", speak: "Luyện nói" };

export function AssignDialog({ cls, students, open, onOpenChange }: { cls: ClassDoc; students: StudentDoc[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [lessons, setLessons] = useState<LessonDoc[] | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const { data: lesson } = useLesson(lessonId ?? undefined, false);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [due, setDue] = useState(defaultDue);
  const [title, setTitle] = useState({ vi: "", en: "" });
  const [target, setTarget] = useState<Target>({ mode: "all" });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const teams = cls.settings?.teams ?? 4;

  useEffect(() => {
    if (!open || lessons) return;
    getDocs(query(collection(db(), COL.lessons), where("status", "==", "approved")))
      .then((s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...d.data() }) as LessonDoc).filter((l) => isMathLesson(l)).sort((a, b) => a.grade - b.grade);
        setLessons(list);
        setLessonId((p) => p ?? list.find((l) => l.grade === cls.grade)?.id ?? list[0]?.id ?? null);
      })
      .catch(() => setLessons([]));
  }, [open, lessons, cls.grade]);

  const items = useMemo(() => (lesson && lesson.lesson.id === lessonId ? lesson.slides.filter(isHomeworkSlide) : []), [lesson, lessonId]);
  const chosen = items.filter((s) => !off.has(s.id));
  const picked = target.mode === "pick" ? target.uids : [];
  const count = target.mode === "all" ? students.length : target.mode === "team" ? students.filter((s) => s.team === target.team).length : picked.length;
  const shown = students.filter((s) => !q.trim() || s.fullName.toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));
  const dueMs = new Date(`${due.date}T${due.time}`).getTime();

  async function submit() {
    setBusy(true);
    try {
      const to = target.mode === "all" ? { all: true } : target.mode === "team" ? { team: target.team } : { uids: picked };
      const r = await api<{ recipients: number; items: number }>("/api/assignments", {
        body: { classId: cls.id, lessonId, slideIds: chosen.map((s) => s.id), title, dueAt: dueMs, to },
      });
      toast.success(`Đã giao ${r.items} câu cho ${r.recipients} em. Học sinh nhận thông báo trong hộp tin.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Giao bài về nhà · lớp {cls.name}</DialogTitle>
          <DialogDescription>Máy tự chấm, có gợi ý 3 tầng (từ vựng → cách làm → lời giải). Hệ thống tự nhắc các em chưa nộp trước hạn 1 ngày.</DialogDescription>
        </DialogHeader>

        {/* Tiết */}
        <div className="space-y-2">
          <p className="text-sm font-bold">1 · Chọn tiết</p>
          {lessons === null ? (
            <p className="flex items-center gap-2 text-sm text-ink-2">
              <Loader2 className="size-4 animate-spin" /> Đang tải…
            </p>
          ) : lessons.length === 0 ? (
            <p className="rounded-2xl bg-paper p-3 text-sm text-ink-2">Chưa có tiết học nào. Chạy “npm run seed:lesson” để nạp tiết mẫu.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {lessons.map((l) => (
                <Chip
                  key={l.id}
                  on={l.id === lessonId}
                  onClick={() => {
                    setLessonId(l.id);
                    setOff(new Set());
                  }}
                >
                  {l.title.vi} · K{l.grade}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Câu */}
        <div className="space-y-2">
          <p className="text-sm font-bold">
            2 · Chọn câu · {chosen.length}/{items.length}
          </p>
          {lessonId && !items.length ? (
            <p className="flex items-center gap-2 text-sm text-ink-2">
              <Loader2 className="size-4 animate-spin" /> Đang tải câu hỏi…
            </p>
          ) : (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {items.map((s, i) => {
                const on = !off.has(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setOff((o) => (o.has(s.id) ? new Set([...o].filter((x) => x !== s.id)) : new Set([...o, s.id])))}
                      className={cn("flex w-full items-start gap-2 rounded-xl border-2 p-2.5 text-left text-sm", on ? "border-blue bg-blue-soft" : "border-line bg-white")}
                    >
                      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2", on ? "border-blue bg-blue text-white" : "border-line-2")}>{on && <Check className="size-3" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="text-en block truncate font-semibold">
                          {i + 1}. {s.question?.prompt.en ?? s.speak?.target}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-ink-2">
                          {s.speak && <Mic className="size-3" />}
                          {TYPE_LABEL[s.speak ? "speak" : (s.question?.type ?? "")]} · {s.question?.skill ?? "Ngôn ngữ"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Tên + hạn */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Tên bài (tiếng Việt)</span>
            <input value={title.vi} onChange={(e) => setTitle({ ...title, vi: e.target.value })} placeholder={lesson?.lesson.title.vi ?? ""} maxLength={120} className="mt-1 h-11 w-full rounded-xl border-2 border-line-2 bg-white px-3 italic outline-none focus:border-blue" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Tên bài (tiếng Anh)</span>
            <input value={title.en} onChange={(e) => setTitle({ ...title, en: e.target.value })} placeholder={lesson?.lesson.title.en ?? ""} maxLength={120} className="text-en mt-1 h-11 w-full rounded-xl border-2 border-line-2 bg-white px-3 font-semibold outline-none focus:border-blue" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">3 · Hạn nộp — ngày</span>
            <input type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} className="mt-1 h-11 w-full rounded-xl border-2 border-line-2 bg-white px-3 outline-none focus:border-blue" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Giờ</span>
            <input type="time" value={due.time} onChange={(e) => setDue({ ...due, time: e.target.value })} className="mt-1 h-11 w-full rounded-xl border-2 border-line-2 bg-white px-3 outline-none focus:border-blue" />
          </label>
        </div>

        {/* Người nhận */}
        <div className="space-y-2">
          <p className="text-sm font-bold">4 · Giao cho · {count} em</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={target.mode === "all"} onClick={() => setTarget({ mode: "all" })}>
              Cả lớp
            </Chip>
            {Array.from({ length: teams }, (_, i) => i + 1).map((t) => (
              <Chip key={t} on={target.mode === "team" && target.team === t} onClick={() => setTarget({ mode: "team", team: t })} dot={teamColor(t)}>
                Tổ {t}
              </Chip>
            ))}
            <Chip on={target.mode === "pick"} onClick={() => setTarget({ mode: "pick", uids: picked })}>
              Chọn từng em
            </Chip>
          </div>
          {target.mode === "pick" && (
            <div className="rounded-2xl border-2 border-line p-2">
              <div className="relative mb-2">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên…" className="h-10 w-full rounded-xl bg-paper pr-3 pl-9 text-sm outline-none" />
              </div>
              <ul className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
                {shown.map((s) => {
                  const on = picked.includes(s.uid);
                  return (
                    <li key={s.uid}>
                      <button
                        type="button"
                        onClick={() => setTarget({ mode: "pick", uids: on ? picked.filter((u) => u !== s.uid) : [...picked, s.uid] })}
                        className={cn("flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm", on ? "bg-blue-soft" : "hover:bg-paper")}
                      >
                        <span className={cn("grid size-5 place-items-center rounded-md border-2", on ? "border-blue bg-blue text-white" : "border-line-2")}>{on && <Check className="size-3" />}</span>
                        <Avatar name={s.fullName} team={s.team} className="size-7 text-[10px]" />
                        <span className="truncate font-semibold">{s.fullName}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button size="lg" onClick={submit} disabled={busy || !lessonId || !chosen.length || !count || !Number.isFinite(dueMs)}>
            {busy ? <Loader2 className="animate-spin" /> : <Send />} Giao {chosen.length} câu cho {count} em
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
