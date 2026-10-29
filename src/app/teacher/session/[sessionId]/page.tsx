"use client";

// Laptop GV điều khiển tiết học: xem trước tivi, nút Tiếp, ghi chú, câu trả lời, lưới học sinh
import { useMemo, useState } from "react";
import { ComposeDialog, KIND_ICON, sendQuick } from "@/components/messages/compose-dialog";
import { MessageFeed } from "@/components/messages/message-feed";
import { useClassMessages } from "@/lib/messages/hooks";
import { KIND_META, type MessageKind, type ReceiptStatus } from "@/lib/messages/types";
import { useClassStats, useNow } from "@/lib/hooks/use-class-history";
import { AssistantPanel } from "@/components/live/console/assistant-panel";
import { TimelineBar } from "@/components/live/console/timeline-bar";
import { PairsPanel } from "@/components/live/console/pairs-panel";
import { suggest, type SuggestAction } from "@/lib/live/assistant";
import { phaseOf, planMinutes, timelineView } from "@/lib/live/timeline";
import type { PairInput } from "@/lib/live/pairing";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Dices, Gamepad2, Loader2, MonitorUp, Square, TimerOff, Volume2 } from "lucide-react";
import { GameStage, StartGameDialog } from "@/components/games/console";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState, FullScreenLoader } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { TvScreen } from "@/components/live/tv-screen";
import { Panel, ResponsesPanel } from "@/components/live/console/responses-panel";
import { StudentPanel } from "@/components/live/console/student-panel";
import { SessionReport } from "@/components/live/console/session-report";
import { api, errorMessage } from "@/lib/api-client";
import { isInteractive } from "@/lib/live/grading";
import { say } from "@/lib/live/speech";
import { useLiveControls } from "@/lib/live/use-controls";
import { useSessionData } from "@/lib/live/use-session-data";
import type { Lang } from "@/lib/live/types";

const LANGS: { v: Lang; label: string }[] = [
  { v: "en", label: "Chỉ tiếng Anh" },
  { v: "bi", label: "Song ngữ" },
  { v: "vi", label: "Tiếng Việt" },
];

export default function TeacherSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const d = useSessionData(sessionId);
  // Đang chơi trò chơi → tắt phím tắt của bài học (tránh bấm nhầm sang trang)
  const { actions, left, nextLabel } = useLiveControls({ session: d.session, receivedAt: d.receivedAt, ctx: d.ctx, roster: d.joined, keyboard: !d.session?.gameId });
  const [confirmEl, confirm] = useConfirm();
  const [ending, setEnding] = useState(false);
  const [gaming, setGaming] = useState(false);
  const [compose, setCompose] = useState<{ kind: MessageKind; uids?: string[] } | null>(null);
  const msgs = useClassMessages(d.session?.classId, 15);
  const now = useNow(30_000);
  // Đợt B — đồng hồ cho thanh thời gian + trợ lý gợi ý; thống kê lớp để ghép cặp
  const tick = useNow(5_000);
  const classStats = useClassStats(d.session?.classId);

  // Trạng thái tin "Chú ý" gần nhất của từng em trong tiết này
  const attention = useMemo(() => {
    const m = new Map<string, ReceiptStatus>();
    msgs.data
      .filter((x) => x.kind === "attention" && x.sessionId === sessionId)
      .forEach((x) => x.toUids.forEach((u) => !m.has(u) && m.set(u, msgs.receipts[x.id]?.find((r) => r.uid === u)?.status ?? "sent")));
    return m;
  }, [msgs.data, msgs.receipts, sessionId]);

  async function bell(uid: string) {
    if (!d.session) return;
    try {
      const r = await sendQuick(d.session.classId, [uid], "attention", d.session.id);
      toast.success(`Đã nhắc chú ý ${d.roster.get(uid)?.name ?? ""}${r.silent ? " (giờ yên lặng: không đổ chuông)" : ""}.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  if (d.loading || (d.session && !d.lesson && !d.lessonError)) return <FullScreenLoader label="Đang mở tiết học…" />;
  if (!d.session || !d.lesson) {
    return (
      <div className="p-8">
        <EmptyState title="Không mở được tiết học" mood="alert" action={<Link href="/teacher" className="font-bold text-blue">← Về trang chủ</Link>}>
          {d.lessonError ?? "Tiết học không tồn tại hoặc bạn không có quyền."}
        </EmptyState>
      </div>
    );
  }

  const s = d.session;
  const st = s.state;
  const slide = d.lesson.slides[st.slideIndex];
  const key = slide ? d.lesson.keys[slide.id] : undefined;
  const back = `/teacher/classes/${s.classId}`;

  async function end() {
    const ok = await confirm({
      title: "Kết thúc tiết học?",
      description: "Điện thoại học sinh sẽ thoát khỏi tiết, kết quả được lưu vào thống kê của từng em.",
      confirmText: "Kết thúc & lưu",
    });
    if (!ok) return;
    setEnding(true);
    try {
      await api(`/api/live/sessions/${s.id}/end`, { method: "POST" });
      toast.success("Đã kết thúc tiết và lưu kết quả.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setEnding(false);
    }
  }

  const openTv = () => window.open(`/present/${s.id}`, "lsn-tv", "popup,width=1280,height=720");

  // ---- Đợt B: thanh thời gian, trợ lý gợi ý, ghép cặp ----
  const slides = d.lesson.slides;
  const timeline = timelineView(planMinutes(d.lesson.lesson.duration, d.lesson.lesson.timing), st.actStarts, phaseOf(slides, st.slideIndex), tick);
  const nameOf = (uid: string) => d.roster.get(uid)?.name ?? "Học sinh";
  const tips = suggest({ state: st, slides, responses: d.responses, participants: d.participants, name: nameOf, left, now: tick, timeline });
  function onTip(a: SuggestAction) {
    if (a.kind === "lock") actions.lock();
    else if (a.kind === "addTime") actions.timer(Math.ceil(((left ?? 0) + a.sec * 1000) / 1000));
    else if (a.kind === "langEn") actions.lang("en");
    else if (a.kind === "call") actions.callUid(a.uid);
    else if (a.kind === "bell") bell(a.uid);
    else if (a.kind === "next") actions.next();
  }
  // Tỉ lệ đúng Ngôn ngữ / Toán: ưu tiên tiết này (≥ 2 câu mỗi phần), không đủ thì dùng thống kê cả lớp
  const pairInputs: PairInput[] = d.joined.map(({ uid }) => {
    const mine = d.responses.filter((r) => r.uid === uid && r.qtype !== "speak");
    const part = (lang: boolean) => mine.filter((r) => (r.skill === "Ngôn ngữ") === lang);
    const rate = (xs: typeof mine) => (xs.length >= 2 ? xs.filter((r) => r.correct).length / xs.length : null);
    const st2 = classStats.get(uid);
    const fromStats = (a?: number, c?: number) => (a && a >= 2 ? (c ?? 0) / a : null);
    return { uid, lang: rate(part(true)) ?? fromStats(st2?.langAnswered, st2?.langCorrect), sci: rate(part(false)) ?? fromStats(st2?.mathAnswered, st2?.mathCorrect) };
  });

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      {/* Đầu trang */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b-2 border-line bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
        <Link href={back} className="inline-flex size-10 items-center justify-center rounded-xl text-ink-2 hover:bg-ink/5" aria-label="Về lớp">
          <ArrowLeft />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight font-extrabold">{d.lesson.lesson.title.vi}</p>
          <p className="text-xs font-semibold text-ink-2">
            Lớp {d.cls?.name} ·{" "}
            {s.status === "live" ? (
              <span className="inline-flex items-center gap-1 text-coral-dk">
                <span className="size-2 animate-pulse rounded-full bg-coral" /> Đang dạy
              </span>
            ) : (
              "Đã kết thúc"
            )}
          </p>
        </div>
        {s.status === "live" && (
          <>
            {!s.gameId && (
              <Button variant="sun" onClick={() => setGaming(true)}>
                <Gamepad2 /> Trò chơi
              </Button>
            )}
            <Button variant="ink" onClick={openTv}>
              <MonitorUp /> Mở màn hình tivi
            </Button>
            <Button variant="destructive" onClick={end} disabled={ending}>
              {ending ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />} Kết thúc tiết
            </Button>
          </>
        )}
      </header>

      {s.status === "ended" ? (
        <SessionReport session={s} lesson={d.lesson} responses={d.responses} participants={d.participants} roster={d.roster} onBack={() => router.push(back)} />
      ) : (
        <div className="grid flex-1 gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {s.gameId ? (
            <div className="min-w-0">
              <GameStage gameId={s.gameId} roster={d.roster} />
            </div>
          ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <TimelineBar items={timeline} />
            <TvScreen
              state={st}
              lesson={d.lesson}
              responses={d.responses}
              participants={d.participants}
              roster={d.roster}
              join={d.join}
              left={left}
              className="rounded-2xl shadow-[0_18px_40px_-20px_rgba(28,27,58,.6)]"
            />

            {/* Nút Tiếp */}
            <div className="card-lsn flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="lg" onClick={actions.prev} aria-label="Lùi">
                  <ChevronLeft /> Lùi
                </Button>
                <Button size="xl" onClick={actions.next} className="min-w-40">
                  Tiếp <ChevronRight />
                </Button>
                <p className="min-w-0 flex-1 text-sm text-ink-2">
                  Bấm Tiếp để <b className="text-ink">{nextLabel}</b>
                </p>
                <div className="inline-flex overflow-hidden rounded-xl border-2 border-line-2" role="group" aria-label="Ngôn ngữ trên tivi">
                  {LANGS.map((l) => (
                    <button
                      key={l.v}
                      onClick={() => actions.lang(l.v)}
                      aria-pressed={st.lang === l.v}
                      className={cn("px-3 py-2 text-xs font-bold transition-colors", st.lang === l.v ? "bg-ink text-white" : "bg-white text-ink-2 hover:bg-paper")}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={actions.callName}>
                  <Dices /> Gọi tên ngẫu nhiên
                </Button>
                <Button variant="outline" size="sm" onClick={() => actions.timer(60)}>
                  <Clock /> Hẹn giờ 1 phút
                </Button>
                <Button variant="outline" size="sm" onClick={() => actions.timer(240)}>
                  <Clock /> 4 phút
                </Button>
                <Button variant="ghost" size="sm" onClick={() => actions.timer(0)} disabled={st.timerMs == null}>
                  <TimerOff /> Tắt giờ
                </Button>
              </div>
              {/* Các trang */}
              <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Các trang">
                {d.lesson.slides.map((sl, i) => (
                  <button
                    key={sl.id}
                    onClick={() => actions.go(i)}
                    aria-current={i === st.slideIndex}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      i === st.slideIndex ? "border-blue bg-blue-soft text-blue-dk" : "border-line bg-white text-ink-2 hover:border-blue/40"
                    )}
                  >
                    <b className="tabular-nums">{i + 1}</b>
                    {isInteractive(sl) && <span className="size-1.5 rounded-full bg-coral" title="Có câu hỏi" />}
                    {sl.title.vi}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-2">
                <Kbd>→</Kbd> <Kbd>Space</Kbd> Tiếp · <Kbd>←</Kbd> Lùi · <Kbd>L</Kbd> đổi ngôn ngữ · <Kbd>N</Kbd> gọi tên · bút trình chiếu dùng được
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Ghi chú & câu nói mẫu">
                <ul className="space-y-1.5">
                  {(key?.notes ?? []).map((n, i) =>
                    n.en ? (
                      <li key={i} className="flex items-start gap-2 text-sm font-semibold">
                        <button onClick={() => say(n.en!)} className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-soft text-blue-dk hover:bg-blue hover:text-white" aria-label="Nghe câu này">
                          <Volume2 className="size-4" />
                        </button>
                        <span className="pt-1.5">{n.en}</span>
                      </li>
                    ) : (
                      <li key={i} className="text-sm text-ink-2 italic">
                        {n.vi}
                      </li>
                    )
                  )}
                </ul>
                <p className="mt-3 text-xs text-ink-2">Bấm nút loa để nghe câu tiếng Anh trước khi nói với lớp.</p>
              </Panel>
              {slide && (
                <ResponsesPanel session={s} slide={slide} responses={d.responses} participants={d.participants} roster={d.roster} actions={actions} />
              )}
            </div>
          </div>
          )}

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
            {!s.gameId && <AssistantPanel items={tips} onAction={onTip} />}
            <PairsPanel pairs={st.pairs} showPairs={st.showPairs} inputs={pairInputs} name={nameOf} onSet={actions.setPairs} onToggleTv={actions.togglePairs} />
            <Panel title="Nhắn tin cho lớp">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(KIND_META) as MessageKind[]).map((k) => {
                  const I = KIND_ICON[k];
                  return (
                    <button
                      key={k}
                      onClick={() => setCompose({ kind: k })}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold shadow-[0_3px_0_rgba(0,0,0,.18)] active:translate-y-[2px] active:shadow-none"
                      style={{ background: KIND_META[k].bg, color: KIND_META[k].fg }}
                    >
                      <I className="size-4" /> {KIND_META[k].label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <MessageFeed messages={msgs.data.filter((m) => m.sessionId === s.id).slice(0, 5)} receipts={msgs.receipts} roster={d.roster} now={now} compact />
              </div>
            </Panel>
            <Panel title="Học sinh trong tiết">
              <StudentPanel
                session={s}
                participants={d.participants}
                responses={d.responses}
                roster={d.roster}
                openElapsed={st.phase === "open" && left != null && slide ? (slide.question?.time ?? slide.speak?.time ?? 30) * 1000 - left : null}
                attention={attention}
                onBell={bell}
              />
            </Panel>
          </aside>
        </div>
      )}
      {compose && d.cls && (
        <ComposeDialog
          key={`${compose.kind}-${compose.uids?.join(",") ?? "all"}`}
          cls={d.cls}
          students={d.students}
          open
          onOpenChange={(v) => !v && setCompose(null)}
          preset={compose}
          sessionId={s.id}
        />
      )}
      {s.status === "live" && <StartGameDialog sessionId={s.id} open={gaming} onOpenChange={setGaming} />}
      {confirmEl}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-b-2 border-line-2 bg-white px-1.5 py-0.5 font-sans text-[11px]">{children}</kbd>;
}
