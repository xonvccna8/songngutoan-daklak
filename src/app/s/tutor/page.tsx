"use client";

// HS: Trợ lý học tập AI "Tâm" — hỏi về Toán và tiếng Anh. Gợi mở, không làm bài hộ; có lọc nội dung; thầy cô xem được nhật kí.
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Tam } from "@/components/brand/tam";
import { SayButtons } from "@/components/library/say";
import { StudentHeader, StudentShell } from "@/components/student/student-shell";
import { api, errorMessage } from "@/lib/api-client";
import { STUDENT_AI_LIMITS, type TutorMsg } from "@/lib/ai/student-ai";

const STARTERS = [
  { en: "Can you explain this lesson in simple words?", vi: "Giải thích bài học bằng lời dễ hiểu giúp em" },
  { en: "How do I read “x² + 2x = 0” in English?", vi: "Đọc “x² + 2x = 0” bằng tiếng Anh thế nào?" },
  { en: "Give me a hint, not the answer, for my homework question.", vi: "Gợi ý cho em làm bài, đừng cho đáp án" },
  { en: "Quiz me with 3 easy questions about this lesson.", vi: "Đố em 3 câu dễ về bài này" },
];

export default function TutorPage() {
  return (
    <StudentShell nav={false}>
      <Tutor />
    </StudentShell>
  );
}

function Tutor() {
  const [state, setState] = useState<{ enabled: boolean; messages: TutorMsg[]; remaining: number } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  /** Mã tạm (số âm) cho tin đang gửi — để gỡ đúng tin nếu gửi lỗi */
  const seq = useRef(0);

  useEffect(() => {
    api<{ enabled: boolean; messages: TutorMsg[]; remaining: number }>("/api/tutor")
      .then(setState)
      .catch((e) => {
        toast.error(errorMessage(e));
        setState({ enabled: false, messages: [], remaining: 0 });
      });
  }, []);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [state?.messages.length, busy]);

  async function send(t = text) {
    const q = t.trim();
    if (!q || busy || !state) return;
    setBusy(true);
    setText("");
    const now = -++seq.current;
    setState({ ...state, messages: [...state.messages, { role: "user", text: q, at: now }] });
    try {
      const r = await api<{ reply: string; blocked: boolean; remaining: number }>("/api/tutor", { body: { text: q } });
      setState((s) => s && { ...s, remaining: r.remaining, messages: [...s.messages, { role: "assistant", text: r.reply, at: -++seq.current, ...(r.blocked ? { flagged: true } : {}) }] });
    } catch (e) {
      toast.error(errorMessage(e));
      setState((s) => s && { ...s, messages: s.messages.filter((m) => m.at !== now) });
      setText(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <StudentHeader vi="Trợ lý học tập AI" en="AI study buddy" right={state?.enabled ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink-2 ring-2 ring-line">còn {state.remaining} câu</span> : undefined} />
      <p className="mx-5 mt-3 flex items-start gap-2 rounded-2xl bg-teal-soft p-3 text-xs text-[#0A6F5F]">
        <ShieldCheck className="size-4 shrink-0" />
        Tâm giúp em hiểu bài và học tiếng Anh, gợi ý chứ không làm bài hộ. Không gửi họ tên, địa chỉ, số điện thoại. Thầy cô có thể xem cuộc trò chuyện. Tối đa {STUDENT_AI_LIMITS.tutorPerStudent} câu/ngày.
      </p>

      <main className="flex flex-1 flex-col gap-3 px-5 pt-4 pb-40">
        {state === null ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-ink-2">
            <Loader2 className="size-4 animate-spin" /> Đang mở…
          </p>
        ) : !state.enabled ? (
          <div className="card-lsn flex flex-col items-center gap-2 p-6 text-center">
            <Tam mood="sleepy" className="size-20" />
            <b>Trợ lý AI đang tắt</b>
            <p className="text-sm text-ink-2">Thầy cô chưa bật Trợ lý AI cho lớp em. Em có thể hỏi ở mục Hỏi đáp lớp nhé.</p>
          </div>
        ) : (
          <>
            {state.messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Tam mood="happy" className="size-20" />
                <p className="font-display text-lg font-extrabold">Hi! I&apos;m Tâm. Ask me anything!</p>
                <p className="text-vi text-sm">Chào em! Em muốn hỏi gì về bài học?</p>
                <div className="mt-2 flex w-full flex-col gap-2">
                  {STARTERS.map((s) => (
                    <button key={s.en} onClick={() => send(s.en)} className="card-lsn p-3 text-left text-sm">
                      <span className="text-en block font-semibold">{s.en}</span>
                      <span className="text-vi block">{s.vi}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {state.messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && <Tam mood="happy" className="mt-1 size-8 shrink-0" />}
                <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] whitespace-pre-line", m.role === "user" ? "bg-blue text-white" : "card-lsn", m.flagged && m.role === "user" && "opacity-60")}>
                  {m.text}
                  {m.role === "assistant" && !m.flagged && (
                    <span className="mt-1 flex justify-end">
                      <SayButtons text={m.text.split("\n")[0].slice(0, 400)} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-ink-2">
                <Sparkles className="size-4 animate-pulse text-[#7A4CC2]" /> Tâm đang suy nghĩ…
              </div>
            )}
            <div ref={end} />
          </>
        )}
      </main>

      {state?.enabled && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-2 border-t-2 border-line bg-paper/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            maxLength={STUDENT_AI_LIMITS.tutorMaxChars}
            placeholder="Hỏi bằng tiếng Anh hoặc tiếng Việt…"
            className="min-w-0 flex-1 resize-none rounded-2xl border-2 border-line-2 bg-white px-3 py-2 text-sm outline-none focus:border-blue"
          />
          <button type="submit" disabled={busy || !text.trim() || state.remaining <= 0} className="grid size-12 shrink-0 place-items-center self-end rounded-2xl bg-blue text-white disabled:opacity-40" aria-label="Gửi">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </button>
        </form>
      )}
    </div>
  );
}
