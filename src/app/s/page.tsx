"use client";

// Trang chủ học sinh: chào, chuỗi ngày, XP, hành trình cấp độ, thẻ "Vào lớp", mục tiêu ngày, bài đến hạn, lộ trình chương, tin GV
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Layers, Lock, LogOut, MessageCircle, Mic, Play } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLiveSessionForClass } from "@/lib/live/hooks";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tam } from "@/components/brand/tam";
import { Avatar, StreakPill, XpPill } from "@/components/common";
import { StudentShell, useStudent } from "@/components/student/student-shell";
import { HwCard } from "@/components/student/hw-card";
import { InstallCard } from "@/components/pwa/install-card";
import { JourneyCard } from "@/components/progress/level";
import { XP, xpTotal } from "@/lib/progress/xp";
import { chapterOf } from "@/lib/curriculum";
import { useAuth } from "@/lib/auth/auth-context";
import { shortName } from "@/lib/class-utils";
import { useInbox } from "@/components/messages/student-inbox";
import { KindChip } from "@/components/messages/message-feed";
import { fmtAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-class-history";
import { REPLY_LABEL } from "@/lib/messages/types";
import { streak } from "@/lib/analytics";
import { vnDayKey } from "@/lib/live/summary";
import { DAILY_GOAL_MIN } from "@/lib/study/time";
import { useMyAssignments, useMyStats, useSubmissionsOf } from "@/lib/study/hooks";

export default function StudentHomePage() {
  return (
    <StudentShell>
      <StudentHome />
    </StudentShell>
  );
}

/** Tin từ thầy cô: mới nhất trước, chấm xanh = chưa đọc; chạm để đánh dấu đã xem (tin bài tập → mở bài) */
function StudentMessages() {
  const inbox = useInbox();
  const router = useRouter();
  const now = useNow();
  const list = inbox?.messages.slice(0, 6) ?? [];
  return (
    <section className="px-5 pt-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        Tin từ thầy cô
        {!!inbox?.unread && <span className="rounded-full bg-coral px-2 py-0.5 text-xs text-white">{inbox.unread} mới</span>}
      </h2>
      {list.length === 0 ? (
        <div className="card-lsn mt-3 flex items-center gap-3 p-4 text-sm text-ink-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-soft text-blue-dk">
            <MessageCircle className="size-5" />
          </span>
          Chưa có tin nhắn mới.
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {list.map((m) => {
            const r = inbox!.receipts[m.id];
            const unread = !r?.readAt && !r?.ackAt;
            return (
              <li key={m.id}>
                <button
                  onClick={() => {
                    if (unread) inbox!.markRead(m);
                    if (m.assignmentId) router.push(`/s/hw/${m.assignmentId}`);
                  }}
                  className={cn("card-lsn flex w-full items-start gap-3 p-3 text-left", unread && "border-blue/40")}
                >
                  <KindChip kind={m.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{m.text.en || m.text.vi}</span>
                    {m.text.en && m.text.vi && <span className="text-vi block text-sm">{m.text.vi}</span>}
                    <span className="mt-0.5 block text-xs text-ink-2">
                      {m.fromName} · {fmtAgo(m.createdAt?.toMillis() ?? null, now)}
                      {r?.reply && ` · ${REPLY_LABEL[r.reply]}`}
                      {m.assignmentId && " · bấm để mở bài"}
                    </span>
                  </span>
                  {unread && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-blue" aria-label="Chưa đọc" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Các bài trong chương đang học: đã học (✓) · đang học (nút Xem trước) · sắp học (khoá) */
function ChapterPath({ curLessonId, prepped }: { curLessonId: string | null | undefined; prepped?: Record<string, number> }) {
  const ch = chapterOf(curLessonId);
  if (!ch) return null;
  const at = ch.lessons.findIndex((l) => l.id === curLessonId);
  return (
    <section className="px-5 pt-6">
      <h2 className="text-lg font-extrabold">
        Chương {ch.no}: {ch.vi}
      </h2>
      <p className="text-en text-sm font-semibold">
        Chapter {ch.no}: {ch.en}
      </p>
      <ol className="relative mt-4 space-y-3 before:absolute before:top-4 before:bottom-4 before:left-[22px] before:w-1 before:rounded-full before:bg-line">
        {ch.lessons.map((l, i) => {
          const state = i < at ? "done" : i === at ? "current" : "locked";
          const body = (
            <>
              <span
                className={cn(
                  "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl font-display font-extrabold",
                  state === "current" ? "bg-teal text-white shadow-[0_4px_0_var(--color-teal-dk)]" : state === "done" ? "bg-blue-soft text-blue-dk" : "border-2 border-line bg-white text-ink-2/50"
                )}
              >
                {state === "locked" ? <Lock className="size-4" /> : state === "done" ? <Check className="size-5" /> : l.no}
              </span>
              <div className={cn("flex-1 rounded-2xl px-3 py-2", state === "current" && "bg-white ring-2 ring-teal/30")}>
                <p className="text-en text-sm font-semibold">{l.en}</p>
                <p className="text-vi text-xs">
                  Bài {l.no}. {l.vi}
                </p>
                {state === "current" && (
                  <p className="mt-1 text-xs font-bold text-teal">{prepped?.[l.id] ? "✓ Đã xem trước · bấm để xem lại" : `Xem trước bài · +${XP.prep} XP`}</p>
                )}
              </div>
            </>
          );
          return (
            <li key={l.id}>
              {state === "locked" ? (
                <div className="relative flex items-center gap-3">{body}</div>
              ) : (
                <Link href={`/s/prep/${l.id}`} className="relative flex items-center gap-3">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function greeting(now: number) {
  const h = new Date(now || 0).getHours();
  if (h < 11) return { en: "Good morning", vi: "Chào buổi sáng" };
  if (h < 18) return { en: "Good afternoon", vi: "Chào buổi chiều" };
  return { en: "Good evening", vi: "Chào buổi tối" };
}

function StudentHome() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { uid, classId, me, cls } = useStudent();
  const { data: liveSession } = useLiveSessionForClass(classId);
  const { data: stats } = useMyStats(classId, uid);
  const { data: hw } = useMyAssignments(uid);
  const subs = useSubmissionsOf(
    hw.map((a) => a.id),
    uid
  );
  const now = useNow(30_000);
  const g = greeting(now);
  const name = me?.fullName ?? "";
  const doneMin = now ? Math.floor((stats?.studySec?.[vnDayKey(now)] ?? 0) / 60) : 0;
  // Bài cần làm: chưa nộp, chưa quá hạn quá 7 ngày
  const todo = hw.filter((a) => !subs[a.id]?.completedAt && a.dueAt.toMillis() > now - 7 * 86_400_000).slice(0, 3);

  const logout = async () => {
    await signOut();
    router.replace("/s/login");
  };

  return (
    <>
      {/* Đầu trang */}
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <StreakPill days={now ? streak(stats?.days, now) : 0} />
          <XpPill xp={xpTotal(stats)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-blue/30" aria-label="Tài khoản">
            <Avatar name={name || "?"} team={me?.team} className="size-11" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-bold">{name}</p>
              <p className="text-xs text-ink-2">
                Lớp {cls?.name} · Tổ {me?.team}
              </p>
            </div>
            <DropdownMenuItem onClick={logout}>
              <LogOut /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section className="px-5 pt-5">
        <p className="text-en font-display text-lg font-semibold">{g.en},</p>
        <h1 className="text-3xl font-extrabold">
          {g.vi}, {name ? shortName(name) : "…"}!
        </h1>
      </section>

      {/* Hành trình: cấp hiện tại + còn bao nhiêu để lên cấp (bấm để xem xếp hạng) */}
      <section className="px-5 pt-5">
        <Link href="/s/rank" aria-label="Xem hành trình và xếp hạng" className="block">
          <JourneyCard stats={stats} />
        </Link>
      </section>

      <InstallCard />

      {/* Thẻ lớp đang học */}
      <section className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white shadow-[0_6px_0_#000]">
          <div className={cn("absolute -top-10 -right-6 size-36 rounded-full blur-2xl", liveSession ? "bg-sun/40" : "bg-blue/40")} />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">
                <span className={cn("size-2 rounded-full", liveSession ? "animate-pulse bg-coral" : "bg-white/40")} /> Lớp {cls?.name ?? "…"}
                {liveSession && " · Đang học"}
              </span>
              <p className="mt-3 font-display text-xl font-extrabold">{liveSession ? liveSession.lessonTitle?.vi : "Chưa có tiết nào đang diễn ra"}</p>
              <p className="mt-1 text-sm text-white/60">
                {liveSession ? liveSession.lessonTitle?.en : "Khi thầy cô bắt đầu tiết học, nút “Vào lớp” sẽ sáng lên."}
              </p>
            </div>
            <Tam mood={liveSession ? "cheer" : "sleepy"} className="size-20 shrink-0" />
          </div>
          {liveSession ? (
            <Link href="/s/live" className={cn(buttonVariants({ variant: "sun", size: "lg" }), "relative mt-4 w-full")}>
              <Play className="fill-current" /> Vào lớp
            </Link>
          ) : (
            <Button variant="sun" size="lg" className="relative mt-4 w-full" disabled>
              <Play className="fill-current" /> Vào lớp
            </Button>
          )}
        </div>
      </section>

      {/* Mục tiêu ngày */}
      <section className="px-5 pt-5">
        <div className="card-lsn flex items-center gap-4 p-4">
          <GoalRing value={doneMin} max={DAILY_GOAL_MIN} />
          <div className="flex-1">
            <p className="font-display text-lg font-extrabold">Mục tiêu hôm nay</p>
            <p className="text-sm text-ink-2">
              Học {DAILY_GOAL_MIN} phút · đã học <b className="text-ink">{doneMin} phút</b>
            </p>
            <p className="text-vi mt-0.5 text-xs">Daily goal: {DAILY_GOAL_MIN} minutes</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/s/cards" className="card-lsn flex items-center gap-2.5 p-3 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-soft text-[#0E6377]">
              <Layers className="size-5" />
            </span>
            Ôn từ vựng
          </Link>
          <Link href="/s/speak" className="card-lsn flex items-center gap-2.5 p-3 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-coral-soft text-[#A3301B]">
              <Mic className="size-5" />
            </span>
            Luyện nói
          </Link>
        </div>
      </section>

      {/* Bài đến hạn */}
      <section className="px-5 pt-6">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-extrabold">Bài cần làm</h2>
          <Link href="/s/learn" className="text-sm font-bold text-blue">
            Tất cả
          </Link>
        </div>
        {todo.length === 0 ? (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Em đã làm hết bài được giao. Giỏi lắm!</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {todo.map((a) => (
              <HwCard key={a.id} a={a} sub={subs[a.id]} now={now} />
            ))}
          </div>
        )}
      </section>

      {/* Lộ trình chương: theo bài lớp đang học (GV chọn ở tab Thành thạo) */}
      <ChapterPath curLessonId={cls?.curLessonId} prepped={stats?.prepped} />


      {/* Tin nhắn GV */}
      <StudentMessages />
    </>
  );
}

function GoalRing({ value, max }: { value: number; max: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" role="img" aria-label={`${value}/${max} phút`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-line)" strokeWidth="8" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-sun)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      <text x="32" y="37" textAnchor="middle" className="rotate-90 fill-ink font-display text-[15px] font-extrabold" style={{ transformOrigin: "32px 32px" }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
