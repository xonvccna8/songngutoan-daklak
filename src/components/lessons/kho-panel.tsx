"use client";

// Trình soạn bài — tab "Kho học liệu": học liệu + thuật ngữ của kho gắn với bài SGK của tiết này.
// GV xem trước học liệu (mô phỏng, hình học động, bài đọc) và thêm thuật ngữ của kho vào tiết bằng 1 chạm.
import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Library, Plus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { SayButtons } from "@/components/library/say";
import { ResourceView, RESOURCE_ICON } from "@/components/library/resource-view";
import { curLesson } from "@/lib/curriculum";
import { useLessonResources } from "@/lib/library/hooks";
import { RESOURCE_KINDS } from "@/lib/library/resources";
import { useTerms } from "@/lib/study/hooks";
import type { Term } from "@/lib/live/types";

export function KhoPanel({ curLessonId, terms, canEdit, onAddTerms }: { curLessonId: string | null | undefined; terms: Term[]; canEdit: boolean; onAddTerms: (t: { en: string; ipa: string; vi: string }[]) => void }) {
  const l = curLesson(curLessonId);
  const resources = useLessonResources(curLessonId);
  const { data: bank } = useTerms(l?.grade);
  const [open, setOpen] = useState<string | null>(null);

  if (!l) {
    return (
      <EmptyState title="Tiết này chưa gắn bài SGK">
        Vào tab “Thông tin & mục tiêu”, chọn bài trong SGK — học liệu và thuật ngữ của kho cho bài đó sẽ hiện ở đây.
      </EmptyState>
    );
  }
  const has = new Set(terms.map((t) => t.en.toLowerCase()));
  const kho = bank.filter((t) => t.curLessonIds?.includes(l.id)).sort((a, b) => a.en.localeCompare(b.en));
  const missing = kho.filter((t) => !has.has(t.en.toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-2 text-sm text-ink-2">
        <Library className="size-4 text-blue" /> Bài {l.no}. {l.vi} <span className="text-en">· {l.en}</span> — học sinh cũng thấy các học liệu đã duyệt này ở trang “Xem trước bài”.
      </p>

      <section className="card-lsn p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold">
            Thuật ngữ của kho ({kho.length}) <span className="text-en text-sm font-semibold">· Key words</span>
          </h3>
          {canEdit && missing.length > 0 && (
            <Button size="sm" onClick={() => onAddTerms(missing)}>
              <Plus /> Thêm {missing.length} thuật ngữ vào tiết
            </Button>
          )}
        </div>
        {kho.length === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Kho chưa có thuật ngữ cho bài này.</p>
        ) : (
          <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {kho.map((t) => {
              const inLesson = has.has(t.en.toLowerCase());
              return (
                <li key={t.id} className="flex items-center gap-2 border-b border-line py-2">
                  <span className="min-w-0 flex-1">
                    <b className="text-en block">{t.en}</b>
                    <span className="block text-xs text-ink-2">{t.ipa}</span>
                    <span className="text-vi block text-sm">{t.vi}</span>
                  </span>
                  <SayButtons text={t.en} />
                  {inLesson ? (
                    <span className="grid size-8 place-items-center rounded-lg bg-teal-soft text-[#0A6F5F]" title="Đã có trong tiết">
                      <Check className="size-4" />
                    </span>
                  ) : (
                    canEdit && (
                      <Button size="icon-sm" variant="outline" aria-label={`Thêm “${t.en}” vào tiết`} title="Thêm vào tiết" onClick={() => onAddTerms([t])}>
                        <Plus />
                      </Button>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold">Học liệu đã duyệt ({resources.length})</h3>
          <Link href="/teacher/library" className="text-sm font-bold text-blue hover:underline">
            Thêm học liệu ở Học liệu số →
          </Link>
        </div>
        {resources.length === 0 ? (
          <p className="card-lsn p-4 text-sm text-ink-2">Chưa có học liệu đã duyệt cho bài này.</p>
        ) : (
          <div className="card-lsn divide-y divide-line overflow-hidden">
            {resources.map((r) => {
              const I = RESOURCE_ICON[r.kind];
              return (
                <div key={r.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk">
                      <I className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block">{r.title.vi}</b>
                      {r.title.en && <span className="text-en block text-sm">{r.title.en}</span>}
                      <span className="block text-xs text-ink-2">
                        {RESOURCE_KINDS[r.kind].vi}
                        {r.note ? ` · ${r.note}` : ""}
                      </span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setOpen(open === r.id ? null : r.id)}>
                      {open === r.id ? "Ẩn" : "Xem"}
                    </Button>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className={cn("grid size-9 place-items-center rounded-xl text-ink-2 hover:bg-ink/5")} aria-label="Mở trong tab mới (chiếu lên tivi)" title="Mở trong tab mới (kéo sang tivi để chiếu)">
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                  {open === r.id && (
                    <div className="mt-3 max-w-3xl">
                      <ResourceView r={r} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
