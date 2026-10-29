"use client";

// Giao diện cấp độ dùng chung cho HS và GV: huy hiệu cấp, thẻ "Hành trình", danh sách 8 hạng,
// và bộ theo dõi XP (thông báo "+XP", màn chúc mừng lên cấp) cho điện thoại HS.
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { RANKS, levelInfo, type NextStep } from "@/lib/progress/levels";
import { journeyOf } from "@/lib/progress/facts";
import { useMyStats } from "@/lib/study/hooks";
import type { StatsDoc } from "@/lib/analytics";

/** Huy hiệu cấp: biểu tượng + tên hạng + bậc (màu chỉ là phụ, luôn có chữ) */
export function LevelBadge({ level, size = "sm", className }: { level: number; size?: "sm" | "md"; className?: string }) {
  const L = levelInfo(level);
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm", className)}
      style={{ background: `${L.rank.color}1A`, color: L.rank.color }}
      title={`${L.vi} · ${L.en}`}
    >
      <span aria-hidden>{L.rank.icon}</span> {L.vi}
    </span>
  );
}

/** Thanh XP + điều kiện của hạng kế tiếp */
export function NextStepView({ step, dark }: { step: NextStep; dark?: boolean }) {
  if (!step.next) return <p className={cn("text-sm font-semibold", dark ? "text-white/70" : "text-ink-2")}>Em đã đạt cấp cao nhất. Huyền thoại! 👑</p>;
  return (
    <div>
      <div className={cn("h-3 overflow-hidden rounded-full", dark ? "bg-white/15" : "bg-paper")}>
        <i className="block h-full rounded-full bg-sun transition-[width] duration-700" style={{ width: `${Math.round(step.progress * 100)}%` }} />
      </div>
      <p className={cn("mt-2 text-sm", dark ? "text-white/80" : "text-ink-2")}>
        {step.xpNeeded > 0 ? (
          <>
            Còn <b className={dark ? "text-sun" : "text-ink"}>{step.xpNeeded.toLocaleString("vi-VN")} XP</b> để lên{" "}
            <b className={dark ? "text-white" : "text-ink"}>
              {step.next.rank.icon} {step.next.vi}
            </b>
          </>
        ) : step.blocked ? (
          <>
            Đủ XP rồi! Hoàn thành điều kiện để lên{" "}
            <b className={dark ? "text-white" : "text-ink"}>
              {step.next.rank.icon} {step.next.vi}
            </b>
          </>
        ) : (
          <>Sắp lên cấp…</>
        )}
      </p>
      {step.requirements.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {step.requirements.map((q) => (
            <li key={q.vi} className={cn("flex items-center gap-2 text-xs font-semibold", dark ? "text-white/80" : "text-ink-2")}>
              {q.met ? <CheckCircle2 className="size-4 text-teal" /> : <Circle className="size-4 opacity-50" />}
              <span className="flex-1">
                {q.vi} <span className="text-en opacity-70">· {q.en}</span>
              </span>
              <b className="tabular-nums">
                {q.have}/{q.goal}
              </b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Thẻ "Hành trình của em" (trang chủ HS, trang xếp hạng, hồ sơ HS phía GV) */
export function JourneyCard({ stats, title = "Hành trình của em" }: { stats: StatsDoc | null | undefined; title?: string }) {
  const { xp, level, step } = journeyOf(stats);
  const L = levelInfo(level);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white shadow-[0_6px_0_#000]">
      <div className="absolute -top-12 -right-10 size-40 rounded-full blur-2xl" style={{ background: `${L.rank.color}66` }} />
      <div className="relative flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-4xl" aria-hidden>
          {L.rank.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white/60">{title}</p>
          <p className="font-display text-2xl leading-tight font-extrabold">{L.vi}</p>
          <p className="text-sm font-semibold text-white/60">{L.en}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-extrabold text-sun tabular-nums">{xp.toLocaleString("vi-VN")}</p>
          <p className="text-xs text-white/60">XP</p>
        </div>
      </div>
      <div className="relative mt-4">
        <NextStepView step={step} dark />
      </div>
    </div>
  );
}

/** Bản đồ 8 hạng: đã qua / đang ở / chưa mở */
export function RankLadder({ level }: { level: number }) {
  const cur = levelInfo(level).rankIndex;
  return (
    <ol className="grid grid-cols-4 gap-2">
      {RANKS.map((r, i) => (
        <li
          key={r.id}
          className={cn("flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center", i === cur ? "border-blue bg-blue-soft" : i < cur ? "border-line bg-white" : "border-dashed border-line bg-paper opacity-70")}
        >
          <span className="text-2xl" aria-hidden>
            {i > cur ? <Lock className="size-6 text-ink-2/50" /> : r.icon}
          </span>
          <span className="text-[11px] leading-tight font-bold">{r.vi}</span>
          <span className="text-en text-[10px] leading-tight">{r.en}</span>
          <span className="text-[10px] text-ink-2 tabular-nums">{r.minXp.toLocaleString("vi-VN")} XP</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Theo dõi XP của em (gắn trong StudentShell): XP tăng → thông báo "+N XP";
 * lên cấp → màn chúc mừng. Lần tải đầu không báo gì.
 */
export function XpWatcher({ classId, uid }: { classId: string | undefined; uid: string | undefined }) {
  const { data, loading } = useMyStats(classId, uid);
  const prev = useRef<{ xp: number; level: number | null } | null>(null);
  const [celebrate, setCelebrate] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    const { xp } = journeyOf(data);
    const level = data?.level ?? null;
    const p = prev.current;
    prev.current = { xp, level };
    if (!p) return;
    if (xp > p.xp) toast.success(`+${xp - p.xp} XP`, { description: "Giỏi lắm! Keep it up!", duration: 2500 });
    // Chỉ chúc mừng khi máy chủ đã ghi cấp trước và sau (tránh báo nhầm lần tính cấp đầu tiên)
    if (p.level != null && level != null && level > p.level) setCelebrate(level);
  }, [data, loading]);

  if (celebrate == null) return null;
  const L = levelInfo(celebrate);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-6 backdrop-blur-sm" role="dialog" aria-modal aria-label="Lên cấp">
      <div className="w-full max-w-sm animate-in rounded-3xl bg-white p-6 text-center zoom-in-90 fade-in">
        <Sparkles className="mx-auto size-8 text-sun" />
        <p className="mt-2 text-sm font-bold text-ink-2">Level up! · Em đã lên cấp</p>
        <p className="mt-3 text-6xl" aria-hidden>
          {L.rank.icon}
        </p>
        <p className="mt-2 font-display text-3xl font-extrabold" style={{ color: L.rank.color }}>
          {L.vi}
        </p>
        <p className="text-en font-semibold">{L.en}</p>
        <Button className="mt-5 w-full" size="lg" onClick={() => setCelebrate(null)}>
          Tuyệt vời! · Awesome!
        </Button>
      </div>
    </div>
  );
}
