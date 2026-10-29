"use client";

// Giao các câu đã chọn trong ngân hàng thành bài về nhà: chọn lớp → tên bài → hạn nộp → người nhận
import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, teamColor } from "@/components/common";
import { Chip } from "@/components/messages/compose-dialog";
import { defaultDue } from "@/components/teacher/assign-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { useMyClasses, useStudents } from "@/lib/hooks/use-firestore";

type Target = { mode: "all" } | { mode: "team"; team: number } | { mode: "pick"; uids: string[] };
const IN = "mt-1 h-11 w-full rounded-xl border-2 border-line-2 bg-white px-3 outline-none focus:border-blue";

export function BankAssignDialog({ ids, open, onOpenChange, onDone }: { ids: string[]; open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void }) {
  const { data: classes } = useMyClasses();
  const [classId, setClassId] = useState<string | null>(null);
  const cls = classes.find((c) => c.id === classId) ?? classes[0];
  const { data: students } = useStudents(cls?.id);
  const [due, setDue] = useState(defaultDue);
  const [title, setTitle] = useState({ vi: "", en: "" });
  const [target, setTarget] = useState<Target>({ mode: "all" });
  const [busy, setBusy] = useState(false);
  const teams = cls?.settings?.teams ?? 4;
  const picked = target.mode === "pick" ? target.uids : [];
  const count = target.mode === "all" ? students.length : target.mode === "team" ? students.filter((s) => s.team === target.team).length : picked.length;
  const dueMs = new Date(`${due.date}T${due.time}`).getTime();

  async function submit() {
    if (!cls) return;
    setBusy(true);
    try {
      const to = target.mode === "all" ? { all: true } : target.mode === "team" ? { team: target.team } : { uids: picked };
      const r = await api<{ recipients: number; items: number }>("/api/questions/assign", { body: { classId: cls.id, questionIds: ids, title, dueAt: dueMs, to } });
      toast.success(`Đã giao ${r.items} câu cho ${r.recipients} em. Máy tự chấm và gợi ý 3 tầng.`);
      onDone();
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
          <DialogTitle className="font-display text-2xl font-extrabold">Giao {ids.length} câu làm bài về nhà</DialogTitle>
          <DialogDescription>Học sinh làm trên điện thoại, máy chấm ngay, có gợi ý 3 tầng (từ vựng → cách làm → lời giải) và tự nhắc trước hạn 1 ngày.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-bold">1 · Lớp</p>
          {classes.length === 0 ? (
            <p className="rounded-2xl bg-paper p-3 text-sm text-ink-2">Thầy cô chưa có lớp nào.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {classes.map((c) => (
                <Chip
                  key={c.id}
                  on={c.id === cls?.id}
                  onClick={() => {
                    setClassId(c.id);
                    setTarget({ mode: "all" });
                  }}
                >
                  Lớp {c.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">2 · Tên bài (tiếng Việt)</span>
            <input value={title.vi} onChange={(e) => setTitle({ ...title, vi: e.target.value })} placeholder="Ôn tập Bài 18" maxLength={120} className={cn(IN, "italic")} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Tên bài (tiếng Anh)</span>
            <input value={title.en} onChange={(e) => setTitle({ ...title, en: e.target.value })} placeholder="Lesson 18 review" maxLength={120} className={cn(IN, "text-en font-semibold")} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">3 · Hạn nộp — ngày</span>
            <input type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} className={IN} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Giờ</span>
            <input type="time" value={due.time} onChange={(e) => setDue({ ...due, time: e.target.value })} className={IN} />
          </label>
        </div>

        {cls && (
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
              <ul className="grid max-h-48 gap-1 overflow-y-auto rounded-2xl border-2 border-line p-2 sm:grid-cols-2">
                {students.map((s) => {
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
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button size="lg" onClick={submit} disabled={busy || !cls || !ids.length || !count || !Number.isFinite(dueMs)}>
            {busy ? <Loader2 className="animate-spin" /> : <Send />} Giao {ids.length} câu cho {count} em
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
