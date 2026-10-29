"use client";

// Danh sách học sinh: tìm kiếm, lọc theo tổ, đổi tổ, sửa tên, đặt lại PIN, xoá
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, MoreHorizontal, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, EmptyState, teamColor } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { saveSlips } from "@/lib/slips";
import type { ClassDoc, PinSlip, StudentDoc } from "@/lib/types";

export function StudentList({ cls, students, onAdd }: { cls: ClassDoc; students: StudentDoc[]; onAdd: () => void }) {
  const router = useRouter();
  const [confirmEl, confirm] = useConfirm();
  const [q, setQ] = useState("");
  const [team, setTeam] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<StudentDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const teams = cls.settings?.teams ?? 4;

  const list = useMemo(() => {
    const k = q.trim().toLocaleLowerCase("vi");
    return students.filter((s) => (!team || s.team === team) && (!k || s.fullName.toLocaleLowerCase("vi").includes(k)));
  }, [students, q, team]);

  const toggle = (uid: string) =>
    setSelected((old) => {
      const n = new Set(old);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  const allChecked = list.length > 0 && list.every((s) => selected.has(s.uid));

  async function changeTeam(s: StudentDoc, t: number) {
    try {
      await api(`/api/classes/${cls.id}/students/${s.uid}`, { method: "PATCH", body: { team: t } });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function resetPins(uids: string[]) {
    const ok = await confirm({
      title: uids.length === 1 ? "Đặt lại PIN cho em này?" : `Đặt lại PIN cho ${uids.length} em?`,
      description: "PIN cũ sẽ không dùng được nữa, các thiết bị đang đăng nhập phải nhập PIN mới. Phiếu mới sẽ mở ra để in.",
      confirmText: "Đặt lại & in phiếu",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { slips } = await api<{ slips: PinSlip[] }>(`/api/classes/${cls.id}/pins`, { body: { uids } });
      saveSlips(cls.id, slips);
      setSelected(new Set());
      router.push(`/teacher/classes/${cls.id}/print`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: StudentDoc) {
    const ok = await confirm({
      title: `Xoá ${s.fullName} khỏi lớp?`,
      description: "Mọi dữ liệu học tập của em trong lớp này cũng sẽ bị xoá. Không thể hoàn tác.",
      confirmText: "Xoá",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/classes/${cls.id}/students/${s.uid}`, { method: "DELETE" });
      toast.success(`Đã xoá ${s.fullName}.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  if (students.length === 0) {
    return (
      <EmptyState
        title="Lớp chưa có học sinh"
        action={
          <Button variant="sun" size="lg" onClick={onAdd} className="mt-2">
            <UserPlus /> Thêm học sinh
          </Button>
        }
      >
        Gõ danh sách hoặc dán thẳng từ Excel. Mỗi em sẽ nhận một mã PIN 6 số để đăng nhập.
      </EmptyState>
    );
  }

  return (
    <div className="card-lsn overflow-hidden">
      {/* Thanh công cụ */}
      <div className="flex flex-col gap-3 border-b-2 border-line p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm học sinh…" className="h-11 rounded-xl border-2 border-line-2 bg-white pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={team === null} onClick={() => setTeam(null)}>
            Tất cả <b>{students.length}</b>
          </Chip>
          {Array.from({ length: teams }, (_, i) => i + 1).map((t) => (
            <Chip key={t} active={team === t} onClick={() => setTeam(t)} color={teamColor(t)}>
              Tổ {t} <b>{students.filter((s) => s.team === t).length}</b>
            </Chip>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-blue-soft px-4 py-2.5 text-sm font-semibold text-blue-dk">
          Đã chọn {selected.size} em
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Bỏ chọn
            </Button>
            <Button size="sm" onClick={() => resetPins([...selected])} disabled={busy}>
              <KeyRound /> Đặt lại PIN
            </Button>
          </div>
        </div>
      )}

      {/* Bảng */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-ink-2">
              <th className="w-10 py-3 pl-4">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả"
                  checked={allChecked}
                  onChange={() => setSelected(allChecked ? new Set() : new Set(list.map((s) => s.uid)))}
                  className="size-4 accent-blue"
                />
              </th>
              <th className="w-12 py-3">STT</th>
              <th className="py-3">Họ tên</th>
              <th className="w-36 py-3">Tổ</th>
              <th className="w-14 py-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.uid} className={cn("border-t border-line transition-colors hover:bg-paper/70", selected.has(s.uid) && "bg-blue-soft/40")}>
                <td className="py-2.5 pl-4">
                  <input type="checkbox" aria-label={`Chọn ${s.fullName}`} checked={selected.has(s.uid)} onChange={() => toggle(s.uid)} className="size-4 accent-blue" />
                </td>
                <td className="py-2.5 font-display font-bold text-ink-2">{s.number}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.fullName} team={s.team} className="size-9 text-xs" />
                    <span className="font-semibold">{s.fullName}</span>
                  </div>
                </td>
                <td className="py-2.5">
                  <select
                    value={s.team}
                    onChange={(e) => changeTeam(s, Number(e.target.value))}
                    className="h-9 rounded-lg border-2 border-line-2 bg-white px-2 text-sm font-semibold"
                    style={{ color: teamColor(s.team) }}
                    aria-label={`Tổ của ${s.fullName}`}
                  >
                    {Array.from({ length: teams }, (_, i) => i + 1).map((t) => (
                      <option key={t} value={t}>
                        Tổ {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-ink/5" aria-label="Thao tác">
                      <MoreHorizontal className="size-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setEditing(s)}>
                        <Pencil /> Sửa họ tên
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => resetPins([s.uid])}>
                        <KeyRound /> Đặt lại PIN
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => remove(s)}>
                        <Trash2 /> Xoá khỏi lớp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-10 text-center text-sm text-ink-2">Không có học sinh phù hợp.</p>}
      </div>

      <EditNameDialog cls={cls} student={editing} onClose={() => setEditing(null)} />
      {confirmEl}
    </div>
  );
}

function Chip({ active, color, children, onClick }: { active: boolean; color?: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-semibold transition-colors",
        active ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink/30"
      )}
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

function EditNameDialog({ cls, student, onClose }: { cls: ClassDoc; student: StudentDoc | null; onClose: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastUid, setLastUid] = useState<string | null>(null);
  // Nạp tên hiện tại mỗi khi mở cho một em khác
  if (student && student.uid !== lastUid) {
    setLastUid(student.uid);
    setName(student.fullName);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setBusy(true);
    try {
      await api(`/api/classes/${cls.id}/students/${student.uid}`, { method: "PATCH", body: { fullName: name } });
      toast.success("Đã cập nhật họ tên.");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!student}
      onOpenChange={(o) => {
        if (!o) {
          setLastUid(null);
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-3xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">Sửa họ tên</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus className="h-12 rounded-xl border-2 border-line-2 bg-white text-base" />
          <Button type="submit" className="w-full" disabled={busy || name.trim().length < 2}>
            Lưu
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
