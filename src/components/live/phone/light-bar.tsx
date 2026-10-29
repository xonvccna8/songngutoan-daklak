"use client";

// Đợt A — Đèn hiểu bài trên điện thoại: sau mỗi ý GV giảng, em bấm 🟢 Hiểu / 🟡 Chưa chắc / 🔴 Chưa hiểu.
// Chỉ GV thấy em bấm màu gì; tivi chỉ hiện tổng cả lớp khi GV bật.
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { api, errorMessage } from "@/lib/api-client";
import type { Light } from "@/lib/live/types";

const OPTS: { v: Light; dot: string; en: string; vi: string }[] = [
  { v: "g", dot: "bg-[#5B82F5]", en: "I get it", vi: "Em hiểu" },
  { v: "y", dot: "bg-sun", en: "Not sure", vi: "Chưa chắc" },
  { v: "r", dot: "bg-coral", en: "I'm lost", vi: "Chưa hiểu" },
];

export function LightBar({ sessionId, lightKey }: { sessionId: string; lightKey: string }) {
  // Nhớ lựa chọn theo từng "trang:bước" (sang ý mới thì bấm lại)
  const [picked, setPicked] = useState<Record<string, Light>>({});
  const [busy, setBusy] = useState(false);
  const cur = picked[lightKey];

  async function pick(v: Light) {
    if (busy) return;
    setBusy(true);
    setPicked((p) => ({ ...p, [lightKey]: v }));
    try {
      await api("/api/live/pulse", { body: { sessionId, kind: "light", v } });
      if (navigator.vibrate) navigator.vibrate(20);
    } catch (e) {
      setPicked((p) => {
        const n = { ...p };
        delete n[lightKey];
        return n;
      });
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
      <p className="text-sm font-semibold">
        Em hiểu ý này chưa? <span className="text-xs font-normal text-[var(--chalk-dim)]">· Do you understand?</span>
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Đèn hiểu bài">
        {OPTS.map((o) => (
          <button
            key={o.v}
            onClick={() => pick(o.v)}
            disabled={busy}
            aria-pressed={cur === o.v}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-xs font-bold transition-all active:scale-95",
              cur === o.v ? "border-sun bg-white/15" : "border-white/15"
            )}
          >
            <span className={cn("size-5 rounded-full", o.dot, cur && cur !== o.v && "opacity-40")} />
            {o.vi}
            <span className="font-normal text-[var(--chalk-dim)]">{o.en}</span>
          </button>
        ))}
      </div>
      {cur && <p className="mt-2 text-center text-xs text-[var(--chalk-dim)]">Đã gửi cho thầy cô. Em đổi được nếu bấm lại.</p>}
    </div>
  );
}
