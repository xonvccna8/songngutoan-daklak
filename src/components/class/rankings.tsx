"use client";

// Tab "Xếp hạng" của lớp (GV): 4 bảng tuần đầy đủ (Trên lớp · Ở nhà · Tiến bộ · Tổ), phân bố cấp độ,
// các em vừa lên cấp, bảng tích XP. Cùng nguồn dữ liệu với màn hình HS (lsn_weekly, lsn_studentStats).
import { useState } from "react";
import { Home, School, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { cn } from "cn";
import { Avatar, EmptyState, teamColor } from "@/components/common";
import { LevelBadge } from "@/components/progress/level";
import { boardEntries, teamBoard, type BoardKind } from "@/lib/progress/boards";
import { useWeekly } from "@/lib/progress/hooks";
import { journeyOf } from "@/lib/progress/facts";
import { RANKS, levelInfo } from "@/lib/progress/levels";
import { XP, STREAK_BONUS } from "@/lib/progress/xp";
import { prevWeekKey, weekKey } from "@/lib/progress/week";
import { fmtAgo } from "@/lib/format";
import type { StatsDoc } from "@/lib/analytics";
import type { ClassDoc, StudentDoc } from "@/lib/types";

const BOARDS: { key: BoardKind; vi: string; icon: React.ComponentType<{ className?: string }>; unit: string }[] = [
  { key: "class", vi: "Trên lớp", icon: School, unit: "XP" },
  { key: "home", vi: "Ở nhà", icon: Home, unit: "XP" },
  { key: "improve", vi: "Tiến bộ nhất", icon: TrendingUp, unit: "XP tăng" },
];

export function ClassRankings({ cls, students, stats, now }: { cls: ClassDoc; students: StudentDoc[]; stats: Map<string, StatsDoc>; now: number }) {
  const [which, setWhich] = useState<"this" | "last">("this");
  const ms = now || 0;
  const thisKey = now ? (which === "this" ? weekKey(ms) : prevWeekKey(ms)) : undefined;
  const lastKey = now ? prevWeekKey(which === "this" ? ms : ms - 7 * 86_400_000) : undefined;
  const cur = useWeekly(cls.id, thisKey);
  const prev = useWeekly(cls.id, lastKey);

  if (students.length === 0) return <EmptyState title="Lớp chưa có học sinh">Vào tab “Quản lý lớp” để thêm học sinh.</EmptyState>;

  const people = students.map((s) => ({ uid: s.uid, name: s.fullName, team: s.team }));
  const level = (uid: string) => journeyOf(stats.get(uid)).level;
  const teams = teamBoard(people.map((p) => ({ ...p, points: (cur?.rows?.[p.uid]?.c ?? 0) + (cur?.rows?.[p.uid]?.h ?? 0) })));
  const maxTeam = Math.max(1, ...teams.map((t) => t.avg));

  // Phân bố 8 hạng + các em vừa lên cấp trong 7 ngày
  const byRank = RANKS.map((_, i) => students.filter((s) => levelInfo(level(s.uid)).rankIndex === i).length);
  const ups = students
    .map((s) => ({ s, st: stats.get(s.uid) }))
    .filter(({ st }) => st?.levelUpAt && now && now - st.levelUpAt < 7 * 86_400_000)
    .sort((a, b) => (b.st!.levelUpAt ?? 0) - (a.st!.levelUpAt ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">Điểm thi đua tính theo tuần (thứ Hai → Chủ nhật), cập nhật tức thì. Học sinh chỉ thấy top 5 và hạng của chính mình.</p>
        <div className="inline-flex rounded-2xl bg-white p-1 ring-2 ring-line" role="tablist">
          {(["this", "last"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={which === k} onClick={() => setWhich(k)} className={cn("h-9 rounded-xl px-4 text-sm font-bold", which === k ? "bg-ink text-white" : "text-ink-2")}>
              {k === "this" ? "Tuần này" : "Tuần trước"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {BOARDS.map((b) => {
          const rows = boardEntries(people, b.key, cur, prev).sort((x, y) => y.points - x.points || x.name.localeCompare(y.name, "vi"));
          return (
            <section key={b.key} className="card-lsn flex flex-col p-4">
              <h3 className="flex items-center gap-2 font-extrabold">
                <b.icon className="size-4 text-blue" /> {b.vi}
              </h3>
              <ol className="mt-3 flex max-h-[420px] flex-col gap-1 overflow-y-auto pr-1">
                {rows.map((r, i) => (
                  <li key={r.uid} className={cn("flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm", i < 3 && r.points > 0 && "bg-sun-soft")}>
                    <span className="w-6 text-right font-display font-extrabold text-ink-2 tabular-nums">{i + 1}</span>
                    <Avatar name={r.name} team={r.team} className="size-7 text-[10px]" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
                    <b className="tabular-nums">{r.points.toLocaleString("vi-VN")}</b>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[11px] text-ink-2">Đơn vị: {b.unit}</p>
            </section>
          );
        })}

        <section className="card-lsn flex flex-col p-4">
          <h3 className="flex items-center gap-2 font-extrabold">
            <UsersRound className="size-4 text-blue" /> Thi đua tổ
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {teams.map((t) => (
              <li key={t.team} className="grid grid-cols-[56px_1fr_48px] items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <i className="size-2.5 rounded-full" style={{ background: teamColor(t.team) }} /> Tổ {t.team}
                </span>
                <span className="h-4 overflow-hidden rounded-full bg-paper">
                  <i className="block h-full rounded-full" style={{ width: `${(t.avg / maxTeam) * 100}%`, background: teamColor(t.team) }} />
                </span>
                <span className="text-right font-bold tabular-nums">{t.avg}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink-2">XP trung bình mỗi bạn trong tổ</p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-lsn p-4">
          <h3 className="font-extrabold">Phân bố cấp độ</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {RANKS.map((r, i) => (
              <li key={r.id} className="grid grid-cols-[150px_1fr_32px] items-center gap-2 text-sm">
                <span className="truncate font-semibold">
                  {r.icon} {r.vi} <span className="text-en text-xs">· {r.en}</span>
                </span>
                <span className="h-3 overflow-hidden rounded-full bg-paper">
                  <i className="block h-full rounded-full" style={{ width: `${(byRank[i] / students.length) * 100}%`, background: r.color }} />
                </span>
                <b className="text-right tabular-nums">{byRank[i]}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-lsn p-4">
          <h3 className="flex items-center gap-2 font-extrabold">
            <Sparkles className="size-4 text-sun-dk" /> Vừa lên cấp (7 ngày)
          </h3>
          {ups.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">Chưa có em nào lên cấp trong 7 ngày qua.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {ups.map(({ s, st }) => (
                <li key={s.uid} className="flex items-center gap-2 text-sm">
                  <Avatar name={s.fullName} team={s.team} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{s.fullName}</span>
                  <LevelBadge level={st!.level ?? 0} />
                  <span className="text-xs text-ink-2">{fmtAgo(st!.levelUpAt ?? null, now)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-2">Gợi ý: khen các em vừa lên cấp (tab Tin nhắn → Khen ngợi, có thể thưởng thêm XP).</p>
        </section>
      </div>

      <XpRules />
    </div>
  );
}

/** Bảng tích XP để GV giải thích cho học sinh */
function XpRules() {
  const rows: [string, string][] = [
    ["Trả lời 1 câu trên lớp (dù sai)", `+${XP.liveAnswer}`],
    ["Trả lời đúng trên lớp", `+${XP.liveCorrect}`],
    ["Câu ngôn ngữ đúng / nói đạt từ 80 điểm", `+${XP.liveEnglish}`],
    ["Thầy cô khen", "+5 / +10 / +20"],
    ["Câu bài về nhà đúng (không xem lời giải thêm +2)", `+${XP.hwCorrect}`],
    ["Nộp bài về nhà (đúng hạn thêm +10)", `+${XP.hwDone}`],
    ["Luyện nói bài về nhà đạt từ 80 điểm", `+${XP.speakGood}`],
    ["Ôn 1 thẻ từ vựng (tối đa 30/ngày)", `+${XP.card}`],
    ["Chuỗi ngày học 3 / 7 / 30 ngày", Object.values(STREAK_BONUS).map((v) => `+${v}`).join(" / ")],
  ];
  return (
    <details className="card-lsn p-4">
      <summary className="cursor-pointer font-extrabold">Bảng tích XP (cho thầy cô giải thích với học sinh)</summary>
      <table className="mt-3 w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t-2 border-line">
              <td className="py-1.5">{k}</td>
              <td className="py-1.5 text-right font-bold tabular-nums">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-2">
        Không trừ điểm khi sai. XP ở nhà tối đa {XP.homeDailyCap}/ngày. Lên hạng mới cần đủ XP và đủ điều kiện (thuật ngữ đã nhớ, câu nói đạt, chuỗi ngày).
      </p>
    </details>
  );
}
