"use client";

// GV: danh sách dự án STEM của các lớp mình dạy + tạo dự án mới (từ mẫu Toán 6–9)
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { ProjectDialog } from "@/components/stem/project-dialog";
import { TemplateLibrary } from "@/components/stem/template-library";
import type { StemTemplate } from "@/lib/stem/projects";
import { useMyClasses } from "@/lib/hooks/use-firestore";
import { useProjects } from "@/lib/stem/hooks";
import { fmtDue } from "@/lib/format";
import { curLesson } from "@/lib/curriculum";

export default function StemListPage() {
  const router = useRouter();
  const { data: classes } = useMyClasses();
  const { data: projects, loading } = useProjects(classes.map((c) => c.id));
  // false = đóng · null = tạo mới (tự soạn / chọn mẫu trong hộp) · StemTemplate = dùng mẫu từ thư viện
  const [creating, setCreating] = useState<StemTemplate | null | false>(false);
  const name = (id: string) => classes.find((c) => c.id === id)?.name ?? "?";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
            <Lightbulb className="size-8 text-sun-dk" /> Dự án STEM
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Có sẵn 16 dự án mẫu cho Toán 6–9 (đo đạc, thiết kế, khảo sát, xác suất). Mỗi tổ làm một sản phẩm theo 6 bước thiết kế kĩ thuật, ghi nhật kí song ngữ trên điện thoại, nộp link ảnh/video sản phẩm. Thầy cô chấm theo rubric 4 tiêu chí, cả tổ nhận XP.
          </p>
        </div>
        <Button size="lg" onClick={() => setCreating(null)} disabled={!classes.length}>
          <Plus /> Tạo dự án
        </Button>
      </div>

      <div className="mt-6">
        {loading ? null : projects.length === 0 ? (
          <EmptyState title="Lớp chưa có dự án nào">Chọn một dự án trong “Thư viện dự án mẫu” ngay bên dưới rồi bấm “Dùng mẫu này”, hoặc bấm “Tạo dự án” để tự soạn.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/teacher/stem/${p.id}`} className="card-lsn hover-glow flex items-center gap-3 p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sun-soft text-[#8A5A00]">
                    <Lightbulb className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{p.title.vi}</b>
                    <span className="text-en block truncate text-sm">{p.title.en}</span>
                    <span className="text-xs text-ink-2">
                      Lớp {name(p.classId)}
                      {curLesson(p.curLessonId) && ` · Bài ${curLesson(p.curLessonId)!.no}`} · {p.teams} tổ · hạn {fmtDue(p.dueAt)} · {p.status === "open" ? "Đang mở" : "Đã đóng"}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-ink-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <TemplateLibrary defaultGrade={8} canUse={classes.length > 0} onUse={(t) => setCreating(t)} />

      {creating !== false && (
        <ProjectDialog
          key={creating?.id ?? "new"}
          open
          onOpenChange={(o) => !o && setCreating(false)}
          classes={classes}
          preset={creating ?? undefined}
          onCreated={(id) => router.push(`/teacher/stem/${id}`)}
        />
      )}
    </div>
  );
}
