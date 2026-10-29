"use client";

// Tab Tổng quan của lớp: 5 ô chỉ số, lọc, lưới thẻ học sinh (trạng thái = màu + biểu tượng + chữ)
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, CircleSlash, Clock, Flame, Mic, Play, Target, Trophy, Users, Wifi } from "lucide-react";
import { cn } from "cn";
import { Avatar, EmptyState, teamColor } from "@/components/common";
import { StatusChip } from "@/components/live/console/student-panel";
import { LevelBadge } from "@/components/progress/level";
import { ENGAGEMENT_META, studentRow, weeklyAvgPoints, type Engagement, type StatsDoc, type StudentRow } from "@/lib/analytics";
import { isStale, liveStatus } from "@/lib/live/status";
import { fmtAgo } from "@/lib/format";
import type { ParticipantDoc, SessionDoc } from "@/lib/live/types";
import { DEFAULT_CLASS_SETTINGS, type ClassDoc, type StudentDoc } from "@/lib/types";

export const ENGAGEMENT_ICON: Record<Engagement, React.ComponentType<{ className?: string }>> = {
  active: CheckCircle2,
  remind: AlertTriangle,
  inactive: CircleSlash,
};

export function EngagementChip({ s }: { s: Engagement }) {
  const m = ENGAGEMENT_META[s];
  const I = ENGAGEMENT_ICON[s];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap" style={{ background: m.bg, color: m.fg }}>
      <I className="size-3" />
      {m.label}
    </span>
  );
}

export { fmtAgo };

type Filter = "all" | "attention" | "inactive" | "active";

export function ClassOverview({
  cls,
  students,
  sessions,
  stats,
  live,
  participants,
  now,
  onBell,
}: {
  cls: ClassDoc;
  students: StudentDoc[];
  sessions: SessionDoc[];
  stats: Map<string, StatsDoc>;
  live: SessionDoc | null;
  participants: ParticipantDoc[];
  now: number;
  /** Nhắc chú ý 1 chạm */
  onBell?: (uid: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [team, setTeam] = useState<number | null>(null);
  const t = { ...DEFAULT_CLASS_SETTINGS.thresholds, ...cls.settings?.thresholds };

  const rows = students.map((s) => ({ s, r: studentRow(s.uid, stats.get(s.uid), now, t) }));

  // Trạng thái trong tiết (nếu đang dạy)
  const byUid = new Map(participants.map((p) => [p.uid, p]));
  const newest = Math.max(0, ...participants.map((p) => p.lastSeenAt?.toMillis?.() ?? 0));
  const liveOf = (uid: string) =>
    live ? liveStatus({ p: byUid.get(uid), stale: now > 0 && isStale(byUid.get(uid)?.lastSeenAt?.toMillis?.(), newest, now), questionOpen: false, openElapsed: null, answered: false }) : null;
  const online = live ? students.filter((s) => liveOf(s.uid) === "watching").length : null;

  const attention = (r: StudentRow, uid: string) => r.status !== "active" || ["away", "offline"].includes(liveOf(uid) ?? "");
  const nAttention = rows.filter(({ s, r }) => attention(r, s.uid)).length;
  const answered = rows.reduce((a, { r }) => a + (r.correctPct != null ? 1 : 0), 0);
  const avgCorrect = answered ? Math.round(rows.reduce((a, { r }) => a + (r.correctPct ?? 0), 0) / answered) : null;
  const weekly = weeklyAvgPoints(sessions, now);

  const shown = rows
    .filter(({ s }) => !team || s.team === team)
    .filter(({ s, r }) => (filter === "all" ? true : filter === "attention" ? attention(r, s.uid) : r.status === filter))
    .sort((a, b) => b.r.points - a.r.points);

  if (students.length === 0) {
    return <EmptyState title="Lớp chưa có học sinh">Vào tab “Quản lý lớp” để thêm học sinh.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-5">
      {live && (
        <Link href={`/teacher/session/${live.id}`} className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white transition-colors hover:bg-[#1a4a3d]">
          <span className="grid size-11 place-items-center rounded-xl bg-coral">
            <Play className="size-5 fill-current" />
          </span>
          <span className="flex-1">
            <b className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-coral" /> Đang dạy: {live.lessonTitle?.vi}
            </b>
            <span className="text-sm text-white/60">
              Trang {live.state.slideIndex + 1} · {participants.length}/{students.length} em đã vào lớp — bấm để mở bảng điều khiển
            </span>
          </span>
        </Link>
      )}

      {/* 5 ô chỉ số */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={Users} tone="blue" label="Sĩ số" value={students.length} />
        <Kpi icon={Wifi} tone="teal" label="Trực tuyến" value={online ?? "—"} hint={live ? undefined : "khi dạy"} />
        <Kpi icon={Trophy} tone="sun" label="Điểm TB tuần" value={weekly ?? "—"} />
        <Kpi icon={Target} tone="blue" label="Tỉ lệ đúng" value={avgCorrect == null ? "—" : `${avgCorrect}%`} />
        <Kpi icon={AlertTriangle} tone="coral" label="Cần chú ý" value={nAttention} />
      </div>

      {/* Lọc */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["all", `Tất cả ${students.length}`],
            ["attention", `Cần chú ý ${nAttention}`],
            ["inactive", `Chưa học ${rows.filter((x) => x.r.status === "inactive").length}`],
            ["active", `Tích cực ${rows.filter((x) => x.r.status === "active").length}`],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn("h-9 rounded-full border-2 px-3 text-xs font-bold transition-colors", filter === k ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink/30")}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-5 w-0.5 bg-line" />
        {Array.from({ length: cls.settings?.teams ?? 4 }, (_, i) => i + 1).map((tm) => (
          <button
            key={tm}
            onClick={() => setTeam(team === tm ? null : tm)}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold", team === tm ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2")}
          >
            <span className="size-2 rounded-full" style={{ background: teamColor(tm) }} /> Tổ {tm}
          </button>
        ))}
      </div>

      {/* Lưới thẻ */}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {shown.map(({ s, r }) => {
          const ls = liveOf(s.uid);
          return (
            <li key={s.uid} className={cn("card-lsn relative flex flex-col gap-3 p-4 transition-shadow hover:shadow-[0_10px_24px_-14px_rgba(28,27,58,.4)]", attention(r, s.uid) && "border-sun/70")}>
              <Link href={`/teacher/classes/${cls.id}/students/${s.uid}`} className="absolute inset-0 rounded-[18px]" aria-label={`Hồ sơ ${s.fullName}`} />
              <div className="flex items-start gap-3">
                <Avatar name={s.fullName} team={s.team} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{s.fullName}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <LevelBadge level={r.level} />
                    <EngagementChip s={r.status} />
                    {ls && <StatusChip s={ls} />}
                  </div>
                </div>
                <button
                  disabled={!onBell}
                  onClick={() => onBell?.(s.uid)}
                  title="Nhắc chú ý (1 chạm)"
                  className="relative z-10 grid size-9 place-items-center rounded-xl border-2 border-line-2 text-ink-2 transition-colors hover:border-sun hover:bg-sun-soft hover:text-[#8A5A00] disabled:opacity-50"
                  aria-label={`Nhắc chú ý ${s.fullName}`}
                >
                  <Bell className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Metric label="XP" value={r.points.toLocaleString("vi-VN")} />
                <Metric label="Đúng" value={r.correctPct == null ? "—" : `${r.correctPct}%`} />
                <Metric label="Phát âm" value={r.pron ?? "—"} icon={<Mic className="size-3" />} />
              </div>
              <div className="space-y-1.5">
                <Bar label="Toán" value={r.mathPct} color="var(--color-blue)" />
                <Bar label="Ngôn ngữ" value={r.langPct} color="var(--color-coral)" />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-2">
                <span className="inline-flex items-center gap-1 font-semibold text-[#E8590C]">
                  <Flame className="size-3.5 fill-[#FF922B]" /> {r.streak} ngày
                </span>
                <span>
                  {r.days7}/7 ngày · {fmtAgo(r.lastActive, now)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-paper px-2.5 py-1.5 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Clock className="size-3.5 text-blue" /> Tự học 7 ngày: <b className="tabular-nums">{r.studyMin7} phút</b>
                </span>
                <span className={cn("font-semibold", r.late7 ? "text-coral-dk" : "text-ink-2")}>{r.late7 ? `${r.late7} bài trễ/thiếu` : `${r.hwDone} bài đã nộp`}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="py-8 text-center text-sm text-ink-2">Không có học sinh phù hợp bộ lọc.</p>}
    </div>
  );
}

export function Kpi({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone: "blue" | "teal" | "sun" | "coral";
  hint?: string;
}) {
  const tones = { blue: "bg-blue-soft text-blue-dk", teal: "bg-teal-soft text-[#0A6F5F]", sun: "bg-sun-soft text-[#8A5A00]", coral: "bg-coral-soft text-[#A3301B]" };
  return (
    <div className="card-lsn flex items-center gap-3 p-4">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl leading-none font-extrabold tabular-nums">{value}</p>
        <p className="mt-1 text-xs leading-tight font-semibold text-ink-2">
          {label}
          {hint && <span className="text-ink-2/60"> · {hint}</span>}
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-paper px-1 py-2">
      <b className="block font-display text-base leading-none tabular-nums">{value}</b>
      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-ink-2">
        {icon}
        {label}
      </span>
    </div>
  );
}

/** Thanh tỉ lệ đúng (nhãn chữ + số, màu chỉ là phụ) */
export function Bar({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr_36px] items-center gap-2 text-[11px] font-semibold text-ink-2">
      <span>{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-paper">
        <i className="block h-full rounded-full" style={{ width: `${value ?? 0}%`, background: color }} />
      </span>
      <span className="text-right text-ink tabular-nums">{value == null ? "—" : `${value}%`}</span>
    </div>
  );
}
