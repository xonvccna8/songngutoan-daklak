"use client";

// Tab "Thành thạo" của lớp (GV): chọn bài lớp đang học + bản đồ Sao thành thạo HS × yêu cầu cần đạt của một chương.
// Cùng dữ liệu với màn hình HS (lsn_studentStats.mastery) — cập nhật ngay sau mỗi tiết / bài về nhà.
import { useState } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Avatar, EmptyState } from "@/components/common";
import { FieldLabel, SELECT } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";
import { STRANDS, chapterOf, chaptersOf, starsOf } from "@/lib/curriculum";
import type { StatsDoc } from "@/lib/analytics";
import type { ClassDoc, StudentDoc } from "@/lib/types";

const STAR_BG = ["#EEF5F0", "#FFE7B3", "#FFD166", "#F4A300"];

export function Stars({ n, size = "sm" }: { n: number; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex" aria-label={`${n} sao`} title={`${n}/3 sao`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} className={cn(size === "sm" ? "size-3" : "size-4", i <= n ? "fill-[#F4A300] text-[#F4A300]" : "text-ink-2/30")} />
      ))}
    </span>
  );
}

export function ClassMastery({ cls, students, stats }: { cls: ClassDoc; students: StudentDoc[]; stats: Map<string, StatsDoc> }) {
  const chapters = chaptersOf(cls.grade);
  const cur = chapterOf(cls.curLessonId);
  const [chapterId, setChapterId] = useState<string>(cur?.id ?? chapters.find((c) => c.lessons.some((l) => l.outcomes.length))?.id ?? chapters[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const chapter = chapters.find((c) => c.id === chapterId);
  const cols = chapter?.lessons.flatMap((l) => l.outcomes.map((o, i) => ({ ...o, code: `B${l.no}.${i + 1}`, lesson: l }))) ?? [];

  async function setCurrent(id: string) {
    setSaving(true);
    try {
      await api(`/api/classes/${cls.id}`, { method: "PATCH", body: { curLessonId: id || null } });
      toast.success(id ? "Đã đổi bài đang học. Học sinh sẽ thấy phần “Xem trước” của bài này." : "Đã bỏ chọn bài đang học.");
      const ch = chapterOf(id);
      if (ch) setChapterId(ch.id);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!chapters.length) return <EmptyState title={`Chưa có khung chương trình cho lớp ${cls.grade}`} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="card-lsn grid gap-4 p-4 md:grid-cols-2">
        <label className="block">
          <FieldLabel>Bài lớp đang học (học sinh thấy phần “Xem trước” của bài này)</FieldLabel>
          <span className="flex items-center gap-2">
            <select value={cls.curLessonId ?? ""} onChange={(e) => setCurrent(e.target.value)} disabled={saving} className={SELECT}>
              <option value="">— Chưa chọn —</option>
              {chapters.map((c) => (
                <optgroup key={c.id} label={`Chương ${c.no}. ${c.vi}`}>
                  {c.lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Bài {l.no}. {l.vi}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {saving && <Loader2 className="size-4 shrink-0 animate-spin" />}
          </span>
        </label>
        <label className="block">
          <FieldLabel>Xem bản đồ thành thạo của chương</FieldLabel>
          <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className={SELECT}>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Chương {c.no}. {c.vi} ({STRANDS[c.strand].vi})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!cols.length ? (
        <EmptyState title="Chương này chưa có yêu cầu cần đạt">Mọi bài Toán 6–9 đều có yêu cầu cần đạt; hãy chọn chương khác hoặc giao thêm câu hỏi gắn YCCĐ.</EmptyState>
      ) : (
        <>
          <div className="card-lsn overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-line">
                  <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-bold">Học sinh</th>
                  {cols.map((c) => (
                    <th key={c.id} className="px-1 py-2 text-center text-xs font-bold" title={`${c.vi}\n${c.en}`}>
                      {c.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const m = stats.get(s.uid)?.mastery;
                  return (
                    <tr key={s.uid} className="border-b border-line">
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5">
                        <Link href={`/teacher/classes/${cls.id}/students/${s.uid}`} className="flex items-center gap-2 font-semibold hover:text-blue">
                          <Avatar name={s.fullName} team={s.team} className="size-7 text-[10px]" />
                          <span className="truncate">{s.fullName}</span>
                        </Link>
                      </td>
                      {cols.map((c) => {
                        const cell = m?.[c.id];
                        const n = starsOf(cell);
                        return (
                          <td key={c.id} className="px-1 py-1.5 text-center" title={cell ? `${c.code}: đúng ${cell.c}/${cell.a} câu` : `${c.code}: chưa làm câu nào`}>
                            <span className="inline-flex min-w-12 justify-center rounded-lg px-1 py-1" style={{ background: cell ? STAR_BG[n] : "transparent" }}>
                              {cell ? <Stars n={n} /> : <span className="text-ink-2/40">·</span>}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr className="bg-paper/60 font-bold">
                  <td className="sticky left-0 z-10 bg-paper px-3 py-2">Số em đạt từ 1⭐</td>
                  {cols.map((c) => {
                    const ok = students.filter((s) => starsOf(stats.get(s.uid)?.mastery?.[c.id]) >= 1).length;
                    const pct = students.length ? Math.round((ok / students.length) * 100) : 0;
                    return (
                      <td key={c.id} className={cn("px-1 py-2 text-center text-xs tabular-nums", pct < 50 ? "text-coral-dk" : "text-ink")}>
                        {ok}/{students.length}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <section className="card-lsn p-4">
            <h3 className="font-extrabold">Chú thích yêu cầu cần đạt</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {cols.map((c) => (
                <li key={c.id}>
                  <b className="mr-1 rounded-md bg-paper px-1.5 py-0.5 text-xs">{c.code}</b> {c.vi} <span className="text-en text-xs">· {c.en}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-2">
              Cách tính Sao: 1⭐ làm ≥ 2 câu, đúng ≥ 50% · 2⭐ ≥ 4 câu, đúng ≥ 70% · 3⭐ ≥ 6 câu, đúng ≥ 85%. Chỉ tính các câu hỏi mà giáo viên đã gắn yêu cầu cần đạt khi soạn bài.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
