"use client";

// Hồ sơ HS (GV): hành trình cấp độ + lịch sử nhận XP — đúng những gì em thấy trên điện thoại
import { JourneyCard } from "@/components/progress/level";
import { useXpEvents } from "@/lib/progress/hooks";
import { KIND_LABEL } from "@/lib/progress/xp";
import { levelInfo } from "@/lib/progress/levels";
import { fmtAgo } from "@/lib/format";
import type { StatsDoc } from "@/lib/analytics";

export function StudentJourney({ classId, uid, stats, now }: { classId: string; uid: string; stats: StatsDoc | undefined; now: number }) {
  const events = useXpEvents(uid, classId, 12);
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <JourneyCard stats={stats} title="Hành trình cấp độ" />
      <section className="card-lsn min-w-0 p-5">
        <h2 className="font-display text-lg font-extrabold">XP gần đây</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-ink-2">Chưa có hoạt động nào được cộng XP.</p>
        ) : (
          <ul className="mt-2 divide-y-2 divide-line">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                <span className={e.scope === "class" ? "rounded-full bg-blue-soft px-2 py-0.5 text-[11px] font-bold text-blue-dk" : "rounded-full bg-teal-soft px-2 py-0.5 text-[11px] font-bold text-[#0A6F5F]"}>
                  {e.scope === "class" ? "Trên lớp" : "Ở nhà"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <b>{e.kind === "levelup" ? `Lên cấp ${levelInfo(e.to ?? 0).vi}` : KIND_LABEL[e.kind]}</b>
                  {e.note && <span className="text-ink-2"> · {e.note}</span>}
                </span>
                <span className="text-xs text-ink-2">{fmtAgo(e.at, now)}</span>
                <b className="w-12 text-right font-display tabular-nums">{e.xp > 0 ? `+${e.xp}` : ""}</b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
