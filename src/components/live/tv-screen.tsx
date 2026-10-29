"use client";

// Màn hình tivi 16:9 (nền ink). Cỡ chữ theo cqw nên dùng được cả ở khung xem trước trên laptop.
import { Clock, Smartphone, SmartphoneNfc } from "lucide-react";
import { cn } from "cn";
import { SHAPE_COLORS, ShapeIcon, type ShapeKind } from "@/components/brand/shapes";
import { BOARD_VARS, BiText, SlideView } from "@/components/live/slide-view";
import { fmtClock, type LessonData } from "@/lib/live/hooks";
import { isInteractive } from "@/lib/live/grading";
import { lightKey, tallyLights } from "@/lib/live/diagnose";
import type { LiveState, ParticipantDoc, ResponseDoc, Slide } from "@/lib/live/types";
import { say } from "@/lib/live/speech";
import type { ELevel } from "@/lib/live/elevel";

export const SHAPES: ShapeKind[] = ["triangle", "diamond", "circle", "square"];

export interface RosterEntry {
  name: string;
  team: number;
  /** Đợt C — mức tiếng Anh GV xác nhận; chỉ hiện trên laptop GV, không lên tivi */
  eLevel?: ELevel;
}

export interface TvProps {
  state: LiveState;
  lesson: LessonData;
  responses: ResponseDoc[];
  participants: ParticipantDoc[];
  roster: Map<string, RosterEntry>;
  join: { code: string; host: string };
  left: number | null;
  className?: string;
}

export function TvScreen({ state, lesson, responses, participants, roster, join, left, className }: TvProps) {
  const slide = lesson.slides[state.slideIndex];
  if (!slide) return null;
  const terms = lesson.lesson.terms.filter((t) => t.at <= state.slideIndex);
  const R = responses.filter((r) => r.slideId === slide.id);
  const joined = participants.length || roster.size;

  return (
    <div
      className={cn("@container relative aspect-video w-full overflow-hidden bg-ink-tv font-present text-[var(--chalk)] select-none", className)}
      style={{
        ...BOARD_VARS,
        backgroundImage: "linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)",
        backgroundSize: "2.5% 4.444%",
      }}
    >
      <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)] gap-[1.3cqw] px-[2.6cqw] pt-[2cqw] pb-[2.2cqw]">
        {/* Thanh trên */}
        <div className="flex items-center justify-between gap-[2cqw] font-sans text-[1.25cqw] text-[var(--chalk-dim)]">
          <div className="flex items-center gap-[1.4cqw]">
            <span>{lesson.lesson.subtitle}</span>
            <span>
              Trang {state.slideIndex + 1}/{lesson.slides.length}
            </span>
          </div>
          <div className="flex items-center gap-[1cqw]">
            {slide.phonesDown ? (
              <Pill className="text-[var(--chalk)]">
                <Smartphone className="size-[1.4cqw] rotate-90" /> Phones down · Úp điện thoại
              </Pill>
            ) : state.phase === "open" ? (
              <Pill className="border-[var(--hi)] bg-[var(--hi)] font-semibold text-ink">
                <SmartphoneNfc className="size-[1.4cqw]" /> Phones up · Trả lời trên điện thoại
              </Pill>
            ) : null}
            {left != null && (
              <Pill className={cn(left <= 10_000 && "border-[var(--hi)] text-[var(--hi)]")}>
                <Clock className="size-[1.4cqw]" />
                <b className={cn("text-[1.5cqw] tabular-nums", left <= 10_000 ? "text-[var(--hi)]" : "text-[var(--chalk)]")}>{fmtClock(left)}</b>
              </Pill>
            )}
            <Pill>
              Mã lớp <b className="tracking-[0.08em] text-[var(--chalk)]">{join.code}</b>
            </Pill>
          </div>
        </div>

        {/* Nội dung + bảng từ */}
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_20cqw] gap-[2.2cqw]">
          <div className="flex min-h-0 flex-col gap-[1.1cqw] overflow-hidden">
            <SlideView slide={slide} step={state.step} lang={state.lang} variant="tv" join={join} />
            <Dynamic slide={slide} state={state} R={R} joined={joined} participants={participants} roster={roster} responses={responses} />
            {state.showLights && !isInteractive(slide) && <LightsTv participants={participants} lkey={lightKey(slide.id, state.step)} />}
          </div>
          <aside className="flex min-h-0 flex-col gap-[0.6cqw] overflow-hidden border-l border-white/15 pl-[1.6cqw]">
            <h4 className="mb-[0.3cqw] font-sans text-[1.05cqw] font-semibold tracking-[0.12em] text-[var(--chalk-dim)] uppercase">Word wall · Bảng từ</h4>
            {terms.map((t) => {
              const fresh = t.at === state.slideIndex;
              return (
                <button key={t.en} onClick={() => say(t.en)} className="-mx-[0.6cqw] rounded-[0.6cqw] px-[0.6cqw] py-[0.4cqw] text-left hover:bg-white/[.07]" title="Nghe phát âm">
                  <span className="block text-[1.45cqw] font-medium">
                    {t.en}
                    {fresh && <span className="ml-[0.5cqw] rounded-[0.4cqw] bg-[var(--hi)] px-[0.4cqw] align-middle font-sans text-[0.75cqw] text-ink">mới</span>}
                  </span>
                  {fresh && <span className="block font-sans text-[1.02cqw] text-[var(--hi)]">{t.ipa}</span>}
                  {state.lang !== "en" && <span className="block font-sans text-[1.05cqw] text-[var(--chalk-dim)] italic">{t.vi}</span>}
                </button>
              );
            })}
          </aside>
        </div>
      </div>

      {/* Đợt B — cặp hỗ trợ (chỉ tên, không lý do / điểm) */}
      {state.showPairs && !!state.pairs?.length && !state.called && (
        <div className="absolute inset-0 z-10 flex flex-col bg-ink-tv/95 px-[4cqw] py-[3cqw]">
          <p className="font-sans text-[1.6cqw] tracking-[0.1em] text-[var(--chalk-dim)] uppercase">Work in pairs · Làm việc theo cặp</p>
          <ol className="mt-[1.5cqw] grid flex-1 grid-cols-3 content-start gap-x-[2cqw] gap-y-[0.9cqw] text-[1.9cqw]">
            {state.pairs.map((p, i) => (
              <li key={i} className="flex items-baseline gap-[0.8cqw]">
                <b className="font-sans text-[1.3cqw] text-[var(--hi)] tabular-nums">{i + 1}</b>
                <span>{[p.a, p.b, p.c].filter(Boolean).map((u) => state.pairNames?.[u!] ?? "…").join(" · ")}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Gọi tên ngẫu nhiên */}
      {state.called && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-ink-tv/90 text-center">
          <div>
            <small className="mb-[1.2cqw] block font-sans text-[1.6cqw] tracking-[0.1em] text-[var(--chalk-dim)] uppercase">Mời bạn trả lời</small>
            <div className="animate-in zoom-in-50 text-[7cqw] leading-none font-bold text-[var(--hi)] duration-300">{state.called.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Đợt A — tổng đèn hiểu bài trên tivi: chỉ số lượng, KHÔNG hiện tên */
function LightsTv({ participants, lkey }: { participants: ParticipantDoc[]; lkey: string }) {
  const t = tallyLights(participants, lkey);
  const bar = (n: number, color: string) => <span className="h-full" style={{ width: `${t.total ? (n / t.total) * 100 : 0}%`, background: color }} />;
  return (
    <div className="mt-auto font-sans">
      <div className="flex items-center gap-[1.4cqw] text-[1.3cqw] text-[var(--chalk-dim)]">
        <span>Do you understand? · Em hiểu chưa?</span>
        <span>🟢 {t.g}</span>
        <span>🟡 {t.y}</span>
        <span>🔴 {t.r}</span>
      </div>
      <div className="mt-[0.5cqw] flex h-[0.9cqw] overflow-hidden rounded-full bg-white/10">
        {bar(t.g, "#4ADE80")}
        {bar(t.y, "#FFC93C")}
        {bar(t.r, "#E8492E")}
      </div>
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-[0.6cqw] rounded-full border border-white/15 px-[1.1cqw] py-[0.35cqw] whitespace-nowrap", className)}>{children}</span>;
}

/** "21/30 đã trả lời" + chấm tiến độ */
function Answered({ n, total }: { n: number; total: number }) {
  const dots = Math.min(total, 40);
  const filled = total ? Math.round((n / total) * dots) : 0;
  return (
    <div className="mt-[0.6cqw] flex items-center gap-[1cqw] font-sans text-[1.3cqw] text-[var(--chalk-dim)]">
      <span className="tabular-nums">
        <b className="text-[var(--chalk)]">{n}</b>/{total} đã trả lời
      </span>
      <span className="flex flex-wrap gap-[0.3cqw]">
        {Array.from({ length: dots }).map((_, i) => (
          <span key={i} className={cn("size-[0.7cqw] rounded-full transition-colors", i < filled ? "bg-[var(--hi)]" : "bg-white/15")} />
        ))}
      </span>
    </div>
  );
}

function Rank({ rows }: { rows: { name: string; value: number; max: number }[] }) {
  return (
    <div className="flex flex-col gap-[0.55cqw]">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[2.6cqw_minmax(0,14cqw)_minmax(0,1fr)_5cqw] items-center gap-[1cqw] text-[1.45cqw]">
          <span className="font-sans text-[var(--chalk-dim)] tabular-nums">{i + 1}</span>
          <span className="truncate">{r.name}</span>
          <span className="h-[1.1cqw] overflow-hidden rounded-full bg-white/10">
            <i className="block h-full rounded-full bg-[var(--hi)] transition-[width] duration-700" style={{ width: `${(r.value / Math.max(1, r.max)) * 100}%` }} />
          </span>
          <span className="text-right font-semibold tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function Dynamic({
  slide,
  state,
  R,
  joined,
  participants,
  roster,
  responses,
}: {
  slide: Slide;
  state: LiveState;
  R: ResponseDoc[];
  joined: number;
  participants: ParticipantDoc[];
  roster: Map<string, RosterEntry>;
  responses: ResponseDoc[];
}) {
  const nameOf = (uid: string) => roster.get(uid)?.name.split(" ").slice(-2).join(" ") ?? "Bạn";
  const rev = state.phase === "reveal";

  if (slide.type === "final") {
    // Bảng vàng: chỉ top 5 (không bao giờ hiện ai đứng cuối)
    const totals = new Map<string, number>();
    responses.forEach((r) => totals.set(r.uid, (totals.get(r.uid) ?? 0) + (r.points ?? 0)));
    participants.forEach((p) => !totals.has(p.uid) && totals.set(p.uid, 0));
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = top[0]?.[1] ?? 1;
    const classTotal = [...totals.values()].reduce((s, x) => s + x, 0);
    return (
      <div className="mt-[0.5cqw] grid grid-cols-[minmax(0,1fr)_16cqw] items-end gap-[2cqw]">
        <Rank rows={top.map(([uid, v]) => ({ name: nameOf(uid), value: v, max }))} />
        <div className="rounded-[1cqw] border border-[var(--hi)] p-[1cqw] text-center">
          <small className="block font-sans text-[1cqw] text-[var(--chalk-dim)]">Cả lớp · Class total</small>
          <b className="text-[3cqw] text-[var(--hi)] tabular-nums">{classTotal.toLocaleString("vi-VN")}</b>
        </div>
      </div>
    );
  }
  if (!isInteractive(slide) || state.phase === "idle") return null;

  if (slide.speak) {
    const arr = R.map((r) => ({ uid: r.uid, s: r.score ?? 0 })).sort((a, b) => b.s - a.s);
    const avg = arr.length ? Math.round(arr.reduce((s, x) => s + x.s, 0) / arr.length) : 0;
    return (
      <div>
        <Answered n={R.length} total={joined} />
        <div className="mt-[0.3cqw] font-sans text-[1.3cqw] text-[var(--chalk-dim)]">
          Điểm phát âm trung bình của lớp: <b className="text-[1.6cqw] text-[var(--hi)]">{avg}</b>
        </div>
        <div className="mt-[0.6cqw]">
          <Rank rows={arr.slice(0, rev || state.phase === "locked" ? 5 : 4).map((x) => ({ name: nameOf(x.uid), value: x.s, max: 100 }))} />
        </div>
      </div>
    );
  }

  const q = slide.question!;
  const reveal = state.reveal?.slideId === slide.id ? state.reveal : null;

  if (q.type === "mcq") {
    const cnt = (q.options ?? []).map((_, i) => R.filter((r) => Number(r.value) === i).length);
    const tot = Math.max(1, R.length);
    return (
      <div>
        <div className="grid grid-cols-2 gap-[1cqw]">
          {(q.options ?? []).map((o, i) => {
            const kind = SHAPES[i];
            const c = SHAPE_COLORS[kind];
            const ok = rev && reveal?.answer === i;
            return (
              <div
                key={i}
                className={cn("relative flex min-h-[4.8cqw] items-center gap-[1cqw] overflow-hidden rounded-[1.2cqw] px-[1.2cqw] py-[0.7cqw] transition-all duration-500", rev && !ok && "opacity-35 saturate-50")}
                style={{ background: c.bg, color: c.text, boxShadow: `0 0.4cqw 0 ${c.dk}`, outline: ok ? "0.35cqw solid #fff" : undefined }}
              >
                {rev && <span className="absolute inset-y-0 left-0 bg-black/15 transition-[width] duration-700" style={{ width: `${(cnt[i] / tot) * 100}%` }} />}
                <ShapeIcon kind={kind} color={c.text} className="relative size-[2.2cqw] shrink-0" />
                <BiText text={o} lang={state.lang} className="relative min-w-0 flex-1 text-[1.7cqw] leading-tight font-semibold" viClass="text-current! opacity-80" />
                {rev && <span className="relative font-sans text-[1.6cqw] font-bold tabular-nums">{cnt[i]}</span>}
              </div>
            );
          })}
        </div>
        {rev && reveal?.explain ? (
          <div className="mt-[0.8cqw] text-[1.5cqw]">
            <BiText text={reveal.explain} lang={state.lang} />
          </div>
        ) : (
          <Answered n={R.length} total={joined} />
        )}
      </div>
    );
  }

  if (q.type === "label") {
    // Các ô cần gắn nhãn; công bố thì hiện nhãn đúng + số bạn ghép đúng cả bài
    const ok = R.filter((r) => r.correct).length;
    return (
      <div>
        <div className="grid grid-cols-2 gap-[0.8cqw]">
          {(q.targets ?? []).map((t, i) => (
            <div key={i} className="flex items-center gap-[0.8cqw] rounded-[0.8cqw] border border-white/15 bg-white/[.04] px-[1cqw] py-[0.5cqw] text-[1.5cqw]">
              <span className="font-sans text-[1.1cqw] text-[var(--chalk-dim)]">{i + 1}</span>
              <BiText text={t} lang={state.lang} className="min-w-0 flex-1 leading-tight" />
            </div>
          ))}
        </div>
        {!rev && (
          <div className="mt-[0.6cqw] flex flex-wrap gap-[0.6cqw]">
            {(q.options ?? []).map((o, i) => (
              <span key={i} className="rounded-[0.6cqw] bg-[var(--chalk)] px-[0.9cqw] py-[0.3cqw] text-[1.4cqw] font-semibold text-ink">
                {o.en}
              </span>
            ))}
          </div>
        )}
        {rev ? (
          <div className="mt-[0.6cqw]">
            <div className="text-[1.7cqw] font-bold text-[var(--hi)]">{reveal?.show}</div>
            <div className="font-sans text-[1.2cqw] text-[var(--chalk-dim)]">
              {ok}/{R.length} bạn ghép đúng hết
            </div>
          </div>
        ) : (
          <Answered n={R.length} total={joined} />
        )}
      </div>
    );
  }

  if (q.type === "number") {
    if (!rev) return <Answered n={R.length} total={joined} />;
    const freq = new Map<string, number>();
    R.forEach((r) => freq.set(String(r.value), (freq.get(String(r.value)) ?? 0) + 1));
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    return (
      <div>
        <div className="text-[2.6cqw] font-bold text-[var(--hi)]">{reveal?.show}</div>
        {reveal?.explain && <div className="font-sans text-[1.4cqw]">{reveal.explain.en}</div>}
        <div className="mt-[0.6cqw] flex flex-wrap gap-[0.8cqw]">
          {top.map(([v, n]) => (
            <div key={v} className={cn("rounded-[0.8cqw] border bg-white/5 px-[1cqw] py-[0.5cqw] text-[1.45cqw]", Number(v) === reveal?.answer ? "border-[var(--hi)]" : "border-white/15")}>
              {v}
              {q.unit}
              <small className="block font-sans text-[1cqw] text-[var(--chalk-dim)]">{n} bạn</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Gõ chữ: chỉ câu GV bấm "Chiếu" mới lên tivi
  const pins = (state.pinned[slide.id] ?? []).map((uid) => R.find((r) => r.uid === uid)).filter(Boolean) as ResponseDoc[];
  return (
    <div>
      {rev ? <div className="text-[2.6cqw] font-bold text-[var(--hi)]">{reveal?.show}</div> : <Answered n={R.length} total={joined} />}
      {pins.length > 0 && (
        <div className="mt-[0.6cqw] flex flex-wrap gap-[0.8cqw]">
          {pins.map((r) => (
            <div key={r.uid} className={cn("rounded-[0.8cqw] border bg-white/5 px-[1cqw] py-[0.5cqw] text-[1.45cqw]", r.correct ? "border-[var(--hi)]" : "border-white/15")}>
              {String(r.value)}
              <small className="block font-sans text-[1cqw] text-[var(--chalk-dim)]">{nameOf(r.uid)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
