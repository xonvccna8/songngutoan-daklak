"use client";

// GĐ 6 — Thư viện bài giảng: bài của tôi, bài chờ duyệt (quản trị), thư viện tiết mẫu đã duyệt
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookA, Copy, FileDown, Loader2, PencilLine, Plus, Search, Sparkles } from "lucide-react";
import { AiDraftDialog } from "@/components/lessons/ai-draft-dialog";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, SectionTitle } from "@/components/common";
import { INPUT, StatusBadge } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { metaOf } from "@/lib/lessons/editor";
import { fetchLessonFull, useLessonList } from "@/lib/lessons/hooks";
import type { LessonDoc } from "@/lib/live/types";
import { GRADES } from "@/lib/curriculum";

export default function LessonLibraryPage() {
  const router = useRouter();
  const { user, role, claims } = useAuth();
  const { data, loading } = useLessonList();
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [ai, setAi] = useState(false);

  const match = (l: LessonDoc) => {
    const s = q.trim().toLowerCase();
    return (!grade || l.grade === grade) && (!s || `${l.title.vi} ${l.title.en} ${l.subtitle ?? ""} ${l.ownerName ?? ""}`.toLowerCase().includes(s));
  };
  const list = data.filter(match);
  const mine = list.filter((l) => l.ownerId && l.ownerId === user?.uid);
  const review = role === "admin" ? list.filter((l) => l.status === "pending" && l.schoolId === claims.schoolId && l.ownerId !== user?.uid) : [];
  const library = list.filter((l) => l.status === "approved" && l.ownerId !== user?.uid);

  async function create(fromId?: string) {
    setBusy(fromId ?? "new");
    try {
      const r = await api<{ id: string }>("/api/lessons", { body: fromId ? { fromId } : {} });
      router.push(`/teacher/lessons/${r.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  }

  async function word(l: LessonDoc) {
    setBusy("w" + l.id);
    try {
      const [{ lesson, slides }, { downloadLessonDoc }] = await Promise.all([fetchLessonFull(l.id), import("@/lib/lessons/word")]);
      await downloadLessonDoc(metaOf(lesson), slides, lesson.ownerName ?? "");
    } catch (e) {
      toast.error("Không xuất được file Word: " + errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const grid = (list: LessonDoc[], empty: React.ReactNode) =>
    list.length === 0 ? (
      <p className="rounded-2xl border-2 border-dashed border-line px-4 py-6 text-center text-sm text-ink-2">{empty}</p>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((l) => (
          <article key={l.id} className="card-lsn flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-lg bg-blue-soft px-2 py-0.5 text-xs font-bold text-blue-dk">Lớp {l.grade}</span>
              <StatusBadge status={l.status} />
            </div>
            <Link href={`/teacher/lessons/${l.id}`} className="mt-2 block hover:text-blue">
              <h3 className="text-lg leading-tight font-extrabold">{l.title.vi}</h3>
              <p className="text-en text-sm font-semibold">{l.title.en}</p>
            </Link>
            <p className="mt-1 text-xs text-ink-2">
              {l.subtitle && `${l.subtitle} · `}
              {l.slideIds.length} trang · {l.terms?.length ?? 0} thuật ngữ
            </p>
            <p className="mt-0.5 text-xs text-ink-2">
              {l.ownerName ?? "Tiết mẫu"}
              {l.updatedAt && ` · sửa ${l.updatedAt.toMillis ? new Date(l.updatedAt.toMillis()).toLocaleDateString("vi-VN") : ""}`}
            </p>
            {l.status === "draft" && l.reviewNote && l.ownerId === user?.uid && <p className="mt-2 rounded-xl bg-sun-soft px-2 py-1 text-xs text-[#8A5A00]">Quản trị góp ý: {l.reviewNote}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <Link href={`/teacher/lessons/${l.id}`} className={buttonVariants({ size: "sm", variant: "default" })}>
                <PencilLine /> {l.ownerId === user?.uid && l.status === "draft" ? "Soạn" : "Mở"}
              </Link>
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => create(l.id)}>
                {busy === l.id ? <Loader2 className="animate-spin" /> : <Copy />} Nhân bản
              </Button>
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => word(l)} aria-label="Xuất Word" title="Xuất giáo án Word (CV 5512)">
                {busy === "w" + l.id ? <Loader2 className="animate-spin" /> : <FileDown />} Word
              </Button>
            </div>
          </article>
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Bài giảng</h1>
          <p className="mt-1 text-sm text-ink-2">Soạn tiết song ngữ theo CV 5512 + 4C, gửi duyệt, rồi dạy trên lớp.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/teacher/terms" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <BookA /> Ngân hàng thuật ngữ
          </Link>
          <Button variant="sun" size="lg" onClick={() => setAi(true)} disabled={!!busy}>
            <Sparkles /> Soạn bằng AI
          </Button>
          <Button size="lg" onClick={() => create()} disabled={!!busy}>
            {busy === "new" ? <Loader2 className="animate-spin" /> : <Plus />} Soạn bài mới
          </Button>
        </div>
      </div>
      <AiDraftDialog open={ai} onOpenChange={setAi} />

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên bài, người soạn…" className={`${INPUT} h-11 pl-9`} />
        </label>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className={`${INPUT} h-11 sm:w-40`} aria-label="Lọc theo khối">
          <option value={0}>Mọi khối</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              Lớp {g}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-lsn h-48 animate-pulse bg-white/60" />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {review.length > 0 && (
            <section>
              <SectionTitle>Chờ bạn duyệt ({review.length})</SectionTitle>
              {grid(review, "")}
            </section>
          )}
          <section>
            <SectionTitle>Bài của tôi ({mine.length})</SectionTitle>
            {mine.length === 0 && !q && !grade ? (
              <EmptyState
                title="Bạn chưa soạn bài nào"
                action={
                  <Button variant="sun" size="lg" onClick={() => create()} disabled={!!busy}>
                    <Plus /> Soạn bài đầu tiên
                  </Button>
                }
              >
                Bắt đầu từ trang trống, hoặc bấm “Nhân bản” một tiết mẫu bên dưới để sửa theo lớp mình.
              </EmptyState>
            ) : (
              grid(mine, "Không có bài phù hợp.")
            )}
          </section>
          <section>
            <SectionTitle>Thư viện tiết mẫu đã duyệt ({library.length})</SectionTitle>
            {grid(library, "Chưa có tiết nào được duyệt.")}
          </section>
        </div>
      )}
    </div>
  );
}
