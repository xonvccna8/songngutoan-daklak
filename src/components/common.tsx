"use client";

// Thành phần dùng chung: màn chờ, trạng thái rỗng, avatar, viên XP/chuỗi ngày, nhãn song ngữ
import { Flame, Loader2, Zap } from "lucide-react";
import { cn } from "cn";
import { Tam } from "@/components/brand/tam";
import { initials } from "@/lib/class-utils";

export function FullScreenLoader({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-3 bg-paper">
      <Tam mood="calm" className="size-20" />
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        <Loader2 className="size-4 animate-spin" /> {label}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  mood = "happy",
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  mood?: React.ComponentProps<typeof Tam>["mood"];
  className?: string;
}) {
  return (
    <div className={cn("card-lsn flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      <Tam mood={mood} className="size-20" />
      <h3 className="text-xl font-bold">{title}</h3>
      {children && <div className="max-w-md text-sm text-ink-2">{children}</div>}
      {action}
    </div>
  );
}

/** Song ngữ: tiếng Anh thẳng màu nhấn, tiếng Việt xám nghiêng */
export function Bi({ en, vi, className }: { en: string; vi: string; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="text-en font-semibold">{en}</span>
      <span className="text-vi text-[0.85em]">{vi}</span>
    </span>
  );
}

export const TEAM_COLORS = ["#E8492E", "#2F5BEA", "#C9951A", "#0E9F8A", "#8B5CF6", "#DB2777", "#0891B2", "#65A30D"];
export const teamColor = (team: number) => TEAM_COLORS[(team - 1) % TEAM_COLORS.length];

export function Avatar({ name, team, className }: { name: string; team?: number; className?: string }) {
  const color = team ? teamColor(team) : "#51607A";
  return (
    <span
      className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white", className)}
      style={{ background: color, boxShadow: `inset 0 -3px 0 rgba(0,0,0,.18)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function StreakPill({ days }: { days: number }) {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-line bg-white px-3 font-display text-sm font-extrabold text-[#E8590C]">
      <Flame className="size-4 fill-[#FF922B] text-[#E8590C]" /> {days}
      <span className="sr-only">ngày liên tiếp</span>
    </span>
  );
}

export function XpPill({ xp }: { xp: number }) {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-line bg-white px-3 font-display text-sm font-extrabold text-blue-dk">
      <Zap className="size-4 fill-blue text-blue" /> {xp.toLocaleString("vi-VN")}
      <span className="sr-only">điểm XP</span>
    </span>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-xl font-extrabold">{children}</h2>
      {action}
    </div>
  );
}
