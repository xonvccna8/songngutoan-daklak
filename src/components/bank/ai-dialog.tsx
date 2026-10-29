"use client";

// Bài tập AI: chọn bài SGK → AI đề xuất câu hỏi song ngữ theo YCCĐ → vào ngân hàng dạng "Nháp AI"
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldLabel, SELECT, TextField } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";
import { chaptersOf, curLesson, GRADES } from "@/lib/curriculum";
import { AI_BANK } from "@/lib/bank/ai";

export function AiBankDialog({ open, onOpenChange, preset }: { open: boolean; onOpenChange: (v: boolean) => void; preset: { grade: number; curLessonId: string | null } }) {
  const [grade, setGrade] = useState(preset.grade);
  const [lessonId, setLessonId] = useState(preset.curLessonId ?? "");
  const [count, setCount] = useState(6);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number; enabled: boolean } | null>(null);
  const l = curLesson(lessonId);

  useEffect(() => {
    if (open) api<{ used: number; limit: number; enabled: boolean }>("/api/ai/draft").then(setUsage, () => setUsage(null));
  }, [open]);

  async function run() {
    setBusy(true);
    try {
      const r = await api<{ created: number }>("/api/questions/ai", { body: { curLessonId: lessonId, count, note } });
      toast.success(`AI đã đề xuất ${r.created} câu (Nháp AI). Hãy kiểm tra từng câu rồi bấm Lưu.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Sparkles className="size-5 text-coral" /> Tạo bài tập bằng AI
          </DialogTitle>
          <DialogDescription>AI ra câu hỏi song ngữ bám yêu cầu cần đạt của bài, trộn mức Biết / Hiểu / Vận dụng. Câu luôn ở dạng Nháp: thầy cô kiểm tra, sửa rồi mới giao.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
            <label>
              <FieldLabel>Khối</FieldLabel>
              <select
                value={grade}
                onChange={(e) => {
                  setGrade(Number(e.target.value));
                  setLessonId("");
                }}
                className={SELECT}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Bài trong SGK</FieldLabel>
              <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={SELECT}>
                <option value="">— Chọn bài —</option>
                {chaptersOf(grade).map((c) => (
                  <optgroup key={c.id} label={`Chương ${c.no}. ${c.vi}`}>
                    {c.lessons.map((x) => (
                      <option key={x.id} value={x.id}>
                        Bài {x.no}. {x.vi}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
          {l && <p className="text-xs text-ink-2">{l.outcomes.length ? `AI sẽ bám ${l.outcomes.length} yêu cầu cần đạt của bài này.` : "Bài chưa có YCCĐ — AI bám theo tên bài."}</p>}
          <label className="block">
            <FieldLabel>Số câu: {count}</FieldLabel>
            <input type="range" min={AI_BANK.min} max={AI_BANK.max} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-blue" />
          </label>
          <TextField label="Ghi chú cho AI (không bắt buộc)" area rows={3} value={note} onChange={setNote} maxLength={AI_BANK.maxNote} placeholder="VD: tập trung dạng tính cạnh huyền; thêm 1 bài toán thực tế về chiếc thang dựa tường." />
          {usage && (
            <p className="text-xs text-ink-2">
              {usage.enabled ? `Hôm nay đã dùng ${usage.used}/${usage.limit} lượt AI (dùng chung với Soạn bằng AI).` : "Chưa cấu hình AI (thiếu OPENAI_API_KEY trên máy chủ)."}
            </p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Huỷ
          </Button>
          <Button variant="coral" onClick={run} disabled={busy || !l || usage?.enabled === false}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "AI đang soạn… (≈ 20–60 giây)" : `Tạo ${count} câu`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
