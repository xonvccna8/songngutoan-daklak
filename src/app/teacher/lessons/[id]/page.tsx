"use client";

// GĐ 6 — Trình soạn bài: danh sách trang (4 hoạt động) | biểu mẫu | xem trước tivi/điện thoại
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Copy, FileDown, Loader2, Lock, Presentation, Save, Send, Sparkles, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, FullScreenLoader } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { INPUT, StatusBadge } from "@/components/lessons/fields";
import { KhoPanel } from "@/components/lessons/kho-panel";
import { LessonTerms } from "@/components/lessons/lesson-terms";
import { MetaForm } from "@/components/lessons/meta-form";
import { SlidePreview } from "@/components/lessons/preview";
import { SlideForm } from "@/components/lessons/slide-form";
import { SlideList } from "@/components/lessons/slide-list";
import { TermPickerDialog } from "@/components/lessons/term-dialogs";
import { api, errorMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { activityOf, metaOf, problemsOf, type EditorSlide, type LessonMeta } from "@/lib/lessons/editor";
import { fetchLessonFull } from "@/lib/lessons/hooks";
import { maxStep } from "@/lib/live/grading";
import type { LessonDoc, LessonStatus } from "@/lib/live/types";

type Tab = "slides" | "info" | "terms" | "kho";

/** Giữ thứ tự theo hoạt động 1 → 4 (ổn định trong từng hoạt động) */
const byActivity = (slides: EditorSlide[]) =>
  slides
    .map((s, i) => ({ s: { ...s, activity: activityOf(s, i, slides.length) }, i }))
    .sort((a, b) => a.s.activity - b.s.activity || a.i - b.i)
    .map((x) => x.s);

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, role, claims } = useAuth();
  const [lesson, setLesson] = useState<LessonDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<LessonMeta | null>(null);
  const [slides, setSlides] = useState<EditorSlide[]>([]);
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("slides");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [returning, setReturning] = useState(false);
  const [confirmEl, confirm] = useConfirm();

  const load = useCallback(
    () =>
      fetchLessonFull(id).then(
        ({ lesson, slides }) => {
          setLesson(lesson);
          setMeta(metaOf(lesson));
          setSlides(byActivity(slides));
          setDirty(false);
        },
        (e) => setError(errorMessage(e))
      ),
    [id]
  );
  useEffect(() => {
    load();
  }, [load]);

  // Rời trang khi chưa lưu → trình duyệt hỏi lại
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const owner = !!lesson?.ownerId && lesson.ownerId === user?.uid;
  const schoolAdmin = role === "admin" && !!lesson?.ownerId && lesson.schoolId === claims.schoolId;
  const canEdit = !!lesson && ((lesson.status === "draft" && (owner || schoolAdmin)) || (lesson.status === "pending" && schoolAdmin));
  const problems = useMemo(() => (meta ? problemsOf(meta, slides) : []), [meta, slides]);
  const problemSlides = useMemo(() => new Set(problems.map((p) => p.slide).filter((x): x is number => x != null)), [problems]);

  const editSlides = (next: EditorSlide[], select?: number) => {
    const keepId = next[select ?? idx]?.id;
    const sorted = byActivity(next);
    setSlides(sorted);
    setIdx(Math.max(0, sorted.findIndex((s) => s.id === keepId)));
    setDirty(true);
  };
  const editMeta = (m: LessonMeta) => {
    setMeta(m);
    setDirty(true);
  };

  const save = useCallback(async () => {
    if (!meta || !canEdit) return true;
    setBusy("save");
    try {
      await api(`/api/lessons/${id}`, { method: "PUT", body: { meta, slides } });
      setDirty(false);
      toast.success("Đã lưu bài.");
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setBusy(null);
    }
  }, [id, meta, slides, canEdit]);

  // Ctrl+S để lưu
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty) save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [dirty, save]);

  async function setStatus(status: LessonStatus, label: string, note?: string) {
    if (dirty && !(await save())) return;
    setBusy(status);
    try {
      await api(`/api/lessons/${id}/status`, { body: { status, note } });
      toast.success(label);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function clone() {
    if (dirty && canEdit && !(await save())) return;
    setBusy("clone");
    try {
      const r = await api<{ id: string }>("/api/lessons", { body: { fromId: id } });
      toast.success("Đã tạo bản sao (nháp) để soạn tiếp.");
      router.push(`/teacher/lessons/${r.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  }

  async function exportWord() {
    if (!meta) return;
    setBusy("word");
    try {
      const { downloadLessonDoc } = await import("@/lib/lessons/word");
      await downloadLessonDoc(meta, slides, lesson?.ownerName || user?.displayName || "");
    } catch (e) {
      toast.error("Không xuất được file Word: " + errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function exportPptx() {
    if (!meta) return;
    setBusy("pptx");
    try {
      const { downloadEditorPptx } = await import("@/lib/lessons/pptx");
      await downloadEditorPptx(meta, slides, lesson?.ownerName || user?.displayName || "");
      toast.success("Đã tạo PowerPoint song ngữ: mỗi câu hỏi có trang đề + trang đáp án, lời giảng ở phần Notes.");
    } catch (e) {
      toast.error("Không xuất được PowerPoint: " + errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    const ok = await confirm({ title: "Xoá bài này?", description: "Toàn bộ trang và đáp án sẽ bị xoá, không khôi phục được.", confirmText: "Xoá bài", danger: true });
    if (!ok) return;
    setBusy("delete");
    try {
      await api(`/api/lessons/${id}`, { method: "DELETE" });
      setDirty(false);
      toast.success("Đã xoá bài.");
      router.push("/teacher/lessons");
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  }

  /** Chèn thuật ngữ: vào Bảng từ của tiết (từ trang đang soạn) + khối phiên âm của trang */
  function insertTerm(t: { en: string; ipa: string; vi: string }) {
    if (!meta) return;
    const has = meta.terms.some((x) => x.en.toLowerCase() === t.en.toLowerCase());
    if (!has) editMeta({ ...meta, terms: [...meta.terms, { ...t, at: idx }] });
    const s = slides[idx];
    if (!s) return;
    const ipa = s.blocks.findIndex((b) => b.kind === "ipa");
    const blocks = [...s.blocks];
    if (ipa >= 0) {
      const b = blocks[ipa];
      if (b.kind === "ipa" && !b.items.some((x) => x.word === t.en)) blocks[ipa] = { ...b, items: [...b.items, { word: t.en, ipa: t.ipa }] };
    } else blocks.push({ kind: "ipa", step: maxStep(s), items: [{ word: t.en, ipa: t.ipa }] });
    editSlides(slides.map((x, j) => (j === idx ? { ...x, blocks } : x)));
    toast.success(`Đã chèn “${t.en}”.`);
  }

  if (error)
    return (
      <div className="mx-auto max-w-xl p-6">
        <EmptyState title="Không mở được bài" mood="alert" action={<Link href="/teacher/lessons" className="font-bold text-blue">← Về thư viện</Link>}>
          {error}
        </EmptyState>
      </div>
    );
  if (!lesson || !meta) return <FullScreenLoader label="Đang mở bài…" />;
  const slide = slides[Math.min(idx, slides.length - 1)];
  const st = lesson.status;

  return (
    <div className="pb-16">
      {/* Thanh trên */}
      <div className="z-20 border-b-2 border-line bg-paper/95 backdrop-blur lg:sticky lg:top-0">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <Link href="/teacher/lessons" className="grid size-10 place-items-center rounded-xl border-2 border-line-2 bg-white" aria-label="Về thư viện bài giảng">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-extrabold">{meta.title.vi || "Bài chưa đặt tên"}</h1>
              <StatusBadge status={st} />
            </div>
            <p className="truncate text-xs text-ink-2">
              <span className="text-en font-semibold">{meta.title.en}</span> · {slides.length} trang · {lesson.ownerName ?? "Tiết mẫu"}
              {dirty && <b className="ml-1 text-coral-dk">· chưa lưu</b>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button onClick={save} disabled={!dirty || !!busy} size="sm">
                {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} Lưu
              </Button>
            )}
            {owner && st === "draft" && !schoolAdmin && (
              <Button variant="sun" size="sm" disabled={!!busy || problems.length > 0} onClick={() => setStatus("pending", "Đã gửi bài cho quản trị duyệt.")} title={problems.length ? "Còn chỗ cần sửa" : undefined}>
                <Send /> Gửi duyệt
              </Button>
            )}
            {owner && st === "pending" && (
              <Button variant="outline" size="sm" disabled={!!busy} onClick={() => setStatus("draft", "Đã rút lại, bài về trạng thái nháp.")}>
                <Undo2 /> Rút lại
              </Button>
            )}
            {schoolAdmin && st !== "approved" && (
              <Button variant="teal" size="sm" disabled={!!busy || problems.length > 0} onClick={() => setStatus("approved", "Đã duyệt — bài có trong danh sách dạy.")}>
                <Check /> Duyệt
              </Button>
            )}
            {schoolAdmin && st === "pending" && !owner && (
              <Button variant="outline" size="sm" disabled={!!busy} onClick={() => setReturning(true)}>
                <Undo2 /> Trả lại
              </Button>
            )}
            {schoolAdmin && st === "approved" && (
              <Button
                variant="outline"
                size="sm"
                disabled={!!busy}
                onClick={async () =>
                  (await confirm({ title: "Chuyển bài về nháp?", description: "Bài sẽ tạm ẩn khỏi danh sách dạy và học sinh không xem lại được cho tới khi duyệt lại. Muốn sửa mà không ẩn bài: dùng “Nhân bản”." })) &&
                  setStatus("draft", "Bài đã về nháp để sửa.")
                }
              >
                <Lock /> Về nháp để sửa
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={!!busy} onClick={clone}>
              {busy === "clone" ? <Loader2 className="animate-spin" /> : <Copy />} Nhân bản
            </Button>
            <Button variant="outline" size="sm" disabled={!!busy} onClick={exportWord}>
              {busy === "word" ? <Loader2 className="animate-spin" /> : <FileDown />} Xuất Word
            </Button>
            <Button variant="outline" size="sm" disabled={!!busy} onClick={exportPptx}>
              {busy === "pptx" ? <Loader2 className="animate-spin" /> : <Presentation />} PowerPoint
            </Button>
            {(owner || schoolAdmin) && st !== "approved" && (
              <Button variant="destructive" size="icon-sm" disabled={!!busy} onClick={remove} aria-label="Xoá bài" title="Xoá bài">
                <Trash2 />
              </Button>
            )}
          </div>
        </div>
        <div className="mx-auto flex max-w-[1600px] gap-1 px-4 sm:px-6">
          {(
            [
              ["slides", "Trang chiếu"],
              ["info", "Thông tin & mục tiêu"],
              ["terms", `Thuật ngữ (${meta.terms.length})`],
              ["kho", "Kho học liệu"],
            ] as const
          ).map(([t, label]) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={cn("rounded-t-xl border-b-4 px-3 py-2 text-sm font-bold", tab === t ? "border-blue text-ink" : "border-transparent text-ink-2 hover:text-ink")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-4 px-4 pt-4 sm:px-6">
        {!canEdit && (
          <p className="flex items-center gap-2 rounded-2xl bg-blue-soft px-4 py-3 text-sm text-blue-dk">
            <Lock className="size-4 shrink-0" />
            {st === "approved"
              ? "Bài đã duyệt nên chỉ xem. Bấm “Nhân bản” để có bản nháp của riêng bạn và sửa tiếp."
              : st === "pending"
                ? "Bài đang chờ quản trị duyệt nên chỉ xem."
                : "Đây là bài của giáo viên khác — chỉ xem. Bấm “Nhân bản” để soạn bản của bạn."}
          </p>
        )}
        {st === "draft" && lesson.aiDraft && canEdit && (
          <p className="flex items-start gap-2 rounded-2xl bg-sun-soft px-4 py-3 text-sm text-[#8A5A00]">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <span>
              <b>Bài do trợ lý AI đề xuất.</b> Thầy cô kiểm tra kĩ từng trang: kiến thức, đáp án đúng, phiên âm, câu tiếng Anh — sửa trực tiếp rồi mới gửi duyệt.
            </span>
          </p>
        )}
        {st === "draft" && lesson.reviewNote && (
          <p className="flex items-start gap-2 rounded-2xl bg-sun-soft px-4 py-3 text-sm text-[#8A5A00]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>
              <b>Góp ý của quản trị:</b> {lesson.reviewNote}
            </span>
          </p>
        )}
        {canEdit && problems.length > 0 && (
          <details className="rounded-2xl border-2 border-coral/40 bg-coral-soft/50 px-4 py-2 text-sm">
            <summary className="cursor-pointer font-bold text-coral-dk">Còn {problems.length} chỗ cần sửa trước khi gửi duyệt</summary>
            <ul className="mt-2 space-y-1">
              {problems.slice(0, 12).map((p, i) => (
                <li key={i}>
                  {p.slide != null ? (
                    <button type="button" className="font-semibold text-blue underline-offset-2 hover:underline" onClick={() => (setTab("slides"), setIdx(p.slide!))}>
                      Trang {p.slide + 1}
                    </button>
                  ) : (
                    <button type="button" className="font-semibold text-blue underline-offset-2 hover:underline" onClick={() => setTab("info")}>
                      Thông tin bài
                    </button>
                  )}
                  : {p.msg}
                </li>
              ))}
            </ul>
          </details>
        )}

        {tab === "slides" && slide && (
          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,440px)]">
            <aside className="lg:sticky lg:top-36 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto">
              <SlideList slides={slides} index={idx} onSelect={setIdx} onChange={editSlides} problemSlides={problemSlides} readOnly={!canEdit} />
            </aside>
            <div className="order-3 min-w-0 xl:order-2">
              <fieldset disabled={!canEdit} className="min-w-0">
                <SlideForm
                  key={slide.id}
                  slide={slide}
                  index={idx}
                  curLessonId={meta.curLessonId}
                  onChange={(s) => editSlides(slides.map((x, j) => (j === idx ? s : x)))}
                  onInsertTerm={() => setPicking(true)}
                />
              </fieldset>
            </div>
            <div className="order-2 min-w-0 lg:col-start-2 xl:order-3 xl:col-start-auto">
              <div className="xl:sticky xl:top-36">
                <SlidePreview meta={meta} slides={slides} index={idx} />
              </div>
            </div>
          </div>
        )}
        {tab === "info" && (
          <fieldset disabled={!canEdit} className="mx-auto max-w-4xl min-w-0">
            <MetaForm meta={meta} onChange={editMeta} />
          </fieldset>
        )}
        {tab === "kho" && (
          <div className="mx-auto max-w-5xl min-w-0">
            <KhoPanel
              curLessonId={meta.curLessonId}
              terms={meta.terms}
              canEdit={canEdit}
              onAddTerms={(list) => {
                const has = new Set(meta.terms.map((t) => t.en.toLowerCase()));
                const add = list.filter((t) => !has.has(t.en.toLowerCase())).map((t) => ({ en: t.en, ipa: t.ipa, vi: t.vi, at: idx }));
                if (add.length) {
                  editMeta({ ...meta, terms: [...meta.terms, ...add] });
                  toast.success(`Đã thêm ${add.length} thuật ngữ vào tiết (từ trang ${idx + 1}). Nhớ bấm Lưu.`);
                }
              }}
            />
          </div>
        )}
        {tab === "terms" && (
          <fieldset disabled={!canEdit} className="mx-auto max-w-4xl min-w-0">
            <LessonTerms terms={meta.terms} slides={slides} onChange={(terms) => editMeta({ ...meta, terms })} onAdd={() => setPicking(true)} />
          </fieldset>
        )}
      </div>

      <TermPickerDialog open={picking} onOpenChange={setPicking} grade={meta.grade} onPick={insertTerm} />
      <ReturnDialog open={returning} onOpenChange={setReturning} onSend={(note) => setStatus("draft", "Đã trả lại bài cho giáo viên.", note)} />
      {confirmEl}
    </div>
  );
}

function ReturnDialog({ open, onOpenChange, onSend }: { open: boolean; onOpenChange: (v: boolean) => void; onSend: (note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">Trả lại bài</DialogTitle>
          <DialogDescription>Ghi góp ý để giáo viên sửa. Bài sẽ về trạng thái nháp.</DialogDescription>
        </DialogHeader>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={500} className={INPUT} placeholder="VD: Trang 5 thiếu lời giải; nên thêm câu luyện nói cho thuật ngữ “base angle”." />
        <Button
          onClick={() => {
            onSend(note);
            onOpenChange(false);
          }}
        >
          <Undo2 /> Trả lại
        </Button>
      </DialogContent>
    </Dialog>
  );
}
