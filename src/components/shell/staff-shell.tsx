"use client";

// Khung trang GV/quản trị: thanh bên nền trắng (menu chia nhóm + danh sách lớp) + vùng nội dung
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookA, BookOpen, Database, FileCheck2, Gamepad2, LayoutGrid, Library, Lightbulb, LogOut, Menu, NotebookPen, Plus, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { cn } from "cn";
import { Logo } from "@/components/brand/logo";
import { CreateClassDialog } from "@/components/teacher/create-class-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useMyClasses } from "@/lib/hooks/use-firestore";

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut } = useAuth();
  const { data: classes } = useMyClasses();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Màn điều khiển tiết học cần toàn bộ chiều ngang → không có sidebar
  if (pathname.startsWith("/teacher/session/")) return <div className="flex min-h-dvh flex-1 flex-col">{children}</div>;

  // Menu chia nhóm cho dễ tìm
  const groups: { title: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
    {
      title: "Dạy học",
      items: [
        { href: "/teacher", label: "Trang chủ", icon: LayoutGrid },
        { href: "/teacher/lessons", label: "Bài giảng", icon: BookOpen },
        { href: "/teacher/questions", label: "Ngân hàng câu hỏi", icon: Database },
        { href: "/teacher/play", label: "Trò chơi ôn tập", icon: Gamepad2 },
      ],
    },
    {
      title: "Học liệu",
      items: [
        { href: "/teacher/terms", label: "Thuật ngữ theo bài", icon: BookA },
        { href: "/teacher/notebook", label: "Vở ghi · PowerPoint", icon: NotebookPen },
        { href: "/teacher/library", label: "Học liệu số · Hình học động", icon: Library },
        { href: "/teacher/stem", label: "Dự án STEM", icon: Lightbulb },
      ],
    },
    {
      title: "Lớp học & theo dõi",
      items: [
        { href: "/teacher/community", label: "Cộng đồng học tập", icon: Users },
        { href: "/teacher/tutor", label: "Trợ lý AI (nhật kí)", icon: Sparkles },
        { href: "/teacher/evidence", label: "Minh chứng", icon: FileCheck2 },
        ...(role === "admin" ? [{ href: "/admin", label: "Quản trị trường", icon: ShieldCheck }] : []),
      ],
    },
  ];

  const sidebar = (
    <div className="flex h-full flex-col border-r border-line bg-white">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Logo href="/teacher" />
        <button className="rounded-lg p-1.5 text-ink-2 hover:bg-paper lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {groups.map((g) => (
          <nav key={g.title} className="mt-3" aria-label={g.title}>
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-ink-2/70 uppercase">{g.title}</p>
            <div className="space-y-0.5">
              {g.items.map((n) => {
                const active = pathname === n.href || (n.href !== "/teacher" && pathname.startsWith(n.href + "/"));
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active ? "bg-blue-soft font-semibold text-blue-dk" : "text-ink-2 hover:bg-paper hover:text-ink"
                    )}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-blue" />}
                    <n.icon className={cn("size-[18px]", active ? "text-blue" : "text-ink-2/80")} /> {n.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        ))}

        <div className="mt-5 flex items-center justify-between px-3 pb-1 text-[11px] font-semibold tracking-wider text-ink-2/70 uppercase">
          Lớp của tôi
          <button onClick={() => setCreating(true)} className="rounded-md p-1 text-ink-2 hover:bg-paper hover:text-blue" aria-label="Tạo lớp">
            <Plus className="size-4" />
          </button>
        </div>
        <nav className="space-y-0.5" aria-label="Lớp của tôi">
          {classes.map((c, i) => {
            const href = `/teacher/classes/${c.id}`;
            const active = pathname.startsWith(href);
            const dot = ["#16A34A", "#E8492E", "#0891B2", "#E0A800"][i % 4];
            return (
              <Link
                key={c.id}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-blue-soft font-semibold text-blue-dk" : "text-ink-2 hover:bg-paper hover:text-ink"
                )}
              >
                <span className="size-2.5 rounded-full" style={{ background: dot }} />
                <span className="flex-1 truncate">Lớp {c.name}</span>
                <span className="rounded-md bg-paper px-1.5 py-0.5 text-[11px] font-semibold text-ink-2 tabular-nums">{c.studentCount ?? 0}</span>
              </Link>
            );
          })}
          {classes.length === 0 && <p className="px-3 py-2 text-xs text-ink-2">Chưa có lớp nào.</p>}
        </nav>
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-blue-soft font-display text-sm font-extrabold text-blue-dk">
            {(user?.displayName || user?.email || "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.displayName || "Giáo viên"}</p>
            <p className="truncate text-xs text-ink-2">{role === "admin" ? "Quản trị" : "Giáo viên"}</p>
          </div>
          <button
            onClick={() => signOut().then(() => router.replace("/login"))}
            className="rounded-lg p-2 text-ink-2 hover:bg-paper hover:text-coral"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {/* Menu trượt trên màn hình nhỏ */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-ink/5" aria-label="Mở menu">
            <Menu className="size-5" />
          </button>
          <Logo href="/teacher" sub={false} />
        </header>
        <main className="flex-1">{children}</main>
      </div>

      <CreateClassDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
