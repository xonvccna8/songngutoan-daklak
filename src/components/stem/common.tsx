"use client";

// Thành phần dùng chung của Dự án STEM: thanh tiến độ 6 bước, nhãn trạng thái tổ
import { cn } from "cn";
import { STEM_STAGES, rubricScore10, stagesDone, type TeamDoc } from "@/lib/stem/projects";

export function StageBar({ team, className }: { team: Pick<TeamDoc, "stages"> | null | undefined; className?: string }) {
  return (
    <span className={cn("flex gap-1", className)} aria-label={`Đã xong ${stagesDone(team)}/6 bước`}>
      {STEM_STAGES.map((s) => (
        <span key={s.key} title={s.vi} className={cn("h-2 flex-1 rounded-full", team?.stages?.[s.key]?.done ? "bg-teal" : "bg-line")} />
      ))}
    </span>
  );
}

export function TeamStatus({ team }: { team: TeamDoc | null | undefined }) {
  const score = rubricScore10(team?.scores);
  if (score != null) return <span className="rounded-full bg-teal-soft px-2 py-0.5 text-xs font-bold text-[#0A6F5F]">Đã chấm · {score}/10</span>;
  if (team?.submittedAt) return <span className="rounded-full bg-blue-soft px-2 py-0.5 text-xs font-bold text-blue-dk">Đã nộp</span>;
  if (stagesDone(team)) return <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-bold text-[#8A5A00]">Đang làm · {stagesDone(team)}/6</span>;
  return <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-bold text-ink-2">Chưa bắt đầu</span>;
}
