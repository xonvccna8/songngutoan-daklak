"use client";

// Tab Bảng điểm: học sinh × tiết học, tổng & trung bình, xuất Excel
import { useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import type { SheetData } from "write-excel-file/browser";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/common";
import { gradebook } from "@/lib/analytics";
import type { SessionDoc } from "@/lib/live/types";
import type { ClassDoc, StudentDoc } from "@/lib/types";

export function Gradebook({ cls, students, sessions }: { cls: ClassDoc; students: StudentDoc[]; sessions: SessionDoc[] }) {
  const [busy, setBusy] = useState(false);
  const { cols, rows } = gradebook(
    sessions,
    students.map((s) => s.uid)
  );
  const byUid = new Map(students.map((s) => [s.uid, s]));

  async function exportExcel() {
    setBusy(true);
    try {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const head = { fontWeight: "bold" as const, backgroundColor: "#E3EAFF" };
      const data = [
        [
          { value: "STT", ...head },
          { value: "Họ tên", ...head },
          { value: "Tổ", ...head },
          ...cols.map((c) => ({ value: `${c.label} · ${c.title}`, ...head, wrap: true })),
          { value: "Tổng điểm", ...head },
          { value: "Điểm TB/tiết", ...head },
          { value: "Số tiết vắng", ...head },
        ],
        ...rows.map((r) => {
          const s = byUid.get(r.uid)!;
          return [
            { value: s.number, type: Number },
            { value: s.fullName, type: String },
            { value: s.team, type: Number },
            ...r.cells.map((c) => (c ? { value: c.points, type: Number } : { value: "vắng", type: String, textColor: "#A3301B" })),
            { value: r.total, type: Number, fontWeight: "bold" as const },
            r.avg == null ? null : { value: r.avg, type: Number },
            { value: r.absent, type: Number },
          ];
        }),
      ];
      const date = new Date().toISOString().slice(0, 10);
      await writeXlsxFile(data as SheetData, {
        sheet: `Lớp ${cls.name}`,
        stickyRowsCount: 1,
        stickyColumnsCount: 2,
        columns: [{ width: 6 }, { width: 26 }, { width: 6 }, ...cols.map(() => ({ width: 16 })), { width: 11 }, { width: 12 }, { width: 12 }],
      }).toFile(`Bang-diem-lop-${cls.name}-${date}.xlsx`);
      toast.success("Đã tải file Excel bảng điểm.");
    } catch {
      toast.error("Không tạo được file Excel.");
    } finally {
      setBusy(false);
    }
  }

  if (cols.length === 0) {
    return <EmptyState title="Chưa có tiết học nào kết thúc">Sau mỗi tiết dạy (bấm “Kết thúc tiết”), điểm của từng em sẽ hiện ở đây.</EmptyState>;
  }

  const sorted = [...rows].sort((a, b) => (byUid.get(a.uid)?.number ?? 0) - (byUid.get(b.uid)?.number ?? 0));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          {cols.length} tiết · ô trống = vắng · tô màu theo tỉ lệ đúng trong tiết
        </p>
        <Button variant="teal" onClick={exportExcel} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Xuất Excel
        </Button>
      </div>
      <div className="card-lsn overflow-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-ink-2">
              <th className="sticky left-0 z-10 bg-white py-3 pr-3 pl-4">Học sinh</th>
              {cols.map((c) => (
                <th key={c.id} className="px-2 py-3 text-center whitespace-nowrap" title={c.title}>
                  <span className="block">{c.label}</span>
                  <span className="block max-w-24 truncate font-normal">{c.title}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-right">Tổng</th>
              <th className="px-3 py-3 text-right">TB</th>
              <th className="py-3 pr-4 pl-2 text-right">Vắng</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const s = byUid.get(r.uid)!;
              return (
                <tr key={r.uid} className="border-t border-line hover:bg-paper/60">
                  <td className="sticky left-0 z-10 bg-white py-2 pr-3 pl-4">
                    <Link href={`/teacher/classes/${cls.id}/students/${r.uid}`} className="flex items-center gap-2 font-semibold hover:text-blue">
                      <span className="w-5 text-right text-xs text-ink-2">{s.number}</span>
                      <Avatar name={s.fullName} team={s.team} className="size-7 text-[10px]" />
                      <span className="whitespace-nowrap">{s.fullName}</span>
                    </Link>
                  </td>
                  {r.cells.map((c, i) => {
                    const rate = c && c.answered ? c.correct / c.answered : null;
                    return (
                      <td key={i} className="px-1 py-1.5 text-center">
                        {c ? (
                          <span
                            className={cn(
                              "inline-block min-w-12 rounded-lg px-2 py-1 font-display font-bold tabular-nums",
                              rate == null ? "bg-paper" : rate >= 0.8 ? "bg-teal-soft text-[#0A6F5F]" : rate >= 0.5 ? "bg-blue-soft text-blue-dk" : "bg-sun-soft text-[#8A5A00]"
                            )}
                            title={`${c.correct}/${c.answered} câu đúng`}
                          >
                            {c.points}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-2/50">vắng</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-display font-extrabold tabular-nums">{r.total.toLocaleString("vi-VN")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.avg ?? "—"}</td>
                  <td className={cn("py-2 pr-4 pl-2 text-right tabular-nums", r.absent > 1 && "font-bold text-coral-dk")}>{r.absent}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap gap-3 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1">
          <i className="size-3 rounded bg-teal-soft" /> ≥ 80% đúng
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="size-3 rounded bg-blue-soft" /> 50–79%
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="size-3 rounded bg-sun-soft" /> dưới 50%
        </span>
      </p>
    </div>
  );
}
