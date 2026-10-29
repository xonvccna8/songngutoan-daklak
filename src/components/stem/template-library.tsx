"use client";

// Thư viện dự án STEM mẫu (Toán 6–9): chọn khối, xem theo bài SGK, mở xem chi tiết, bấm “Dùng mẫu này” để tạo cho lớp
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SayButtons } from "@/components/library/say";
import { DEFAULT_GRADE, GRADES, chaptersOf, curLesson, isGrade } from "@/lib/curriculum";
import { cn } from "cn";
import { STEM_TEMPLATES, type StemTemplate } from "@/lib/stem/projects";

export function TemplateLibrary({ defaultGrade, canUse, onUse }: { defaultGrade: number; canUse: boolean; onUse: (t: StemTemplate) => void }) {
  // Mặc định khối của lớp đầu tiên; GV chuyển khối để xem mẫu khác
  const [grade, setGrade] = useState<number>(isGrade(defaultGrade) ? defaultGrade : DEFAULT_GRADE);
  const [open, setOpen] = useState<string | null>(null);
  const list = STEM_TEMPLATES.filter((t) => t.grade === grade);
  const lessons = chaptersOf(grade).flatMap((c) => c.lessons.map((l) => ({ l, chapter: c })));
  const groups = lessons.map(({ l, chapter }) => ({ l, chapter, items: list.filter((t) => t.curLessonId === l.id) })).filter((g) => g.items.length);
  const other = list.filter((t) => !curLesson(t.curLessonId));

  const card = (t: StemTemplate) => {
    const isOpen = open === t.id;
    return (
      <li key={t.id} className="card-lsn overflow-hidden">
        <button type="button" onClick={() => setOpen(isOpen ? null : t.id)} className="flex w-full items-start gap-3 p-4 text-left hover:bg-paper/60">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sun-soft text-[#8A5A00]">
            <Lightbulb className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block leading-snug">{t.title.vi}</b>
            <span className="text-en block text-sm">{t.title.en}</span>
            <span className="mt-1 block text-sm text-ink-2">{t.goal.vi}</span>
          </span>
          {isOpen ? <ChevronDown className="mt-1 size-5 shrink-0 text-ink-2" /> : <ChevronRight className="mt-1 size-5 shrink-0 text-ink-2" />}
        </button>
        {isOpen && (
          <div className="space-y-3 border-t-2 border-line bg-paper/40 px-4 py-4 text-sm">
            <div>
              <p className="text-xs font-bold text-ink-2 uppercase">Yêu cầu sản phẩm</p>
              <p className="mt-1">{t.brief.vi}</p>
              <p className="text-en mt-1">{t.brief.en}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-ink-2 uppercase">Vật liệu · an toàn</p>
              <p className="mt-1">{t.materials}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-ink-2 uppercase">Từ vựng</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {t.vocab.map((w) => (
                  <li key={w.en} className="flex items-center gap-1 rounded-xl bg-white px-2 py-1 ring-1 ring-line">
                    <span className="text-en font-semibold">{w.en}</span>
                    <span className="text-vi text-xs">· {w.vi}</span>
                    <SayButtons text={w.en} />
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={() => onUse(t)} disabled={!canUse}>
              <Sparkles /> Dùng mẫu này cho lớp
            </Button>
            {!canUse && <p className="text-xs text-ink-2">Thầy cô cần tạo lớp trước (nút + ở “Lớp của tôi”).</p>}
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="mt-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold">
            <BookOpen className="size-6 text-blue" /> Thư viện dự án mẫu
          </h2>
          <p className="text-sm text-ink-2">
            {STEM_TEMPLATES.length} dự án song ngữ có tiêu chí, vật liệu, lưu ý an toàn. Bấm vào một dự án để xem chi tiết, rồi “Dùng mẫu này”.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5" role="group" aria-label="Chọn khối">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={cn("h-10 shrink-0 rounded-xl border-2 px-3 font-display font-extrabold whitespace-nowrap", grade === g ? "border-blue bg-blue-soft text-blue-dk" : "border-line-2 bg-white text-ink-2")}
            >
              Lớp {g}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="card-lsn mt-4 p-4 text-sm text-ink-2">Chưa có dự án mẫu cho lớp {grade}.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map(({ l, chapter, items }) => (
            <div key={l.id}>
              <p className="mb-2 text-sm font-bold">
                Bài {l.no}. {l.vi} <span className="text-en font-semibold">· {l.en}</span>
                <span className="ml-2 text-xs font-normal text-ink-2">Chương {chapter.no}</span>
              </p>
              <ul className="grid gap-2 lg:grid-cols-2">{items.map(card)}</ul>
            </div>
          ))}
          {other.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-bold">Khác</p>
              <ul className="grid gap-2 lg:grid-cols-2">{other.map(card)}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
