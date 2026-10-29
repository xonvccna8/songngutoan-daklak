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

const THEMES: { bg: string; dk: string; shape: ShapeKind; fg: string }[] = [
  { bg: "#2F5BEA", dk: "#1E40B8", shape: "triangle", fg: "#fff" },
  { bg: "#E8492E", dk: "#B4321B", shape: "square", fg: "#fff" },
  { bg: "#0E9F8A", dk: "#0A7565", shape: "diamond", fg: "#fff" },
  { bg: "#FFC93C", dk: "#C99A1F", shape: "circle", fg: "#14213D" },
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
          <p className="text-sm font-semibold text-ink-2 first-letter:uppercase">{today}</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
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

      <h2 className="mt-10 mb-4 text-xl font-extrabold">Lớp của tôi</h2>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-lsn h-64 animate-pulse bg-white/60" />
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
            className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-line-2 text-ink-2 transition-colors hover:border-blue hover:bg-white hover:text-blue"
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
    blue: "bg-blue-soft text-blue-dk",
    teal: "bg-teal-soft text-[#0A6F5F]",
    sun: "bg-sun-soft text-[#8A5A00]",
    coral: "bg-coral-soft text-[#A3301B]",
  };
  return (
    <div className="card-lsn flex items-center gap-3 p-4">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl leading-none font-extrabold">{value}</p>
        <p className="mt-1 truncate text-xs font-semibold text-ink-2">
          {label}
          {hint && <span className="ml-1 text-ink-2/60">· {hint}</span>}
        </p>
      </div>
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
    <article className="group overflow-hidden rounded-[24px] border-2 border-line bg-white transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_-14px_rgba(28,27,58,.35)]">
      {/* Dải màu trên */}
      <div className="relative h-28 overflow-hidden px-5 pt-4" style={{ background: theme.bg, color: theme.fg }}>
        <ShapeIcon kind={theme.shape} color={theme.dk} className="absolute -right-4 -bottom-8 size-36 opacity-60 transition-transform group-hover:rotate-12" />
        <ShapeIcon kind={theme.shape} color="rgba(255,255,255,.25)" className="absolute top-3 right-24 size-6" />
        <p className="relative text-xs font-bold opacity-80">Khối {cls.grade}</p>
        <p className="relative font-display text-5xl leading-none font-extrabold">{cls.name}</p>
        {cls.isSample && <span className="absolute top-3 right-3 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">Dữ liệu mẫu</span>}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-2">Mã lớp</span>
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-2.5 py-1 font-mono text-sm font-bold tracking-[0.2em] hover:bg-blue-soft" title="Chép mã lớp">
            {cls.joinCode} <Copy className="size-3.5 text-ink-2" />
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { k: "Sĩ số", v: cls.studentCount ?? 0 },
            { k: "Trực tuyến", v: online ?? "—" },
            { k: "Điểm TB tuần", v: weekly ?? "—" },
            { k: "Cần chú ý", v: attention, warn: attention > 0 },
          ].map((m) => (
            <div key={m.k} className={cn("rounded-xl px-1 py-2", m.warn ? "bg-sun-soft text-[#8A5A00]" : "bg-paper")}>
              <dd className="font-display text-lg leading-none font-extrabold tabular-nums">{m.v}</dd>
              <dt className="mt-1 text-[10px] font-semibold text-ink-2">{m.k}</dt>
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
