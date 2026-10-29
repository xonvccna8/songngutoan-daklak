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
        <div className="flex min-h-dvh flex-1 justify-center bg-paper">
          <div className={cn("relative flex w-full max-w-md flex-col", nav && "pb-28")}>{children}</div>
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

function BottomNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/s" ? path === "/s" : path.startsWith(href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="grid grid-cols-4 rounded-3xl border-2 border-line bg-white/95 p-1.5 shadow-[0_8px_30px_-10px_rgba(28,27,58,.25)] backdrop-blur">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold transition-colors",
              active(n.href) ? "bg-blue-soft text-blue-dk" : "text-ink-2 hover:bg-paper"
            )}
            aria-current={active(n.href) ? "page" : undefined}
          >
            <n.icon className="size-5" />
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
    <header className="flex items-center gap-3 px-5 pt-5">
      <Link href={back} className="grid size-11 shrink-0 place-items-center rounded-2xl border-2 border-line bg-white text-ink-2 hover:text-ink" aria-label="Quay lại">
        <ArrowLeft className="size-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl leading-tight font-extrabold">{vi}</h1>
        <p className="text-en truncate text-sm font-semibold">{en}</p>
      </div>
      {right}
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
