"use client";

// Chọn tiết học để bắt đầu dạy (hoặc tiếp tục tiết đang dạy dở của lớp)
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { BookOpen, Loader2, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errorMessage } from "@/lib/api-client";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { isMathLesson } from "@/lib/subject";
import { useLiveSessionForClass } from "@/lib/live/hooks";
import type { LessonDoc } from "@/lib/live/types";
import type { ClassDoc } from "@/lib/types";

export function StartLessonDialog({ cls, open, onOpenChange }: { cls: ClassDoc; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const live = useLiveSessionForClass(open ? cls.id : undefined);
  const [lessons, setLessons] = useState<LessonDoc[] | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || lessons) return;
    getDocs(query(collection(db(), COL.lessons), where("status", "==", "approved")))
      .then((s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...d.data() }) as LessonDoc).filter((l) => isMathLesson(l)).sort((a, b) => a.grade - b.grade);
        setLessons(list);
        setPick((p) => p ?? list.find((l) => l.grade === cls.grade)?.id ?? list[0]?.id ?? null);
      })
      .catch(() => setLessons([]));
  }, [open, lessons, cls.grade]);

  async function start() {
    if (!pick) return;
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>("/api/live/sessions", { body: { classId: cls.id, lessonId: pick } });
      router.push(`/teacher/session/${id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Bắt đầu tiết học · Lớp {cls.name}</DialogTitle>
          <DialogDescription>Học sinh mở web trên điện thoại sẽ tự vào tiết. Tivi: bấm “Mở màn hình tivi” ở trang điều khiển.</DialogDescription>
        </DialogHeader>

        {live.data && (
          <button
            onClick={() => router.push(`/teacher/session/${live.data!.id}`)}
            className="flex items-center gap-3 rounded-2xl border-2 border-coral/50 bg-coral-soft p-3 text-left transition-colors hover:border-coral"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-coral text-white">
              <RotateCcw className="size-5" />
            </span>
            <span className="flex-1">
              <b className="block">Tiếp tục tiết đang dạy</b>
              <span className="text-sm text-ink-2">
                {live.data.lessonTitle?.vi} · trang {live.data.state.slideIndex + 1}
              </span>
            </span>
          </button>
        )}

        <div className="space-y-2">
          <p className="text-sm font-bold">{live.data ? "Hoặc bắt đầu tiết mới" : "Chọn tiết học"}</p>
          {lessons === null ? (
            <div className="flex items-center gap-2 py-6 text-sm text-ink-2">
              <Loader2 className="size-4 animate-spin" /> Đang tải danh sách tiết…
            </div>
          ) : lessons.length === 0 ? (
            <p className="rounded-2xl bg-paper p-4 text-sm text-ink-2">Chưa có tiết nào được duyệt. Vào mục “Bài giảng” để soạn bài và gửi duyệt.</p>
          ) : (
            <div className="-mx-1 max-h-[45dvh] space-y-2 overflow-y-auto px-1 py-1">
            {lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => setPick(l.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all",
                  pick === l.id ? "border-blue bg-blue-soft shadow-[0_3px_0_var(--color-blue)]" : "border-line bg-white hover:border-blue/40"
                )}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-teal text-white">
                  <BookOpen className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{l.title.vi}</b>
                  <span className="block truncate text-sm text-en">{l.title.en}</span>
                  <span className="text-xs text-ink-2">
                    {l.subtitle} · {l.slideIds.length} trang
                  </span>
                </span>
              </button>
            ))}
            </div>
          )}
        </div>

        <Button size="lg" onClick={start} disabled={!pick || busy} className="w-full">
          {busy ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />} Bắt đầu tiết mới
        </Button>
      </DialogContent>
    </Dialog>
  );
}
