"use client";

// Đợt D — Minh chứng theo tiêu chí 3 mức độ (dự thảo): số tiết song ngữ Toán, tỉ lệ tiếng Anh, số HS tham gia, mức E1/E2/E3.
// Chỉ đọc dữ liệu đã có (không ghi gì); tiết Toán cũ đã được ẩn trong useClassSessions.
import { useState } from "react";
import { Download, FileCheck2, Loader2, Printer } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { Chip } from "@/components/messages/compose-dialog";
import { useMyClasses, useStudents } from "@/lib/hooks/use-firestore";
import { useClassSessions } from "@/lib/hooks/use-class-history";
import { EN_SESSION_MIN, LEVEL2_SESSIONS, evidenceCsv, evidenceOf, yearsOf } from "@/lib/live/evidence";
import { schoolYearOf } from "@/lib/live/english";
import { LEVEL_META } from "@/lib/live/elevel";

export default function EvidencePage() {
  const { data: classes, loading } = useMyClasses();
  const [pick, setPick] = useState<string | null>(null);
  const classId = pick ?? classes[0]?.id;
  const cls = classes.find((c) => c.id === classId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
        <FileCheck2 className="size-8 text-blue" /> Minh chứng
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-ink-2">
        Số tiết song ngữ Toán, tỉ lệ tiếng Anh thực tế và số học sinh tham gia — dùng làm minh chứng cho tiêu chí đánh giá trường học theo 3 mức độ khi đưa tiếng Anh thành ngôn ngữ thứ hai. Tiêu chí hiện mới là <b>dự thảo</b>.
      </p>
      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-ink-2">
          <Loader2 className="size-4 animate-spin" /> Đang tải…
        </p>
      ) : !cls ? (
        <div className="mt-6">
          <EmptyState title="Chưa có lớp nào" />
        </div>
      ) : (
        <>
          <div className="no-print mt-5 flex flex-wrap gap-1.5">
            {classes.map((c) => (
              <Chip key={c.id} on={c.id === classId} onClick={() => setPick(c.id)}>
                Lớp {c.name}
              </Chip>
            ))}
          </div>
          <ClassEvidence key={cls.id} classId={cls.id} className={cls.name} />
        </>
      )}
    </div>
  );
}

function ClassEvidence({ classId, className }: { classId: string; className: string }) {
  const { data: sessions, loading } = useClassSessions(classId, 400);
  const { data: students } = useStudents(classId);
  const years = yearsOf(sessions);
  const [yearPick, setYear] = useState<number | null>(null);
  const [thisYear] = useState(() => schoolYearOf(Date.now()));
  const year = yearPick ?? years[0] ?? thisYear;
  const e = evidenceOf(sessions, year);
  const level = (l: "e1" | "e2" | "e3") => students.filter((s) => (s.eLevel ?? "e2") === l).length;
  const progress = Math.min(100, Math.round((e.sessions / LEVEL2_SESSIONS) * 100));
  const fmt = (ms: number) => new Date(ms).toLocaleDateString("vi-VN");

  function downloadCsv() {
    const blob = new Blob([evidenceCsv(e, className)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `minh-chung-lop-${className}-${year}-${year + 1}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading)
    return (
      <p className="mt-6 flex items-center gap-2 text-sm text-ink-2">
        <Loader2 className="size-4 animate-spin" /> Đang tải các tiết…
      </p>
    );
  return (
    <div className="mt-4 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-print flex flex-wrap gap-1.5">
          {(years.length ? years : [year]).map((y) => (
            <Chip key={y} on={y === year} onClick={() => setYear(y)}>
              Năm học {y}–{y + 1}
            </Chip>
          ))}
        </div>
        <h2 className="hidden text-xl font-extrabold print:block">
          Lớp {className} · Năm học {year}–{year + 1}
        </h2>
        <div className="no-print flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> In
          </Button>
          <Button variant="outline" onClick={downloadCsv} disabled={!e.rows.length}>
            <Download /> Tải CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Tiết song ngữ đã dạy" value={e.sessions} />
        <Kpi label={`Tiết tiếng Anh từ ${EN_SESSION_MIN}%`} value={`${e.enSessions}/${e.measured}`} hint="trong số tiết đã đo" />
        <Kpi label="Tỉ lệ tiếng Anh trung bình" value={e.avgEnPct == null ? "—" : `${e.avgEnPct}%`} />
        <Kpi label="Học sinh tham gia" value={`${e.students}/${students.length}`} hint={`${e.participations} lượt`} />
      </div>

      <section className="card-lsn p-4">
        <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">So với mốc Mức 2 (dự thảo: tối thiểu {LEVEL2_SESSIONS} tiết/năm)</h3>
        <div className="h-3 overflow-hidden rounded-full bg-paper">
          <div className="h-full rounded-full bg-blue" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-sm">
          {e.sessions}/{LEVEL2_SESSIONS} tiết ({progress}%). Mức tiếng Anh hiện tại của lớp:{" "}
          {(["e1", "e2", "e3"] as const).map((l) => `${LEVEL_META[l].label} ${level(l)} em`).join(" · ")}.
        </p>
        <p className="mt-1 text-xs text-ink-2">Đây là số tiết song ngữ Toán của một lớp trên app; mốc của tiêu chí tính cho cả trường và mọi môn. Tỉ lệ tiếng Anh: tiếng Anh tính đủ, song ngữ tính một nửa, tiếng Việt không tính.</p>
      </section>

      {e.months.length > 0 && (
        <section className="card-lsn p-4">
          <h3 className="mb-3 text-xs font-bold tracking-wider text-ink-2 uppercase">Theo tháng</h3>
          <ul className="space-y-2 text-sm">
            {e.months.map((m) => (
              <li key={m.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 font-semibold tabular-nums">{m.key.split("-").reverse().join("/")}</span>
                <span className="w-16 shrink-0 text-ink-2">{m.n} tiết</span>
                <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-paper">
                  <span className="block h-full rounded-full bg-sun" style={{ width: `${m.avgEnPct ?? 0}%` }} />
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums">{m.avgEnPct == null ? "chưa đo" : `${m.avgEnPct}% tiếng Anh`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card-lsn overflow-x-auto">
        {e.rows.length ? (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-ink-2">
                <th className="py-3 pl-4">Ngày</th>
                <th className="py-3">Bài</th>
                <th className="py-3 text-right">Học sinh</th>
                <th className="py-3 text-right">Số phút đo</th>
                <th className="py-3 text-right">Tiếng Anh</th>
                <th className="py-3 pr-4 text-right">Không xem tiếng Việt</th>
              </tr>
            </thead>
            <tbody>
              {[...e.rows].reverse().map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-2 pl-4 tabular-nums">{fmt(r.at)}</td>
                  <td className="py-2 font-semibold">{r.title}</td>
                  <td className="py-2 text-right tabular-nums">{r.participants}</td>
                  <td className="py-2 text-right tabular-nums">{r.minutes ?? "—"}</td>
                  <td className={cn("py-2 text-right font-bold tabular-nums", r.enPct != null && r.enPct >= EN_SESSION_MIN && "text-success-fg")}>{r.enPct == null ? "—" : `${r.enPct}%`}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{r.noViPct == null ? "—" : `${r.noViPct}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-sm text-ink-2">Năm học này lớp chưa có tiết song ngữ nào đã kết thúc.</p>
        )}
      </div>
      <p className="text-xs text-ink-2">Tiết dạy trước khi có tính năng đo (Đợt D) hiện “—” ở cột tiếng Anh nhưng vẫn được tính vào số tiết. Không tính các tiết bằng bài Toán cũ.</p>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card-lsn p-4">
      <b className="block font-display text-3xl leading-none font-extrabold">{value}</b>
      <span className="text-xs font-semibold text-ink-2">{label}</span>
      {hint && <span className="block text-[11px] text-ink-2">{hint}</span>}
    </div>
  );
}
