"use client";

// Nút nghe mẫu tiếng Anh: bấm thường = tốc độ vừa, nút rùa = đọc chậm (GV chưa vững tiếng Anh nghe theo được)
import { Turtle, Volume2 } from "lucide-react";
import { cn } from "cn";
import { say } from "@/lib/live/speech";

/** "___" trong khung câu đọc thành "blank" */
const spoken = (t: string) => t.replaceAll("___", "blank");

export function SayButtons({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 gap-1", className)}>
      <button type="button" onClick={() => say(spoken(text), 0.9)} className="grid size-8 place-items-center rounded-lg bg-blue-soft text-blue-dk hover:bg-blue/20" aria-label={`Nghe: ${text}`} title="Nghe">
        <Volume2 className="size-4" />
      </button>
      <button type="button" onClick={() => say(spoken(text), 0.55)} className="grid size-8 place-items-center rounded-lg bg-paper text-ink-2 hover:bg-line" aria-label={`Nghe chậm: ${text}`} title="Nghe chậm">
        <Turtle className="size-4" />
      </button>
    </span>
  );
}
