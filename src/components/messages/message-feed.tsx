"use client";

// Tin đã gửi + trạng thái thời gian thực: Đã gửi → Đã nhận → Đã xem → Đã xác nhận; câu trả lời nhanh của HS
import { useState } from "react";
import { ChevronDown, ChevronRight, HandHelping } from "lucide-react";
import { cn } from "cn";
import { EmptyState } from "@/components/common";
import { KIND_ICON } from "@/components/messages/compose-dialog";
import { fmtAgo } from "@/lib/format";
import { KIND_META, REPLY_LABEL, STATUS_LABEL, STATUS_ORDER, type MessageDoc, type ReceiptDoc, type ReceiptStatus } from "@/lib/messages/types";
import type { RosterEntry } from "@/components/live/tv-screen";

const STATUS_STYLE: Record<ReceiptStatus, { bg: string; fg: string }> = {
  sent: { bg: "#E9F1EC", fg: "#4A6158" },
  delivered: { bg: "#DCFCE7", fg: "#15803D" },
  read: { bg: "#FFF1D2", fg: "#8A5A00" },
  acked: { bg: "#DDF7EE", fg: "#0E6377" },
};

export function ReceiptChip({ s }: { s: ReceiptStatus }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap" style={{ background: STATUS_STYLE[s].bg, color: STATUS_STYLE[s].fg }}>
      {STATUS_LABEL[s]}
    </span>
  );
}

export function KindChip({ kind }: { kind: MessageDoc["kind"] }) {
  const m = KIND_META[kind];
  const I = KIND_ICON[kind];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap" style={{ background: m.bg, color: m.fg }}>
      <I className="size-3" />
      {m.label}
    </span>
  );
}

export function MessageFeed({
  messages,
  receipts,
  roster,
  now,
  compact,
}: {
  messages: MessageDoc[];
  receipts: Record<string, ReceiptDoc[]>;
  roster: Map<string, RosterEntry>;
  now: number;
  compact?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (!messages.length) return compact ? <p className="text-sm text-ink-2">Chưa gửi tin nào.</p> : <EmptyState title="Chưa có tin nhắn">Tin gửi cho học sinh và trạng thái đã đọc sẽ hiện ở đây.</EmptyState>;

  return (
    <ul className="flex flex-col gap-2">
      {messages.map((m) => {
        const rs = receipts[m.id] ?? [];
        const total = m.toUids.length;
        const atLeast = (s: ReceiptStatus) => rs.filter((r) => STATUS_ORDER.indexOf(r.status) >= STATUS_ORDER.indexOf(s)).length;
        const help = rs.filter((r) => r.reply === "need_help");
        const isOpen = open === m.id;
        return (
          <li key={m.id} className={cn("rounded-2xl border-2 bg-white", help.length ? "border-coral/50" : "border-line")}>
            <button onClick={() => setOpen(isOpen ? null : m.id)} className="flex w-full items-start gap-2 p-3 text-left">
              {isOpen ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-ink-2" /> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-ink-2" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <KindChip kind={m.kind} />
                  <span className="truncate text-xs font-semibold text-ink-2">→ {m.toLabel}</span>
                  <span className="text-xs text-ink-2">· {fmtAgo(m.createdAt?.toMillis() ?? null, now)}</span>
                  {m.points > 0 && <span className="rounded-full bg-teal-soft px-1.5 text-[11px] font-bold text-[#0E6377]">+{m.points} XP</span>}
                  {m.silent && m.kind !== "notice" && <span className="text-[11px] text-ink-2">· im lặng</span>}
                </div>
                <p className="mt-1 truncate text-sm font-semibold">{m.text.vi || m.text.en}</p>
                {/* Tiến độ: nhận / xem / xác nhận */}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold text-ink-2 tabular-nums">
                  <span>Đã nhận {atLeast("delivered")}/{total}</span>
                  <span>Đã xem {atLeast("read")}/{total}</span>
                  {m.kind === "attention" && <span className="text-[#0E6377]">Đã xác nhận {atLeast("acked")}/{total}</span>}
                  {help.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-coral-dk">
                      <HandHelping className="size-3" /> {help.length} em cần giúp
                    </span>
                  )}
                </div>
              </div>
            </button>
            {isOpen && (
              <ul className="grid gap-1 border-t border-line p-2 sm:grid-cols-2">
                {m.toUids.map((uid) => {
                  const r = rs.find((x) => x.uid === uid);
                  return (
                    <li key={uid} className="flex items-center gap-2 rounded-xl bg-paper px-2.5 py-1.5 text-[13px]">
                      <span className="min-w-0 flex-1 truncate font-semibold">{roster.get(uid)?.name ?? "Học sinh"}</span>
                      {r?.reply && <span className={cn("text-[11px] font-bold", r.reply === "need_help" ? "text-coral-dk" : "text-[#0E6377]")}>{REPLY_LABEL[r.reply]}</span>}
                      <ReceiptChip s={r?.status ?? "sent"} />
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
