"use client";

// GĐ 6b — Hộp "Soạn bằng AI": dán giáo án tiếng Việt → AI đề xuất tiết song ngữ (Nháp) → mở trình soạn
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldLabel, INPUT, SELECT } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";

/** Lượt AI dùng thử (máy chủ: src/lib/server/ai-gate.ts) — remaining null = đã mở khoá */
type AiFree = { used: number; limit: number; unlocked: boolean; remaining: number | null };
import { AI_LIMITS } from "@/lib/lessons/ai-draft";
import { DEFAULT_GRADE, GRADES } from "@/lib/curriculum";

export function AiDraftDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [plan, setPlan] = useState("");
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState(DEFAULT_GRADE);
  const [usage, setUsage] = useState<{ used: number; limit: number; enabled: boolean; free?: AiFree } | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!open) return;
    api<{ used: number; limit: number; enabled: boolean; free?: AiFree }>("/api/ai/draft").then(setUsage, () => setUsage(null));
  }, [open]);

  // Đồng hồ đếm giây trong lúc chờ AI
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const len = plan.trim().length;
  const left = usage ? usage.limit - usage.used : null;
  const busy = startedAt != null;

  async function run() {
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    try {
      const r = await api<{ id: string; slides: number }>("/api/ai/draft", { body: { plan, grade, title } });
      toast.success(`AI đã đề xuất ${r.slides} trang. Thầy cô kiểm tra kĩ trước khi gửi duyệt nhé.`);
      router.push(`/teacher/lessons/${r.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setStartedAt(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl font-extrabold">
            <Sparkles className="size-6 text-sun-dk" /> Soạn bằng AI
          </DialogTitle>
          <DialogDescription>
            Dán giáo án tiếng Việt của thầy cô. Trợ lý AI đề xuất các trang song ngữ theo 4 hoạt động (CV 5512), câu hỏi, thuật ngữ và mục tiêu 4C. Bài tạo ra luôn ở trạng thái <b>Nháp</b>: thầy cô kiểm tra kĩ nội dung, đáp án, phiên âm rồi mới gửi duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <label>
            <FieldLabel hint="không bắt buộc">Tên bài</FieldLabel>
            <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} maxLength={200} placeholder="VD: Bài 35. Định lí Pythagore và ứng dụng" className={INPUT} />
          </label>
          <label>
            <FieldLabel>Khối</FieldLabel>
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} disabled={busy} className={SELECT}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <FieldLabel hint={`${len.toLocaleString("vi-VN")}/${AI_LIMITS.maxPlanChars.toLocaleString("vi-VN")} kí tự`}>Giáo án (tiếng Việt)</FieldLabel>
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            disabled={busy}
            rows={12}
            maxLength={AI_LIMITS.maxPlanChars}
            placeholder={"I. Mục tiêu…\nII. Thiết bị…\nIII. Tiến trình dạy học\nHoạt động 1: Mở đầu…\nHoạt động 2: Hình thành kiến thức…"}
            className={`${INPUT} resize-y`}
          />
        </label>
        <p className="text-xs text-ink-2">Chỉ dán nội dung bài học — không dán tên hay thông tin học sinh.</p>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-2">
            {usage && !usage.enabled
              ? "Trợ lý AI chưa được cấu hình trên máy chủ."
              : usage?.free && usage.free.remaining != null
                ? `Còn ${usage.free.remaining}/${usage.free.limit} lượt AI dùng thử.`
                : left != null
                  ? `Hôm nay còn ${left}/${usage!.limit} lượt.`
                  : "Mỗi giáo viên có " + AI_LIMITS.perTeacherPerDay + " lượt/ngày."}
          </p>
          <Button variant="sun" size="lg" onClick={run} disabled={busy || len < AI_LIMITS.minPlanChars || left === 0 || usage?.enabled === false}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> AI đang soạn… {Math.round((now - startedAt!) / 1000)} giây
              </>
            ) : (
              <>
                <Sparkles /> Để AI soạn
              </>
            )}
          </Button>
        </div>
        {busy && <p className="text-center text-xs text-ink-2">Thường mất 30–90 giây. Đừng đóng trang nhé.</p>}
      </DialogContent>
    </Dialog>
  );
}
