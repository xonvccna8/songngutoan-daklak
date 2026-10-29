"use client";

// Bảng chia tổ: mỗi tổ một cột; kéo thả hoặc bấm mũi tên để chuyển em sang tổ khác
import { useState } from "react";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, teamColor } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { api, errorMessage } from "@/lib/api-client";
import type { ClassDoc, StudentDoc } from "@/lib/types";

export function TeamsBoard({ cls, students }: { cls: ClassDoc; students: StudentDoc[] }) {
  const teams = cls.settings?.teams ?? 4;
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [confirmEl, confirm] = useConfirm();
  const [busy, setBusy] = useState(false);

  async function move(uid: string, team: number) {
    try {
      await api(`/api/classes/${cls.id}/students/${uid}`, { method: "PATCH", body: { team } });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  // Chia lại ngẫu nhiên cho đều các tổ
  async function shuffle() {
    const ok = await confirm({ title: "Chia tổ ngẫu nhiên?", description: "Tất cả học sinh sẽ được xếp lại vào các tổ đều nhau.", confirmText: "Chia lại" });
    if (!ok) return;
    setBusy(true);
    const order = [...students].sort(() => Math.random() - 0.5);
    try {
      await Promise.all(order.map((s, i) => api(`/api/classes/${cls.id}/students/${s.uid}`, { method: "PATCH", body: { team: (i % teams) + 1 } })));
      toast.success("Đã chia lại tổ.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-2">Kéo thả tên học sinh giữa các tổ, hoặc bấm vào tên để chọn tổ.</p>
        <Button variant="outline" size="sm" onClick={shuffle} disabled={busy || students.length === 0}>
          <Shuffle /> Chia ngẫu nhiên
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: teams }, (_, i) => i + 1).map((t) => {
          const members = students.filter((s) => s.team === t);
          return (
            <section
              key={t}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(t);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const uid = e.dataTransfer.getData("text/plain");
                setOver(null);
                setDragging(null);
                if (uid && students.find((s) => s.uid === uid)?.team !== t) move(uid, t);
              }}
              className={cn("card-lsn flex min-h-48 flex-col overflow-hidden transition-colors", over === t && "border-blue bg-blue-soft/40")}
            >
              <header className="flex items-center justify-between px-4 py-3" style={{ borderTop: `6px solid ${teamColor(t)}` }}>
                <h3 className="font-display text-lg font-extrabold">Tổ {t}</h3>
                <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-bold text-ink-2">{members.length} em</span>
              </header>
              <ul className="flex-1 space-y-1.5 px-3 pb-3">
                {members.map((s) => (
                  <li
                    key={s.uid}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", s.uid);
                      setDragging(s.uid);
                    }}
                    onDragEnd={() => setDragging(null)}
                    className={cn("cursor-grab rounded-xl bg-paper active:cursor-grabbing", dragging === s.uid && "opacity-40")}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm font-semibold hover:bg-white">
                        <Avatar name={s.fullName} team={t} className="size-8 text-xs" />
                        <span className="flex-1 truncate">{s.fullName}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40">
                        {Array.from({ length: teams }, (_, i) => i + 1)
                          .filter((x) => x !== t)
                          .map((x) => (
                            <DropdownMenuItem key={x} onClick={() => move(s.uid, x)}>
                              <span className="size-2.5 rounded-full" style={{ background: teamColor(x) }} /> Chuyển sang Tổ {x}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
                {members.length === 0 && <li className="py-6 text-center text-xs text-ink-2">Thả tên vào đây</li>}
              </ul>
            </section>
          );
        })}
      </div>
      {confirmEl}
    </div>
  );
}
