"use client";

// GĐ 6 — Ngân hàng thuật ngữ Toán 6–9, CHIA THEO KHỐI VÀ TỪNG BÀI: bài nào từ vựng bài đó để HS dễ học.
// Tìm, thêm, sửa; quản trị duyệt. Thuật ngữ đã duyệt dùng cho thẻ từ vựng của học sinh (HS chọn ôn theo bài).
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, NotebookPen, PencilLine, Plus, Search, Trash2, Undo2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { INPUT, StatusBadge } from "@/components/lessons/fields";
import { TermFormDialog } from "@/components/lessons/term-dialogs";
import { api, errorMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { matches } from "@/lib/library";
import { LOOSE, groupByLesson, lessonsOf } from "@/lib/lessons/by-lesson";
import { DEFAULT_GRADE, GRADES, chaptersOf } from "@/lib/curriculum";
import { noteOf } from "@/lib/notebook";
import { useTermBank } from "@/lib/lessons/hooks";
import { say } from "@/lib/live/speech";
import type { TermDoc } from "@/lib/study/types";

export default function TermBankPage() {
  const { user, role } = useAuth();
  const admin = role === "admin";
  const { data, loading } = useTermBank();
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState<number>(DEFAULT_GRADE);
  const [lessonId, setLessonId] = useState("");
  const chapters = chaptersOf(grade);
  const [status, setStatus] = useState<"all" | "pending">("all");
  const [editing, setEditing] = useState<{ term?: TermDoc; lessonId?: string | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmEl, confirm] = useConfirm();

  const list = data.filter(
    (t) =>
      t.grade === grade &&
      (status === "all" || t.status !== "approved") &&
      matches(q, t.en, t.vi) &&
      // GV thấy thuật ngữ đã duyệt + của mình; quản trị thấy tất cả
      (admin || t.status === "approved" || t.createdBy === user?.uid)
  );
  const groups = groupByLesson(list).filter((g) => !lessonId || (lessonId === LOOSE ? !g.lesson : g.lesson?.id === lessonId));
  const pending = data.filter((t) => t.grade === grade && t.status !== "approved").length;
  const canEdit = (t: TermDoc) => admin || (t.createdBy === user?.uid && t.status !== "approved");
  const countOf = (id: string) => data.filter((t) => t.grade === grade && t.curLessonIds?.includes(id)).length;

  async function act(t: TermDoc, fn: () => Promise<unknown>, msg: string) {
    setBusy(t.id);
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const row = (t: TermDoc, inLesson: string | null) => {
    const others = lessonsOf(grade).filter((l) => l.id !== inLesson && t.curLessonIds?.includes(l.id));
    return (
      <div key={t.id} className={cn("flex flex-col gap-2 p-4 sm:flex-row sm:items-center", busy === t.id && "opacity-60")}>
        <button type="button" onClick={() => say(t.en)} className="hidden size-10 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk sm:grid" aria-label={`Nghe ${t.en}`}>
          <Volume2 className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <b className="text-en text-lg">{t.en}</b>
            <span className="text-sm text-ink-2">{t.ipa}</span>
            <StatusBadge status={t.status} />
            {others.length > 0 && <span className="rounded-md bg-paper px-1.5 py-0.5 text-[11px] font-bold text-ink-2">Cũng có ở {others.map((l) => `Bài ${l.no}`).join(", ")}</span>}
          </p>
          <p className="text-vi">{t.vi}</p>
          {t.readAs && <p className="text-xs text-ink-2">Cách đọc: {t.readAs}</p>}
          {t.example?.en && (
            <p className="text-xs">
              <span className="text-en">{t.example.en}</span> <span className="text-vi">— {t.example.vi}</span>
            </p>
          )}
          {t.createdByName && <p className="text-[11px] text-ink-2">Thêm bởi {t.createdByName}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {admin && t.status !== "approved" && (
            <Button size="sm" variant="teal" disabled={!!busy} onClick={() => act(t, () => api(`/api/terms/${t.id}`, { method: "PUT", body: { status: "approved" } }), "Đã duyệt thuật ngữ.")}>
              <Check /> Duyệt
            </Button>
          )}
          {admin && t.status === "approved" && (
            <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act(t, () => api(`/api/terms/${t.id}`, { method: "PUT", body: { status: "draft" } }), "Đã gỡ duyệt.")} title="Gỡ duyệt (học sinh sẽ không thấy)">
              <Undo2 />
            </Button>
          )}
          {canEdit(t) && (
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setEditing({ term: t })}>
              <PencilLine /> Sửa
            </Button>
          )}
          {canEdit(t) && (
            <Button
              size="icon-sm"
              variant="destructive"
              disabled={!!busy}
              aria-label="Xoá"
              onClick={async () => (await confirm({ title: `Xoá “${t.en}”?`, confirmText: "Xoá", danger: true })) && act(t, () => api(`/api/terms/${t.id}`, { method: "DELETE" }), "Đã xoá.")}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <Link href="/teacher/lessons" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-blue">
        <ArrowLeft className="size-4" /> Bài giảng
      </Link>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Ngân hàng thuật ngữ</h1>
          <p className="mt-1 text-sm text-ink-2">
            Thuật ngữ Toán song ngữ <b>chia theo khối và từng bài</b>: phiên âm, nghĩa, câu ví dụ. Học sinh ôn thẻ từ theo đúng bài đang học. Không dịch máy — giáo viên nhập, quản trị duyệt.
          </p>
        </div>
        <Button size="lg" onClick={() => setEditing({ lessonId: lessonId && lessonId !== LOOSE ? lessonId : null })}>
          <Plus /> Thêm thuật ngữ
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="flex gap-1.5" role="group" aria-label="Chọn khối">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => {
                setGrade(g);
                setLessonId("");
              }}
              className={cn("h-11 rounded-xl border-2 px-3.5 font-display font-extrabold", grade === g ? "border-blue bg-blue-soft text-blue-dk" : "border-line-2 bg-white text-ink-2")}
            >
              {g}
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tiếng Anh hoặc tiếng Việt (có dấu, không dấu đều được)…" className={`${INPUT} h-11 pl-9`} />
        </label>
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={`${INPUT} h-11 sm:w-80`} aria-label="Lọc theo bài">
          <option value="">Tất cả các bài lớp {grade}</option>
          {chapters.map((c) => (
            <optgroup key={c.id} label={`Chương ${c.no}. ${c.vi}`}>
              {c.lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  Bài {l.no}. {l.vi} ({countOf(l.id)})
                </option>
              ))}
            </optgroup>
          ))}
          <option value={LOOSE}>Chưa gắn bài</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as "all" | "pending")} className={`${INPUT} h-11 sm:w-44`} aria-label="Lọc theo trạng thái">
          <option value="all">Tất cả</option>
          <option value="pending">Chưa duyệt ({pending})</option>
        </select>
      </div>

      <div className="mt-6 space-y-6">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Loader2 className="size-4 animate-spin" /> Đang tải…
          </p>
        ) : groups.length === 0 ? (
          <EmptyState title="Chưa có thuật ngữ phù hợp">Bấm “Thêm thuật ngữ” để bổ sung vào bài.</EmptyState>
        ) : (
          groups.map((g, i) => {
            const l = g.lesson;
            const chapter = l && chapters.find((c) => c.id === l.chapterId);
            const newChapter = !!chapter && (i === 0 || groups[i - 1].lesson?.chapterId !== chapter.id);
            return (
              <section key={l?.id ?? LOOSE}>
                {newChapter && (
                  <p className="mb-3 text-xs font-extrabold tracking-widest text-ink-2 uppercase">
                    Chương {chapter.no}. {chapter.vi} <span className="text-en normal-case">· {chapter.en}</span>
                  </p>
                )}
                <div className="card-lsn overflow-hidden">
                  <div className="flex flex-col gap-2 border-b-2 border-line bg-paper/60 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      {l ? (
                        <>
                          <h2 className="text-lg font-extrabold">
                            <span className="mr-2 rounded-lg bg-ink px-2 py-0.5 text-sm text-white">Bài {l.no}</span>
                            {l.vi}
                          </h2>
                          <p className="text-en text-sm font-semibold">
                            {l.en} · {g.terms.length} từ
                          </p>
                        </>
                      ) : (
                        <h2 className="text-lg font-extrabold">Chưa gắn bài · {g.terms.length} từ</h2>
                      )}
                    </div>
                    {l && (
                      <div className="flex shrink-0 gap-2">
                        {noteOf(l.id) && (
                        <Link href={`/teacher/notebook?bai=${l.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-ink-2 hover:bg-ink/5">
                          <NotebookPen className="size-4" /> Vở ghi
                        </Link>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setEditing({ lessonId: l.id })}>
                          <Plus /> Thêm từ cho bài
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-line">{g.terms.map((t) => row(t, l?.id ?? null))}</div>
                </div>
              </section>
            );
          })
        )}
      </div>

      <TermFormDialog open={editing != null} onOpenChange={(o) => !o && setEditing(null)} term={editing?.term} grade={grade} lessonId={editing?.lessonId} />
      {confirmEl}
    </div>
  );
}
