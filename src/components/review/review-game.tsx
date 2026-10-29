"use client";

// Trò chơi ôn tập theo bài: ghép cặp từ vựng · thử thách từ vựng · đố vui kiến thức · về đích (3 mạng).
// Có âm thanh đúng/sai, chuỗi đúng liên tiếp, đồng hồ, pháo giấy, kỷ lục trên máy. Dùng cho HS (điện thoại) và GV (trình chiếu).
import { useEffect, useRef, useState } from "react";
import { BookOpenCheck, Brain, Check, Flag, Flame, Heart, Puzzle, RotateCcw, Star, Timer, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "cn";
import { SHAPE_COLORS, ShapeIcon, type ShapeKind } from "@/components/brand/shapes";
import { Tam } from "@/components/brand/tam";
import { burst, buzz, cheer } from "@/lib/feedback";
import { isMuted, setMuted, sfx, unlock } from "@/lib/games/sound";
import { say } from "@/lib/live/speech";
import type { VocabRow } from "@/lib/notebook";
import { LIVES, MODES, QUIZ_SECONDS, buildRound, getBest, matchRounds, quizPoints, saveBest, shuffle, starsOf, type GameMode, type GameQ, type MatchPair } from "@/lib/review/game";

const KINDS: ShapeKind[] = ["triangle", "diamond", "circle", "square"];
const MODE_ICON = { match: Puzzle, vocab: BookOpenCheck, science: Brain, final: Flag } as const;
const MODE_TINT = { match: "bg-teal-soft text-[#0E6377]", vocab: "bg-blue-soft text-blue-dk", science: "bg-sun-soft text-[#8A5A00]", final: "bg-coral-soft text-[#A3301B]" } as const;

interface Result {
  mode: GameMode;
  score: number;
  correct: number;
  total: number;
  /** Câu làm sai — xem lại ở màn kết thúc */
  missed: { prompt: string; answer: string }[];
  /** Hết mạng trước khi xong */
  out?: boolean;
}

type Screen = { s: "menu" } | { s: "quiz"; mode: Exclude<GameMode, "match">; qs: GameQ[] } | { s: "match"; rounds: MatchPair[][] } | { s: "end"; r: Result; record: boolean };

export function ReviewGame({ lessonId, title, vocab, onFinish }: { lessonId: string; title: string; vocab: VocabRow[]; onFinish?: (r: Result) => void }) {
  const [screen, setScreen] = useState<Screen>({ s: "menu" });
  const [round, setRound] = useState(0); // đổi key để chơi lại từ đầu

  function start(mode: GameMode) {
    unlock();
    sfx.pop();
    setRound((n) => n + 1);
    if (mode === "match") setScreen({ s: "match", rounds: matchRounds(vocab) });
    else setScreen({ s: "quiz", mode, qs: buildRound(mode, lessonId, vocab) });
  }

  function finish(r: Result) {
    const record = saveBest(lessonId, r.mode, r.score);
    const stars = starsOf(r.correct, r.total);
    if (stars >= 2) {
      sfx.fanfare();
      burst(null, true);
      setTimeout(() => burst(null, true), 450);
    } else if (r.out || stars === 0) sfx.lose();
    setScreen({ s: "end", r, record });
    onFinish?.(r);
  }

  const canMatch = vocab.length >= 3;

  return (
    <div className="flex flex-col gap-4">
      {screen.s === "menu" && (
        <>
          <div className="card-lsn flex items-center gap-3 p-4">
            <Tam mood="happy" className="size-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink-2">Trò chơi ôn tập · Review game</p>
              <b className="block font-display text-lg leading-tight">{title}</b>
            </div>
            <MuteButton />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => {
              const Icon = MODE_ICON[m.id];
              const disabled = m.id === "match" && !canMatch;
              const best = getBest(lessonId, m.id);
              return (
                <button
                  key={m.id}
                  disabled={disabled}
                  onClick={() => start(m.id)}
                  className="card-lsn hover-glow group flex items-start gap-3 p-4 text-left disabled:opacity-50"
                >
                  <span className={cn("hover-wiggle grid size-12 shrink-0 place-items-center rounded-2xl", MODE_TINT[m.id])}>
                    <Icon className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-display text-lg leading-tight">{m.vi}</b>
                    <span className="text-en block text-xs font-semibold">{m.en}</span>
                    <span className="mt-1 block text-xs text-ink-2">{disabled ? "Bài này chưa đủ từ vựng để ghép." : m.desc}</span>
                    {best > 0 && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sun-soft px-2 py-0.5 text-[11px] font-bold text-[#8A5A00]">
                        <Trophy className="size-3" /> Kỷ lục {best.toLocaleString("vi-VN")}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {screen.s === "quiz" && <Quiz key={round} qs={screen.qs} mode={screen.mode} onEnd={finish} onQuit={() => setScreen({ s: "menu" })} />}
      {screen.s === "match" && <Match key={round} rounds={screen.rounds} onEnd={finish} onQuit={() => setScreen({ s: "menu" })} />}
      {screen.s === "end" && <End r={screen.r} record={screen.record} onAgain={() => start(screen.r.mode)} onMenu={() => setScreen({ s: "menu" })} />}
    </div>
  );
}

function MuteButton() {
  const [muted, setM] = useState(isMuted);
  return (
    <button
      onClick={() => {
        setMuted(!muted);
        setM(!muted);
        if (muted) {
          unlock();
          sfx.pop();
        }
      }}
      className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-line bg-white text-ink-2"
      aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
      title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  );
}

function TopBar({ onQuit, children }: { onQuit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onQuit} className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-line bg-white text-ink-2" aria-label="Thoát trò chơi">
        <X className="size-5" />
      </button>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">{children}</div>
      <MuteButton />
    </div>
  );
}

const Chip = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={cn("inline-flex h-9 items-center gap-1 rounded-xl px-2.5 font-display text-sm font-extrabold", className)}>{children}</span>
);

/* ===================== Đố nhanh (trắc nghiệm có giờ) ===================== */

function Quiz({ qs, mode, onEnd, onQuit }: { qs: GameQ[]; mode: Exclude<GameMode, "match">; onEnd: (r: Result) => void; onQuit: () => void }) {
  const hasLives = mode === "final";
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // -1 = hết giờ
  const [left, setLeft] = useState(QUIZ_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [gain, setGain] = useState(0);
  const missed = useRef<Result["missed"]>([]);
  const q = qs[i];

  // Đồng hồ đếm ngược từng câu; hết giờ = sai
  const leftRef = useRef(QUIZ_SECONDS);
  useEffect(() => {
    if (picked != null || !q) return;
    const t = setInterval(() => {
      leftRef.current = Math.max(0, leftRef.current - 0.25);
      setLeft(leftRef.current);
      if (leftRef.current <= 0) choose(-1);
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, q]);

  // Câu nghe: đọc từ ngay khi hiện câu
  useEffect(() => {
    if (q?.listen) say(q.listen, 0.85);
  }, [q]);

  function choose(k: number, el?: Element | null) {
    if (picked != null || !q) return;
    setPicked(k);
    if (k === q.answer) {
      const pts = quizPoints(Math.ceil(left), streak);
      setScore((s) => s + pts);
      setGain(pts);
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
      cheer(el);
      if (streak >= 2) setTimeout(() => sfx.combo(streak), 250);
    } else {
      buzz();
      setStreak(0);
      setGain(0);
      if (hasLives) setLives((l) => l - 1);
      missed.current.push({ prompt: q.listen ? `(nghe) ${q.listen}` : q.prompt, answer: q.options[q.answer] });
    }
  }

  const out = hasLives && lives <= 0;
  const last = i + 1 >= qs.length;

  function next() {
    if (out || last) {
      onEnd({ mode, score, correct, total: out ? i + 1 : qs.length, missed: missed.current, out });
      return;
    }
    setI(i + 1);
    setPicked(null);
    leftRef.current = QUIZ_SECONDS;
    setLeft(QUIZ_SECONDS);
    sfx.pop();
  }

  // Đúng → tự sang câu sau
  useEffect(() => {
    if (picked == null || !q || picked !== q.answer || last) return;
    const t = setTimeout(next, 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  if (!q) {
    return (
      <div className="card-lsn p-5 text-center text-sm text-ink-2">
        Bài này chưa có đủ câu hỏi cho trò chơi này.
        <button onClick={onQuit} className="mt-3 block w-full font-bold text-blue">
          Quay lại
        </button>
      </div>
    );
  }

  const done = picked != null;
  const ok = done && picked === q.answer;
  const pct = (left / QUIZ_SECONDS) * 100;

  return (
    <>
      <TopBar onQuit={onQuit}>
        {hasLives && (
          <Chip className="bg-coral-soft text-coral-dk">
            {Array.from({ length: LIVES }, (_, k) => (
              <Heart key={k} className={cn("size-4", k < lives ? "fill-coral text-coral" : "text-coral/30", k === lives && done && !ok && "animate-shake")} />
            ))}
          </Chip>
        )}
        {streak >= 2 && (
          <Chip className="animate-pop bg-sun-soft text-[#8A5A00]" key={streak}>
            <Flame className="size-4 fill-sun text-sun-dk" /> ×{streak}
          </Chip>
        )}
        <Chip className="bg-white ring-2 ring-line">
          <Star className="size-4 fill-sun text-sun-dk" /> {score.toLocaleString("vi-VN")}
        </Chip>
      </TopBar>

      {/* Tiến độ + đồng hồ */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-ink-2">
          <span>
            Câu {i + 1}/{qs.length}
          </span>
          <span className={cn("inline-flex items-center gap-1", left <= 5 && !done && "text-coral-dk")}>
            <Timer className="size-3.5" /> {Math.ceil(left)} giây
          </span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line">
          <div className={cn("h-full rounded-full transition-[width] duration-300 ease-linear", left <= 5 ? "bg-coral" : "bg-blue")} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div key={i} className="card-lsn animate-in fade-in slide-in-from-right-4 p-5 text-center duration-300">
        <p className="text-[11px] font-bold tracking-wider text-ink-2 uppercase">{q.tag}</p>
        {q.listen ? (
          <button
            onClick={() => say(q.listen!, 0.85)}
            className="mx-auto mt-3 grid size-20 place-items-center rounded-full bg-blue text-white shadow-[0_5px_0_var(--color-blue-dk)] active:translate-y-[3px] active:shadow-none"
            aria-label="Nghe lại"
          >
            <Volume2 className="size-9" />
          </button>
        ) : null}
        <p className={cn("mt-2 font-display font-extrabold", q.listen ? "text-sm text-ink-2" : "text-2xl leading-snug", q.enPrompt && "text-en")}>{q.prompt}</p>
        {q.sub && !q.listen && <p className={cn("mt-1 text-sm", q.enPrompt && q.tag.startsWith("Anh") ? "text-ink-2" : "text-vi")}>{q.sub}</p>}
      </div>

      {q.layout === "tf" ? (
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o, k) => (
            <OptionBtn key={k} k={k} text={o} q={q} picked={picked} onPick={choose} tone={k === 0 ? "#1C7ED6" : "#7A4CC2"} tall />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o, k) => (
            <OptionBtn key={k} k={k} text={o} q={q} picked={picked} onPick={choose} />
          ))}
        </div>
      )}

      {done && (
        <div className={cn("animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3 rounded-3xl p-4 duration-300", ok ? "bg-success-bg" : "animate-shake border-2 border-coral/50 bg-coral-soft")}>
          <Tam mood={ok ? "cheer" : "calm"} className="size-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className={cn("font-display text-xl font-extrabold", ok ? "text-success-fg" : "text-coral-dk")}>
              {ok ? `Correct! +${gain}` : picked === -1 ? "Hết giờ! · Time's up" : "Chưa đúng · Not quite"}
            </p>
            {!ok && (
              <p className="text-sm">
                Đáp án: <b className={cn(q.enOptions && "text-en")}>{q.options[q.answer]}</b>
              </p>
            )}
            {ok && streak >= 3 && <p className="text-sm font-semibold text-[#8A5A00]">Chuỗi {streak} câu đúng liên tiếp!</p>}
          </div>
          {(!ok || last) && (
            <button onClick={next} className="h-12 shrink-0 rounded-2xl bg-ink px-4 font-bold text-white shadow-[0_4px_0_#000] active:translate-y-[3px] active:shadow-none">
              {out || last ? "Xem kết quả" : "Câu tiếp"}
            </button>
          )}
        </div>
      )}
    </>
  );
}

function OptionBtn({ k, text, q, picked, onPick, tone, tall }: { k: number; text: string; q: GameQ; picked: number | null; onPick: (k: number, el: Element) => void; tone?: string; tall?: boolean }) {
  const kind = KINDS[k % 4];
  const c = SHAPE_COLORS[kind];
  const bg = tone ?? c.bg;
  const fg = tone ? "#fff" : c.text;
  const done = picked != null;
  const right = k === q.answer;
  const mine = picked === k;
  return (
    <button
      disabled={done}
      onClick={(e) => onPick(k, e.currentTarget)}
      className={cn(
        "relative flex flex-col items-start justify-between gap-2 rounded-[20px] p-3 text-left transition-all active:translate-y-[4px] active:shadow-none disabled:active:translate-y-0",
        tall ? "min-h-24 items-center justify-center text-center" : "min-h-24",
        done && !right && !mine && "opacity-30",
        done && right && "animate-pop ring-4 ring-success-fg ring-offset-2",
        mine && !right && "animate-shake ring-4 ring-coral-dk ring-offset-2"
      )}
      style={{ background: bg, color: fg, boxShadow: `0 6px 0 ${tone ? "rgba(0,0,0,.25)" : c.dk}` }}
    >
      {!tall && <ShapeIcon kind={kind} color={fg} className="size-6" />}
      <span className={cn("leading-tight font-semibold", tall ? "font-display text-2xl font-extrabold" : "text-base", q.enOptions && "font-present")}>{text}</span>
      {done && right && <Check className="absolute top-2 right-2 size-6 rounded-full bg-white p-1 text-success-fg" />}
      {mine && !right && <X className="absolute top-2 right-2 size-6 rounded-full bg-white p-1 text-coral-dk" />}
    </button>
  );
}

/* ===================== Ghép cặp ===================== */

interface MatchBoard {
  pairs: MatchPair[];
  left: string[];
  right: string[];
}

const boardOf = (pairs: MatchPair[]): MatchBoard => ({ pairs, left: shuffle(pairs.map((p) => p.id)), right: shuffle(pairs.map((p) => p.id)) });

function Match({ rounds, onEnd, onQuit }: { rounds: MatchPair[][]; onEnd: (r: Result) => void; onQuit: () => void }) {
  const [r, setR] = useState(0);
  const [board, setBoard] = useState<MatchBoard>(() => boardOf(rounds[0] ?? []));
  const [sel, setSel] = useState<{ side: "en" | "vi"; id: string } | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [bad, setBad] = useState<{ en: string; vi: string; n: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [secs, setSecs] = useState(0);
  const missed = useRef<Result["missed"]>([]);
  const total = rounds.reduce((s, x) => s + x.length, 0);
  const matched = rounds.slice(0, r).reduce((s, x) => s + x.length, 0) + done.length;

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function tap(side: "en" | "vi", id: string, el: Element) {
    if (done.includes(id)) return;
    if (!sel || sel.side === side) {
      sfx.pop();
      setSel({ side, id });
      return;
    }
    const en = side === "en" ? id : sel.id;
    const vi = side === "vi" ? id : sel.id;
    setSel(null);
    if (en === vi) {
      const nextDone = [...done, id];
      setDone(nextDone);
      cheer(el);
      const p = board.pairs.find((x) => x.id === id);
      if (p) say(p.en, 0.9);
      if (nextDone.length === board.pairs.length) setTimeout(() => nextRound(), 700);
    } else {
      buzz();
      setMistakes((m) => m + 1);
      setBad((b) => ({ en, vi, n: (b?.n ?? 0) + 1 }));
      const p = board.pairs.find((x) => x.id === en);
      if (p && !missed.current.some((m) => m.prompt === p.en)) missed.current.push({ prompt: p.en, answer: p.vi });
    }
  }

  function nextRound() {
    if (r + 1 >= rounds.length) {
      // Điểm: 100/cặp − 25/lần sai + thưởng nhanh (dưới 8 giây mỗi cặp)
      const score = Math.max(0, total * 100 - mistakes * 25 + Math.max(0, total * 8 - secs) * 10);
      onEnd({ mode: "match", score, correct: total, total: total + mistakes, missed: missed.current });
      return;
    }
    sfx.pass();
    setR(r + 1);
    setBoard(boardOf(rounds[r + 1]));
    setDone([]);
    setBad(null);
  }

  const byId = new Map(board.pairs.map((p) => [p.id, p]));
  const card = (side: "en" | "vi", id: string) => {
    const p = byId.get(id)!;
    const isDone = done.includes(id);
    const isSel = sel?.side === side && sel.id === id;
    const isBad = bad && bad[side] === id;
    return (
      <button
        key={`${side}-${id}-${isBad ? bad!.n : 0}`}
        disabled={isDone}
        onClick={(e) => tap(side, id, e.currentTarget)}
        className={cn(
          "min-h-16 rounded-2xl border-2 px-3 py-2 text-left text-[15px] leading-tight font-semibold transition-all",
          isDone ? "animate-pop border-success-fg/40 bg-success-bg text-success-fg opacity-60" : isSel ? "-translate-y-0.5 border-blue bg-blue-soft shadow-[0_4px_0_var(--color-blue)]" : "border-line-2 bg-white shadow-[0_4px_0_var(--color-line-2)]",
          isBad && "animate-shake border-coral",
          side === "en" ? "font-present text-blue-dk" : "text-ink"
        )}
      >
        {isDone && <Check className="mr-1 inline size-4" />}
        {side === "en" ? p.en : p.vi}
      </button>
    );
  };

  return (
    <>
      <TopBar onQuit={onQuit}>
        <Chip className="bg-white ring-2 ring-line">
          <Timer className="size-4" /> {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
        </Chip>
        <Chip className="bg-coral-soft text-coral-dk">
          <X className="size-4" /> {mistakes}
        </Chip>
      </TopBar>
      <div>
        <div className="flex justify-between text-xs font-bold text-ink-2">
          <span>
            Lượt {r + 1}/{rounds.length}
          </span>
          <span>
            {matched}/{total} cặp
          </span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-teal transition-[width] duration-300" style={{ width: `${(matched / Math.max(1, total)) * 100}%` }} />
        </div>
      </div>
      <p className="text-center text-sm text-ink-2">Chạm một từ tiếng Anh rồi chạm nghĩa tiếng Việt của nó</p>
      <div key={r} className="animate-in fade-in grid grid-cols-2 gap-2.5 duration-300">
        <div className="flex flex-col gap-2.5">{board.left.map((id) => card("en", id))}</div>
        <div className="flex flex-col gap-2.5">{board.right.map((id) => card("vi", id))}</div>
      </div>
    </>
  );
}

/* ===================== Kết thúc ===================== */

function End({ r, record, onAgain, onMenu }: { r: Result; record: boolean; onAgain: () => void; onMenu: () => void }) {
  const stars = starsOf(r.correct, r.total);
  const msg = stars === 3 ? "Xuất sắc! · Excellent!" : stars === 2 ? "Rất tốt! · Great job!" : stars === 1 ? "Khá lắm! · Good try!" : "Cố lên nhé! · Keep going!";
  return (
    <div className="card-lsn animate-in fade-in zoom-in-95 flex flex-col items-center p-6 text-center duration-300">
      <Tam mood={stars >= 2 ? "cheer" : stars === 1 ? "happy" : "calm"} className="size-24" />
      <div className="mt-2 flex gap-1">
        {[0, 1, 2].map((k) => (
          <Star key={k} className={cn("size-10", k < stars ? "animate-pop fill-sun text-sun-dk" : "text-line-2")} style={{ animationDelay: `${k * 150}ms` }} />
        ))}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold">{r.out ? "Hết mạng! · Out of lives" : msg}</p>
      <p className="mt-1 font-display text-4xl font-extrabold text-blue-dk">{r.score.toLocaleString("vi-VN")}</p>
      <p className="text-sm text-ink-2">điểm · {r.mode === "match" ? `${r.correct} cặp, sai ${r.total - r.correct} lần` : `đúng ${r.correct}/${r.total} câu`}</p>
      {record && (
        <p className="animate-pop mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1 text-sm font-extrabold text-ink">
          <Trophy className="size-4" /> Kỷ lục mới! · New record!
        </p>
      )}

      {r.missed.length > 0 && (
        <div className="mt-5 w-full text-left">
          <p className="text-sm font-extrabold">Ôn lại các câu chưa đúng</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {r.missed.map((m, k) => (
              <li key={k} className="rounded-xl bg-paper px-3 py-2 text-sm">
                <span className="block text-ink-2">{m.prompt}</span>
                <b className="text-success-fg">→ {m.answer}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid w-full grid-cols-2 gap-2">
        <button onClick={onMenu} className="h-12 rounded-2xl border-2 border-line-2 bg-white font-bold">
          Chọn trò khác
        </button>
        <button onClick={onAgain} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue font-bold text-white shadow-[0_4px_0_var(--color-blue-dk)] active:translate-y-[3px] active:shadow-none">
          <RotateCcw className="size-4" /> Chơi lại
        </button>
      </div>
    </div>
  );
}
