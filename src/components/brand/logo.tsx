import Link from "next/link";
import { cn } from "cn";
import { SUBJECT } from "@/lib/subject";
import { LOGO_BG, LOGO_MARK } from "@/components/brand/mark";

/** Biểu trưng: dấu cộng · tam giác · π · đường tròn xếp thành ô vuông + chữ "Lớp Song Ngữ" */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="12" fill={LOGO_BG} />
      <g dangerouslySetInnerHTML={{ __html: LOGO_MARK }} />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  tone = "dark",
  sub = true,
}: {
  className?: string;
  href?: string;
  tone?: "dark" | "light";
  sub?: boolean;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-extrabold", tone === "light" ? "text-white" : "text-ink")}>
          Lớp Song Ngữ
        </span>
        {sub && (
          <span className={cn("mt-0.5 text-[11px] font-semibold tracking-wide", tone === "light" ? "text-white/60" : "text-ink-2")}>
            Bilingual {SUBJECT.enShort} · THCS
          </span>
        )}
      </span>
    </Link>
  );
}
