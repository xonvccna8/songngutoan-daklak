"use client";

// Khung trang HS trên điện thoại: kiểm vai trò, hộp tin (Chú ý bật lên mọi trang), thanh điều hướng 4 mục
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, Home, Trophy, User } from "lucide-react";
import { cn } from "cn";
import { RequireRole } from "@/components/require-role";
import { InboxProvider } from "@/components/messages/student-inbox";
import { XpWatcher } from "@/components/progress/level";
import { useAuth } from "@/lib/auth/auth-context";
import { useClass, useMyStudentProfile } from "@/lib/hooks/use-firestore";

const NAV = [
  { href: "/s", label: "Trang chủ", icon: Home },
  { href: "/s/learn", label: "Tự học", icon: BookOpen },
  { href: "/s/rank", label: "Thi đua", icon: Trophy },
  { href: "/s/me", label: "Của em", icon: User },
] as const;

export function StudentShell({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  return (
    <RequireRole roles={["student"]} loginPath="/s/login">
      <WithInbox>
        <div className="bg-app flex min-h-dvh flex-1 justify-center">
          {/* key theo trang → nội dung trượt nhẹ lên khi chuyển trang */}
          <PageRise className={cn("relative flex w-full max-w-md flex-col", nav && "pb-28")}>{children}</PageRise>
          {nav && <BottomNav />}
        </div>
      </WithInbox>
    </RequireRole>
  );
}

function WithInbox({ children }: { children: React.ReactNode }) {
  const { user, claims } = useAuth();
  if (!user) return <>{children}</>;
  return (
    <InboxProvider uid={user.uid}>
      {children}
      {/* "+XP" và chúc mừng lên cấp hiện ở mọi trang của HS */}
      <XpWatcher classId={claims.classIds?.[0]} uid={user.uid} />
    </InboxProvider>
  );
}

function PageRise({ className, children }: { className?: string; children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div key={path} className={cn("animate-rise", className)}>
      {children}
    </div>
  );
}

function BottomNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/s" ? path === "/s" : path.startsWith(href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="grid grid-cols-4 gap-1 rounded-[26px] border border-white/70 bg-white/85 p-1.5 shadow-[0_12px_32px_-12px_rgba(20,83,45,.45)] backdrop-blur-xl">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "group flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] font-bold transition-all duration-200",
              active(n.href)
                ? "bg-gradient-to-br from-[#22C55E] to-[#15803D] text-white shadow-[0_6px_16px_-6px_rgba(21,128,61,.7)]"
                : "text-ink-2 hover:bg-[#ECFDF3] hover:text-[#15803D]"
            )}
            aria-current={active(n.href) ? "page" : undefined}
          >
            <n.icon className={cn("size-5 transition-transform duration-200", active(n.href) ? "scale-110" : "group-hover:-translate-y-0.5")} />
            {n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Đầu trang con: nút quay lại + tiêu đề song ngữ */
export function StudentHeader({ en, vi, back = "/s/learn", right }: { en: string; vi: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="relative mx-3 mt-3 flex items-center gap-3 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#15803D] via-[#16A34A] to-[#0891B2] px-3.5 py-4 text-white shadow-[0_14px_30px_-16px_rgba(21,128,61,.8)]">
      {/* Trang trí: lưới mờ + hình học */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[.12]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      <span aria-hidden className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-white/15 blur-2xl" />
      <Link href={back} className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/30" aria-label="Quay lại">
        <ArrowLeft className="size-5" />
      </Link>
      <div className="relative min-w-0 flex-1">
        <h1 className="truncate text-2xl leading-tight font-extrabold text-white">{vi}</h1>
        <p className="truncate text-sm font-semibold text-white/85">{en}</p>
      </div>
      {right && <div className="relative">{right}</div>}
    </header>
  );
}

/** Thông tin HS đang đăng nhập (dùng trong StudentShell) */
export function useStudent() {
  const { user, claims } = useAuth();
  const classId = claims.classIds?.[0];
  const { data: me } = useMyStudentProfile(classId, user?.uid);
  const { data: cls } = useClass(classId);
  return { uid: user?.uid, classId, me, cls };
}
