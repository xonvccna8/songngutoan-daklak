"use client";

// Cửa sổ TIVI: kéo sang màn hình tivi (HDMI) rồi bấm vào màn hình / phím F để toàn màn hình.
// Cũng nhận phím Tiếp/Lùi và bút trình chiếu như laptop.
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Maximize } from "lucide-react";
import { RequireRole } from "@/components/require-role";
import { TvScreen } from "@/components/live/tv-screen";
import { GameTvById } from "@/components/games/tv";
import { Tam } from "@/components/brand/tam";
import { useLiveControls } from "@/lib/live/use-controls";
import { useSessionData } from "@/lib/live/use-session-data";

export default function PresentPage() {
  return (
    <RequireRole roles={["teacher", "admin"]}>
      <Present />
    </RequireRole>
  );
}

function Present() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const d = useSessionData(sessionId);
  const { left } = useLiveControls({ session: d.session, receivedAt: d.receivedAt, ctx: d.ctx, roster: d.joined, keyboard: !d.session?.gameId });
  const box = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(true);

  const full = () => box.current?.requestFullscreen?.().catch(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === "f" || e.key === "F") && full();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => setHint(false), 6000);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, []);

  return (
    <div ref={box} className="fixed inset-0 grid place-items-center overflow-hidden bg-black" onDoubleClick={full}>
      {d.session?.status === "live" && d.session.gameId ? (
        // Trò chơi đang mở → tivi chuyển sang màn hình trò chơi (đọc luật, nhạc, pháo giấy)
        <GameTvById gameId={d.session.gameId} roster={d.roster} className="w-[min(100vw,177.78vh)]" />
      ) : d.session && d.lesson && d.session.status === "live" ? (
        <TvScreen
          state={d.session.state}
          lesson={d.lesson}
          responses={d.responses}
          participants={d.participants}
          roster={d.roster}
          join={d.join}
          left={left}
          className="w-[min(100vw,177.78vh)]"
        />
      ) : (
        <div className="text-center text-white/70">
          <Tam mood={d.session?.status === "ended" ? "happy" : "calm"} className="mx-auto size-28" />
          <p className="mt-4 font-display text-2xl font-bold">{d.session?.status === "ended" ? "Tiết học đã kết thúc. Cảm ơn cả lớp!" : "Đang tải tiết học…"}</p>
        </div>
      )}
      {hint && (
        <button onClick={full} className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80 backdrop-blur hover:bg-white/20">
          <Maximize className="size-4" /> Toàn màn hình (F hoặc nhấp đúp)
        </button>
      )}
    </div>
  );
}
