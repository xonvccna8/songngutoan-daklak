"use client";

// Trang chủ GV: chỉ số tổng + thẻ từng lớp
import { useCallback, useEffect, useState } from "react";
import { useNow } from "@/lib/hooks/use-class-history";
import { useClassPulse, type Pulse } from "@/lib/hooks/use-class-pulse";
import Link from "next/link";
import { AlertTriangle, BookOpenCheck, Copy, Play, Plus, Settings2, Trash2, Users, Wifi } from "lucide-react";
import { DeleteClassDialog } from "@/components/teacher/delete-class-dialog";
import { toast } from "sonner";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { ShapeIcon, type ShapeKind } from "@/components/brand/shapes";
import { EmptyState } from "@/components/common";
import { CreateClassDialog } from "@/components/teacher/create-class-dialog";
import { StartLessonDialog } from "@/components/teacher/start-lesson-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useMyClasses } from "@/lib/hooks/use-firestore";
import type { ClassDoc } from "@/lib/types";

// Thẻ lớp kiểu pastel: nền nhạt, chữ đậm cùng tông, hình học mờ trang trí
const THEMES: { soft: string; accent: string; ink: string; shape: ShapeKind }[] = [
  { soft: "#EAF0FF", accent: "#2F5BEA", ink: "#1E3A9E", shape: "triangle" },
  { soft: "#FFEEE9", accent: "#E8492E", ink: "#A3301B", shape: "square" },
  { soft: "#E3F6F1", accent: "#0E9F8A", ink: "#0A6B5D", shape: "diamond" },
  { soft: "#FFF5DA", accent: "#E0A800", ink: "#7A5A00", shape: "circle" },
];

function hello() {
  const h = new Date().getHours();
  return h < 11 ? "Chào buổi sáng" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
}

export default function TeacherHome() {
  const { user } = useAuth();
  const { data: classes, loading } = useMyClasses();
  const [creating, setCreating] = useState(false);
  const total = classes.reduce((s, c) => s + (c.studentCount ?? 0), 0);
  const now = useNow();
  // Mỗi thẻ lớp báo số liệu lên để cộng tổng
  const [pulses, setPulses] = useState<Record<string, Pulse>>({});
  const report = useCallback((id: string, p: Pulse) => setPulses((old) => (JSON.stringify(old[id]) === JSON.stringify(p) ? old : { ...old, [id]: p })), []);
  const live = classes.filter((c) => pulses[c.id]?.live);
  const online = live.reduce((s, c) => s + (pulses[c.id]?.online ?? 0), 0);
  const attention = classes.reduce((s, c) => s + (pulses[c.id]?.attention ?? 0), 0);
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-ink-2 first-letter:uppercase">{today}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-[2.1rem]">
            {hello()}, {user?.displayName?.split(" ").slice(-1)[0] || "thầy cô"}!
          </h1>
        </div>
        <Button onClick={() => setCreating(true)} size="lg">
          <Plus /> Tạo lớp
        </Button>
      </div>

      {/* Ô chỉ số */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={BookOpenCheck} label="Lớp đang dạy" value={classes.length} tone="blue" />
        <Stat icon={Users} label="Tổng học sinh" value={total} tone="teal" />
        <Stat icon={Wifi} label="Đang trực tuyến" value={live.length ? online : "—"} tone="sun" hint={live.length ? `${live.length} lớp đang học` : "khi dạy"} />
        <Stat icon={AlertTriangle} label="Cần chú ý" value={attention} tone="coral" hint="7 ngày qua" />
      </div>

      <div className="mt-10 mb-4 flex items-end justify-between">
        <h2 className="text-lg font-bold">Lớp của tôi</h2>
        {classes.length > 0 && <p className="text-sm text-ink-2">{classes.length} lớp · {total} học sinh</p>}
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-lsn h-64 animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          title="Chưa có lớp nào"
          action={
            <Button onClick={() => setCreating(true)} variant="sun" size="lg" className="mt-2">
              <Plus /> Tạo lớp đầu tiên
            </Button>
          }
        >
          Tạo lớp, dán danh sách học sinh từ Excel rồi in phiếu đăng nhập — chưa tới 5 phút.
        </EmptyState>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c, i) => (
            <ClassCard key={c.id} cls={c} theme={THEMES[i % THEMES.length]} now={now} onPulse={report} />
          ))}
          <button
            onClick={() => setCreating(true)}
            className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-white/50 text-ink-2 transition-colors hover:border-blue hover:bg-white hover:text-blue"
          >
            <Plus className="size-8" />
            <span className="font-semibold">Thêm lớp</span>
          </button>
        </div>
      )}

      <CreateClassDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function Stat({
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
  const tones = {
    blue: "bg-blue-soft text-blue",
    teal: "bg-teal-soft text-teal-dk",
    sun: "bg-sun-soft text-[#B07F00]",
    coral: "bg-coral-soft text-coral",
  };
  return (
    <div className="card-lsn flex items-start justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink-2">{label}</p>
        <p className="mt-1.5 font-display text-[1.75rem] leading-none font-bold tabular-nums">{value}</p>
        {hint && <p className="mt-1.5 truncate text-xs text-ink-2/70">{hint}</p>}
      </div>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
    </div>
  );
}

function ClassCard({ cls, theme, now, onPulse }: { cls: ClassDoc; theme: (typeof THEMES)[number]; now: number; onPulse: (id: string, p: Pulse) => void }) {
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { liveId, levelUps, ...pulse } = useClassPulse(cls, now);
  const { online, weekly, attention, live } = pulse;
  useEffect(() => {
    onPulse(cls.id, { online, weekly, attention, live });
  }, [cls.id, online, weekly, attention, live, onPulse]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cls.joinCode);
      toast.success(`Đã chép mã lớp ${cls.joinCode}`);
    } catch {
      toast.error("Không chép được mã lớp.");
    }
  };
  return (
    <article className="card-lsn group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(20,33,61,.05),0_18px_36px_-18px_rgba(20,33,61,.28)]">
      {/* Đầu thẻ pastel */}
      <div className="relative h-28 overflow-hidden px-5 pt-4" style={{ background: theme.soft, color: theme.ink }}>
        <ShapeIcon kind={theme.shape} color={theme.accent} className="absolute -right-5 -bottom-9 size-36 opacity-[.13] transition-transform duration-500 group-hover:rotate-12" />
        <ShapeIcon kind={theme.shape} color={theme.accent} className="absolute top-4 right-24 size-5 opacity-30" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: theme.ink }}>
          <span className="size-1.5 rounded-full" style={{ background: theme.accent }} /> Khối {cls.grade}
        </span>
        <p className="relative mt-2 font-display text-[2.6rem] leading-none font-bold tracking-tight">
          <span className="text-2xl font-semibold opacity-60">Lớp </span>
          {cls.name}
        </p>
        {cls.isSample && <span className="absolute top-4 right-4 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold">Dữ liệu mẫu</span>}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-2">Mã vào lớp</span>
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1 font-mono text-sm font-bold tracking-[0.2em] hover:border-blue/40 hover:bg-blue-soft" title="Chép mã lớp">
            {cls.joinCode} <Copy className="size-3.5 text-ink-2" />
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-4 divide-x divide-line rounded-xl border border-line text-center">
          {[
            { k: "Sĩ số", v: cls.studentCount ?? 0 },
            { k: "Trực tuyến", v: online ?? "—" },
            { k: "Điểm TB tuần", v: weekly ?? "—" },
            { k: "Cần chú ý", v: attention, warn: attention > 0 },
          ].map((m) => (
            <div key={m.k} className={cn("px-1 py-2.5 first:rounded-l-xl last:rounded-r-xl", m.warn && "bg-coral-soft/60 text-coral-dk")}>
              <dd className="font-display text-lg leading-none font-bold tabular-nums">{m.v}</dd>
              <dt className={cn("mt-1 text-[10px] font-medium", m.warn ? "text-coral-dk/80" : "text-ink-2")}>{m.k}</dt>
            </div>
          ))}
        </dl>

        {levelUps.length > 0 && (
          <Link href={`/teacher/classes/${cls.id}`} className="mt-3 flex items-center gap-2 rounded-xl bg-sun-soft px-3 py-2 text-xs font-semibold text-[#8A5A00] hover:underline">
            <span aria-hidden>🎉</span>
            <span className="min-w-0 flex-1 truncate">
              {levelUps.length} em vừa lên cấp: {levelUps.slice(0, 3).join(", ")}
              {levelUps.length > 3 && "…"}
            </span>
          </Link>
        )}

        <div className="mt-4 flex gap-2">
          <Button className="flex-1" variant={liveId ? "coral" : "default"} onClick={() => setStarting(true)}>
            <Play className="fill-current" /> {liveId ? "Đang dạy — vào tiếp" : "Bắt đầu tiết học"}
          </Button>
          <Link href={`/teacher/classes/${cls.id}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Quản lý lớp" title="Quản lý lớp">
            <Settings2 />
          </Link>
          <Button variant="destructive" size="icon" onClick={() => setDeleting(true)} aria-label={`Xoá lớp ${cls.name}`} title="Xoá lớp">
            <Trash2 />
          </Button>
        </div>
      </div>
      <StartLessonDialog cls={cls} open={starting} onOpenChange={setStarting} />
      {deleting && <DeleteClassDialog cls={cls} open onOpenChange={setDeleting} live={!!liveId} />}
    </article>
  );
}
