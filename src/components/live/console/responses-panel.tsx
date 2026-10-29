"use client";

// Câu trả lời của trang hiện tại: thống kê, bảng chi tiết, nút "Chiếu" câu gõ lên tivi
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { fmtAnswer, isInteractive } from "@/lib/live/grading";
import { VERDICT_LABEL, diagnoseQuestion, lightKey, summarizeExits, tallyLights } from "@/lib/live/diagnose";
import type { ParticipantDoc, ResponseDoc, SessionDoc, Slide } from "@/lib/live/types";
import type { RosterEntry } from "@/components/live/tv-screen";

const PHASE: Record<string, string> = { idle: "Chưa mở", open: "Đang nhận câu trả lời", locked: "Đã khoá", reveal: "Đã công bố" };

export function ResponsesPanel({
  session,
  slide,
  responses,
  participants,
  roster,
  actions,
}: {
  session: SessionDoc;
  slide: Slide;
  responses: ResponseDoc[];
  participants: ParticipantDoc[];
  roster: Map<string, RosterEntry>;
  actions: { open: () => void; lock: () => void; reveal: () => void; pin: (slideId: string, uid: string) => void; toggleLights: () => void };
}) {
  const st = session.state;
  const R = responses.filter((r) => r.slideId === slide.id).sort((a, b) => a.answeredAt - b.answeredAt);
  const N = participants.length || roster.size;
  const name = (uid: string) => roster.get(uid)?.name ?? "Học sinh";

  if (slide.type === "final") {
    const totals = new Map<string, number>();
    responses.forEach((r) => totals.set(r.uid, (totals.get(r.uid) ?? 0) + (r.points ?? 0)));
    const lb = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return (
      <>
        <Panel title="Bảng điểm cả tiết">
          <Table head={["#", "Học sinh", "Điểm"]} rows={lb.map(([uid, p], i) => [i + 1, name(uid), <b key="p">{p}</b>])} />
        </Panel>
        <Panel title="Phiếu ra về 3-2-1">
          <ExitSummaryView participants={participants} name={name} total={N} />
        </Panel>
      </>
    );
  }
  if (!isInteractive(slide)) {
    // Đợt A — Đèn hiểu bài của ý đang giảng (trang + bước hiện tại)
    const t = tallyLights(participants, lightKey(slide.id, st.step));
    return (
      <Panel title="Đèn hiểu bài · ý đang giảng">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button size="xs" variant={st.showLights ? "default" : "outline"} onClick={actions.toggleLights}>
            {st.showLights ? "Đang hiện trên tivi (ẩn danh)" : "Hiện tổng lên tivi"}
          </Button>
          <span className="text-xs text-ink-2">Tivi chỉ hiện số lượng, không hiện tên.</span>
        </div>
        <Stats items={[[`${t.total}/${N}`, "đã bấm"], [<span key="g" className="text-[#16A34A]">🟢 {t.g}</span>, "hiểu"], [<span key="y" className="text-sun-dk">🟡 {t.y}</span>, "chưa chắc"], [<span key="r" className="text-coral-dk">🔴 {t.r}</span>, "chưa hiểu"]]} />
        {t.alert && (
          <div className="mt-1 rounded-xl border-2 border-coral/50 bg-coral-soft p-3 text-sm">
            <b className="text-coral-dk">Gợi ý: {Math.round(t.redPct * 100)}% chưa hiểu ý này.</b> Giảng lại bằng tiếng Việt khoảng 1 phút, rồi nói lại câu then chốt bằng tiếng Anh.
            <p className="mt-1 text-xs text-ink-2">Câu nói mẫu: “Let me explain it in Vietnamese.” · “Now, listen again in English.”</p>
          </div>
        )}
        {(t.red.length > 0 || t.yellow.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {t.red.map((u) => (
              <span key={u} className="rounded-full bg-coral-soft px-2 py-0.5 font-semibold text-coral-dk">🔴 {name(u)}</span>
            ))}
            {t.yellow.map((u) => (
              <span key={u} className="rounded-full bg-sun-soft px-2 py-0.5 font-semibold text-[#8A5A00]">🟡 {name(u)}</span>
            ))}
          </div>
        )}
        {t.total === 0 && <p className="mt-1 text-xs text-ink-2">Mời học sinh bấm đèn trên điện thoại sau mỗi ý: “Tap green if you understand.”</p>}
      </Panel>
    );
  }

  const ctrl = (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <Button size="xs" variant="outline" onClick={actions.open} disabled={st.phase === "open"}>
        Mở
      </Button>
      <Button size="xs" variant="outline" onClick={actions.lock} disabled={st.phase !== "open"}>
        Khoá
      </Button>
      <Button size="xs" variant="outline" onClick={actions.reveal} disabled={st.phase === "reveal" || st.phase === "idle"}>
        Công bố
      </Button>
      <span className="text-xs font-semibold text-ink-2">· {PHASE[st.phase]}</span>
    </div>
  );

  if (slide.speak) {
    const avg = R.length ? Math.round(R.reduce((s, r) => s + (r.score ?? 0), 0) / R.length) : 0;
    const weak = R.filter((r) => (r.score ?? 0) < 60).length;
    const sorted = [...R].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    return (
      <Panel title="Luyện nói · máy chấm">
        {ctrl}
        <Stats items={[[`${R.length}/${N}`, "đã nói"], [avg, "điểm TB"], [weak, "dưới 60"]]} />
        <Table
          head={["Học sinh", "Điểm", "Lần"]}
          rows={sorted.map((r) => [name(r.uid), <b key="s" className={cn((r.score ?? 0) < 60 && "text-coral-dk")}>{r.score}</b>, r.attempts])}
        />
        <p className="mt-2 text-xs text-ink-2">Xếp từ thấp đến cao để biết em nào cần hỗ trợ.</p>
      </Panel>
    );
  }

  const q = slide.question!;
  const ok = R.filter((r) => r.correct).length;
  const pins = st.pinned[slide.id] ?? [];
  const fmt = (r: ResponseDoc) => fmtAnswer(q, r.value);
  // Đợt A — chẩn đoán câu này: vướng tiếng Anh hay kiến thức (sau khi khoá để không làm GV phân tâm lúc đang mở)
  const dq = st.phase !== "open" ? diagnoseQuestion(R, q.skill) : null;
  return (
    <Panel title={`Câu trả lời · Kĩ năng: ${q.skill}`}>
      {ctrl}
      <Stats items={[[`${R.length}/${N}`, "đã trả lời"], [`${R.length ? Math.round((ok / R.length) * 100) : 0}%`, "đúng"], [Math.max(0, N - R.length), "chưa trả lời"]]} />
      {dq && dq.verdict !== "few" && (
        <div className={cn("mb-2 rounded-xl border-2 p-3 text-sm", dq.verdict === "ok" ? "border-[#16A34A]/30 bg-blue-soft" : dq.verdict === "language" ? "border-sun/60 bg-sun-soft" : "border-coral/50 bg-coral-soft")}>
          <b>{VERDICT_LABEL[dq.verdict]}</b>
          <p className="mt-0.5 text-xs text-ink-2">
            Sai khi chỉ đọc tiếng Anh: {dq.enWrongPct == null ? "—" : `${Math.round(dq.enWrongPct * 100)}%`} · Sai khi có tiếng Việt: {dq.viWrongPct == null ? "—" : `${Math.round(dq.viWrongPct * 100)}%`}
            {dq.topWrong != null && dq.verdict !== "ok" && <> · Đáp án sai hay gặp: <b>{fmtAnswer(q, dq.topWrong)}</b></>}
          </p>
        </div>
      )}
      <Table
        head={q.type === "text" ? ["Học sinh", "Trả lời", "Kết quả", ""] : ["Học sinh", "Trả lời", "Kết quả"]}
        rows={R.map((r) => {
          const row: React.ReactNode[] = [
            <span key="n">
              {name(r.uid)} {r.vi && <span className="rounded bg-paper px-1 text-[10px] font-bold text-ink-2" title="Em có xem đề tiếng Việt">VI</span>}
            </span>,
            fmt(r),
            <span key="c" className={cn("font-bold", r.correct ? "text-success-fg" : "text-coral-dk")}>
              {r.correct ? "Đúng" : "Sai"}
              {r.aiGraded && (
                <span className="ml-1 rounded bg-[#F0E9FB] px-1 text-[10px] font-bold text-[#7A4CC2]" title={`AI chấm (máy so khớp chấm sai). ${r.aiFeedback?.vi ?? ""}`}>
                  AI
                </span>
              )}
            </span>,
          ];
          if (q.type === "text")
            row.push(
              <Button key="p" size="xs" variant={pins.includes(r.uid) ? "default" : "outline"} onClick={() => actions.pin(slide.id, r.uid)}>
                {pins.includes(r.uid) ? "Đang chiếu" : "Chiếu"}
              </Button>
            );
          return row;
        })}
      />
    </Panel>
  );
}

/** Đợt A — tổng hợp phiếu ra về 3-2-1 (dùng cả ở laptop trong tiết và báo cáo tiết) */
export function ExitSummaryView({ participants, name, total }: { participants: ParticipantDoc[]; name: (uid: string) => string; total: number }) {
  const s = summarizeExits(participants);
  if (!s.count) return <p className="text-sm text-ink-2">Chưa em nào nộp phiếu. Câu mời: “Please fill in your exit ticket on your phone.”</p>;
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs font-semibold text-ink-2">
        {s.count}/{total} em đã nộp
      </p>
      <div>
        <p className="text-xs font-bold text-ink-2">3 từ mới — chọn nhiều nhất</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {s.words.map((w) => (
            <span key={w.word} className="rounded-full bg-blue-soft px-2 py-0.5 text-xs font-semibold text-blue-dk">
              {w.word} · {w.n}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-ink-2">1 câu hỏi của các em (chỉ GV xem)</p>
        <ul className="mt-1 max-h-40 space-y-1 overflow-auto">
          {s.questions.map((x, i) => (
            <li key={i}>
              <b>{name(x.uid)}:</b> {x.text}
            </li>
          ))}
          {!s.questions.length && <li className="text-xs text-ink-2">Không có câu hỏi.</li>}
        </ul>
      </div>
      <details>
        <summary className="cursor-pointer text-xs font-bold text-blue">2 ý chính ({s.ideas.length})</summary>
        <ul className="mt-1 max-h-40 space-y-1 overflow-auto">
          {s.ideas.map((x, i) => (
            <li key={i}>
              <b>{name(x.uid)}:</b> {x.text}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card-lsn min-w-0 p-4", className)}>
      <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Stats({ items }: { items: [React.ReactNode, string][] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-5">
      {items.map(([v, l], i) => (
        <div key={i}>
          <b className="block font-display text-2xl leading-none tabular-nums">{v}</b>
          <span className="text-xs text-ink-2">{l}</span>
        </div>
      ))}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="max-h-64 overflow-auto border-t border-line">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="sticky top-0 bg-white py-1.5 pr-2 text-left text-[11px] font-bold text-ink-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-2 align-middle">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-4 text-center text-xs text-ink-2">Chưa có câu trả lời.</p>}
    </div>
  );
}
