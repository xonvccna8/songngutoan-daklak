"use client";

// Báo cáo tiết học sau khi kết thúc: điểm, số câu đúng, tách Toán / Ngôn ngữ, phát âm, số lần rời trang
import { useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common";
import { Tam } from "@/components/brand/tam";
import type { LessonData } from "@/lib/live/hooks";
import type { ParticipantDoc, ResponseDoc, SessionDoc } from "@/lib/live/types";
import type { RosterEntry } from "@/components/live/tv-screen";
import { ExitSummaryView } from "@/components/live/console/responses-panel";
import { BARRIER_LABEL, VERDICT_LABEL, diagnoseQuestion, diagnoseStudent, tallyLights, type Barrier } from "@/lib/live/diagnose";
import { fmtAnswer, isInteractive } from "@/lib/live/grading";
import { LEVEL_META, levelInputOf, suggestLevel } from "@/lib/live/elevel";
import { LevelChip } from "@/components/live/console/student-panel";
import { RemedialPanel } from "@/components/live/console/remedial-panel";
import { roadmapTarget, type EnglishStat } from "@/lib/live/english";

export function SessionReport({
  session,
  lesson,
  responses,
  participants,
  roster,
  onBack,
}: {
  session: SessionDoc;
  lesson: LessonData;
  responses: ResponseDoc[];
  participants: ParticipantDoc[];
  roster: Map<string, RosterEntry>;
  onBack: () => void;
}) {
  const questions = lesson.slides.filter((s) => s.question).length;
  // Lúc mở báo cáo — dùng khi bản ghi kết thúc tiết chưa về tới máy
  const [openedAt] = useState(() => Date.now());
  const pByUid = new Map(participants.map((p) => [p.uid, p]));
  const rows = [...roster.entries()]
    .map(([uid, info]) => {
      const mine = responses.filter((r) => r.uid === uid);
      const q = mine.filter((r) => r.qtype !== "speak");
      const sp = mine.filter((r) => r.qtype === "speak");
      // lang = true → phần Ngôn ngữ; false → phần Toán (gồm cả "Khoa học" của dữ liệu KHTN)
      const pct = (lang: boolean) => {
        const a = q.filter((r) => (r.skill === "Ngôn ngữ") === lang);
        return a.length ? Math.round((a.filter((r) => r.correct).length / a.length) * 100) : null;
      };
      return {
        uid,
        info,
        joined: pByUid.has(uid),
        points: mine.reduce((s, r) => s + (r.points ?? 0), 0),
        answered: q.length,
        correct: q.filter((r) => r.correct).length,
        math: pct(false),
        lang: pct(true),
        pron: sp.length ? Math.round(sp.reduce((s, r) => s + (r.score ?? 0), 0) / sp.length) : null,
        left: pByUid.get(uid)?.leftCount ?? 0,
        // Đợt A — vướng tiếng Anh hay vướng kiến thức
        barrier: diagnoseStudent(mine).barrier,
        // Đợt C — gợi ý mức theo kết quả tiết này (session.results có sau khi kết thúc)
        sug: suggestLevel(levelInputOf([session], uid)),
      };
    })
    .sort((a, b) => b.points - a.points);
  // Đợt A — câu cần giảng lại + ý giảng có nhiều đèn đỏ
  const hardQs = lesson.slides
    .filter((s) => s.question)
    .map((s) => ({ s, d: diagnoseQuestion(responses.filter((r) => r.slideId === s.id), s.question!.skill) }))
    .filter((x) => x.d.verdict === "language" || x.d.verdict === "content");
  const redSteps = lesson.slides
    .filter((s) => !isInteractive(s))
    .flatMap((s) => {
      const keys = new Set(participants.flatMap((p) => Object.keys(p.lights ?? {})).filter((k) => k.startsWith(`${s.id}:`)));
      return [...keys].map((k) => ({ s, step: Number(k.split(":")[1]), t: tallyLights(participants, k) }));
    })
    .filter((x) => x.t.alert);
  const nameOf = (uid: string) => roster.get(uid)?.name ?? "Học sinh";
  const joined = rows.filter((r) => r.joined);
  const levelOf = (r: (typeof rows)[number]) => r.info.eLevel ?? "e2";
  const levelMoves = joined.filter((r) => r.sug.enough && r.sug.level !== levelOf(r));
  const avg = joined.length ? Math.round(joined.reduce((s, r) => s + r.points, 0) / joined.length) : 0;
  const acc = (() => {
    const q = responses.filter((r) => r.qtype !== "speak");
    return q.length ? Math.round((q.filter((r) => r.correct).length / q.length) * 100) : 0;
  })();

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Tam mood="cheer" className="size-20" />
          <div>
            <h1 className="text-3xl font-extrabold">Báo cáo tiết học</h1>
            <p className="text-ink-2">
              {lesson.lesson.title.vi} · {joined.length}/{roster.size} học sinh tham gia
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft /> Về trang lớp
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Tham gia" value={`${joined.length}/${roster.size}`} />
        <Kpi label="Điểm trung bình" value={avg} />
        <Kpi label="Tỉ lệ đúng" value={`${acc}%`} />
        <Kpi label="Số câu hỏi" value={questions} />
      </div>

      <div className="card-lsn mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-ink-2">
              <th className="py-3 pl-4">#</th>
              <th className="py-3">Học sinh</th>
              <th className="py-3 text-right">Điểm</th>
              <th className="py-3 text-right">Đúng</th>
              <th className="py-3 text-right">Toán</th>
              <th className="py-3 text-right">Ngôn ngữ</th>
              <th className="py-3 text-right">Phát âm</th>
              <th className="py-3 text-right">Rời trang</th>
              <th className="py-3 pr-4">Chẩn đoán</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.uid} className={cn("border-t border-line", !r.joined && "text-ink-2/60")}>
                <td className="py-2 pl-4 font-display font-bold">{i < 3 && r.points > 0 ? <Trophy className="size-4 text-sun-dk" /> : i + 1}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.info.name} team={r.info.team} className="size-8 text-[11px]" />
                    <span className="font-semibold">{r.info.name}</span>
                    <LevelChip l={r.info.eLevel} />
                    {!r.joined && <span className="text-xs">(vắng)</span>}
                  </div>
                </td>
                <td className="py-2 text-right font-display font-extrabold">{r.points}</td>
                <td className="py-2 text-right tabular-nums">
                  {r.correct}/{questions}
                </td>
                <td className="py-2 text-right tabular-nums">{r.math == null ? "—" : `${r.math}%`}</td>
                <td className="py-2 text-right tabular-nums">{r.lang == null ? "—" : `${r.lang}%`}</td>
                <td className="py-2 text-right tabular-nums">{r.pron ?? "—"}</td>
                <td className={cn("py-2 text-right tabular-nums", r.left > 2 && "font-bold text-coral-dk")}>{r.left}</td>
                <td className="py-2 pr-4">{r.joined && <BarrierBadge b={r.barrier} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Đợt A — gợi ý cho tiết sau */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card-lsn p-4">
          <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Câu cần giảng lại</h3>
          {hardQs.length ? (
            <ul className="space-y-2 text-sm">
              {hardQs.map(({ s, d }) => (
                <li key={s.id} className={cn("rounded-xl border-2 p-2.5", d.verdict === "language" ? "border-sun/60 bg-sun-soft" : "border-coral/50 bg-coral-soft")}>
                  <b>{s.question!.prompt.vi || s.title.vi}</b> · sai {Math.round(d.wrongPct * 100)}%
                  <p className="text-xs text-ink-2">
                    {VERDICT_LABEL[d.verdict]}
                    {d.topWrong != null && <> · Đáp án sai hay gặp: <b>{fmtAnswer(s.question!, d.topWrong)}</b></>}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">Không có câu nào lớp sai từ 40% trở lên.</p>
          )}
          {redSteps.length > 0 && (
            <>
              <h3 className="mt-4 mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Ý giảng có nhiều đèn đỏ</h3>
              <ul className="space-y-1 text-sm">
                {redSteps.map((x) => (
                  <li key={`${x.s.id}:${x.step}`}>
                    <b>{x.s.title.vi}</b> (bước {x.step}) · 🔴 {x.t.r}/{x.t.total} em chưa hiểu
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="card-lsn p-4">
          <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Phiếu ra về 3-2-1</h3>
          <ExitSummaryView participants={participants} name={nameOf} total={joined.length} />
        </section>
        {/* Đợt C — mức tiếng Anh */}
        <section className="card-lsn p-4 lg:col-span-2">
          <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Mức tiếng Anh</h3>
          <p className="text-sm text-ink-2">
            {(["e1", "e2", "e3"] as const).map((l) => `${LEVEL_META[l].label} ${LEVEL_META[l].vi}: ${joined.filter((r) => levelOf(r) === l).length} em`).join(" · ")}
          </p>
          {levelMoves.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {levelMoves.map((r) => (
                <li key={r.uid}>
                  <b>{r.info.name}</b>: {LEVEL_META[levelOf(r)].label} → <b>{LEVEL_META[r.sug.level].label}</b> <span className="text-xs text-ink-2">({r.sug.reason})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-2">Chưa có em nào cần đổi mức theo kết quả tiết này.</p>
          )}
          <p className="mt-2 text-xs text-ink-2">Gợi ý từ một tiết; xác nhận ở trang lớp → thẻ “Mức tiếng Anh” (gợi ý ở đó cộng dồn nhiều tiết).</p>
        </section>
        {/* Đợt D — tỉ lệ tiếng Anh thực tế so với lộ trình */}
        {session.english && <EnglishCard e={session.english} at={session.endedAt?.toMillis?.() ?? openedAt} />}
        <RemedialPanel session={session} lesson={lesson} responses={responses} participants={participants} name={nameOf} />
      </div>
      <p className="mt-3 text-xs text-ink-2">
        Chẩn đoán là gợi ý theo luật (tỉ lệ đúng phần Toán / Ngôn ngữ và việc em có xem tiếng Việt khi trả lời), cần từ 2 câu mỗi phần. Thầy cô là người quyết định.
      </p>
      <p className="mt-3 text-xs text-ink-2">
        Điểm phát âm GĐ này do điện thoại chấm (Web Speech) — chỉ mang tính tham khảo. Thống kê dài hạn của từng em có ở Giai đoạn 3.
      </p>
      {session.summary && <p className="sr-only">Tóm tắt: {session.summary.participants} em, điểm TB {session.summary.avgPoints}</p>}
    </div>
  );
}

function BarrierBadge({ b }: { b: Barrier }) {
  const m = BARRIER_LABEL[b];
  const cls = { teal: "bg-teal-soft text-[#0E7490]", sun: "bg-sun-soft text-[#8A5A00]", coral: "bg-coral-soft text-coral-dk", ink: "bg-paper text-ink-2" }[m.tone];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap", cls)} title={m.hint}>
      {m.vi}
    </span>
  );
}

const mins = (ms: number) => Math.round(ms / 60_000);

function EnglishCard({ e, at }: { e: EnglishStat; at: number }) {
  const t = roadmapTarget(at);
  const tone = e.enPct >= t.min ? "text-success-fg" : "text-[#8A5A00]";
  return (
    <section className="card-lsn p-4 lg:col-span-2">
      <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Tỉ lệ tiếng Anh thực tế</h3>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <b className={cn("font-display text-4xl font-extrabold", tone)}>{e.enPct}%</b>
        <div className="text-sm">
          <p>
            Tivi: tiếng Anh {mins(e.ms.en)} phút · song ngữ {mins(e.ms.bi)} phút · tiếng Việt {mins(e.ms.vi)} phút
          </p>
          <p className="text-ink-2">
            Lộ trình đề xuất ({t.label}): {t.min}–{t.max}% · {e.noViPct != null ? `${e.noViPct}% câu trả lời không xem tiếng Việt` : "chưa có số liệu xem tiếng Việt"}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-2">Quy đổi: tiếng Anh tính đủ, song ngữ tính một nửa, tiếng Việt không tính. Mỗi đoạn tối đa 20 phút.</p>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card-lsn p-4">
      <b className="block font-display text-3xl leading-none font-extrabold">{value}</b>
      <span className="text-xs font-semibold text-ink-2">{label}</span>
    </div>
  );
}
