"use client";

// Thêm học sinh: gõ mỗi dòng một em hoặc dán thẳng từ Excel (cột STT, Họ tên, Tổ)
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/common";
import { api, errorMessage } from "@/lib/api-client";
import { parseStudentPaste } from "@/lib/class-utils";
import { saveSlips } from "@/lib/slips";
import type { ClassDoc, PinSlip } from "@/lib/types";

const EXAMPLE = `Nguyễn Văn An\t1
Trần Thị Bình\t2
Lê Minh Châu`;

export function AddStudentsDialog({ cls, open, onOpenChange }: { cls: ClassDoc; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const teams = cls.settings?.teams ?? 4;
  const parsed = useMemo(() => parseStudentPaste(text, teams), [text, teams]);

  async function submit() {
    setBusy(true);
    try {
      const { slips } = await api<{ slips: PinSlip[] }>(`/api/classes/${cls.id}/students`, { body: { text } });
      saveSlips(cls.id, slips);
      toast.success(`Đã thêm ${slips.length} học sinh. Hãy in phiếu PIN ngay nhé!`);
      setText("");
      onOpenChange(false);
      router.push(`/teacher/classes/${cls.id}/print`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function pasteClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      setText((old) => (old ? old + "\n" : "") + t);
    } catch {
      toast.info("Hãy bấm vào ô và nhấn Ctrl + V để dán.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Thêm học sinh vào lớp {cls.name}</DialogTitle>
          <DialogDescription>
            Mỗi dòng một em. Có thể dán từ Excel: cột Họ tên và (tuỳ chọn) cột Tổ. Em nào chưa có tổ sẽ được chia đều.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Danh sách</span>
              <Button type="button" variant="ghost" size="sm" onClick={pasteClipboard}>
                <ClipboardPaste /> Dán từ Excel
              </Button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE}
              rows={12}
              className="min-h-64 w-full flex-1 resize-y rounded-2xl border-2 border-line-2 bg-white p-3.5 font-mono text-sm leading-relaxed outline-none focus:border-blue"
            />
            <p className="text-xs text-ink-2">Chỉ lưu họ tên và tổ — không email, không số điện thoại.</p>
          </div>

          <div className="flex flex-col rounded-2xl bg-paper p-3">
            <p className="px-1 pb-2 text-sm font-bold">
              Xem trước <span className="text-ink-2">· {parsed.length} em</span>
            </p>
            <ul className="max-h-72 flex-1 space-y-1.5 overflow-y-auto">
              {parsed.map((s, i) => (
                <li key={i} className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-1.5 text-sm">
                  <Avatar name={s.fullName} team={s.team ?? undefined} className="size-8 text-xs" />
                  <span className="flex-1 font-semibold">{s.fullName}</span>
                  <span className="text-xs text-ink-2">{s.team ? `Tổ ${s.team}` : "Tự chia"}</span>
                </li>
              ))}
              {parsed.length === 0 && <li className="px-2 py-10 text-center text-sm text-ink-2">Danh sách sẽ hiện ở đây.</li>}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button size="lg" onClick={submit} disabled={busy || parsed.length === 0}>
            {busy ? <Loader2 className="animate-spin" /> : <UserPlus />} Thêm {parsed.length || ""} em & tạo PIN
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
