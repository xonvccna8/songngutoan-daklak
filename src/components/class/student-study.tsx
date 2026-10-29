"use client";

// Hồ sơ HS (GV xem): thời gian tự học thật 7 ngày + từng bài về nhà (trạng thái, điểm, thời gian làm)
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Clock, Gamepad2, Layers, Mic } from "lucide-react";
import { HwStatusChip } from "@/components/student/hw-card";
import { studySeries, type StatsDoc } from "@/lib/analytics";
import { fmtDue, fmtMinutes } from "@/lib/format";
import { hwStatus } from "@/lib/study/hw";
import { useClassAssignments, useSubmissionsOf } from "@/lib/study/hooks";
import { DAILY_GOAL_MIN } from "@/lib/study/time";

const INK2 = "#51607A";
const GRID = "#E2EFE6";

export function StudentStudy({ classId, uid, stats, now }: { classId: string; uid: string; stats?: StatsDoc; now: number }) {
  const { data: all } = useClassAssignments(classId);
  const mine = all.filter((a) => a.toUids.includes(uid));
  const subs = useSubmissionsOf(
    mine.map((a) => a.id),
    uid
  );
  const series = now ? studySeries(stats?.studySec, now) : [];
  const total7 = series.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <section className="card-lsn min-w-0 p-5">
        <h2 className="font-display text-lg font-extrabold">Tự học 7 ngày · {total7} phút</h2>
        <p className="text-xs text-ink-2">Chỉ tính khi trang tự học đang mở và em có thao tác trong 60 giây gần nhất.</p>
        <div className="mt-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: INK2, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: INK2, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} phút`, "Tự học"]} contentStyle={{ borderRadius: 12, border: "2px solid #E2EFE6", fontSize: 12 }} cursor={{ fill: "#F5FAF7" }} />
              <Bar dataKey="minutes" fill="#16A34A" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
          <li className="rounded-xl bg-paper p-2">
            <Layers className="mx-auto size-4 text-teal" />
            <b className="block font-display text-base">{stats?.cardReviews ?? 0}</b> lượt ôn thẻ
          </li>
          <li className="rounded-xl bg-paper p-2">
            <Mic className="mx-auto size-4 text-coral" />
            <b className="block font-display text-base">{stats?.speakPractice ?? 0}</b> lần luyện nói
          </li>
          <li className="rounded-xl bg-paper p-2">
            <Gamepad2 className="mx-auto size-4 text-sun-dk" />
            <b className="block font-display text-base">{stats?.gamePlays ?? 0}</b> lượt chơi ôn tập
          </li>
          <li className="rounded-xl bg-paper p-2">
            <Clock className="mx-auto size-4 text-blue" />
            <b className="block font-display text-base">{fmtMinutes(stats?.studySeconds ?? 0)}</b> tổng
          </li>
        </ul>
        <p className="mt-2 text-xs text-ink-2">Mục tiêu gợi ý cho HS: {DAILY_GOAL_MIN} phút/ngày.</p>
      </section>

      <section className="card-lsn min-w-0 overflow-x-auto p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
          <BookOpen className="size-5 text-blue" /> Bài về nhà · đã nộp {stats?.hwDone ?? 0}
          {stats?.hwLate ? ` · trễ ${stats.hwLate}` : ""}
          {stats?.hwMissed ? ` · thiếu ${stats.hwMissed}` : ""}
        </h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Chưa giao bài nào cho em.</p>
        ) : (
          <table className="mt-3 w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-ink-2">
                <th className="py-1.5">Bài</th>
                <th className="py-1.5">Hạn</th>
                <th className="py-1.5">Trạng thái</th>
                <th className="py-1.5 text-right">Thời gian</th>
                <th className="py-1.5 text-right">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((a) => {
                const s = subs[a.id];
                return (
                  <tr key={a.id} className="border-t border-line">
                    <td className="max-w-48 truncate py-2 font-semibold">{a.title.vi}</td>
                    <td className="py-2 text-xs text-ink-2">{fmtDue(a.dueAt.toMillis())}</td>
                    <td className="py-2">
                      <HwStatusChip s={hwStatus(s, a.dueAt.toMillis(), now)} />
                    </td>
                    <td className="py-2 text-right tabular-nums">{s?.activeSeconds ? fmtMinutes(s.activeSeconds) : "—"}</td>
                    <td className="py-2 text-right font-display font-extrabold tabular-nums">
                      {s ? `${s.score}` : "—"}
                      {s && <span className="ml-1 text-xs font-normal text-ink-2">({s.correct}/{a.items.length} đúng)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
