"use client";

// Đợt B — Thanh thời gian 4 hoạt động + Tổng kết: kế hoạch (độ rộng) so với thực tế (phần tô màu)
import { cn } from "cn";
import type { PhaseView } from "@/lib/live/timeline";

const mm = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0")}`;

export function TimelineBar({ items }: { items: PhaseView[] }) {
  const total = items.reduce((a, x) => a + x.plannedMs, 0) || 1;
  const cur = items.find((x) => x.status === "current");
  return (
    <div className="card-lsn p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <b className="text-ink-2 uppercase">Thời gian tiết học</b>
        {cur && (
          <span className={cn("font-semibold tabular-nums", cur.over ? "text-coral-dk" : "text-ink")}>
            {cur.vi}: {mm(cur.usedMs)} / {Math.round(cur.plannedMs / 60_000)} phút{cur.over && " · quá giờ"}
          </span>
        )}
      </div>
      <div className="flex h-7 gap-1" role="list" aria-label="Các hoạt động của tiết">
        {items.map((x) => {
          const fill = x.plannedMs ? Math.min(1, x.usedMs / x.plannedMs) : 0;
          return (
            <div
              key={x.id}
              role="listitem"
              title={`${x.vi}: ${mm(x.usedMs)} / ${Math.round(x.plannedMs / 60_000)} phút`}
              className={cn("relative min-w-0 overflow-hidden rounded-md border-2", x.status === "current" ? "border-blue" : "border-line", x.over && "border-coral")}
              style={{ flexGrow: x.plannedMs / total, flexBasis: 0 }}
            >
              <span className={cn("absolute inset-y-0 left-0", x.over ? "bg-coral/35" : x.status === "done" ? "bg-[#16A34A]/25" : "bg-blue/25")} style={{ width: `${fill * 100}%` }} />
              <span className={cn("relative block truncate px-1.5 text-[11px] leading-6 font-bold", x.status === "upcoming" ? "text-ink-2" : "text-ink")}>
                {x.id}. {x.vi}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
