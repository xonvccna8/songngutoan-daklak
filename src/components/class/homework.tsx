"use client";

// Tab Bài tập của lớp: danh sách bài đã giao + tiến độ (đã nộp / trễ / chưa nộp), mở ra xem từng em
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ClipboardList, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { HwStatusChip } from "@/components/student/hw-card";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { fmtDue, fmtMinutes } from "@/lib/format";
import { hwStatus } from "@/lib/study/hw";
import { useClassAssignments, useSubmissions } from "@/lib/study/hooks";
import type { AssignmentDoc } from "@/lib/study/types";
import type { ClassDoc, StudentDoc } from "@/lib/types";

export function Homework({ cls, students, now }: { cls: ClassDoc; students: StudentDoc[]; now: number }) {
  const { data: list, loading } = useClassAssignments(cls.id);
  const [assigning, setAssigning] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">Bài về nhà tự chấm. Thời gian làm bài chỉ tính khi em thật sự thao tác trên trang.</p>
        <Button onClick={() => setAssigning(true)} disabled={!students.length}>
          <Plus /> Giao bài
        </Button>
      </div>
      {loading ? null : list.length === 0 ? (
        <EmptyState title="Chưa giao bài nào" action={<Button onClick={() => setAssigning(true)}>Giao bài đầu tiên</Button>}>
          Chọn câu từ tiết đã dạy, đặt hạn nộp — học sinh làm trên điện thoại ở nhà.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((a) => (
            <AssignmentRow key={a.id} a={a} students={students} now={now} open={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)} />
          ))}
        </ul>
      )}
      {assigning && <AssignDialog cls={cls} students={students} open onOpenChange={setAssigning} />}
    </div>
  );
}

function AssignmentRow({ a, students, now, open, onToggle }: { a: AssignmentDoc; students: StudentDoc[]; now: number; open: boolean; onToggle: () => void }) {
  const subs = useSubmissions(a.id);
  const [confirmEl, confirm] = useConfirm();
  const due = a.dueAt.toMillis();
  const assigned = students.filter((s) => a.toUids.includes(s.uid));
  const statuses = assigned.map((s) => hwStatus(subs.get(s.uid), due, now));
  const n = (k: string) => statuses.filter((x) => x === k).length;
  const submitted = subs.size ? [...subs.values()].filter((s) => s.completedAt) : [];
  const avg = submitted.length ? Math.round(submitted.reduce((x, s) => x + s.score, 0) / submitted.length) : null;
  const pctDone = assigned.length ? Math.round(((n("done") + n("late")) / assigned.length) * 100) : 0;

  async function remove() {
    const ok = await confirm({ title: `Xoá bài “${a.title.vi}”?`, description: "Bài làm của học sinh cũng bị xoá. Điểm đã cộng vẫn giữ.", confirmText: "Xoá bài", danger: true });
    if (!ok) return;
    try {
      await api(`/api/assignments/${a.id}`, { method: "DELETE" });
      toast.success("Đã xoá bài.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <li className="card-lsn overflow-hidden">
      <button onClick={onToggle} className="flex w-full flex-wrap items-center gap-4 p-4 text-left hover:bg-paper/50">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk">
          <ClipboardList className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate">{a.title.vi}</b>
          <span className="text-xs text-ink-2">
            {a.items.length} câu · {a.toLabel} · hạn {fmtDue(due)}
            {now > due ? " · đã hết hạn" : ""}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs">
          <HwStatusChip s="done" /> {n("done")}
          <HwStatusChip s="late" /> {n("late")}
          <HwStatusChip s={now > due ? "missed" : "todo"} /> {n("missed") + n("todo") + n("doing")}
        </span>
        <span className="w-28 text-right">
          <b className="block font-display text-xl tabular-nums">{pctDone}%</b>
          <span className="text-xs text-ink-2">đã nộp{avg != null ? ` · TB ${avg}đ` : ""}</span>
        </span>
        {open ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
      </button>
      {open && (
        <div className="overflow-x-auto border-t-2 border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-ink-2">
                <th className="py-2 pl-4">Học sinh</th>
                <th className="py-2">Trạng thái</th>
                <th className="py-2 text-right">Đã làm</th>
                <th className="py-2 text-right">Đúng</th>
                <th className="py-2 text-right">Xem lời giải</th>
                <th className="py-2 text-right">Thời gian</th>
                <th className="py-2 pr-4 text-right">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((s, i) => {
                const sub = subs.get(s.uid);
                return (
                  <tr key={s.uid} className="border-t border-line">
                    <td className="py-2 pl-4">
                      <Link href={`/teacher/classes/${a.classId}/students/${s.uid}`} className="flex items-center gap-2 font-semibold hover:text-blue">
                        <Avatar name={s.fullName} team={s.team} className="size-7 text-[10px]" /> {s.fullName}
                      </Link>
                    </td>
                    <td className="py-2">
                      <HwStatusChip s={statuses[i]} />
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {sub?.answered ?? 0}/{a.items.length}
                    </td>
                    <td className="py-2 text-right tabular-nums">{sub ? sub.correct : "—"}</td>
                    <td className={cn("py-2 text-right tabular-nums", Object.keys(sub?.solutionViewed ?? {}).length > 1 && "font-bold text-[#8A5A00]")}>
                      {Object.keys(sub?.solutionViewed ?? {}).length || "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">{sub?.activeSeconds ? fmtMinutes(sub.activeSeconds) : "—"}</td>
                    <td className="py-2 pr-4 text-right font-display font-extrabold tabular-nums">{sub ? sub.score : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end p-3">
            <Button variant="destructive" size="sm" onClick={remove}>
              <Trash2 /> Xoá bài
            </Button>
          </div>
        </div>
      )}
      {confirmEl}
    </li>
  );
}
