"use client";

// Thuật ngữ của tiết: hiện trên "Bảng từ" của tivi từ trang đã chọn; dùng làm gợi ý bài về nhà
import { Plus, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INPUT, SELECT, Section } from "@/components/lessons/fields";
import { say } from "@/lib/live/speech";
import type { EditorSlide } from "@/lib/lessons/editor";
import type { Term } from "@/lib/live/types";

export function LessonTerms({ terms, slides, onChange, onAdd }: { terms: Term[]; slides: EditorSlide[]; onChange: (t: Term[]) => void; onAdd: () => void }) {
  const set = (i: number, p: Partial<Term>) => onChange(terms.map((t, j) => (j === i ? { ...t, ...p } : t)));
  return (
    <Section
      title={`Thuật ngữ của tiết (${terms.length})`}
      action={
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Thêm từ ngân hàng
        </Button>
      }
    >
      <p className="text-xs text-ink-2">Thuật ngữ hiện trên Bảng từ của tivi kể từ trang đã chọn, kèm nhãn “mới” ở trang đó. Sửa phiên âm / nghĩa ở đây chỉ áp dụng cho tiết này.</p>
      {terms.length === 0 && <p className="rounded-xl bg-paper p-3 text-sm text-ink-2">Chưa có thuật ngữ nào.</p>}
      {terms.map((t, i) => (
        <div key={i} className="grid gap-2 rounded-xl bg-paper/60 p-2 sm:grid-cols-[1.3fr_1fr_1.3fr_auto_auto] sm:items-center">
          <input value={t.en} onChange={(e) => set(i, { en: e.target.value })} aria-label="Tiếng Anh" className={`${INPUT} font-semibold text-blue-dk`} />
          <input value={t.ipa} onChange={(e) => set(i, { ipa: e.target.value })} aria-label="Phiên âm" className={INPUT} />
          <input value={t.vi} onChange={(e) => set(i, { vi: e.target.value })} aria-label="Tiếng Việt" className={`${INPUT} text-ink-2 italic`} />
          <select value={Math.min(t.at, Math.max(0, slides.length - 1))} onChange={(e) => set(i, { at: Number(e.target.value) })} className={`${SELECT} sm:w-36`} aria-label="Hiện từ trang">
            {slides.map((s, j) => (
              <option key={s.id} value={j}>
                Từ trang {j + 1}
              </option>
            ))}
          </select>
          <span className="flex">
            <Button variant="ghost" size="icon-sm" onClick={() => say(t.en)} aria-label="Nghe">
              <Volume2 />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onChange(terms.filter((_, j) => j !== i))} aria-label="Bỏ thuật ngữ">
              <Trash2 />
            </Button>
          </span>
        </div>
      ))}
    </Section>
  );
}
