"use client";

// GV: nhật kí Trợ lý học tập AI của lớp (7 ngày gần nhất) — xem HS hỏi gì, câu nào bị bộ lọc chặn; bật/tắt ở Cài đặt lớp
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "cn";
import { EmptyState } from "@/components/common";
import { Chip } from "@/components/messages/compose-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { useMyClasses } from "@/lib/hooks/use-firestore";
import type { TutorMsg } from "@/lib/ai/student-ai";

interface Log {
  uid: string;
  name: string;
  day: string;
  flagged: number;
  messages: TutorMsg[];
}

const fmtDay = (d: string) => `${d.slice(6, 8)}/${d.slice(4, 6)}`;

export default function TeacherTutorPage() {
  const { data: classes } = useMyClasses();
  const [classId, setClassId] = useState<string | null>(null);
  const cls = classes.find((c) => c.id === classId) ?? classes[0];
  const [state, setState] = useState<{ for: string; logs: Log[] | null; error?: string }>({ for: "", logs: null });
  const [open, setOpen] = useState<string | null>(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const cid = cls?.id;
  useEffect(() => {
    if (!cid) return;
    let alive = true;
    api<{ logs: Log[] }>(`/api/tutor/logs?classId=${encodeURIComponent(cid)}`).then(
      (r) => alive && setState({ for: cid, logs: r.logs }),
      (e) => alive && setState({ for: cid, logs: [], error: errorMessage(e) })
    );
    return () => {
      alive = false;
    };
  }, [cid]);

  const logs = state.for === cls?.id ? state.logs : null;
  const shown = (logs ?? []).filter((l) => !onlyFlagged || l.flagged > 0);
  const flaggedTotal = (logs ?? []).reduce((s, l) => s + l.flagged, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
        <Sparkles className="size-8 text-[#7A4CC2]" /> Trợ lý học tập AI
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        Nhật kí học sinh hỏi Trợ lý AI trong 7 ngày gần nhất. Trợ lý chỉ gợi mở, không làm bài hộ; câu hỏi và câu trả lời đều qua bộ lọc nội dung. Bật / tắt cho từng lớp ở <b>Lớp → Quản lý lớp → Cài đặt</b>.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {classes.map((c) => (
          <Chip key={c.id} on={c.id === cls?.id} onClick={() => setClassId(c.id)}>
            Lớp {c.name}
            {c.settings?.aiTutor === false && " · đang tắt"}
          </Chip>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} /> Chỉ tin bị chặn {flaggedTotal > 0 && <span className="rounded-full bg-coral px-1.5 text-xs text-white">{flaggedTotal}</span>}
        </label>
      </div>

      <div className="mt-4">
        {!cls ? (
          <EmptyState title="Chưa có lớp nào" />
        ) : logs === null ? (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Loader2 className="size-4 animate-spin" /> Đang tải…
          </p>
        ) : state.error ? (
          <p className="card-lsn p-4 text-sm text-coral-dk">{state.error}</p>
        ) : shown.length === 0 ? (
          <EmptyState title="Chưa có cuộc trò chuyện nào">
            Học sinh mở <b>Tự học → Trợ lý AI</b> trên điện thoại để hỏi.{" "}
            {cls.settings?.aiTutor === false && (
              <Link href={`/teacher/classes/${cls.id}`} className="font-bold text-blue">
                Lớp này đang tắt Trợ lý AI.
              </Link>
            )}
          </EmptyState>
        ) : (
          <ul className="card-lsn divide-y divide-line overflow-hidden">
            {shown.map((l) => {
              const k = `${l.uid}_${l.day}`;
              const isOpen = open === k;
              const asked = l.messages.filter((m) => m.role === "user").length;
              return (
                <li key={k}>
                  <button onClick={() => setOpen(isOpen ? null : k)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper/60">
                    {isOpen ? <ChevronDown className="size-4 text-ink-2" /> : <ChevronRight className="size-4 text-ink-2" />}
                    <b className="min-w-0 flex-1 truncate">{l.name}</b>
                    <span className="text-xs text-ink-2">
                      {fmtDay(l.day)} · {asked} câu hỏi
                    </span>
                    {l.flagged > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-coral-soft px-2 py-0.5 text-xs font-bold text-coral-dk">
                        <AlertTriangle className="size-3" /> {l.flagged} bị chặn
                      </span>
                    )}
                  </button>
                  {isOpen && (
                    <div className="space-y-2 bg-paper/40 px-4 pb-4">
                      {l.messages.map((m, i) => (
                        <div key={i} className={cn("rounded-xl px-3 py-2 text-sm whitespace-pre-line", m.role === "user" ? "bg-blue-soft" : "bg-white ring-1 ring-line", m.flagged && "ring-2 ring-coral")}>
                          <span className="mb-0.5 block text-[11px] font-bold text-ink-2 uppercase">
                            {m.role === "user" ? "Học sinh" : "Trợ lý"} · {new Date(m.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            {m.flagged && <span className="text-coral-dk"> · bị bộ lọc chặn</span>}
                          </span>
                          {m.text}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
