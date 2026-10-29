"use client";

// Hộp soạn tin của GV: người nhận (cả lớp / tổ / chọn em), loại tin, mẫu song ngữ, điểm thưởng khi khen
import { useMemo, useState } from "react";
import { Bell, Check, Loader2, Megaphone, MessageSquareWarning, Search, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, teamColor } from "@/components/common";
import { api, errorMessage } from "@/lib/api-client";
import { KIND_META, TEMPLATES, type MessageKind } from "@/lib/messages/types";
import { PRAISE_XP, inQuietHours } from "@/lib/messages/rules";
import { useNow } from "@/lib/hooks/use-class-history";
import { DEFAULT_CLASS_SETTINGS, type ClassDoc, type StudentDoc } from "@/lib/types";

export const KIND_ICON: Record<MessageKind, React.ComponentType<{ className?: string }>> = {
  attention: Bell,
  reminder: MessageSquareWarning,
  praise: Sparkles,
  notice: Megaphone,
};

type Target = { mode: "all" } | { mode: "team"; team: number } | { mode: "pick"; uids: string[] };

export interface ComposePreset {
  kind?: MessageKind;
  uids?: string[];
}

/** Gửi nhanh (1 chạm) — dùng cho nút chuông "Nhắc chú ý" */
export async function sendQuick(classId: string, uids: string[], kind: MessageKind, sessionId?: string | null) {
  const t = TEMPLATES[kind][0];
  return api<{ recipients: number; silent: boolean; skipped: number }>("/api/messages", { body: { classId, kind, text: t, to: { uids }, sessionId: sessionId ?? null } });
}

export function ComposeDialog({
  cls,
  students,
  open,
  onOpenChange,
  preset,
  sessionId,
}: {
  cls: ClassDoc;
  students: StudentDoc[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preset?: ComposePreset;
  sessionId?: string | null;
}) {
  const [kind, setKind] = useState<MessageKind>(preset?.kind ?? "reminder");
  const [target, setTarget] = useState<Target>(preset?.uids?.length ? { mode: "pick", uids: preset.uids } : { mode: "all" });
  const [en, setEn] = useState(TEMPLATES[preset?.kind ?? "reminder"][0].en);
  const [vi, setVi] = useState(TEMPLATES[preset?.kind ?? "reminder"][0].vi);
  const [points, setPoints] = useState(0);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const teams = cls.settings?.teams ?? 4;
  const now = useNow();
  const quiet = now > 0 && inQuietHours({ ...DEFAULT_CLASS_SETTINGS.quietHours, ...cls.settings?.quietHours }, now);

  const shown = useMemo(() => {
    const k = q.trim().toLocaleLowerCase("vi");
    return students.filter((s) => !k || s.fullName.toLocaleLowerCase("vi").includes(k));
  }, [students, q]);

  const pickKind = (k: MessageKind) => {
    setKind(k);
    setEn(TEMPLATES[k][0].en);
    setVi(TEMPLATES[k][0].vi);
    if (k !== "praise") setPoints(0);
  };
  const picked = target.mode === "pick" ? target.uids : [];
  const togglePick = (uid: string) => setTarget({ mode: "pick", uids: picked.includes(uid) ? picked.filter((u) => u !== uid) : [...picked, uid] });
  const count = target.mode === "all" ? students.length : target.mode === "team" ? students.filter((s) => s.team === target.team).length : picked.length;

  async function send() {
    setBusy(true);
    try {
      const to = target.mode === "all" ? { all: true } : target.mode === "team" ? { team: target.team } : { uids: picked };
      const r = await api<{ recipients: number; skipped: number; silent: boolean; pushed: number }>("/api/messages", {
        body: { classId: cls.id, kind, text: { en, vi }, to, points, sessionId: sessionId ?? null },
      });
      toast.success(
        `Đã gửi “${KIND_META[kind].label}” tới ${r.recipients} em${r.skipped ? ` (${r.skipped} em đã nhận đủ tin Chú ý)` : ""}${r.silent && kind !== "notice" ? " · giờ yên lặng: không đổ chuông" : ""}.`
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Nhắn tin · lớp {cls.name}</DialogTitle>
          <DialogDescription>Học sinh chỉ nhận tin từ thầy cô, không nhắn được cho nhau.</DialogDescription>
        </DialogHeader>

        {/* Loại tin */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(KIND_META) as MessageKind[]).map((k) => {
            const m = KIND_META[k];
            const I = KIND_ICON[k];
            const on = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => pickKind(k)}
                aria-pressed={on}
                className={cn("flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all", on ? "border-transparent shadow-[0_4px_0_rgba(0,0,0,.2)]" : "border-line bg-white hover:border-ink/20")}
                style={on ? { background: m.bg, color: m.fg } : undefined}
              >
                <I className="size-5" />
                <b className="text-sm">{m.label}</b>
              </button>
            );
          })}
        </div>
        <p className="-mt-2 text-xs text-ink-2">{KIND_META[kind].desc}</p>

        {/* Người nhận */}
        <div className="space-y-2">
          <p className="text-sm font-bold">Gửi tới · {count} em</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={target.mode === "all"} onClick={() => setTarget({ mode: "all" })}>
              Cả lớp
            </Chip>
            {Array.from({ length: teams }, (_, i) => i + 1).map((t) => (
              <Chip key={t} on={target.mode === "team" && target.team === t} onClick={() => setTarget({ mode: "team", team: t })} dot={teamColor(t)}>
                Tổ {t}
              </Chip>
            ))}
            <Chip on={target.mode === "pick"} onClick={() => setTarget({ mode: "pick", uids: picked })}>
              Chọn từng em
            </Chip>
          </div>
          {target.mode === "pick" && (
            <div className="rounded-2xl border-2 border-line p-2">
              <div className="relative mb-2">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên…" className="h-10 w-full rounded-xl bg-paper pr-3 pl-9 text-sm outline-none" />
              </div>
              <ul className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
                {shown.map((s) => {
                  const on = picked.includes(s.uid);
                  return (
                    <li key={s.uid}>
                      <button type="button" onClick={() => togglePick(s.uid)} className={cn("flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm", on ? "bg-blue-soft" : "hover:bg-paper")}>
                        <span className={cn("grid size-5 place-items-center rounded-md border-2", on ? "border-blue bg-blue text-white" : "border-line-2")}>{on && <Check className="size-3" />}</span>
                        <Avatar name={s.fullName} team={s.team} className="size-7 text-[10px]" />
                        <span className="truncate font-semibold">{s.fullName}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Nội dung */}
        <div className="space-y-2">
          <p className="text-sm font-bold">Nội dung</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES[kind].map((t) => (
              <button key={t.en} type="button" onClick={() => (setEn(t.en), setVi(t.vi))} className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold hover:bg-blue-soft">
                {t.vi}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Tiếng Anh</span>
            <input value={en} onChange={(e) => setEn(e.target.value)} maxLength={500} className="mt-1 h-11 w-full rounded-xl border-2 border-line-2 bg-white px-3 text-en font-semibold outline-none focus:border-blue" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-2">Tiếng Việt</span>
            <input value={vi} onChange={(e) => setVi(e.target.value)} maxLength={500} className="mt-1 h-11 w-full rounded-xl border-2 border-line-2 bg-white px-3 italic outline-none focus:border-blue" />
          </label>
        </div>

        {kind === "praise" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">Thưởng XP</span>
            {PRAISE_XP.map((p) => (
              <Chip key={p} on={points === p} onClick={() => setPoints(p)}>
                {p === 0 ? "Không" : `+${p} XP`}
              </Chip>
            ))}
          </div>
        )}

        {quiet && kind !== "notice" && (
          <p className="rounded-xl bg-sun-soft px-3 py-2 text-xs font-semibold text-[#8A5A00]">Đang trong giờ yên lặng: tin vẫn được gửi nhưng điện thoại không đổ chuông, không rung.</p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button size="lg" onClick={send} disabled={busy || !count || (!en.trim() && !vi.trim())} variant={kind === "attention" ? "sun" : kind === "praise" ? "teal" : "default"}>
            {busy ? <Loader2 className="animate-spin" /> : <Send />} Gửi tới {count} em
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Chip({ on, onClick, children, dot }: { on: boolean; onClick: () => void; children: React.ReactNode; dot?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold transition-colors", on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink/30")}
    >
      {dot && <span className="size-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}
