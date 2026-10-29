"use client";

// Màn hình TIVI của trò chơi (16:9, cỡ chữ theo cqw như tivi bài học):
// phòng chờ (luật chơi đọc bằng tiếng Anh) · bảng xếp hạng nhảy liên tục · câu hỏi + công bố (GV điều khiển)
// · đường đua thuyền các tổ · Rung chuông vàng · bục vinh quang Top 3 có pháo giấy.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { Pause, Users } from "lucide-react";
import { cn } from "cn";
import { teamColor } from "@/components/common";
import { BOARD_VARS } from "@/components/live/slide-view";
import { ShapeIcon } from "@/components/brand/shapes";
import { LiveBoard, OPTION_STYLE, aliasOrder, nameOf, promptLines, sortedRows, teamAverages } from "@/components/games/shared";
import { MODE_META, type BoardDoc, type GameDoc } from "@/lib/games/types";
import { useBoard, useGame, useTicker } from "@/lib/games/hooks";
import { music, sfx } from "@/lib/games/sound";
import { say } from "@/lib/live/speech";
import type { RosterEntry } from "@/components/live/tv-screen";

export function GameTv({ game, board, roster, voice = false, className }: { game: GameDoc; board: BoardDoc | null; roster: Map<string, RosterEntry>; voice?: boolean; className?: string }) {
  const meta = MODE_META[game.mode];
  const rows = board?.rows ?? {};
  const players = Object.keys(rows).length;
  const hide = game.settings.hideNames;
  const now = useTicker(250, game.status === "play");
  const order = aliasOrder(rows);
  const name = (uid?: string) => (uid ? nameOf(uid, roster, hide, order) : "");

  // Dòng chữ chạy: gom các sự kiện gần nhất
  const [ticker, setTicker] = useState<{ t: number; text: string }[]>([]);
  const evT = board?.ev?.t;
  useEffect(() => {
    const ev = board?.ev;
    if (!ev || Date.now() - ev.t > 15_000) return;
    const text =
      ev.kind === "pass"
        ? `⚡ ${name(ev.uid)} vừa vượt lên hạng ${ev.n}! · moved up to #${ev.n}!`
        : ev.kind === "streak"
          ? `🔥 ${name(ev.uid)} có chuỗi ${ev.n} câu đúng! · ${ev.n} in a row!`
          : ev.kind === "power"
            ? `🎉 Power Play! Cả lớp +50% điểm trong 20 giây · Everyone gets +50%!`
            : ev.kind === "out"
              ? `🔔 ${ev.n} bạn bị loại · ${ev.n} out`
              : `🛟 Cứu trợ! ${ev.n} bạn quay lại · Rescue!`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nhận sự kiện mới từ Firestore
    setTicker((l) => [{ t: ev.t, text }, ...l.filter((x) => x.t !== ev.t)].slice(0, 4));
    if (voice) (ev.kind === "power" ? sfx.power : sfx.pass)();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi có sự kiện mới
  }, [evT]);

  // Tivi đọc luật chơi bằng tiếng Anh ở phòng chờ; nhạc nền khi đang chơi
  const spoke = useRef(false);
  useEffect(() => {
    if (!voice) return;
    if (game.status === "lobby" && !spoke.current) {
      spoke.current = true;
      setTimeout(() => say(`Welcome to ${meta.en}! ${meta.rules.en}`, 0.85), 600);
    }
    music(game.settings.music && game.status === "play");
    return () => music(false);
  }, [voice, game.status, game.settings.music, meta]);

  // Pháo giấy khi kết thúc
  const fired = useRef(false);
  useEffect(() => {
    if (game.status !== "ended" || fired.current || !voice) return;
    fired.current = true;
    sfx.fanfare();
    const end = Date.now() + 2500;
    const burst = () => {
      confetti({ particleCount: 60, spread: 80, origin: { x: Math.random() * 0.6 + 0.2, y: 0.4 } });
      if (Date.now() < end) setTimeout(burst, 350);
    };
    burst();
  }, [game.status, voice]);

  const q = game.cur ? game.questions[game.cur.i] : null;
  const left = game.cur?.endsAt && game.cur.phase === "q" ? Math.max(0, game.cur.endsAt - now) : null;
  const powerPlay = game.powerPlayUntil && now < game.powerPlayUntil;

  return (
    <div className={cn("@container relative aspect-video w-full overflow-hidden bg-ink-tv font-present text-[var(--chalk)] select-none", className)} style={BOARD_VARS}>
      <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)] gap-[1.2cqw] px-[2.6cqw] pt-[2cqw] pb-[2.2cqw]">
        {/* Đầu */}
        <header className="flex items-center justify-between gap-[2cqw] font-sans text-[1.3cqw] text-[var(--chalk-dim)]">
          <span className="flex items-center gap-[1cqw]">
            <span className="text-[2.2cqw]">{meta.icon}</span>
            <b className="font-display text-[1.8cqw] text-[var(--chalk)]">{meta.en}</b> · {meta.vi}
            {game.settings.team && <span className="rounded-[0.5cqw] bg-white/10 px-[0.6cqw]">Thi theo tổ · Teams</span>}
          </span>
          <span className="flex items-center gap-[1.4cqw]">
            {powerPlay && <span className="animate-pulse rounded-[0.6cqw] bg-[var(--hi)] px-[0.8cqw] py-[0.2cqw] font-bold text-ink">🎉 POWER PLAY +50%</span>}
            {q && game.pace === "teacher" && (
              <span>
                Câu {game.cur!.i + 1}/{game.questions.length}
              </span>
            )}
            {left != null && <b className={cn("font-display text-[2cqw] tabular-nums", left < 5000 ? "text-[var(--hi)]" : "text-[var(--chalk)]")}>{Math.ceil(left / 1000)}s</b>}
            <span className="flex items-center gap-[0.4cqw]">
              <Users className="size-[1.4cqw]" /> {players}
            </span>
          </span>
        </header>

        {/* Thân */}
        <div className="relative min-h-0">
          {game.status === "lobby" && <Lobby game={game} rows={rows} name={name} />}
          {(game.status === "play" || game.status === "paused") && (
            <>
              {game.pace === "teacher" && q ? (
                <TeacherPaced game={game} board={board} name={name} />
              ) : game.mode === "boat" ? (
                <BoatRace game={game} board={board} />
              ) : (
                <SelfPaced game={game} board={board} roster={roster} hide={hide} ticker={ticker} />
              )}
              {game.pace === "teacher" && q && ticker[0] && now - ticker[0].t < 6000 && (
                <p className="absolute right-0 bottom-0 left-0 truncate rounded-[0.6cqw] bg-white/10 px-[1cqw] py-[0.4cqw] font-sans text-[1.3cqw]">{ticker[0].text}</p>
              )}
            </>
          )}
          {game.status === "ended" && <Podium game={game} board={board} name={name} />}

          {game.status === "paused" && (
            <div className="absolute inset-0 grid place-items-center rounded-[1cqw] bg-ink/85 backdrop-blur-sm">
              <div className="text-center">
                <Pause className="mx-auto size-[5cqw]" />
                <p className="mt-[1cqw] font-display text-[4cqw] font-extrabold">Eyes on the board!</p>
                <p className="font-sans text-[2cqw] text-[var(--chalk-dim)]">Tạm dừng — các em nhìn lên bảng nhé</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Cửa sổ tivi: tự tải trận theo id (đọc luật, nhạc, pháo giấy chỉ phát ở cửa sổ này) */
export function GameTvById({ gameId, roster, className }: { gameId: string; roster: Map<string, RosterEntry>; className?: string }) {
  const { data: game } = useGame(gameId);
  const board = useBoard(gameId);
  if (!game) return null;
  return <GameTv game={game} board={board} roster={roster} voice className={className} />;
}

function Lobby({ game, rows, name }: { game: GameDoc; rows: BoardDoc["rows"]; name: (uid?: string) => string }) {
  const meta = MODE_META[game.mode];
  const list = Object.keys(rows);
  return (
    <div className="grid h-full grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-[3cqw]">
      <div className="flex flex-col justify-center gap-[1.4cqw]">
        <p className="text-[8cqw] leading-none">{meta.icon}</p>
        <h1 className="font-display text-[5cqw] leading-tight font-extrabold">{meta.en}</h1>
        <p className="text-[2.4cqw] text-[var(--hi)]">{meta.vi}</p>
        <p className="text-[2cqw] leading-snug">{meta.rules.en}</p>
        <p className="font-sans text-[1.5cqw] text-[var(--chalk-dim)] italic">{meta.rules.vi}</p>
        <p className="mt-[1cqw] font-sans text-[1.4cqw] text-[var(--chalk-dim)]">
          {game.questions.length} {game.mode === "match" ? "vòng" : "câu"} · {game.settings.qTime ? `${game.settings.qTime} giây mỗi ${game.mode === "match" ? "vòng" : "câu"}` : "không tính giờ"} · mức {game.settings.level.toUpperCase()}
        </p>
      </div>
      <div className="flex min-h-0 flex-col gap-[1cqw] rounded-[1.2cqw] bg-white/6 p-[1.6cqw]">
        <p className="font-sans text-[1.5cqw] font-bold">
          Đã vào trận: {list.length} · <span className="text-[var(--chalk-dim)]">mở điện thoại để tham gia</span>
        </p>
        <div className="flex flex-wrap content-start gap-[0.6cqw] overflow-hidden">
          <AnimatePresence>
            {list.map((uid) => (
              <motion.span
                key={uid}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full px-[1cqw] py-[0.4cqw] font-sans text-[1.3cqw] font-bold text-white"
                style={{ background: teamColor(rows[uid].team) }}
              >
                {name(uid)}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <p className="mt-auto font-sans text-[1.3cqw] text-[var(--chalk-dim)]">Thầy cô bấm “Bắt đầu” khi cả lớp sẵn sàng.</p>
      </div>
    </div>
  );
}

function SelfPaced({ game, board, roster, hide, ticker }: { game: GameDoc; board: BoardDoc | null; roster: Map<string, RosterEntry>; hide: boolean; ticker: { t: number; text: string }[] }) {
  const rows = board?.rows ?? {};
  const players = Object.keys(rows).length;
  const done = Object.values(rows).filter((r) => r.done).length;
  const answered = Object.values(rows).reduce((s, r) => s + r.n, 0);
  const totalQ = players * game.questions.length || 1;
  const teams = game.settings.team ? teamAverages(rows) : [];
  return (
    <div className="grid h-full grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[2.4cqw]">
      <section className="min-h-0 overflow-hidden">
        <h2 className="mb-[0.8cqw] font-sans text-[1.3cqw] font-semibold tracking-[0.12em] text-[var(--chalk-dim)] uppercase">Leaderboard · Bảng xếp hạng</h2>
        <LiveBoard rows={rows} roster={roster} hide={hide} />
      </section>
      <aside className="flex min-h-0 flex-col gap-[1.4cqw]">
        <div className="rounded-[1cqw] bg-white/6 p-[1.2cqw]">
          <p className="font-sans text-[1.2cqw] text-[var(--chalk-dim)]">Tiến độ cả lớp · Class progress</p>
          <div className="mt-[0.6cqw] h-[1.2cqw] overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-[var(--hi)]" animate={{ width: `${Math.min(100, (answered / totalQ) * 100)}%` }} />
          </div>
          <p className="mt-[0.5cqw] font-sans text-[1.2cqw]">
            {done}/{players} bạn đã xong
          </p>
        </div>
        {teams.length > 0 && (
          <div className="rounded-[1cqw] bg-white/6 p-[1.2cqw]">
            <p className="mb-[0.6cqw] font-sans text-[1.2cqw] text-[var(--chalk-dim)]">Thi đua tổ · Teams (TB mỗi bạn)</p>
            {teams.map((t, i) => (
              <p key={t.team} className="flex items-center justify-between font-sans text-[1.5cqw] font-bold">
                <span className="flex items-center gap-[0.6cqw]">
                  <i className="size-[1cqw] rounded-full" style={{ background: teamColor(t.team) }} /> {i === 0 ? "👑 " : ""}Tổ {t.team}
                </span>
                <span className="tabular-nums">{t.avg.toLocaleString("vi-VN")}</span>
              </p>
            ))}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col gap-[0.6cqw] overflow-hidden">
          <AnimatePresence initial={false}>
            {ticker.map((x) => (
              <motion.p key={x.t} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="rounded-[0.8cqw] bg-white/10 px-[1cqw] py-[0.6cqw] font-sans text-[1.3cqw] leading-snug">
                {x.text}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      </aside>
    </div>
  );
}

function BoatRace({ game, board }: { game: GameDoc; board: BoardDoc | null }) {
  const teams = teamAverages(board?.rows ?? {}).sort((a, b) => a.team - b.team);
  const total = game.questions.length || 1;
  return (
    <div className="flex h-full flex-col justify-center gap-[1.6cqw]">
      <p className="text-center font-sans text-[1.4cqw] text-[var(--chalk-dim)]">Mỗi câu đúng đẩy thuyền của tổ tiến lên (tính trung bình mỗi bạn) · Every correct answer moves your boat!</p>
      {teams.map((t) => {
        const pct = Math.min(1, t.correctAvg / total);
        return (
          <div key={t.team} className="relative h-[6cqw] rounded-[1cqw] bg-[#14532d]/70" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 2cqw, transparent 2cqw 4cqw)" }}>
            <span className="absolute top-1/2 left-[1cqw] -translate-y-1/2 font-sans text-[1.5cqw] font-bold" style={{ color: teamColor(t.team) }}>
              Tổ {t.team}
            </span>
            <span className="absolute inset-y-0 right-[2cqw] w-[0.4cqw] bg-[repeating-linear-gradient(0deg,#fff_0_0.6cqw,#000_0.6cqw_1.2cqw)]" title="Đích" />
            <motion.span className="absolute top-1/2 text-[4cqw]" style={{ translateY: "-50%" }} animate={{ left: `calc(${8 + pct * 80}% )` }} transition={{ type: "spring", stiffness: 60, damping: 14 }}>
              {pct >= 1 ? "🏁" : "🚤"}
            </motion.span>
            <span className="absolute top-1/2 right-[3.5cqw] -translate-y-1/2 font-sans text-[1.3cqw] tabular-nums">{Math.round(pct * 100)}%</span>
          </div>
        );
      })}
      {!teams.length && <p className="text-center text-[2cqw] text-[var(--chalk-dim)]">Chờ các tổ vào trận…</p>}
    </div>
  );
}

function TeacherPaced({ game, board, name }: { game: GameDoc; board: BoardDoc | null; name: (uid?: string) => string }) {
  const cur = game.cur!;
  const q = game.questions[cur.i];
  const reveal = cur.phase === "reveal" && game.reveal?.i === cur.i ? game.reveal : null;
  const st = board?.stats?.[cur.i];
  const lines = promptLines(q, game.settings.level);
  const rows = board?.rows ?? {};
  const alive = Object.values(rows).filter((r) => !r.out).length;
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_22cqw] gap-[2cqw]">
      <div className="flex min-h-0 flex-col gap-[1.2cqw]">
        <div className="rounded-[1.2cqw] bg-white/8 p-[1.6cqw]">
          <p className="font-display text-[3cqw] leading-tight font-extrabold">{q.listen ? "🎧 Listen and choose · Nghe và chọn" : lines.main}</p>
          {lines.sub && !q.listen && <p className="mt-[0.4cqw] font-sans text-[1.7cqw] text-[var(--chalk-dim)] italic">{lines.sub}</p>}
        </div>
        {q.kind === "mcq" && (
          <div className="grid flex-1 grid-cols-2 gap-[1cqw]">
            {q.options!.map((o, i) => {
              const right = reveal && reveal.answer === i;
              const n = st?.pick?.[i] ?? 0;
              return (
                <div
                  key={i}
                  className={cn("relative flex items-center gap-[1cqw] rounded-[1cqw] px-[1.4cqw] text-white transition-opacity", reveal && !right && "opacity-35")}
                  style={{ background: OPTION_STYLE[i % 4].bg, boxShadow: `0 0.4cqw 0 ${OPTION_STYLE[i % 4].shadow}` }}
                >
                  <ShapeIcon kind={OPTION_STYLE[i % 4].kind} color="#fff" className="size-[2.2cqw] shrink-0" />
                  <span className="min-w-0 flex-1 font-sans text-[2.1cqw] leading-tight font-bold">{o.en}</span>
                  {reveal && <span className="font-display text-[2cqw] font-extrabold">{n}</span>}
                  {right && <span className="text-[2.4cqw]">✔</span>}
                </div>
              );
            })}
          </div>
        )}
        {q.kind !== "mcq" && (
          <div className="grid flex-1 place-items-center rounded-[1cqw] border-2 border-dashed border-white/20">
            {reveal ? <p className="font-display text-[4cqw] font-extrabold text-[var(--hi)]">{reveal.show}</p> : <p className="font-sans text-[2cqw] text-[var(--chalk-dim)]">Nhập đáp án trên điện thoại · Type your answer on your phone</p>}
          </div>
        )}
        {reveal?.explain && (
          <p className="rounded-[0.8cqw] bg-white/8 px-[1.2cqw] py-[0.6cqw] font-sans text-[1.5cqw]">
            💡 {reveal.explain.en} {reveal.explain.vi && <span className="text-[var(--chalk-dim)] italic">— {reveal.explain.vi}</span>}
          </p>
        )}
      </div>
      <aside className="flex min-h-0 flex-col gap-[0.8cqw]">
        <div className="rounded-[1cqw] bg-white/6 p-[1.2cqw] text-center">
          <p className="font-display text-[3.4cqw] font-extrabold">
            {st?.a ?? 0}
            <span className="text-[1.8cqw] text-[var(--chalk-dim)]">/{game.mode === "bell" ? alive : Object.keys(rows).length}</span>
          </p>
          <p className="font-sans text-[1.2cqw] text-[var(--chalk-dim)]">đã trả lời · answered</p>
          {reveal && st && <p className="mt-[0.4cqw] font-sans text-[1.4cqw] font-bold text-[var(--hi)]">{st.a ? Math.round((st.c / st.a) * 100) : 0}% đúng</p>}
        </div>
        {game.mode === "bell" ? (
          <div className="rounded-[1cqw] bg-white/6 p-[1.2cqw]">
            <p className="font-sans text-[1.3cqw] font-bold">🔔 Còn trong cuộc: {alive}</p>
            <div className="mt-[0.6cqw] flex flex-wrap gap-[0.4cqw]">
              {Object.entries(rows).map(([uid, r]) => (
                <span key={uid} className={cn("rounded-full px-[0.6cqw] py-[0.2cqw] font-sans text-[1cqw] font-bold", r.out ? "bg-white/10 text-white/40 line-through" : "bg-[var(--hi)] text-ink")}>
                  {name(uid)}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-[0.4cqw]">
            {sortedRows(rows)
              .slice(0, 5)
              .map(([uid, r], i) => (
                <li key={uid} className="flex justify-between rounded-[0.6cqw] bg-white/6 px-[0.8cqw] py-[0.4cqw] font-sans text-[1.3cqw]">
                  <span className="truncate">
                    {i + 1}. {name(uid)}
                  </span>
                  <b className="tabular-nums">{r.s.toLocaleString("vi-VN")}</b>
                </li>
              ))}
          </ol>
        )}
      </aside>
    </div>
  );
}

function Podium({ game, board, name }: { game: GameDoc; board: BoardDoc | null; name: (uid?: string) => string }) {
  const rows = board?.rows ?? {};
  const top = game.podium?.length ? game.podium : sortedRows(rows).slice(0, 3).map(([uid, r]) => ({ uid, s: r.s }));
  const streak = Object.entries(rows).sort((a, b) => b[1].best - a[1].best)[0];
  const place = [1, 0, 2]; // giữa cao nhất
  const h = ["16cqw", "22cqw", "12cqw"];
  return (
    <div className="flex h-full flex-col items-center justify-end gap-[1.4cqw]">
      <h2 className="font-display text-[3.6cqw] font-extrabold">🏆 Champions · Vinh danh</h2>
      <div className="flex items-end gap-[2cqw]">
        {place.map((p, k) =>
          top[p] ? (
            <motion.div key={p} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + k * 0.25 }} className="flex w-[18cqw] flex-col items-center gap-[0.6cqw]">
              <span className="text-[4cqw]">{["🥇", "🥈", "🥉"][p]}</span>
              <span className="max-w-full truncate font-sans text-[1.8cqw] font-bold">{name(top[p].uid)}</span>
              <span className="font-display text-[1.6cqw] text-[var(--hi)] tabular-nums">{top[p].s.toLocaleString("vi-VN")}</span>
              <div className="w-full rounded-t-[1cqw] bg-white/15" style={{ height: h[k] }} />
            </motion.div>
          ) : (
            <div key={p} className="w-[18cqw]" />
          )
        )}
      </div>
      <div className="flex gap-[2cqw] font-sans text-[1.5cqw]">
        {game.winnerTeam != null && (
          <span className="rounded-[0.8cqw] bg-white/10 px-[1.2cqw] py-[0.5cqw]">
            👑 Tổ vô địch: <b style={{ color: teamColor(game.winnerTeam) }}>Tổ {game.winnerTeam}</b>
          </span>
        )}
        {streak && streak[1].best >= 2 && (
          <span className="rounded-[0.8cqw] bg-white/10 px-[1.2cqw] py-[0.5cqw]">
            🔥 Chuỗi dài nhất: <b>{name(streak[0])}</b> ({streak[1].best})
          </span>
        )}
      </div>
    </div>
  );
}
