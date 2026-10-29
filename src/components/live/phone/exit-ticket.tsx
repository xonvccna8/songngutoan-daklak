"use client";

// Đợt A — Phiếu ra về 3-2-1 ở trang Tổng kết: 3 từ mới (chọn trong thuật ngữ của tiết) · 2 ý chính · 1 câu hỏi.
// Câu hỏi của em chỉ GV đọc trên laptop, không lên tivi.
import { useState } from "react";
import { Check, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { api, errorMessage } from "@/lib/api-client";
import type { Term } from "@/lib/live/types";

export function ExitTicketForm({ sessionId, terms }: { sessionId: string; terms: Term[] }) {
  const [words, setWords] = useState<string[]>([]);
  const [ideas, setIdeas] = useState(["", ""]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const toggle = (w: string) => setWords((cur) => (cur.includes(w) ? cur.filter((x) => x !== w) : cur.length < 3 ? [...cur, w] : cur));

  async function submit() {
    setBusy(true);
    try {
      await api("/api/live/pulse", { body: { sessionId, kind: "exit", words, ideas, question } });
      setSent(true);
      toast.success("Đã nộp phiếu ra về. Thank you!");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-[#5B82F5] bg-[#5B82F5]/15 p-4">
        <Check className="size-6 shrink-0 text-[#7EE2A8]" />
        <div className="text-sm">
          <b>Em đã nộp phiếu ra về.</b>
          <button onClick={() => setSent(false)} className="ml-1 text-[var(--hi)] underline">
            Sửa lại
          </button>
        </div>
      </div>
    );
  }

  const field = "w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-[15px] text-[var(--chalk)] placeholder:text-[var(--chalk-dim)] focus:border-sun focus:outline-none";
  return (
    <div className="flex flex-col gap-3 rounded-3xl border-2 border-sun/70 p-4">
      <p className="font-display text-lg font-extrabold">
        Phiếu ra về 3-2-1 <span className="text-sm font-semibold text-[var(--chalk-dim)]">· Exit ticket</span>
      </p>

      <div>
        <p className="text-sm font-semibold">
          3 từ mới em học được <span className="text-xs text-[var(--chalk-dim)]">({words.length}/3)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {terms.map((t) => (
            <button
              key={t.en}
              onClick={() => toggle(t.en)}
              aria-pressed={words.includes(t.en)}
              className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold", words.includes(t.en) ? "border-sun bg-sun text-ink" : "border-white/20")}
            >
              {t.en}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">2 ý chính của bài (tiếng Anh hoặc tiếng Việt)</p>
        {ideas.map((v, i) => (
          <input key={i} value={v} maxLength={150} onChange={(e) => setIdeas((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? "Today I learnt that… / Hôm nay em học được…" : "Ý thứ hai…"} className={field} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">1 câu hỏi em còn thắc mắc</p>
        <input value={question} maxLength={200} onChange={(e) => setQuestion(e.target.value)} placeholder="Why…? / Tại sao…?" className={field} />
        <p className="text-xs text-[var(--chalk-dim)]">Chỉ thầy cô đọc câu hỏi này.</p>
      </div>

      <button
        onClick={submit}
        disabled={busy || (!words.length && !ideas.some((x) => x.trim()) && !question.trim())}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-sun font-bold text-ink shadow-[0_5px_0_var(--color-sun-dk)] active:translate-y-[3px] active:shadow-none disabled:opacity-50"
      >
        <Send className="size-5" /> Nộp phiếu
      </button>
    </div>
  );
}
