"use client";

// Đợt C — Bảng "Mức tiếng Anh" (Quản lý lớp): mức gợi ý theo luật + lý do, GV xác nhận từng em hoặc cả lớp.
// App không tự đổi mức; điện thoại HS hiển thị theo mức GV đã xác nhận.
import { useState } from "react";
import { Check, Languages, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { api, errorMessage } from "@/lib/api-client";
import { LEVEL_META, levelInputOf, suggestLevel, type ELevel } from "@/lib/live/elevel";
import type { SessionDoc } from "@/lib/live/types";
import type { ClassDoc, StudentDoc } from "@/lib/types";

const LEVELS: ELevel[] = ["e1", "e2", "e3"];
const TONE: Record<ELevel, string> = { e1: "bg-coral-soft text-coral-dk", e2: "bg-sun-soft text-[#8A5A00]", e3: "bg-blue-soft text-blue-dk" };

export function LevelsBoard({ cls, students, sessions }: { cls: ClassDoc; students: StudentDoc[]; sessions: SessionDoc[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const ended = sessions.filter((s) => s.status === "ended");
  const rows = [...students]
    .sort((a, b) => a.number - b.number)
    .map((s) => ({ s, cur: s.eLevel ?? "e2", sug: suggestLevel(levelInputOf(ended, s.uid)) }));
  const changes = rows.filter((r) => r.sug.enough && r.sug.level !== r.cur);
  const count = (l: ELevel) => rows.filter((r) => r.cur === l).length;

  async function setOne(uid: string, eLevel: ELevel) {
    setBusy(uid);
    try {
      await api(`/api/classes/${cls.id}/students/${uid}`, { method: "PATCH", body: { eLevel } });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }
  async function applyAll() {
    setBusy("all");
    try {
      const r = await api<{ updated: number }>(`/api/classes/${cls.id}/levels`, { body: { levels: Object.fromEntries(changes.map((x) => [x.s.uid, x.sug.level])) } });
      toast.success(`Đã áp dụng mức gợi ý cho ${r.updated} em.`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (!students.length) return <EmptyState title="Lớp chưa có học sinh" />;
  return (
    <div className="space-y-4">
      <div className="card-lsn flex flex-wrap items-center gap-4 p-4">
        <Languages className="size-6 text-blue" />
        <div className="min-w-0 flex-1 text-sm">
          <b className="block">Mỗi em một mức tiếng Anh trên điện thoại</b>
          <span className="text-ink-2">
            {LEVELS.map((l) => `${LEVEL_META[l].label} ${LEVEL_META[l].vi}: ${count(l)} em`).join(" · ")}
          </span>
        </div>
        <Button onClick={applyAll} disabled={!changes.length || busy === "all"}>
          {busy === "all" ? <Loader2 className="animate-spin" /> : <Wand2 />} Áp dụng gợi ý ({changes.length} em)
        </Button>
      </div>

      <div className="card-lsn overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-ink-2">
              <th className="py-3 pl-4">STT</th>
              <th className="py-3">Học sinh</th>
              <th className="py-3">Mức hiện tại</th>
              <th className="py-3">Gợi ý</th>
              <th className="py-3 pr-4">Lý do</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, cur, sug }) => (
              <tr key={s.uid} className="border-t border-line">
                <td className="py-2 pl-4 tabular-nums">{s.number}</td>
                <td className="py-2 font-semibold">{s.fullName}</td>
                <td className="py-2">
                  <div className="inline-flex overflow-hidden rounded-xl border-2 border-line-2" role="group" aria-label={`Mức của ${s.fullName}`}>
                    {LEVELS.map((l) => (
                      <button
                        key={l}
                        disabled={busy === s.uid}
                        onClick={() => l !== cur && setOne(s.uid, l)}
                        aria-pressed={cur === l}
                        title={LEVEL_META[l].phone}
                        className={cn("px-2.5 py-1 text-xs font-bold", cur === l ? "bg-ink text-white" : "bg-white text-ink-2 hover:bg-paper")}
                      >
                        {LEVEL_META[l].label}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="py-2">
                  {sug.enough ? (
                    sug.level === cur ? (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-2">
                        <Check className="size-3.5" /> Đúng mức
                      </span>
                    ) : (
                      <button onClick={() => setOne(s.uid, sug.level)} disabled={busy === s.uid} className={cn("rounded-full px-2 py-0.5 text-xs font-bold", TONE[sug.level])} title="Bấm để áp dụng">
                        → {LEVEL_META[sug.level].label} {LEVEL_META[sug.level].vi}
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-ink-2">—</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-xs text-ink-2">{sug.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-2">
        Gợi ý theo luật: tỉ lệ đúng phần Ngôn ngữ, tỉ lệ câu em xem tiếng Việt, điểm phát âm trong các tiết Toán gần đây. Em vẫn tự đổi mức trên điện thoại trong tiết được; lần đổi đó được ghi để chẩn đoán.
      </p>
    </div>
  );
}
