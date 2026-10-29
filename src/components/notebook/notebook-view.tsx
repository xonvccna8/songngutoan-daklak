"use client";

// Vở ghi một bài Toán: mục tiêu · từ vựng · lý thuyết · ghi nhớ · câu tiếng Anh · bài tập.
// GV: bật/tắt đáp án, in. HS (interactive): bấm chọn đáp án để tự kiểm tra, xem gợi ý tự luận.
import { useState } from "react";
import { Check, Lightbulb, Star, Volume2, X } from "lucide-react";
import { cn } from "cn";
import { SayButtons } from "@/components/library/say";
import { chapterOf, curLesson } from "@/lib/curriculum";
import { say } from "@/lib/live/speech";
import { LETTERS, fillWordBox, noteOf, richParts, type VocabRow } from "@/lib/notebook";
import { answerFx, cheer } from "@/lib/feedback";

/** Chữ có **đậm** */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {richParts(text).map((x, i) =>
        x.bold ? (
          <b key={i} className="text-ink">
            {x.text}
          </b>
        ) : (
          <span key={i}>{x.text}</span>
        )
      )}
    </>
  );
}

function H({ n, vi, en }: { n: string; vi: string; en: string }) {
  return (
    <h3 className="mt-6 mb-2 flex flex-wrap items-baseline gap-x-2 border-b-2 border-line pb-1 text-lg font-extrabold">
      <span className="text-blue-dk">{n}</span> {vi} <span className="text-en text-sm font-semibold">· {en}</span>
    </h3>
  );
}

export function NotebookView({ lessonId, vocab, answers = false, interactive = false, compact = false }: { lessonId: string; vocab: VocabRow[]; answers?: boolean; interactive?: boolean; compact?: boolean }) {
  const l = curLesson(lessonId);
  const n = noteOf(lessonId);
  const ch = chapterOf(lessonId);
  if (!l || !n) return null;

  return (
    <article className={cn("card-lsn bg-white", compact ? "p-4" : "p-5 sm:p-8")}>
      <header className="text-center">
        <p className="text-xs font-bold text-ink-2">
          Chương {ch?.no}. {ch?.vi}
        </p>
        <h2 className={cn("mt-1 font-extrabold text-blue-dk", compact ? "text-xl" : "text-2xl sm:text-3xl")}>
          Bài {l.no}. {l.vi}
        </h2>
        <p className="text-en font-semibold">
          Lesson {l.no}. {l.en}
        </p>
      </header>

      <H n="" vi="Mục tiêu" en="Learning goals" />
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {l.outcomes.map((o) => (
          <li key={o.id}>
            {o.vi} <span className="text-vi">— {o.en}</span>
          </li>
        ))}
      </ul>

      <H n="I." vi="Từ vựng" en="Vocabulary" />
      <div className="print-avoid overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-soft text-left">
              <th className="w-10 border border-line-2 px-2 py-1.5">#</th>
              <th className="border border-line-2 px-2 py-1.5">Tiếng Anh</th>
              {!compact && <th className="border border-line-2 px-2 py-1.5">Phiên âm</th>}
              <th className="border border-line-2 px-2 py-1.5">Tiếng Việt</th>
            </tr>
          </thead>
          <tbody>
            {vocab.map((v, i) => (
              <tr key={v.id}>
                <td className="border border-line-2 px-2 py-1.5 text-center">{i + 1}</td>
                <td className="border border-line-2 px-2 py-1.5">
                  <button type="button" onClick={() => say(v.en, 0.85)} className="text-en inline-flex items-center gap-1 text-left font-bold hover:underline">
                    <Volume2 className="no-print size-3.5 shrink-0" /> {v.en}
                  </button>
                  {compact && <span className="block text-xs text-ink-2">{v.ipa}</span>}
                </td>
                {!compact && <td className="border border-line-2 px-2 py-1.5 text-ink-2">{v.ipa}</td>}
                <td className="border border-line-2 px-2 py-1.5">{v.vi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H n="II." vi="Lý thuyết" en="Theory" />
      <div className="space-y-4">
        {n.theory.map((s, i) => (
          <section key={i} className="print-avoid">
            <h4 className="font-extrabold">
              {i + 1}. {s.h} <span className="text-en text-sm font-semibold">({s.en})</span>
            </h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
              {s.points.map((pt, j) => (
                <li key={j}>
                  <Rich text={pt} />
                </li>
              ))}
            </ul>
            {s.table && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-soft text-left">
                      {s.table.head.map((h) => (
                        <th key={h} className="border border-line-2 px-2 py-1.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} className="border border-line-2 px-2 py-1.5 align-top">
                            <Rich text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="print-avoid mt-5 rounded-2xl border-2 border-sun/50 bg-sun-soft p-4">
        <p className="flex items-center gap-1.5 font-extrabold text-[#8A5A00]">
          <Star className="size-4 fill-sun text-sun-dk" /> Ghi nhớ <span className="text-sm font-semibold italic">· Remember</span>
        </p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px]">
          {n.remember.map((r, i) => (
            <li key={i}>
              <Rich text={r} />
            </li>
          ))}
        </ul>
      </div>

      <H n="III." vi="Câu tiếng Anh cần nhớ" en="Key sentences" />
      <ol className="space-y-2">
        {n.sentences.map((s, i) => (
          <li key={i} className="print-avoid flex items-start gap-2">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-blue-soft text-xs font-extrabold text-blue-dk">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="text-en block font-semibold">{s.en}</span>
              <span className="text-vi block text-sm">{s.vi}</span>
            </span>
            <span className="no-print">
              <SayButtons text={s.en} />
            </span>
          </li>
        ))}
      </ol>

      <H n="IV." vi="Bài tập" en="Exercises" />
      <Exercises lessonId={lessonId} answers={answers} interactive={interactive} />
    </article>
  );
}

function Exercises({ lessonId, answers, interactive }: { lessonId: string; answers: boolean; interactive: boolean }) {
  const n = noteOf(lessonId)!;
  // Bài làm của HS (chỉ trên máy, không lưu)
  const [mcq, setMcq] = useState<Record<number, number>>({});
  const [tf, setTf] = useState<Record<number, boolean>>({});
  const [fill, setFill] = useState<Record<number, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const reveal = (k: string) => setShown((s) => ({ ...s, [k]: true }));
  const norm = (s: string) => s.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <section>
        <p className="font-bold">Bài 1. Chọn câu trả lời đúng.</p>
        <ol className="mt-2 space-y-3">
          {n.mcq.map((q, i) => {
            const picked = mcq[i];
            return (
              <li key={i} className="print-avoid">
                <p>
                  <b>Câu {i + 1}.</b> {q.q}
                </p>
                <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt, j) => {
                    const right = j === q.answer;
                    const showRight = answers || (picked != null && right);
                    const wrong = picked === j && !right;
                    return (
                      <button
                        key={j}
                        type="button"
                        disabled={!interactive || picked != null}
                        onClick={(e) => {
                          answerFx(right, e.currentTarget);
                          setMcq((m) => ({ ...m, [i]: j }));
                        }}
                        className={cn(
                          "flex items-start gap-2 rounded-xl border-2 px-3 py-1.5 text-left text-sm disabled:cursor-default",
                          showRight ? "border-teal bg-teal-soft font-semibold" : wrong ? "border-coral bg-coral-soft" : "border-line bg-white",
                          picked === j && (right ? "animate-pop" : "animate-shake"),
                          interactive && picked == null && "hover:border-blue/50"
                        )}
                      >
                        <b>{LETTERS[j]}.</b> <span className="flex-1">{opt}</span>
                        {showRight && <Check className="size-4 shrink-0 text-teal" />}
                        {wrong && <X className="size-4 shrink-0 text-coral" />}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="print-avoid">
        <p className="font-bold">Bài 2. Đúng hay sai?</p>
        <ol className="mt-2 space-y-1.5">
          {n.tf.map((t, i) => {
            const picked = tf[i];
            const done = answers || picked != null;
            return (
              <li key={i} className="flex flex-col gap-1.5 rounded-xl border-2 border-line px-3 py-2 text-sm sm:flex-row sm:items-center">
                <span className="flex-1">
                  {i + 1}. {t.q}
                </span>
                <span className="flex shrink-0 gap-1.5">
                  {[true, false].map((v) => {
                    const on = done && v === t.answer;
                    const wrong = picked === v && v !== t.answer;
                    return (
                      <button
                        key={String(v)}
                        type="button"
                        disabled={!interactive || picked != null}
                        onClick={(e) => {
                          answerFx(v === t.answer, e.currentTarget);
                          setTf((m) => ({ ...m, [i]: v }));
                        }}
                        className={cn(
                          "h-8 w-12 rounded-lg border-2 text-xs font-extrabold disabled:cursor-default",
                          on ? "border-teal bg-teal-soft text-[#0A6F5F]" : wrong ? "border-coral bg-coral-soft text-coral-dk" : "border-line-2 bg-white text-ink-2",
                          picked === v && (v === t.answer ? "animate-pop" : "animate-shake")
                        )}
                      >
                        {v ? "Đúng" : "Sai"}
                      </button>
                    );
                  })}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="print-avoid">
        <p className="font-bold">
          Bài 3. Điền từ tiếng Anh vào chỗ trống. <span className="text-en font-semibold">Fill in the blanks.</span>
        </p>
        <p className="mt-2 rounded-xl bg-blue-soft px-3 py-2 text-center text-sm">
          <span className="text-ink-2">Từ gợi ý · Word box: </span>
          {fillWordBox(n).map((w, i) => (
            <b key={w} className="text-en">
              {i > 0 && " · "}
              {w}
            </b>
          ))}
        </p>
        <ol className="mt-2 space-y-2">
          {n.fill.map((f, i) => {
            const [a, b] = f.q.split("___");
            const val = fill[i] ?? "";
            const ok = norm(val) === norm(f.answer);
            const show = answers || shown[`f${i}`];
            return (
              <li key={i} className="text-sm">
                <p className="text-en flex flex-wrap items-center gap-1">
                  <span>{i + 1}.</span> {a}
                  {interactive && !answers ? (
                    <input
                      value={val}
                      onChange={(e) => {
                        const v = e.target.value;
                        // Gõ đúng từ → reo một lần
                        if (!ok && norm(v) === norm(f.answer)) cheer(e.currentTarget);
                        setFill((m) => ({ ...m, [i]: v }));
                      }}
                      aria-label={`Chỗ trống câu ${i + 1}`}
                      className={cn("h-8 w-36 rounded-lg border-2 px-2 font-bold", val && (ok ? "border-teal bg-teal-soft" : "border-line-2"), !val && "border-line-2")}
                    />
                  ) : (
                    <b className={cn("min-w-24 border-b-2 border-dotted border-ink-2 px-1 text-center", show && "text-[#0A6F5F]")}>{show ? f.answer : " "}</b>
                  )}
                  {b}
                  {interactive && !answers && val && ok && <Check className="size-4 text-teal" />}
                </p>
                <p className="text-vi pl-4 text-xs">{f.vi}</p>
                {interactive && !answers && !ok && (
                  <button type="button" onClick={() => reveal(`f${i}`)} className="no-print pl-4 text-xs font-bold text-blue">
                    {shown[`f${i}`] ? `Đáp án: ${f.answer}` : "Xem đáp án"}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <p className="font-bold">Bài 4. Trả lời câu hỏi.</p>
        <ol className="mt-2 space-y-3">
          {n.essay.map((e, i) => {
            const show = answers || shown[`e${i}`];
            return (
              <li key={i} className="print-avoid text-sm">
                <p>
                  <b>Câu {i + 1}.</b> {e.q}
                </p>
                {show ? (
                  <p className="mt-1 rounded-xl bg-teal-soft px-3 py-2 text-[#0A5A50]">
                    <Lightbulb className="mr-1 inline size-4" />
                    <b>Gợi ý: </b>
                    {e.answer}
                  </p>
                ) : interactive ? (
                  <button type="button" onClick={() => reveal(`e${i}`)} className="no-print mt-1 text-xs font-bold text-blue">
                    Tự trả lời vào vở rồi bấm xem gợi ý
                  </button>
                ) : (
                  <div className="mt-2 space-y-4" aria-hidden>
                    {[0, 1, 2].map((k) => (
                      <div key={k} className="border-b border-dotted border-ink-2/60" />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
