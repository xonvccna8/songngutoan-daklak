"use client";

// Của em: chỉ số học tập, thời gian tự học 7 ngày, huy hiệu, kết quả các tiết gần đây, đăng xuất
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Flame, Layers, LogOut, Mic, Rocket, Star, Zap } from "lucide-react";
import { cn } from "cn";
import { Avatar } from "@/components/common";
import { Button } from "@/components/ui/button";
import { InstallCard } from "@/components/pwa/install-card";
import { StudentShell, useStudent } from "@/components/student/student-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { ended, studentRow, studySeries } from "@/lib/analytics";
import { useClassSessions, useNow } from "@/lib/hooks/use-class-history";
import { badges, longestStreak, type Badge } from "@/lib/study/gamify";
import { useMyStats } from "@/lib/study/hooks";
import { DEFAULT_CLASS_SETTINGS } from "@/lib/types";
import { DAILY_GOAL_MIN } from "@/lib/study/time";
import { levelInfo } from "@/lib/progress/levels";

export default function MePage() {
  return (
    <StudentShell>
      <Me />
    </StudentShell>
  );
}

const BADGE_ICON: Record<Badge["icon"], React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  rocket: Rocket,
  book: BookOpen,
  clock: Clock,
  cards: Layers,
  mic: Mic,
  zap: Zap,
  star: Star,
};

function Me() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { uid, classId, me, cls } = useStudent();
  const { data: stats } = useMyStats(classId, uid);
  const { data: sessions } = useClassSessions(classId, 20);
  const now = useNow();
  const row = uid && now ? studentRow(uid, stats ?? undefined, now, { ...DEFAULT_CLASS_SETTINGS.thresholds, ...cls?.settings?.thresholds }) : null;
  const series = now ? studySeries(stats?.studySec, now) : [];
  const maxMin = Math.max(DAILY_GOAL_MIN, ...series.map((d) => d.minutes));
  const list = badges(stats);
  const recent = uid ? ended(sessions).filter((s) => s.results?.[uid]).slice(-5).reverse() : [];

  return (
    <>
      <header className="flex items-center gap-4 px-5 pt-6">
        <Avatar name={me?.fullName || "?"} team={me?.team} className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold">{me?.fullName ?? "…"}</h1>
          <p className="text-sm text-ink-2">
            Lớp {cls?.name} · Tổ {me?.team}
          </p>
        </div>
      </header>

      {/* Chỉ số */}
      <section className="grid grid-cols-3 gap-2 px-5 pt-5">
        <Tile label="Tổng XP" value={(row?.points ?? 0).toLocaleString("vi-VN")} hint={row ? levelInfo(row.level).vi : undefined} />
        <Tile label="Chuỗi ngày" value={row?.streak ?? 0} hint={`dài nhất ${longestStreak(stats?.days)}`} />
        <Tile label="Tự học 7 ngày" value={`${row?.studyMin7 ?? 0}′`} />
        <Tile label="Bài đã nộp" value={stats?.hwDone ?? 0} hint={stats?.hwLate ? `${stats.hwLate} trễ` : undefined} />
        <Tile label="Đúng trên lớp" value={row?.correctPct == null ? "—" : `${row.correctPct}%`} />
        <Tile label="Phát âm TB" value={row?.pron ?? "—"} />
      </section>

      {/* Thời gian tự học 7 ngày */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">Thời gian học 7 ngày</h2>
        <div className="card-lsn mt-3 flex h-40 items-end gap-2 p-4" role="img" aria-label={series.map((d) => `${d.label}: ${d.minutes} phút`).join(", ")}>
          {series.map((d, i) => (
            <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] font-bold tabular-nums">{d.minutes || ""}</span>
              <span
                className={cn("w-full rounded-t-lg", d.minutes >= DAILY_GOAL_MIN ? "bg-teal" : d.minutes > 0 ? "bg-blue" : "bg-line")}
                style={{ height: `${Math.max(4, (d.minutes / maxMin) * 100)}%` }}
              />
              <span className={cn("text-[11px] text-ink-2", i === series.length - 1 && "font-bold text-ink")}>{d.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-2">Cột xanh lá: đạt mục tiêu {DAILY_GOAL_MIN} phút. Chỉ tính lúc em thật sự học trên trang.</p>
      </section>

      {/* Huy hiệu */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">
          Huy hiệu · {list.filter((b) => b.earned).length}/{list.length}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {list.map((b) => {
            const I = BADGE_ICON[b.icon];
            return (
              <li key={b.id} className={cn("card-lsn flex items-center gap-3 p-3", !b.earned && "opacity-70")}>
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", b.earned ? "bg-sun text-ink shadow-[0_3px_0_var(--color-sun-dk)]" : "bg-paper text-ink-2")}>
                  <I className="size-5" />
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm">{b.title.vi}</b>
                  <span className="text-en block truncate text-xs">{b.title.en}</span>
                  <span className="text-[11px] text-ink-2">{b.earned ? "Đã đạt ✓" : `${b.have}/${b.goal} · ${b.desc}`}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Kết quả các tiết */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">Kết quả các tiết gần đây</h2>
        {recent.length === 0 ? (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Chưa có tiết nào.</p>
        ) : (
          <ul className="card-lsn mt-3 divide-y divide-line">
            {recent.map((s) => {
              const r = s.results![uid!];
              return (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{s.lessonTitle?.vi}</b>
                    <span className="text-xs text-ink-2">
                      {new Date(s.createdAt?.toMillis() ?? 0).toLocaleDateString("vi-VN")} · đúng {r.correct}/{r.answered}
                      {r.pronN ? ` · phát âm ${Math.round(r.pronSum / r.pronN)}` : ""}
                    </span>
                  </span>
                  <b className="font-display text-lg tabular-nums">{r.points}</b>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Luôn có hướng dẫn cài app ở đây (kể cả khi em đã ẩn thẻ ở trang chủ); đã cài thì tự ẩn */}
      <section className="px-5 pt-6">
        <InstallCard force />
      </section>

      <section className="px-5 pt-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await signOut();
            router.replace("/s/login");
          }}
        >
          <LogOut /> Đăng xuất
        </Button>
      </section>
    </>
  );
}

function Tile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card-lsn p-3">
      <b className="block font-display text-xl leading-none font-extrabold tabular-nums">{value}</b>
      <span className="mt-1 block text-[11px] leading-tight font-semibold text-ink-2">{label}</span>
      {hint && <span className="block text-[10px] text-ink-2/70">{hint}</span>}
    </div>
  );
}
