"use client";

// Đợt B — Khung "Trợ lý gợi ý" trên laptop GV: gợi ý theo luật (src/lib/live/assistant.ts); GV bấm làm theo hoặc bỏ qua.
import { useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { Suggestion, SuggestAction } from "@/lib/live/assistant";

const TONE = {
  warn: "border-coral/50 bg-coral-soft",
  info: "border-line-2 bg-paper",
  good: "border-[#16A34A]/30 bg-blue-soft",
};

export function AssistantPanel({ items, onAction }: { items: Suggestion[]; onAction: (a: SuggestAction) => void }) {
  // Gợi ý GV đã bỏ qua / đã làm → không hiện lại trong tiết này
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const list = items.filter((s) => !hidden.has(s.id));
  const hide = (id: string) => setHidden((h) => new Set(h).add(id));

  return (
    <section className="card-lsn min-w-0 p-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink-2 uppercase">
        <Lightbulb className="size-4 text-sun-dk" /> Trợ lý gợi ý
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-ink-2">Mọi thứ đang ổn. Gợi ý sẽ hiện ở đây khi lớp cần thầy cô chú ý.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className={cn("flex items-start gap-2 rounded-xl border-2 p-2.5 text-sm", TONE[s.tone])}>
              <span className="min-w-0 flex-1">{s.text}</span>
              {s.action && (
                <Button
                  size="xs"
                  variant={s.tone === "warn" ? "default" : "outline"}
                  onClick={() => {
                    onAction(s.action!);
                    hide(s.id);
                  }}
                >
                  {s.actionLabel}
                </Button>
              )}
              <button onClick={() => hide(s.id)} className="grid size-6 shrink-0 place-items-center rounded-md text-ink-2 hover:bg-ink/5" aria-label="Bỏ qua gợi ý">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-ink-2">Gợi ý theo luật rõ ràng; app không tự làm gì nếu thầy cô không bấm.</p>
    </section>
  );
}
