"use client";

// Hộp tin của HS (chạy trên trang chủ và trong tiết):
//  - tự báo "Đã nhận"; tin Chú ý → khung vàng toàn màn hình + chuông + rung đến khi bấm "Em đã chú ý"
//  - Nhắc nhở / Khen → thẻ tin + âm báo, trả lời nhanh "Em hiểu rồi" / "Em cần giúp"; Thông báo → im lặng
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { BellRing, Check, HandHelping, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Tam } from "@/components/brand/tam";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { useStudentInbox } from "@/lib/messages/hooks";
import { enablePush, isIosBrowser, pushPermission } from "@/lib/messages/push-client";
import { audioReady, playKind, unlockAudio, vibrateKind } from "@/lib/messages/sound";
import { KIND_META, type MessageDoc, type ReceiptDoc, type Reply } from "@/lib/messages/types";

const RECENT_MS = 2 * 3600_000;

interface InboxValue {
  messages: MessageDoc[];
  receipts: Record<string, ReceiptDoc>;
  unread: number;
  markRead: (m: MessageDoc, reply?: Reply) => Promise<void>;
}
const Ctx = createContext<InboxValue | null>(null);
export const useInbox = () => useContext(Ctx);

export function InboxProvider({ uid, children }: { uid: string; children: React.ReactNode }) {
  const { data: messages } = useStudentInbox(uid);
  const [receipts, setReceipts] = useState<Record<string, ReceiptDoc>>({});
  const [queue, setQueue] = useState<MessageDoc[]>([]);
  const seen = useRef(new Set<string>());

  const rref = useCallback((mid: string) => doc(db(), COL.messages, mid, COL.receipts, uid), [uid]);
  const patch = useCallback(
    async (mid: string, data: Partial<Record<keyof ReceiptDoc, unknown>>) => {
      setReceipts((o) => ({ ...o, [mid]: { ...(o[mid] ?? { uid, status: "sent" }), ...(data as Partial<ReceiptDoc>) } }));
      await updateDoc(rref(mid), data).catch(() => {});
    },
    [rref, uid]
  );

  // Tin mới: đọc biên nhận của mình, báo "Đã nhận", xếp hàng các tin cần bật lên
  useEffect(() => {
    const fresh = messages.filter((m) => !seen.current.has(m.id));
    if (!fresh.length) return;
    fresh.forEach((m) => seen.current.add(m.id));
    (async () => {
      const now = Date.now();
      const got = await Promise.all(fresh.map(async (m) => [m, (await getDoc(rref(m.id)).catch(() => null))?.data() as ReceiptDoc | undefined] as const));
      const pop: MessageDoc[] = [];
      for (const [m, r] of got) {
        setReceipts((o) => ({ ...o, [m.id]: r ?? { uid, status: "sent" } }));
        if (r && !r.deliveredAt) await updateDoc(rref(m.id), { status: r.status === "sent" ? "delivered" : r.status, deliveredAt: serverTimestamp() }).catch(() => {});
        const created = m.createdAt?.toMillis() ?? now; // chưa có giờ máy chủ = vừa gửi
        const pending = m.kind === "attention" ? !r?.ackAt : !r?.readAt;
        if (m.kind !== "notice" && pending && now - created < RECENT_MS) pop.push(m);
      }
      if (pop.length) {
        setQueue((q) => [...q, ...pop.sort((a, b) => (a.kind === "attention" ? -1 : 0) - (b.kind === "attention" ? -1 : 0))]);
      }
    })();
  }, [messages, rref, uid]);

  const markRead = useCallback(
    async (m: MessageDoc, reply?: Reply) => {
      const r = receipts[m.id];
      const data: Record<string, unknown> = { readAt: r?.readAt ?? serverTimestamp(), status: r?.status === "acked" ? "acked" : "read" };
      if (reply) data.reply = reply;
      await patch(m.id, data);
    },
    [patch, receipts]
  );

  const current = queue[0];
  const done = (m: MessageDoc) => setQueue((q) => q.filter((x) => x.id !== m.id));
  const unread = messages.filter((m) => !receipts[m.id]?.readAt && !receipts[m.id]?.ackAt).length;

  return (
    <Ctx.Provider value={{ messages, receipts, unread, markRead }}>
      {children}
      <SoundBanner uid={uid} />
      {current?.kind === "attention" && (
        <AttentionOverlay
          key={current.id}
          m={current}
          onAck={async () => {
            await patch(current.id, { status: "acked", readAt: serverTimestamp(), ackAt: serverTimestamp() });
            done(current);
          }}
        />
      )}
      {current && current.kind !== "attention" && (
        <MessageCard
          key={current.id}
          m={current}
          onReply={async (reply) => {
            await markRead(current, reply);
            if (reply === "need_help") toast.success("Đã báo thầy cô — em chờ một chút nhé.");
            done(current);
          }}
          onClose={async () => {
            await markRead(current);
            done(current);
          }}
        />
      )}
    </Ctx.Provider>
  );
}

/** Tin "Chú ý": phủ vàng toàn màn hình, chuông 2 lần + rung, nhắc lại sau 15 giây nếu chưa xác nhận */
function AttentionOverlay({ m, onAck }: { m: MessageDoc; onAck: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (m.silent) return;
    playKind("attention");
    vibrateKind("attention");
    const t = setInterval(() => {
      playKind("attention");
      vibrateKind("attention");
    }, 15_000);
    return () => clearInterval(t);
  }, [m]);
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="att-title" className="animate-in fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-sun p-6 text-center text-ink duration-200">
      <Tam mood="alert" className="size-32 animate-bounce" />
      <div>
        <p className="font-display text-sm font-extrabold tracking-[0.2em] uppercase">Attention · Chú ý</p>
        <h2 id="att-title" className="mt-2 font-present text-3xl leading-tight font-bold">
          {m.text.en || m.text.vi}
        </h2>
        {m.text.en && m.text.vi && <p className="mt-2 text-lg italic">{m.text.vi}</p>}
        <p className="mt-3 text-sm font-semibold opacity-70">— {m.fromName}</p>
      </div>
      <button
        onClick={async () => {
          setBusy(true);
          await onAck();
        }}
        disabled={busy}
        className="mt-2 flex h-16 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-bold text-white shadow-[0_6px_0_#000] active:translate-y-[4px] active:shadow-none"
      >
        <Check className="size-6" /> Em đã chú ý
      </button>
    </div>
  );
}

/** Nhắc nhở / Khen: thẻ tin trượt lên, trả lời nhanh */
function MessageCard({ m, onReply, onClose }: { m: MessageDoc; onReply: (r: Reply) => Promise<void>; onClose: () => Promise<void> }) {
  const meta = KIND_META[m.kind];
  useEffect(() => {
    if (m.silent) return;
    playKind(m.kind);
    vibrateKind(m.kind);
  }, [m]);
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] flex justify-center p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div role="dialog" aria-labelledby="msg-title" className="animate-in slide-in-from-bottom-8 w-full max-w-md rounded-3xl border-2 border-line bg-white p-4 text-ink shadow-2xl duration-300">
        <div className="flex items-start gap-3">
          {m.kind === "praise" ? (
            <Tam mood="cheer" className="size-14 shrink-0" />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: meta.bg, color: meta.fg }}>
              <BellRing className="size-6" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wider uppercase" style={{ color: m.kind === "praise" ? "#B4321B" : "#1E40B8" }}>
              {meta.en} · {meta.label}
              {m.points > 0 && <span className="ml-1.5 rounded-full bg-teal-soft px-1.5 text-[#0A6F5F]">+{m.points} XP</span>}
            </p>
            <p id="msg-title" className="mt-0.5 font-present text-lg leading-snug font-semibold">
              {m.text.en || m.text.vi}
            </p>
            {m.text.en && m.text.vi && <p className="text-vi text-sm">{m.text.vi}</p>}
            <p className="mt-1 text-xs text-ink-2">— {m.fromName}</p>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-xl text-ink-2 hover:bg-paper" aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => onReply("understood")} className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-teal font-bold text-white shadow-[0_4px_0_var(--color-teal-dk)] active:translate-y-[3px] active:shadow-none">
            <Check className="size-5" /> Em hiểu rồi
          </button>
          <button onClick={() => onReply("need_help")} className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-coral/40 font-bold text-coral-dk active:translate-y-[2px]">
            <HandHelping className="size-5" /> Em cần giúp
          </button>
        </div>
      </div>
    </div>
  );
}

/** Lần đầu: nhắc bật âm thanh (trình duyệt chặn tự phát) + xin quyền thông báo đẩy */
function SoundBanner({ uid }: { uid: string }) {
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // Mỗi cú chạm đều mở khoá âm thanh cho lần phát sau
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("lsn:notifyOn") === "1" && pushPermission() !== "default";
    } catch {}
    const t = setTimeout(() => setHidden(dismissed && audioReady()), 0);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      clearTimeout(t);
    };
  }, []);
  if (hidden) return null;

  async function enable() {
    setBusy(true);
    unlockAudio();
    playKind("praise");
    const r = await enablePush(uid).catch((e: Error) => ({ ok: false, reason: e.message }));
    try {
      localStorage.setItem("lsn:notifyOn", "1");
    } catch {}
    if (r.ok) toast.success("Đã bật âm thanh và thông báo.");
    else toast.info(`Đã bật âm thanh. ${r.reason ?? ""}`);
    setBusy(false);
    setHidden(true);
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[80] flex justify-center p-3 pt-[max(env(safe-area-inset-top),12px)]">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink p-3 text-white shadow-xl">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sun text-ink">
          <Volume2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <b className="block">Bật âm thanh thông báo</b>
          <span className="text-white/70">{isIosBrowser() ? "iPhone: thêm web vào màn hình chính để nhận tin khi tắt màn hình." : "Để nghe chuông khi thầy cô nhắn tin."}</span>
        </div>
        <button onClick={enable} disabled={busy} className={cn("h-10 shrink-0 rounded-xl bg-sun px-3 text-sm font-bold text-ink", busy && "opacity-60")}>
          Bật
        </button>
        <button onClick={() => setHidden(true)} className="grid size-8 shrink-0 place-items-center rounded-lg text-white/60" aria-label="Để sau">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
