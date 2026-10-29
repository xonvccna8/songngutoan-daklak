"use client";

// Quản trị trường: duyệt tài khoản giáo viên, xem tất cả lớp
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Clock, Loader2, RefreshCw, ShieldCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { useMyClasses } from "@/lib/hooks/use-firestore";
import type { UserDoc } from "@/lib/types";
import { KindChip } from "@/components/messages/message-feed";
import { useSchoolMessages } from "@/lib/messages/hooks";

const ROLE_CHIP: Record<string, { label: string; cls: string }> = {
  admin: { label: "Quản trị", cls: "bg-ink text-white" },
  teacher: { label: "Giáo viên", cls: "bg-teal-soft text-[#0E6377]" },
  pending: { label: "Chờ duyệt", cls: "bg-sun-soft text-[#8A5A00]" },
};

export default function AdminPage() {
  const { user, claims } = useAuth();
  const { data: classes } = useMyClasses();
  const log = useSchoolMessages(claims.schoolId);
  const [users, setUsers] = useState<UserDoc[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [confirmEl, confirm] = useConfirm();

  const load = useCallback(
    () =>
      api<{ users: UserDoc[] }>("/api/admin/users")
        .then((r) => setUsers(r.users))
        .catch((e) => {
          toast.error(errorMessage(e));
          setUsers([]);
        }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  async function setRole(u: UserDoc, role: "teacher" | "admin" | "pending") {
    if (role !== "teacher") {
      const ok = await confirm({
        title: role === "admin" ? `Cấp quyền quản trị cho ${u.displayName}?` : `Thu hồi quyền của ${u.displayName}?`,
        description: role === "admin" ? "Quản trị có thể duyệt giáo viên và xem mọi lớp trong trường." : "Tài khoản sẽ trở về trạng thái chờ duyệt.",
        confirmText: role === "admin" ? "Cấp quyền" : "Thu hồi",
        danger: role === "pending",
      });
      if (!ok) return;
    }
    setWorking(u.uid);
    try {
      await api(`/api/admin/users/${u.uid}`, { body: { role } });
      toast.success("Đã cập nhật quyền.");
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setWorking(null);
    }
  }

  const pending = users?.filter((u) => u.role === "pending") ?? [];
  const staff = users?.filter((u) => u.role !== "pending") ?? [];
  const teacherName = (uid: string) => users?.find((u) => u.uid === uid)?.displayName ?? "—";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-2">
            <ShieldCheck className="size-4" /> Quản trị trường
          </p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Giáo viên & lớp học</h1>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw /> Tải lại
        </Button>
      </div>

      {/* Chờ duyệt */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold">
          <Clock className="size-5 text-sun-dk" /> Chờ duyệt
          {pending.length > 0 && <span className="rounded-full bg-sun px-2 py-0.5 text-sm text-ink">{pending.length}</span>}
        </h2>
        {users === null ? (
          <div className="card-lsn h-24 animate-pulse" />
        ) : pending.length === 0 ? (
          <p className="card-lsn px-5 py-4 text-sm text-ink-2">Không có tài khoản nào đang chờ.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {pending.map((u) => (
              <li key={u.uid} className="card-lsn flex items-center gap-3 border-sun/60 p-4">
                <Initial name={u.displayName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{u.displayName}</p>
                  <p className="truncate text-sm text-ink-2">{u.email}</p>
                </div>
                <Button size="sm" variant="teal" onClick={() => setRole(u, "teacher")} disabled={working === u.uid}>
                  {working === u.uid ? <Loader2 className="animate-spin" /> : <Check />} Duyệt
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Nhân sự */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-extrabold">Giáo viên trong trường</h2>
        <div className="card-lsn overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-ink-2">
                <th className="py-3 pl-5">Họ tên</th>
                <th className="py-3">Vai trò</th>
                <th className="py-3">Số lớp</th>
                <th className="py-3 pr-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => {
                const chip = ROLE_CHIP[u.role] ?? ROLE_CHIP.pending;
                const me = u.uid === user?.uid;
                return (
                  <tr key={u.uid} className="border-t border-line">
                    <td className="py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <Initial name={u.displayName} />
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {u.displayName} {me && <span className="text-xs text-ink-2">(bạn)</span>}
                          </p>
                          <p className="text-xs text-ink-2">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", chip.cls)}>{chip.label}</span>
                    </td>
                    <td className="py-3 font-display font-bold">{u.classIds?.length ?? 0}</td>
                    <td className="py-3 pr-5 text-right">
                      {!me && (
                        <div className="flex justify-end gap-1.5">
                          {u.role === "teacher" && (
                            <Button size="sm" variant="ghost" onClick={() => setRole(u, "admin")} disabled={working === u.uid}>
                              <ShieldCheck /> Làm quản trị
                            </Button>
                          )}
                          {u.role === "admin" && (
                            <Button size="sm" variant="ghost" onClick={() => setRole(u, "teacher")} disabled={working === u.uid}>
                              Về giáo viên
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => setRole(u, "pending")} disabled={working === u.uid}>
                            <UserX /> Thu hồi
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lớp */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-extrabold">Tất cả lớp ({classes.length})</h2>
        {classes.length === 0 ? (
          <EmptyState title="Trường chưa có lớp nào">Giáo viên tạo lớp từ trang chủ của mình.</EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id}>
                <Link href={`/teacher/classes/${c.id}`} className="card-lsn flex items-center gap-3 p-4 transition-colors hover:border-blue">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-ink font-display font-extrabold text-white">{c.name}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      Lớp {c.name} <span className="font-mono text-xs text-ink-2">· {c.joinCode}</span>
                    </p>
                    <p className="truncate text-xs text-ink-2">
                      {c.studentCount ?? 0} HS · GV: {c.teacherIds.map(teacherName).join(", ")}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-ink-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* Nhật ký tin nhắn */}
      <section className="mt-10">
        <h2 className="mb-1 text-xl font-extrabold">Nhật ký tin nhắn</h2>
        <p className="mb-3 text-sm text-ink-2">Mọi tin giáo viên gửi học sinh trong trường (100 tin gần nhất).</p>
        {log.data.length === 0 ? (
          <p className="card-lsn px-5 py-4 text-sm text-ink-2">Chưa có tin nhắn nào.</p>
        ) : (
          <div className="card-lsn overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-ink-2">
                  <th className="py-3 pl-5">Thời gian</th>
                  <th className="py-3">Loại</th>
                  <th className="py-3">Người gửi</th>
                  <th className="py-3">Gửi tới</th>
                  <th className="py-3 pr-5">Nội dung</th>
                </tr>
              </thead>
              <tbody>
                {log.data.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="py-2.5 pl-5 whitespace-nowrap text-ink-2">{m.createdAt ? new Date(m.createdAt.toMillis()).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                    <td className="py-2.5">
                      <KindChip kind={m.kind} />
                    </td>
                    <td className="py-2.5">{m.fromName}</td>
                    <td className="py-2.5">{m.toLabel}</td>
                    <td className="max-w-80 truncate py-2.5 pr-5" title={`${m.text.vi} / ${m.text.en}`}>
                      {m.text.vi || m.text.en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {confirmEl}
    </div>
  );
}

function Initial({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-soft font-display font-extrabold text-blue-dk">
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
