"use client";

// Thi đua: hành trình cấp độ + 4 bảng tuần (Trên lớp · Ở nhà · Tiến bộ nhất · Tổ) + XP gần đây.
// Mỗi bảng chỉ hiện top 5 + hạng của em + khoảng cách tới bạn ngay trên (không "bêu" bạn đứng cuối).
import { useEffect, useState } from "react";
import { Crown, Home, Loader2, Medal, School, TrendingUp, UsersRound } from "lucide-react";
import { cn } from "cn";
import { Tam } from "@/components/brand/tam";
import { teamColor } from "@/components/common";
import { StudentShell, useStudent } from "@/components/student/student-shell";
import { JourneyCard, RankLadder } from "@/components/progress/level";
import { api, errorMessage } from "@/lib/api-client";
import { useMyStats } from "@/lib/study/hooks";
import { useXpEvents } from "@/lib/progress/hooks";
import { journeyOf } from "@/lib/progress/facts";
import { KIND_LABEL } from "@/lib/progress/xp";
import { levelInfo } from "@/lib/progress/levels";
import { fmtAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-class-history";
import type { Board, TeamRow } from "@/lib/progress/boards";

interface Boards {
  week: string;
  resetAt: number;
  class: Board;
  home: Board;
  improve: Board;
  teams: TeamRow[];
}

const TABS = [
  { key: "class", vi: "Trên lớp", en: "In class", icon: School, hint: "XP kiếm trong tiết học và lời khen của thầy cô tuần này" },
  { key: "home", vi: "Ở nhà", en: "At home", icon: Home, hint: "XP từ bài về nhà, ôn từ, luyện nói tuần này" },
  { key: "improve", vi: "Tiến bộ", en: "Most improved", icon: TrendingUp, hint: "XP tuần này nhiều hơn tuần trước bao nhiêu" },
  { key: "teams", vi: "Tổ", en: "Teams", icon: UsersRound, hint: "XP trung bình mỗi bạn trong tổ tuần này" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function RankPage() {
  return (
    <StudentShell>
      <Rank />
    </StudentShell>
  );
}

const MEDAL = ["#E8B100", "#9AA3B5", "#C27A3A"];

function Rank() {
  const { uid, classId, me } = useStudent();
  const { data: stats } = useMyStats(classId, uid);
  const events = useXpEvents(uid, undefined, 10);
  const now = useNow();
  const [data, setData] = useState<Boards | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("class");
  useEffect(() => {
    api<Boards>("/api/s/leaderboard")
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  const { level } = journeyOf(stats);
  const t = TABS.find((x) => x.key === tab)!;
  const daysLeft = data && now ? Math.max(0, Math.ceil((data.resetAt - now) / 86_400_000)) : null;

  return (
    <>
      <header className="px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Thi đua</h1>
        <p className="text-en font-semibold">Leaderboard</p>
      </header>

      <section className="px-5 pt-5">
        <JourneyCard stats={stats} />
      </section>

      {/* 4 bảng tuần */}
      <section className="px-5 pt-6">
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 ring-2 ring-line" role="tablist">
          {TABS.map((x) => (
            <button
              key={x.key}
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={cn("flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-bold transition-colors", tab === x.key ? "bg-ink text-white" : "text-ink-2")}
            >
              <x.icon className="size-4" />
              {x.vi}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-2">
          {t.hint}
          {daysLeft != null && ` · làm mới sau ${daysLeft} ngày (thứ Hai)`}
        </p>

        {error && <p className="card-lsn mt-3 p-4 text-sm text-coral-dk">{error}</p>}
        {!data && !error && (
          <p className="flex items-center justify-center gap-2 py-12 text-sm text-ink-2">
            <Loader2 className="size-4 animate-spin" /> Đang tải bảng thi đua…
          </p>
        )}
        {data && tab !== "teams" && <BoardView board={data[tab]} unit={tab === "improve" ? "XP tăng" : "XP"} />}
        {data && tab === "teams" && <TeamsView teams={data.teams} myTeam={me?.team} />}
      </section>

      {/* Bậc thang 8 hạng */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">8 hạng · 8 ranks</h2>
        <p className="text-vi text-sm">Mỗi hạng có 3 bậc I · II · III. Lên hạng mới cần đủ XP và đủ điều kiện.</p>
        <div className="mt-3">
          <RankLadder level={level} />
        </div>
      </section>

      {/* XP gần đây */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">XP gần đây</h2>
        {events.length === 0 ? (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Chưa có. Vào tiết, làm bài về nhà, ôn từ để kiếm XP nhé!</p>
        ) : (
          <ul className="card-lsn mt-3 divide-y-2 divide-line">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{e.kind === "levelup" ? `Lên cấp ${levelInfo(e.to ?? 0).vi} ${levelInfo(e.to ?? 0).rank.icon}` : KIND_LABEL[e.kind]}</b>
                  <span className="block truncate text-xs text-ink-2">
                    {e.note ? `${e.note} · ` : ""}
                    {fmtAgo(e.at, now)}
                  </span>
                </span>
                {e.xp > 0 && <b className="font-display text-blue-dk tabular-nums">+{e.xp}</b>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function BoardView({ board, unit }: { board: Board; unit: string }) {
  const inTop = board.top.some((r) => r.isMe);
  return (
    <>
      {board.me && (
        <div className="mt-3 flex items-center gap-4 rounded-3xl bg-blue-soft p-4">
          <Tam mood={board.me.rank <= 5 && board.me.points > 0 ? "cheer" : "happy"} className="size-14 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-dk">Hạng của em tuần này</p>
            <p className="font-display text-3xl font-extrabold">
              {board.me.points > 0 ? board.me.rank : "—"}
              <span className="text-base text-ink-2">/{board.me.total}</span>
            </p>
            {board.me.above && board.me.points > 0 && (
              <p className="text-xs font-semibold text-ink-2">
                Còn <b className="text-ink">{board.me.above.gap.toLocaleString("vi-VN")} {unit}</b> nữa là vượt {board.me.above.name}!
              </p>
            )}
            {board.me.points === 0 && <p className="text-xs font-semibold text-ink-2">Kiếm XP đầu tiên của tuần để vào bảng nhé!</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold text-blue-dk tabular-nums">{board.me.points.toLocaleString("vi-VN")}</p>
            <p className="text-xs text-ink-2">{unit}</p>
          </div>
        </div>
      )}

      <h3 className="mt-4 flex items-center gap-2 font-extrabold">
        <Crown className="size-5 text-[#E8B100]" /> Top 5
      </h3>
      {board.top.length === 0 ? (
        <p className="card-lsn mt-2 p-4 text-sm text-ink-2">Tuần mới vừa bắt đầu — chưa ai có điểm. Em hãy là người đầu tiên!</p>
      ) : (
        <ol className="mt-2 flex flex-col gap-2">
          {board.top.map((r, i) => (
            <li key={i} className={cn("card-lsn flex items-center gap-3 p-3", r.isMe && "border-blue bg-blue-soft")}>
              <span
                className="grid size-10 place-items-center rounded-xl font-display text-lg font-extrabold"
                style={{ background: r.rank <= 3 ? MEDAL[r.rank - 1] : "var(--color-paper)", color: r.rank <= 3 ? "#fff" : undefined }}
              >
                {r.rank <= 3 ? <Medal className="size-5" /> : r.rank}
              </span>
              <span className="flex-1 font-bold">
                {r.name}
                {r.isMe && " (em)"}
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
                  <i className="size-2 rounded-full" style={{ background: teamColor(r.team) }} /> Tổ {r.team}
                </span>
              </span>
              <b className="font-display text-lg tabular-nums">{r.points.toLocaleString("vi-VN")}</b>
            </li>
          ))}
        </ol>
      )}
      {!inTop && board.me && board.me.points > 0 && <p className="mt-2 text-center text-sm text-ink-2">Cố lên — mỗi ngày một chút là em sẽ vào top 5!</p>}
    </>
  );
}

function TeamsView({ teams, myTeam }: { teams: TeamRow[]; myTeam?: number }) {
  const maxAvg = Math.max(1, ...teams.map((t) => t.avg));
  return (
    <>
      <ul className="card-lsn mt-3 flex flex-col gap-3 p-4">
        {teams.map((t, i) => (
          <li key={t.team} className={cn("grid grid-cols-[24px_56px_1fr_52px] items-center gap-2 text-sm", myTeam === t.team && "font-bold")}>
            <span className="text-ink-2 tabular-nums">{i + 1}</span>
            <span className="inline-flex items-center gap-1.5">
              <i className="size-2.5 rounded-full" style={{ background: teamColor(t.team) }} /> Tổ {t.team}
            </span>
            <span className="h-4 overflow-hidden rounded-full bg-paper">
              <i className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(t.avg / maxAvg) * 100}%`, background: teamColor(t.team) }} />
            </span>
            <span className="text-right tabular-nums">{t.avg}</span>
          </li>
        ))}
      </ul>
      {myTeam != null && <p className="mt-2 text-center text-xs text-ink-2">Mỗi XP em kiếm được đều góp cho Tổ {myTeam}.</p>}
    </>
  );
}
