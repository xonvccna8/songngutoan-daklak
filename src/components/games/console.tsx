"use client";

// Laptop GV: hộp chọn trò chơi (3 lần bấm: 🎮 → chọn trò → Mở trò chơi) và bảng điều khiển trận
// (Bắt đầu · Công bố · Câu tiếp · Tạm dừng · Cứu trợ · Kết thúc · Về bài học) + % đúng từng câu ngay lúc chơi.
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Flag, Gamepad2, Loader2, Pause, Play, SkipForward, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GameTv } from "@/components/games/tv";
import { aliasOrder, nameOf, sortedRows } from "@/components/games/shared";
import { api, errorMessage } from "@/lib/api-client";
import { useBoard, useGame, useTicker } from "@/lib/games/hooks";
import { MODE_META, type BoardDoc, type GameDoc, type GameLevel, type GameMode, type Pace } from "@/lib/games/types";
import { say } from "@/lib/live/speech";
import type { RosterEntry } from "@/components/live/tv-screen";

const chip = (on: boolean) => cn("h-9 rounded-xl border-2 px-3 text-sm font-bold", on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink/30");

export function StartGameDialog({ sessionId, open, onOpenChange }: { sessionId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<GameMode>("arena");
  const [pace, setPace] = useState<Pace>("self");
  const [team, setTeam] = useState(false);
  const [count, setCount] = useState(10);
  const [qTime, setQTime] = useState(20);
  const [level, setLevel] = useState<GameLevel>("e2");
  const [powerups, setPowerups] = useState(true);
  const [stickers, setStickers] = useState(true);
  const [music, setMusic] = useState(false);
  const [hideNames, setHideNames] = useState(false);
  const [busy, setBusy] = useState(false);
  const meta = MODE_META[mode];

  function pick(m: GameMode) {
    setMode(m);
    if (m === "match") {
      setCount(3);
      setQTime(60);
    } else if (count < 5) {
      setCount(10);
      setQTime(20);
    }
  }

  async function create() {
    setBusy(true);
    try {
      const r = await api<{ id: string; questions: number }>("/api/game", { body: { sessionId, mode, pace, settings: { count, qTime, level, powerups, stickers, music, hideNames, team } } });
      toast.success(`Đã mở ${meta.vi} (${r.questions} ${mode === "match" ? "vòng" : "câu"}). Học sinh đang vào trận…`);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Gamepad2 className="size-6 text-blue" /> Trò chơi trên lớp
          </DialogTitle>
          <DialogDescription>Nội dung tự lấy từ câu hỏi và thuật ngữ của tiết đang dạy. Chơi xong, lớp quay lại đúng trang đang dạy.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(MODE_META) as GameMode[]).map((m) => (
            <button key={m} onClick={() => pick(m)} className={cn("rounded-2xl border-2 p-3 text-left transition-colors", mode === m ? "border-blue bg-blue-soft" : "border-line bg-white hover:border-blue/40")}>
              <p className="font-extrabold">
                {MODE_META[m].icon} {MODE_META[m].vi} <span className="text-en text-xs font-semibold">· {MODE_META[m].en}</span>
              </p>
              <p className="mt-1 text-xs text-ink-2">{MODE_META[m].hint}</p>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {meta.pace === "either" && (
            <Row label="Cách chơi">
              <button className={chip(pace === "self")} onClick={() => setPace("self")}>
                Tự do (mỗi em tốc độ riêng)
              </button>
              <button className={chip(pace === "teacher")} onClick={() => setPace("teacher")}>
                GV điều khiển từng câu
              </button>
            </Row>
          )}
          {meta.team === "either" && (
            <Row label="Thi theo tổ">
              <button className={chip(!team)} onClick={() => setTeam(false)}>
                Cá nhân
              </button>
              <button className={chip(team)} onClick={() => setTeam(true)}>
                Theo tổ (điểm TB mỗi bạn)
              </button>
            </Row>
          )}
          <Row label={mode === "match" ? "Số vòng" : "Số câu"}>
            {(mode === "match" ? [2, 3, 4, 5] : [5, 10, 15, 20]).map((n) => (
              <button key={n} className={chip(count === n)} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </Row>
          <Row label="Giây mỗi câu">
            {(mode === "match" ? [45, 60, 90] : [10, 20, 30, 60, 0]).map((n) => (
              <button key={n} className={chip(qTime === n)} onClick={() => setQTime(n)}>
                {n ? `${n}s` : "Không tính giờ"}
              </button>
            ))}
          </Row>
          <Row label="Mức tiếng Anh của đề">
            {(["e1", "e2", "e3"] as GameLevel[]).map((l) => (
              <button key={l} className={chip(level === l)} onClick={() => setLevel(l)} title={l === "e1" ? "Chủ yếu tiếng Việt" : l === "e2" ? "Song ngữ" : "Chủ yếu tiếng Anh, +100 điểm thưởng song ngữ"}>
                {l.toUpperCase()} · {l === "e1" ? "Việt + thuật ngữ" : l === "e2" ? "Song ngữ" : "Tiếng Anh (+100)"}
              </button>
            ))}
          </Row>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            {mode === "arena" && <Check v={powerups} set={setPowerups} label="Power-up 🎁" />}
            <Check v={stickers} set={setStickers} label="Sticker động viên" />
            <Check v={music} set={setMusic} label="Nhạc nền (tivi)" />
            <Check v={hideNames} set={setHideNames} label="Ẩn tên trên tivi (tên nhà toán học)" />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button size="lg" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Gamepad2 />} Mở trò chơi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-36 shrink-0 text-xs font-bold text-ink-2">{label}</span>
      {children}
    </div>
  );
}

function Check({ v, set, label }: { v: boolean; set: (b: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );
}

/** Khu vực trò chơi trên laptop GV: xem trước tivi + bảng điều khiển */
export function GameStage({ gameId, roster }: { gameId: string; roster: Map<string, RosterEntry> }) {
  const { data: game } = useGame(gameId);
  const board = useBoard(gameId);
  if (!game) return <p className="flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-4 animate-spin" /> Đang mở trò chơi…</p>;
  return (
    <div className="flex flex-col gap-4">
      <GameTv game={game} board={board} roster={roster} className="rounded-2xl shadow-[0_18px_40px_-20px_rgba(28,27,58,.6)]" />
      <GameConsole game={game} board={board} roster={roster} />
    </div>
  );
}

function GameConsole({ game, board, roster }: { game: GameDoc; board: BoardDoc | null; roster: Map<string, RosterEntry> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const rows = board?.rows ?? {};
  const players = Object.keys(rows).length;
  const now = useTicker(500, game.status === "play" && game.pace === "teacher");

  async function act(action: string) {
    setBusy(action);
    try {
      await api(`/api/game/${game.id}/control`, { body: { action } });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  // GV điều khiển: hết giờ hoặc mọi em (còn trong cuộc) đã trả lời → tự công bố
  const autoRef = useRef<string>("");
  const cur = game.cur;
  const st = cur ? board?.stats?.[cur.i] : undefined;
  const alive = Object.values(rows).filter((r) => !r.out).length;
  useEffect(() => {
    if (game.status !== "play" || game.pace !== "teacher" || !cur || cur.phase !== "q") return;
    const tag = `${cur.i}-${cur.startedAt}`;
    const timeUp = cur.endsAt != null && now > cur.endsAt + 800;
    const allIn = alive > 0 && (st?.a ?? 0) >= alive;
    if ((timeUp || allIn) && autoRef.current !== tag) {
      autoRef.current = tag;
      void act("reveal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- act ổn định trong một lần render
  }, [now, st?.a, alive, cur?.i, cur?.phase, game.status]);

  const last = cur && cur.i >= game.questions.length - 1;
  const order = aliasOrder(rows);
  const weak = game.questions.map((q, i) => ({ q, i, st: board?.stats?.[i] })).filter((x) => x.st && x.st.a >= 3 && x.st.c / x.st.a < 0.5);

  return (
    <div className="card-lsn flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-extrabold">
          {MODE_META[game.mode].icon} {MODE_META[game.mode].vi} · {game.status === "lobby" ? "Phòng chờ" : game.status === "paused" ? "Tạm dừng" : game.status === "ended" ? "Đã kết thúc" : "Đang chơi"} · {players} em
        </p>
        {game.status === "lobby" && (
          <Button size="lg" onClick={() => act("start")} disabled={!!busy || players === 0}>
            {busy === "start" ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />} Bắt đầu trận
          </Button>
        )}
        {game.status === "play" && game.pace === "teacher" && cur?.phase === "q" && (
          <Button size="lg" onClick={() => act("reveal")} disabled={!!busy}>
            <Flag /> Công bố đáp án
          </Button>
        )}
        {game.status === "play" && game.pace === "teacher" && cur?.phase === "reveal" && (
          <Button size="lg" onClick={() => act("next")} disabled={!!busy}>
            <SkipForward /> {last ? "Xem kết quả" : "Câu tiếp"}
          </Button>
        )}
        {game.mode === "bell" && game.status === "play" && (
          <Button variant="sun" onClick={() => act("rescue")} disabled={!!busy}>
            🛟 Cứu trợ
          </Button>
        )}
        {game.status === "play" && (
          <Button variant="outline" onClick={() => act("pause")} disabled={!!busy}>
            <Pause /> Tạm dừng
          </Button>
        )}
        {game.status === "paused" && (
          <Button onClick={() => act("resume")} disabled={!!busy}>
            <Play /> Tiếp tục
          </Button>
        )}
        {game.status !== "ended" && game.status !== "lobby" && (
          <Button variant="destructive" onClick={() => act("end")} disabled={!!busy}>
            Kết thúc trận
          </Button>
        )}
        {(game.status === "ended" || game.status === "lobby") && (
          <Button variant={game.status === "ended" ? "default" : "ghost"} onClick={() => act("close")} disabled={!!busy}>
            <ArrowLeft /> {game.status === "ended" ? "Về bài học" : "Huỷ trò chơi"}
          </Button>
        )}
      </div>
      {game.status === "lobby" && players === 0 && <p className="text-sm text-ink-2">Chờ học sinh vào trận (điện thoại tự chuyển vào trò chơi)…</p>}
      {game.status === "ended" && <p className="text-sm text-ink-2">Đã cộng XP trận vào bảng xếp hạng “Trên lớp”. Bấm “Về bài học” để quay lại đúng trang đang dạy.</p>}

      {/* Câu khó: dưới 50% đúng → gợi ý dừng lại giảng */}
      {weak.length > 0 && (
        <div className="rounded-2xl bg-coral-soft p-3 text-sm">
          <p className="font-bold text-[#A3301B]">Câu dưới 50% đúng — nên dừng lại giảng:</p>
          <ul className="mt-1 space-y-0.5">
            {weak.map((x) => (
              <li key={x.i}>
                Câu {x.i + 1}: {x.q.prompt.vi || x.q.prompt.en} ({Math.round((x.st!.c / x.st!.a) * 100)}% đúng)
              </li>
            ))}
          </ul>
          <button onClick={() => say("Let's look at this question together.")} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-xs font-bold">
            <Volume2 className="size-3.5" /> “Let&apos;s look at this question together.” — Cùng xem lại câu này nhé.
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold text-ink-2 uppercase">Từng câu (cập nhật tức thì)</p>
          <div className="max-h-64 overflow-y-auto rounded-xl border-2 border-line">
            <table className="w-full text-sm">
              <tbody>
                {game.questions.map((q, i) => {
                  const s = board?.stats?.[i];
                  const pct = s?.a ? Math.round((s.c / s.a) * 100) : null;
                  return (
                    <tr key={q.id} className={cn("border-b border-line", cur?.i === i && "bg-blue-soft")}>
                      <td className="px-2 py-1.5 font-bold tabular-nums">{i + 1}</td>
                      <td className="max-w-0 truncate px-2 py-1.5">{q.prompt.vi || q.prompt.en}</td>
                      <td className={cn("px-2 py-1.5 text-right font-bold tabular-nums", pct != null && pct < 50 ? "text-coral-dk" : "")}>{pct == null ? "—" : `${pct}%`}</td>
                      <td className="px-2 py-1.5 text-right text-xs text-ink-2 tabular-nums">{s?.a ?? 0} trả lời</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-ink-2 uppercase">Học sinh</p>
          <div className="max-h-64 overflow-y-auto rounded-xl border-2 border-line">
            <table className="w-full text-sm">
              <tbody>
                {sortedRows(rows).map(([uid, r], i) => (
                  <tr key={uid} className={cn("border-b border-line", r.out && "opacity-50")}>
                    <td className="px-2 py-1.5 font-bold tabular-nums">{i + 1}</td>
                    <td className="truncate px-2 py-1.5">
                      {nameOf(uid, roster, false, order)}
                      {game.settings.hideNames && <span className="ml-1 text-xs text-ink-2">({nameOf(uid, roster, true, order)})</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right text-xs tabular-nums">
                      {r.c}/{r.n} {r.st >= 3 && `🔥${r.st}`} {r.done && "✓"} {r.out && "🔔"}
                    </td>
                    <td className="px-2 py-1.5 text-right font-bold tabular-nums">{r.s.toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
