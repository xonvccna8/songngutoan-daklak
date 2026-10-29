"use client";

// Nền "bảng đen" (ink) cho màn làm bài trên điện thoại — giống màn trả lời trong tiết
import { cn } from "cn";
import { BOARD_VARS } from "@/components/live/slide-view";
import type { Lang } from "@/lib/live/types";

export function Board({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex min-h-dvh flex-1 justify-center bg-ink-tv font-sans text-[var(--chalk)]", className)}
      style={{ ...BOARD_VARS, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "18px 18px" }}
    >
      <div className="flex w-full max-w-md flex-col">{children}</div>
    </div>
  );
}

/** Chọn ngôn ngữ hiển thị: EN / Song ngữ / VI */
export function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-white/20 text-xs" role="group" aria-label="Ngôn ngữ">
      {(["en", "bi", "vi"] as Lang[]).map((l) => (
        <button key={l} onClick={() => onChange(l)} aria-pressed={lang === l} className={cn("px-3 py-2 font-bold", lang === l ? "bg-sun text-ink" : "text-[var(--chalk-dim)]")}>
          {l === "bi" ? "EN·VI" : l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
