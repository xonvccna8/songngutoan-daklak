"use client";

// Danh sách trang bên trái, nhóm theo 4 hoạt động CV 5512; thêm / nhân đôi / di chuyển / xoá trang
import { useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACTIVITIES, KIND_META, activityOf, kindOf, newSlide, newSlideId, type EditorKind, type EditorSlide } from "@/lib/lessons/editor";
import type { Activity } from "@/lib/live/types";

export function SlideList({
  slides,
  index,
  onSelect,
  onChange,
  problemSlides,
  readOnly,
}: {
  slides: EditorSlide[];
  index: number;
  onSelect: (i: number) => void;
  onChange: (slides: EditorSlide[], select?: number) => void;
  problemSlides: Set<number>;
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState<Activity | null>(null);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const out = [...slides];
    [out[i], out[j]] = [out[j], out[i]];
    // Sang nhóm hoạt động khác thì theo hoạt động của trang bên cạnh
    out[j] = { ...out[j], activity: activityOf(out[i], i, out.length) };
    onChange(out, j);
  };

  return (
    <div className="space-y-4">
      {ACTIVITIES.map((a) => {
        const items = slides.map((s, i) => ({ s, i })).filter(({ s, i }) => activityOf(s, i, slides.length) === a.n);
        return (
          <div key={a.n}>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <p className="text-[11px] font-extrabold tracking-wider text-ink-2 uppercase">
                HĐ {a.n} · {a.vi}
              </p>
              {!readOnly && (
                <button type="button" onClick={() => setAdding(a.n)} className="rounded-md p-1 text-ink-2 hover:bg-white hover:text-blue" aria-label={`Thêm trang vào hoạt động ${a.n}`} title="Thêm trang">
                  <Plus className="size-4" />
                </button>
              )}
            </div>
            <ol className="space-y-1.5">
              {items.map(({ s, i }) => (
                <li key={s.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-2 rounded-xl border-2 bg-white px-2 py-1.5 transition-colors",
                      i === index ? "border-blue shadow-[0_3px_0_var(--color-blue)]" : "border-line hover:border-blue/40"
                    )}
                  >
                    <button type="button" onClick={() => onSelect(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-paper text-xs font-extrabold">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{s.title.vi || s.title.en || "(chưa đặt tiêu đề)"}</span>
                        <span className="block text-[11px] text-ink-2">{KIND_META[kindOf(s)].label}</span>
                      </span>
                      {problemSlides.has(i) && <AlertCircle className="size-4 shrink-0 text-coral" aria-label="Trang còn thiếu thông tin" />}
                    </button>
                    {!readOnly && i === index && (
                      <span className="flex shrink-0">
                        <IconBtn label="Lên" onClick={() => move(i, -1)} disabled={i === 0}>
                          <ArrowUp />
                        </IconBtn>
                        <IconBtn label="Xuống" onClick={() => move(i, 1)} disabled={i === slides.length - 1}>
                          <ArrowDown />
                        </IconBtn>
                        <IconBtn label="Nhân đôi" onClick={() => onChange([...slides.slice(0, i + 1), { ...structuredClone(s), id: newSlideId() }, ...slides.slice(i + 1)], i + 1)}>
                          <Copy />
                        </IconBtn>
                        <IconBtn label="Xoá trang" onClick={() => slides.length > 1 && onChange(slides.filter((_, j) => j !== i), Math.max(0, i - 1))} disabled={slides.length <= 1}>
                          <Trash2 className="text-coral-dk" />
                        </IconBtn>
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {items.length === 0 && <li className="rounded-xl border-2 border-dashed border-line px-3 py-2 text-xs text-ink-2">Chưa có trang.</li>}
            </ol>
          </div>
        );
      })}

      <Dialog open={adding != null} onOpenChange={(o) => !o && setAdding(null)}>
        <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold">Thêm trang · HĐ {adding}</DialogTitle>
            <DialogDescription>Chọn loại trang. Trang mới nằm cuối hoạt động này.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(KIND_META) as EditorKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  const act = adding ?? 2;
                  const s = newSlide(k, act);
                  // Chèn sau trang cuối cùng của hoạt động này (hoặc trước hoạt động sau)
                  let at = slides.length;
                  for (let i = slides.length - 1; i >= 0; i--) {
                    const a = activityOf(slides[i], i, slides.length);
                    if (a <= act) {
                      at = i + 1;
                      break;
                    }
                    at = i;
                  }
                  onChange([...slides.slice(0, at), s, ...slides.slice(at)], at);
                  setAdding(null);
                }}
                className="rounded-2xl border-2 border-line bg-white p-3 text-left transition-colors hover:border-blue"
              >
                <b className="block text-sm">{KIND_META[k].label}</b>
                <span className="text-xs text-ink-2">{KIND_META[k].hint}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IconBtn({ label, children, ...rest }: { label: string; children: React.ReactNode } & React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="icon-xs" aria-label={label} title={label} {...rest}>
      {children}
    </Button>
  );
}
