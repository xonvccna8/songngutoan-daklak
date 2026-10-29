"use client";

// Màn hình ĐIỆN THOẠI HS trong trò chơi: tự vào trận, câu hỏi theo mức tiếng Anh (E1/E2/E3) + nút nghe,
// power-up, Ghép bộ ba, kết quả sau mỗi câu (điểm, chuỗi 🔥, hạng ▲▼, sticker song ngữ), bục vinh quang.
// Máy chủ chấm và tính giờ; điện thoại chỉ hiển thị.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Pause, Send, Turtle, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Tam } from "@/components/brand/tam";
import { OPTION_STYLE, promptLines } from "@/components/games/shared";
import { ShapeIcon } from "@/components/brand/shapes";
import { api, errorMessage } from "@/lib/api-client";
import { useGame, usePlayer, useTicker } from "@/lib/games/hooks";
import { POWER_META, STICKERS } from "@/lib/games/scoring";
import { sfx, unlock } from "@/lib/games/sound";
import { MODE_META, type GameDoc, type GameQ, type LastResult, type PlayerDoc, type PowerKind } from "@/lib/games/types";
import { gameXp } from "@/lib/progress/xp";
import { say } from "@/lib/live/speech";

/** Điện thoại: tự tải trận theo id (trận đang mở trong tiết) */
export function GamePhoneById({ gameId, uid }: { gameId: string; uid: string }) {
  const { data: game } = useGame(gameId);
  if (!game)
    return (
      <Center>
        <Loader2 className="size-8 animate-spin" /> Đang mở trò chơi…
      </Center>
    );
  return <GamePhone game={game} uid={uid} />;
}

export function GamePhone({ game, uid }: { game: GameDoc; uid: string }) {
  const player = usePlayer(game.id, uid);
  const meta = MODE_META[game.mode];
  // Lệch đồng hồ điện thoại so với máy chủ (ms) — để thanh thời gian khớp
  const skew = useRef(0);
  const joined = useRef(false);

  useEffect(() => {
    if (joined.current || game.status === "ended") return;
    joined.current = true;
    const t0 = Date.now();
    api<{ now: number }>(`/api/game/${game.id}/join`, { method: "POST" })
      .then((r) => (skew.current = (t0 + Date.now()) / 2 - r.now))
      .catch((e) => {
        joined.current = false;
        toast.error(errorMessage(e));
      });
  }, [game.id, game.status]);

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-4" onPointerDown={unlock}>
      <header className="flex items-center justify-between gap-2">
        <p className="font-display text-lg font-extrabold">
          {meta.icon} {meta.en}
          <span className="block font-sans text-xs font-semibold text-[var(--chalk-dim)]">{meta.vi}</span>
        </p>
        {player && (
          <p className="text-right">
            <b className="block font-display text-2xl leading-none text-sun tabular-nums">{player.s.toLocaleString("vi-VN")}</b>
            <span className="text-xs text-[var(--chalk-dim)]">{player.st >= 2 ? `🔥 ${player.st} liên tiếp` : "điểm"}</span>
          </p>
        )}
      </header>

      {!player ? (
        <Center>
          <Loader2 className="size-8 animate-spin" /> Đang vào trận…
        </Center>
      ) : game.status === "lobby" ? (
        <Center>
          <Tam mood="cheer" className="size-24" />
          <p className="text-xl font-extrabold">Em đã vào trận!</p>
          <p className="text-sm">{meta.rules.en}</p>
          <p className="text-sm text-[var(--chalk-dim)] italic">{meta.rules.vi}</p>
          <p className="text-xs text-[var(--chalk-dim)]">Chờ thầy cô bấm Bắt đầu…</p>
        </Center>
      ) : game.status === "ended" ? (
        <Finished game={game} player={player} />
      ) : (
        <Playing game={game} player={player} skew={skew} />
      )}

      {game.status === "paused" && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/90 p-6 text-center">
          <div>
            <Pause className="mx-auto size-12" />
            <p className="mt-3 font-display text-3xl font-extrabold">Eyes on the board!</p>
            <p className="text-[var(--chalk-dim)]">Thầy cô tạm dừng — các em nhìn lên bảng nhé</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Âm thanh + rung khi biết đúng / sai */
function feel(ok: boolean) {
  (ok ? sfx.correct : sfx.wrong)();
  if (navigator.vibrate) navigator.vibrate(ok ? 40 : [60, 40, 60]);
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">{children}</div>;
}

/** Câu hiện tại của em */
function currentQi(game: GameDoc, p: PlayerDoc): { qi: number; redeem: boolean } | null {
  if (game.pace === "teacher") return game.cur ? { qi: game.cur.i, redeem: false } : null;
  if (p.phase === "q") return p.pos < p.order.length ? { qi: p.order[p.pos], redeem: false } : null;
  if (p.phase === "redeem") return p.redeemPos < p.redeem.length ? { qi: p.redeem[p.redeemPos], redeem: true } : null;
  return null;
}

function Playing({ game, player, skew }: { game: GameDoc; player: PlayerDoc; skew: React.RefObject<number> }) {
  const cur = currentQi(game, player);
  // Tự làm: hiện kết quả câu vừa xong ~1,8 giây rồi mới sang câu mới
  const [feedback, setFeedback] = useState<LastResult | null>(null);
  const shownAt = useRef(0);
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), feedback.ok ? 1600 : 2600);
    return () => clearTimeout(t);
  }, [feedback]);

  // GV điều khiển: kết quả hiện lúc công bố
  if (game.pace === "teacher" && game.cur) {
    const i = game.cur.i;
    const mine = player.answers[i];
    if (game.cur.phase === "reveal") {
      const last = player.last?.qi === i ? player.last : null;
      return <ResultCard game={game} last={last} missed={!mine} reveal={game.reveal?.i === i ? game.reveal : null} out={!!player.out} />;
    }
    if (player.out) {
      return (
        <Center>
          <p className="text-5xl">🔔</p>
          <p className="text-xl font-extrabold">Em đã bị loại</p>
          <p className="text-sm text-[var(--chalk-dim)]">Theo dõi câu hỏi trên tivi và chờ thầy cô cứu trợ nhé! · Wait for the rescue!</p>
        </Center>
      );
    }
    if (mine) {
      return (
        <Center>
          <p className="text-5xl">📨</p>
          <p className="text-xl font-extrabold">Đã gửi!</p>
          <p className="text-sm text-[var(--chalk-dim)]">Chờ thầy cô công bố đáp án · Waiting for the answer…</p>
        </Center>
      );
    }
  }

  if (feedback) return <ResultCard game={game} last={feedback} />;
  if (!cur) {
    return (
      <Center>
        <Tam mood="happy" className="size-24" />
        <p className="text-xl font-extrabold">Em đã làm xong! 🎉</p>
        <p className="text-sm text-[var(--chalk-dim)]">Xem bảng xếp hạng trên tivi nhé · Look at the leaderboard!</p>
        {player.last && <RankLine last={player.last} />}
      </Center>
    );
  }
  return (
    <QuestionView
      key={`${cur.qi}-${cur.redeem ? "r" : "q"}`}
      game={game}
      player={player}
      qi={cur.qi}
      redeem={cur.redeem}
      skew={skew}
      onResult={(last) => {
        if (shownAt.current === last.at) return;
        shownAt.current = last.at;
        // GV điều khiển: chưa báo đúng/sai cho tới lúc công bố
        if (game.pace !== "self") return;
        feel(last.ok);
        setFeedback(last);
      }}
    />
  );
}

function QuestionView({
  game,
  player,
  qi,
  redeem,
  skew,
  onResult,
}: {
  game: GameDoc;
  player: PlayerDoc;
  qi: number;
  redeem: boolean;
  skew: React.RefObject<number>;
  onResult: (l: LastResult) => void;
}) {
  const q = game.questions[qi];
  const limit = game.settings.qTime;
  const frozen = player.fx.freeze === qi;
  const start = game.pace === "teacher" ? (game.cur?.startedAt ?? 0) : Math.max(player.qStart, game.startedAt ?? 0, game.resumedAt ?? 0);
  const now = useTicker(200, limit > 0 && !frozen && game.status === "play");
  const left = limit > 0 ? Math.max(0, start + limit * 1000 - (now - (skew.current ?? 0))) : null;
  const [busy, setBusy] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [text, setText] = useState("");
  const sent = useRef(false);
  const hidden = player.fx.hidden?.qi === qi ? player.fx.hidden.opts : [];
  const lines = promptLines(q, game.settings.level, flipped);

  async function send(value: unknown) {
    if (sent.current) return;
    sent.current = true;
    setBusy(true);
    try {
      const r = await api<{ retry: boolean; last?: LastResult; wrongGroups?: number; immunity?: boolean }>(`/api/game/${game.id}/answer`, { body: { qi, value, flip: flipped } });
      if (r.retry) {
        sent.current = false;
        sfx.wrong();
        toast(r.immunity ? "🔁 Làm lại! Em được trả lời lại câu này một lần." : `Còn ${r.wrongGroups} nhóm chưa đúng — ghép lại nhé!`);
        return r;
      }
      if (r.last) onResult(r.last);
    } catch (e) {
      sent.current = false;
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // Hết giờ → tự gửi "không trả lời" để sang câu sau
  useEffect(() => {
    if (left === 0 && !sent.current && game.status === "play") void send(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi đồng hồ về 0
  }, [left === 0]);

  // Đọc đề tự động với câu "nghe và chọn"
  useEffect(() => {
    if (q.listen && q.say) setTimeout(() => say(q.say!, 0.8), 300);
  }, [q]);

  async function power(kind: PowerKind) {
    unlock();
    try {
      await api(`/api/game/${game.id}/power`, { body: { kind } });
      sfx.power();
      if (kind === "hint") setShowHint(true);
      if (kind === "slow") say(q.say ?? q.prompt.en, 0.5);
      if (kind === "flip") setFlipped(true);
      toast.success(`${POWER_META[kind].icon} ${POWER_META[kind].vi}: ${POWER_META[kind].hint}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Thanh thời gian */}
      {left != null && (
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className={cn("h-full rounded-full transition-[width] duration-200 ease-linear", frozen ? "bg-[#7cc4ff]" : left < 5000 ? "bg-coral" : "bg-sun")} style={{ width: frozen ? "100%" : `${(left / (limit * 1000)) * 100}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-[var(--chalk-dim)]">
        <span>
          {redeem ? "🛟 Câu cứu điểm (tối đa 300)" : `Câu ${(game.pace === "teacher" ? qi : player.pos) + 1}/${game.questions.length}`}
          {player.fx.double && <b className="ml-2 text-sun">✖️2 đang bật</b>}
          {player.fx.saver && <b className="ml-2 text-sun">🛡️</b>}
        </span>
        {frozen ? <b className="text-[#7cc4ff]">⏸️ Đóng băng</b> : left != null && <b className={cn("tabular-nums", left < 5000 && "text-coral")}>{Math.ceil(left / 1000)}s</b>}
      </div>

      {/* Đề */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-4">
        {q.listen && !flipped ? (
          <button onClick={() => say(q.say!, 0.8)} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-sun py-5 font-bold text-ink">
            <Volume2 className="size-7" /> Nghe lại · Listen again
          </button>
        ) : (
          <>
            <p className="font-present text-xl leading-snug font-semibold">{lines.main}</p>
            {lines.sub && <p className="mt-1 text-sm text-[var(--chalk-dim)] italic">{lines.sub}</p>}
          </>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {q.say && !q.listen && (
            <button onClick={() => say(q.say!, 0.9)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 px-3 text-xs font-bold">
              <Volume2 className="size-4" /> Nghe đề
            </button>
          )}
          {q.say && (
            <button onClick={() => say(q.say!, 0.5)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 px-3 text-xs font-bold" aria-label="Nghe chậm">
              <Turtle className="size-4" /> Nghe chậm
            </button>
          )}
          {game.settings.level !== "e1" && !flipped && (
            <button
              onClick={() => {
                setFlipped(true);
                if (game.settings.level === "e3") toast("🔤 Đã lật đề sang tiếng Việt (câu này không được thưởng song ngữ).");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 px-3 text-xs font-bold"
            >
              🔤 Lật đề (Tiếng Việt)
            </button>
          )}
        </div>
        {showHint && q.hint && <p className="mt-2 rounded-xl bg-sun/20 px-3 py-2 text-sm">📖 {q.hint}</p>}
      </div>

      {/* Trả lời */}
      {q.kind === "mcq" && (
        <div className="grid flex-1 grid-cols-1 gap-2.5">
          {q.options!.map((o, i) =>
            hidden.includes(i) ? (
              <div key={i} className="rounded-2xl border border-dashed border-white/15 py-4 text-center text-sm text-white/30">
                ✂️ đã bỏ
              </div>
            ) : (
              <button
                key={i}
                disabled={busy}
                onClick={() => send(i)}
                className="flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-white active:translate-y-[3px] active:shadow-none disabled:opacity-60"
                style={{ background: OPTION_STYLE[i % 4].bg, boxShadow: `0 5px 0 ${OPTION_STYLE[i % 4].shadow}` }}
              >
                <ShapeIcon kind={OPTION_STYLE[i % 4].kind} color="#fff" className="size-6 shrink-0" />
                <span className="min-w-0 flex-1 text-lg leading-tight">{o.en}</span>
              </button>
            )
          )}
        </div>
      )}
      {(q.kind === "number" || q.kind === "text") && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) void send(text.trim());
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            inputMode={q.kind === "number" ? "decimal" : "text"}
            autoFocus
            maxLength={200}
            placeholder={q.kind === "number" ? "Nhập số…" : "Type in English…"}
            className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg font-bold outline-none focus:border-sun"
          />
          {q.unit && <span className="self-center text-lg font-bold">{q.unit}</span>}
          <button disabled={busy || !text.trim()} className="grid size-14 place-items-center rounded-2xl bg-sun text-ink disabled:opacity-50" aria-label="Gửi">
            {busy ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </form>
      )}
      {q.kind === "match" && <MatchBoard q={q} busy={busy} onSubmit={(groups) => send(JSON.stringify(groups))} />}

      {/* Power-up */}
      {game.settings.powerups && player.inv.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <span className="text-xs font-bold text-[var(--chalk-dim)]">Power-up:</span>
          {player.inv.map((k, i) => (
            <button key={`${k}-${i}`} onClick={() => power(k)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-bold active:bg-white/20" title={POWER_META[k].hint}>
              <span>{POWER_META[k].icon}</span> {POWER_META[k].vi}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ghép bộ ba: chạm 3 thẻ (thuật ngữ – nghĩa – kí hiệu) để ghép một nhóm; đủ nhóm thì gửi */
function MatchBoard({ q, busy, onSubmit }: { q: GameQ; busy: boolean; onSubmit: (groups: string[][]) => void }) {
  const cards = q.cards ?? [];
  const need = cards.length / 3;
  const [sel, setSel] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[][]>([]);
  const used = new Set(groups.flat());
  const COLORS = ["#16A34A", "#1C7ED6", "#D98E04", "#E8492E", "#0891B2"];
  const groupOf = (id: string) => groups.findIndex((g) => g.includes(id));

  function tap(id: string, side: string) {
    unlock();
    if (used.has(id)) {
      // Chạm lại thẻ đã ghép → gỡ nhóm đó
      setGroups((gs) => gs.filter((g) => !g.includes(id)));
      return;
    }
    const sameSide = sel.find((x) => cards.find((c) => c.id === x)?.side === side);
    const next = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel.filter((x) => x !== sameSide), id];
    if (next.length === 3) {
      const g = [...groups, next];
      setGroups(g);
      setSel([]);
      sfx.tick();
      if (g.length === need) {
        onSubmit(g);
        setTimeout(() => setGroups([]), 400);
      }
    } else setSel(next);
  }

  const by = (side: "en" | "vi" | "sym") => cards.filter((c) => c.side === side);
  return (
    <div className="grid grid-cols-3 gap-2">
      {(["en", "vi", "sym"] as const).map((side) => (
        <div key={side} className="flex flex-col gap-2">
          <p className="text-center text-[10px] font-bold text-[var(--chalk-dim)] uppercase">{side === "en" ? "English" : side === "vi" ? "Tiếng Việt" : "Kí hiệu / IPA"}</p>
          {by(side).map((c) => {
            const gi = groupOf(c.id);
            return (
              <motion.button
                key={c.id}
                layout
                disabled={busy}
                onClick={() => tap(c.id, c.side)}
                className={cn("min-h-16 rounded-xl border-2 px-1.5 py-2 text-sm leading-tight font-bold break-words", sel.includes(c.id) ? "border-sun bg-sun/20" : gi >= 0 ? "border-transparent text-white" : "border-white/15 bg-white/5")}
                style={gi >= 0 ? { background: COLORS[gi % COLORS.length] } : undefined}
              >
                {c.text}
              </motion.button>
            );
          })}
        </div>
      ))}
      <p className="col-span-3 text-center text-xs text-[var(--chalk-dim)]">
        Đã ghép {groups.length}/{need} nhóm · chạm lại thẻ màu để gỡ nhóm
      </p>
    </div>
  );
}

function RankLine({ last }: { last: LastResult }) {
  const half = last.to <= Math.ceil(last.total / 2);
  const moved = last.from - last.to;
  return (
    <div className="flex flex-col items-center gap-1 text-sm">
      {half ? (
        <p className="font-bold">
          Hạng {last.to}/{last.total} {moved > 0 && <span className="text-[#5be3b5]">▲{moved}</span>}
          {moved < 0 && <span className="text-coral">▼{-moved}</span>}
        </p>
      ) : moved > 0 ? (
        <p className="font-bold text-[#5be3b5]">Em vừa tăng {moved} bậc! · You moved up {moved}!</p>
      ) : (
        <p className="font-bold">Cố lên, mỗi câu đúng là một bước tiến! · Keep going!</p>
      )}
      {last.gap != null && <p className="text-[var(--chalk-dim)]">Còn {last.gap.toLocaleString("vi-VN")} điểm nữa là vượt bạn phía trên</p>}
    </div>
  );
}

function ResultCard({ game, last, missed, reveal, out }: { game: GameDoc; last: LastResult | null; missed?: boolean; reveal?: GameDoc["reveal"]; out?: boolean }) {
  const ok = !!last?.ok;
  // Đổi sticker theo từng câu (chọn theo thời điểm trả lời → ổn định khi vẽ lại)
  const sticker = useMemo(() => {
    const list = ok ? STICKERS.ok : STICKERS.no;
    return list[(last?.at ?? reveal?.i ?? 0) % list.length];
  }, [ok, last?.at, reveal?.i]);
  const show = last?.show ?? reveal?.show;
  const explain = last?.explain ?? reveal?.explain;
  // GV điều khiển: âm thanh đúng/sai lúc công bố
  useEffect(() => {
    if (reveal) feel(ok);
  }, [reveal, ok]);
  return (
    <AnimatePresence>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl p-5 text-center", ok ? "bg-[#16A34A]/25" : "bg-white/5")}>
        {game.settings.stickers && <p className="text-6xl">{missed ? "⏰" : sticker.e}</p>}
        <p className="font-display text-3xl font-extrabold">{missed ? "Em chưa kịp trả lời" : ok ? sticker.en : game.settings.stickers ? sticker.en : "Chưa đúng"}</p>
        {!missed && <p className="text-[var(--chalk-dim)]">{ok ? sticker.vi : sticker.vi}</p>}
        {last && ok && <p className="font-display text-4xl font-extrabold text-sun">+{last.pts.toLocaleString("vi-VN")}</p>}
        {last && last.streak >= 2 && ok && <p className="font-bold">🔥 Chuỗi {last.streak} câu đúng!</p>}
        {last?.gift && (
          <p className="rounded-xl bg-sun px-3 py-1.5 font-bold text-ink">
            🎁 Nhận power-up: {POWER_META[last.gift].icon} {POWER_META[last.gift].vi}
          </p>
        )}
        {!ok && show && (
          <p className="text-sm">
            Đáp án đúng · Answer: <b className="text-sun">{show}</b>
          </p>
        )}
        {explain && (explain.en || explain.vi) && (
          <p className="text-sm text-[var(--chalk-dim)]">
            💡 {explain.en} {explain.vi && <i>— {explain.vi}</i>}
          </p>
        )}
        {out && <p className="font-bold text-coral">🔔 Em bị loại — chờ thầy cô cứu trợ nhé!</p>}
        {last && <RankLine last={last} />}
      </motion.div>
    </AnimatePresence>
  );
}

function Finished({ game, player }: { game: GameDoc; player: PlayerDoc }) {
  const place = game.podium?.findIndex((p) => p.uid === player.uid) ?? -1;
  const teamWin = game.winnerTeam != null && game.winnerTeam === player.team;
  return (
    <Center>
      <p className="text-6xl">{place === 0 ? "🥇" : place === 1 ? "🥈" : place === 2 ? "🥉" : "🎉"}</p>
      <p className="font-display text-3xl font-extrabold">{place >= 0 ? `Top ${place + 1}!` : "Well played!"}</p>
      <p className="text-[var(--chalk-dim)]">Em đã hoàn thành trận đấu · Great game!</p>
      <div className="mt-2 rounded-3xl border-2 border-sun px-8 py-4">
        <p className="text-sm text-[var(--chalk-dim)]">Điểm trận</p>
        <p className="font-display text-5xl font-extrabold text-sun tabular-nums">{player.s.toLocaleString("vi-VN")}</p>
        <p className="mt-1 text-sm">
          Đúng {player.c}/{player.n} · chuỗi dài nhất 🔥{player.best}
        </p>
      </div>
      <p className="text-sm font-bold">
        Khoảng +{gameXp(player.s, teamWin, false)} XP {teamWin && "(có thưởng tổ thắng 👑)"}
      </p>
      <p className="text-xs text-[var(--chalk-dim)]">Thầy cô sẽ đưa lớp quay lại bài học.</p>
    </Center>
  );
}
