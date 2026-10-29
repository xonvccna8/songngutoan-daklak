"use client";

// Thẻ bài tập về nhà trên điện thoại HS: tên bài, hạn nộp, tiến độ, trạng thái (màu + biểu tượng + chữ)
import Link from "next/link";
import { AlarmClock, CheckCircle2, ChevronRight, CircleDashed, Clock, PencilLine, XCircle } from "lucide-react";
import { cn } from "cn";
import { fmtDue, fmtLeft } from "@/lib/format";
import { HW_STATUS_META, hwStatus, type HwStatus } from "@/lib/study/hw";
import type { AssignmentDoc, SubmissionDoc } from "@/lib/study/types";

const ICON: Record<HwStatus, React.ComponentType<{ className?: string }>> = {
  todo: CircleDashed,
  doing: PencilLine,
  done: CheckCircle2,
  late: Clock,
  missed: XCircle,
};

export function HwStatusChip({ s }: { s: HwStatus }) {
  const m = HW_STATUS_META[s];
  const I = ICON[s];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap" style={{ background: m.bg, color: m.fg }}>
      <I className="size-3" /> {m.label}
    </span>
  );
}

export function HwCard({ a, sub, now }: { a: AssignmentDoc; sub?: SubmissionDoc; now: number }) {
  const due = a.dueAt.toMillis();
  const s = hwStatus(sub, due, now);
  const total = a.items.length;
  const done = sub?.answered ?? 0;
  const urgent = now > 0 && (s === "todo" || s === "doing") && due - now < 24 * 3600_000;
  return (
    <Link href={`/s/hw/${a.id}`} className={cn("card-lsn flex items-center gap-3 p-3.5 transition-shadow hover:shadow-[0_8px_20px_-12px_rgba(28,27,58,.4)]", urgent && "border-sun")}>
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", s === "done" || s === "late" ? "bg-teal-soft text-[#0A6F5F]" : urgent ? "bg-sun-soft text-[#8A5A00]" : "bg-blue-soft text-blue-dk")}>
        {urgent ? <AlarmClock className="size-6" /> : <PencilLine className="size-6" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{a.title.vi}</span>
        <span className="text-en block truncate text-sm">{a.title.en}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-2">
          <HwStatusChip s={s} />
          {s === "done" || s === "late" ? (
            <span>
              {sub?.score ?? 0} điểm · đúng {sub?.correct ?? 0}/{total}
            </span>
          ) : (
            <span className={cn(urgent && "font-bold text-[#8A5A00]")}>
              {done}/{total} câu · hạn {fmtDue(due)}
              {now > 0 && ` (${fmtLeft(due, now)})`}
            </span>
          )}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-ink-2" />
    </Link>
  );
}
