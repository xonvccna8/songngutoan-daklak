"use client";

// Xoá lớp từ thẻ lớp ở Trang chủ GV — không hoàn tác được nên phải gõ đúng tên lớp để xác nhận
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { INPUT } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";
import type { ClassDoc } from "@/lib/types";

export function DeleteClassDialog({ cls, open, onOpenChange, live }: { cls: ClassDoc; open: boolean; onOpenChange: (v: boolean) => void; live: boolean }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const match = typed.trim() === cls.name.trim();

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/classes/${cls.id}`, { method: "DELETE" });
      toast.success(`Đã xoá lớp ${cls.name}.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="rounded-3xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-extrabold text-coral-dk">
            <Trash2 className="size-5" /> Xoá lớp {cls.name}?
          </DialogTitle>
          <DialogDescription>Việc này KHÔNG hoàn tác được.</DialogDescription>
        </DialogHeader>
        {live ? (
          <p className="rounded-2xl bg-sun-soft p-3 text-sm text-[#8A5A00]">Lớp đang có tiết học diễn ra. Hãy kết thúc tiết học trước rồi mới xoá lớp.</p>
        ) : (
          <>
            <div className="rounded-2xl bg-coral-soft/60 p-3 text-sm">
              Sẽ xoá vĩnh viễn: <b>{cls.studentCount ?? 0} học sinh</b> và mã PIN, các tiết đã dạy, bảng điểm, bài tập, tin nhắn, XP, dự án STEM, bài đăng Cộng đồng, nhật kí Trợ lý AI của lớp.
              <span className="mt-1 block text-ink-2">Bài giảng, ngân hàng câu hỏi, học liệu, thuật ngữ vẫn giữ nguyên.</span>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm">
                Gõ <b>{cls.name}</b> để xác nhận:
              </span>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={cls.name} className={INPUT} autoFocus />
            </label>
          </>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Huỷ
          </Button>
          {!live && (
            <Button variant="coral" onClick={remove} disabled={!match || busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />} Xoá vĩnh viễn
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
