"use client";

// Lưới học sinh trong tiết: trạng thái thời gian thực (màu + biểu tượng + chữ), điểm, hàng chờ giơ tay
import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { Bell, CheckCircle2, Circle, CircleDashed, EyeOff, Hand, HelpCircle, WifiOff } from "lucide-react";
import { ReceiptChip } from "@/components/messages/message-feed";
import type { ReceiptStatus } from "@/lib/messages/types";
import { cn } from "cn";
import { Avatar } from "@/components/common";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { isStale, liveStatus, STATUS_META, type LiveStatus } from "@/lib/live/status";
import type { ParticipantDoc, ResponseDoc, SessionDoc } from "@/lib/live/types";
import type { RosterEntry } from "@/components/live/tv-screen";
import { LEVEL_META, type ELevel } from "@/lib/live/elevel";

const ICONS: Record<LiveStatus, React.ComponentType<{ className?: string }>> = {
  watching: Circle,
  answered: CheckCircle2,
  pending: HelpCircle,
  away: EyeOff,
  offline: WifiOff,
  absent: CircleDashed,
};

export function StatusChip({ s, compact }: { s: LiveStatus; compact?: boolean }) {
  const m = STATUS_META[s];
  const I = ICONS[s];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap" style={{ background: m.bg, color: m.fg }}>
      <I className="size-3" />
      {!compact && m.label}
    </span>
  );
}

export function StudentPanel({
  session,
  participants,
  responses,
  roster,
  openElapsed,
  attention,
  onBell,
}: {
  session: SessionDoc;
  participants: ParticipantDoc[];
  responses: ResponseDoc[];
  roster: Map<string, RosterEntry>;
  openElapsed: number | null;
  /** Trạng thái tin "Chú ý" gần nhất gửi từng em trong tiết này */
  attention?: Map<string, ReceiptStatus>;
  onBell?: (uid: string) => void;
}) {
  // Đồng hồ 5 giây/lần để cập nhật "mất kết nối"
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const st = session.state;
  const slideId = session.slideIds[st.slideIndex];
  const seenOf = (p?: ParticipantDoc) => p?.lastSeenAt?.toMillis?.();
  const newest = Math.max(0, ...participants.map((p) => seenOf(p) ?? 0));

  const byUid = new Map(participants.map((p) => [p.uid, p]));
  const answered = new Set(responses.filter((r) => r.slideId === slideId).map((r) => r.uid));
  const points = new Map<string, number>();
  responses.forEach((r) => points.set(r.uid, (points.get(r.uid) ?? 0) + (r.points ?? 0)));

  const rows = [...roster.entries()].map(([uid, info]) => ({
    uid,
    info,
    p: byUid.get(uid),
    status: liveStatus({
      p: byUid.get(uid),
      stale: now > 0 && isStale(seenOf(byUid.get(uid)), newest, now),
      questionOpen: st.phase === "open",
      openElapsed,
      answered: answered.has(uid),
    }),
  }));
  const count = (s: LiveStatus) => rows.filter((r) => r.status === s).length;
  const hands = participants.filter((p) => p.raisedHandAt).sort((a, b) => (a.raisedHandAt ?? 0) - (b.raisedHandAt ?? 0));

  const lowerHand = (uid: string) => updateDoc(doc(db(), COL.sessions, session.id, COL.participants, uid), { raisedHandAt: null }).catch(() => {});

  // Ưu tiên hiện em cần chú ý lên đầu
  const order: LiveStatus[] = ["away", "offline", "pending", "absent", "watching", "answered"];
  rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.info.name.localeCompare(b.info.name, "vi"));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label="Đã vào" value={`${participants.length}/${roster.size}`} />
        <Mini label="Rời trang" value={count("away")} tone={count("away") ? "coral" : undefined} />
        <Mini label="Mất kết nối" value={count("offline")} />
      </div>

      {hands.length > 0 && (
        <div className="rounded-2xl border-2 border-sun bg-sun-soft p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#8A5A00]">
            <Hand className="size-4" /> Giơ tay ({hands.length})
          </p>
          <ul className="space-y-1.5">
            {hands.map((h, i) => (
              <li key={h.uid} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-sm">
                <b className="w-4 text-ink-2">{i + 1}</b>
                <span className="flex-1 truncate font-semibold">{roster.get(h.uid)?.name ?? "Học sinh"}</span>
                <button onClick={() => lowerHand(h.uid)} className="rounded-lg px-2 py-1 text-xs font-bold text-blue hover:bg-blue-soft">
                  Đã gọi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
        {rows.map(({ uid, info, status }) => (
          <li key={uid} className={cn("flex items-center gap-2 rounded-xl border-2 bg-white px-2 py-1.5", status === "away" ? "border-coral/40" : "border-line")}>
            <Avatar name={info.name} team={info.team} className="size-8 text-[11px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{info.name.split(" ").slice(-2).join(" ")}</p>
              <div className="flex flex-wrap gap-1">
                <StatusChip s={status} />
                <LevelChip l={info.eLevel} />
                {attention?.get(uid) && <ReceiptChip s={attention.get(uid)!} />}
              </div>
            </div>
            <span className="font-display text-sm font-extrabold tabular-nums">{points.get(uid) ?? 0}</span>
            {onBell && (
              <button
                onClick={() => onBell(uid)}
                className={cn("grid size-9 shrink-0 place-items-center rounded-xl border-2 transition-colors", status === "away" || status === "pending" ? "border-sun bg-sun-soft text-[#8A5A00]" : "border-line-2 text-ink-2 hover:border-sun hover:bg-sun-soft")}
                aria-label={`Nhắc chú ý ${info.name}`}
                title="Nhắc chú ý (1 chạm)"
              >
                <Bell className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Đợt C — nhãn mức tiếng Anh (chưa đặt = E2 mặc định) */
export function LevelChip({ l }: { l?: ELevel }) {
  const lv = l ?? "e2";
  const tone = { e1: "bg-coral-soft text-coral-dk", e2: "bg-sun-soft text-[#8A5A00]", e3: "bg-blue-soft text-blue-dk" }[lv];
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-bold", tone)} title={`${LEVEL_META[lv].label} · ${LEVEL_META[lv].phone}`}>
      {LEVEL_META[lv].label}
    </span>
  );
}

function Mini({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "coral" }) {
  return (
    <div className={cn("rounded-xl px-2 py-2", tone === "coral" ? "bg-coral-soft text-[#A3301B]" : "bg-paper")}>
      <b className="block font-display text-lg leading-none tabular-nums">{value}</b>
      <span className="text-[11px] font-semibold text-ink-2">{label}</span>
    </div>
  );
}
