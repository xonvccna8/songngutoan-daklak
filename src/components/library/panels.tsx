"use client";

// Các bảng của trang "Học liệu số" (GV): khung chương trình · khung câu · câu lệnh lớp học · kí hiệu · học liệu (link)
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, PencilLine, Plus, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/lessons/fields";
import { SayButtons } from "@/components/library/say";
import { ResourceView, RESOURCE_ICON } from "@/components/library/resource-view";
import { ResourceDialog } from "@/components/library/resource-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { STRANDS, chaptersOf, curLesson, type CurLesson } from "@/lib/curriculum";
import {
  E_LEVELS,
  FRAME_FNS,
  PHRASE_GROUPS,
  SYMBOL_TOPICS,
  matches,
  sayOf,
  searchFrames,
  searchPhrases,
  searchSymbols,
  type ELevel,
  type FrameFn,
  type PhraseGroup,
  type SymbolTopic,
} from "@/lib/library";
import { RESOURCE_KINDS, type ResourceDoc } from "@/lib/library/resources";
import type { LessonStatus } from "@/lib/live/types";

const chip = (on: boolean) => cn("h-8 rounded-full border-2 px-3 text-xs font-bold whitespace-nowrap", on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink/30");

// ---------------- Khung chương trình ----------------

export function CurriculumPanel({ grade, q, resources, onAddResource }: { grade: number; q: string; resources: ResourceDoc[]; onAddResource: (l: CurLesson) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const chapters = chaptersOf(grade)
    .map((c) => ({ ...c, lessons: c.lessons.filter((l) => matches(q, l.vi, l.en, c.vi, c.en, ...l.outcomes.flatMap((o) => [o.vi, o.en]))) }))
    .filter((c) => c.lessons.length);
  const count = (id: string) => resources.filter((r) => r.curLessonId === id).length;
  if (!chapters.length) return <EmptyState title="Không tìm thấy bài phù hợp" />;
  return (
    <div className="flex flex-col gap-4">
      {chapters.map((c) => (
        <section key={c.id} className="card-lsn overflow-hidden">
          <header className="flex flex-wrap items-center gap-2 border-b-2 border-line px-4 py-3">
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: STRANDS[c.strand].color }}>
              {STRANDS[c.strand].vi}
            </span>
            <h3 className="font-extrabold">
              Chương {c.no}. {c.vi}
            </h3>
            <span className="text-en text-sm">· {c.en}</span>
          </header>
          <ul className="divide-y divide-line">
            {c.lessons.map((l) => {
              const isOpen = open === l.id || !!q.trim();
              return (
                <li key={l.id}>
                  <button onClick={() => setOpen(open === l.id ? null : l.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-paper/60">
                    {isOpen ? <ChevronDown className="size-4 shrink-0 text-ink-2" /> : <ChevronRight className="size-4 shrink-0 text-ink-2" />}
                    <span className="min-w-0 flex-1">
                      <b>
                        Bài {l.no}. {l.vi}
                      </b>{" "}
                      <span className="text-en text-sm">· {l.en}</span>
                    </span>
                    <span className="hidden shrink-0 text-xs text-ink-2 sm:inline">
                      {l.outcomes.length ? `${l.outcomes.length} YCCĐ` : "chưa có YCCĐ"} · {count(l.id)} học liệu
                    </span>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 bg-paper/40 px-11 pb-3">
                      {l.outcomes.length ? (
                        <ol className="list-decimal space-y-1 pl-4 text-sm">
                          {l.outcomes.map((o) => (
                            <li key={o.id}>
                              {o.vi} <span className="text-en text-xs">· {o.en}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-xs text-ink-2">Yêu cầu cần đạt của bài này sẽ được bổ sung.</p>
                      )}
                      <Button size="xs" variant="outline" onClick={() => onAddResource(l)}>
                        <Plus /> Thêm học liệu cho bài này
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="text-xs text-ink-2">
        Yêu cầu cần đạt bám theo Chương trình GDPT 2018 môn Toán (Thông tư 32/2018/TT-BGDĐT): chi tiết cho lớp 8 và chương Tam giác lớp 7; các bài khác tạm dùng 1 YCCĐ chung. Tổ chuyên môn nên bổ sung và đối chiếu câu chữ với văn bản gốc.
      </p>
    </div>
  );
}

// ---------------- Khung câu ----------------

export function FramesPanel({ q }: { q: string }) {
  const [fn, setFn] = useState<FrameFn | "">("");
  const [level, setLevel] = useState<ELevel | "all">("all");
  const list = searchFrames(q).filter((f) => !fn || f.fn === fn);
  const levels: ELevel[] = level === "all" ? ["e1", "e2", "e3"] : [level];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <button className={chip(!fn)} onClick={() => setFn("")}>
          Tất cả
        </button>
        {(Object.keys(FRAME_FNS) as FrameFn[]).map((k) => (
          <button key={k} className={chip(fn === k)} onClick={() => setFn(k)} title={FRAME_FNS[k].hint}>
            {FRAME_FNS[k].vi}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold text-ink-2">Mức tiếng Anh:</span>
        {(["all", "e1", "e2", "e3"] as const).map((k) => (
          <button key={k} className={chip(level === k)} onClick={() => setLevel(k)}>
            {k === "all" ? "Cả 3 mức" : `${E_LEVELS[k].label} · ${E_LEVELS[k].vi.split("· ")[1]}`}
          </button>
        ))}
      </div>
      {fn && (
        <p className="text-sm text-ink-2">
          <b className="text-ink">{FRAME_FNS[fn].vi}</b> <span className="text-en">· {FRAME_FNS[fn].en}</span> — {FRAME_FNS[fn].hint}
          {FRAME_FNS[fn].twm && <span> · Cambridge TWM: {FRAME_FNS[fn].twm}</span>}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((f) => (
          <article key={f.id} className="card-lsn p-4">
            <p className="text-[11px] font-bold text-ink-2 uppercase">{FRAME_FNS[f.fn].vi}</p>
            <ul className="mt-2 space-y-2">
              {levels.map((lv) => (
                <li key={lv} className="flex items-start gap-2">
                  <span className="mt-0.5 rounded-md bg-paper px-1.5 py-0.5 text-[10px] font-extrabold text-ink-2">{E_LEVELS[lv].label}</span>
                  <span className="min-w-0 flex-1">
                    <span className="text-en block font-semibold">{f[lv].en}</span>
                    <span className="text-vi block text-sm">{f[lv].vi}</span>
                  </span>
                  <SayButtons text={f[lv].en} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {!list.length && <EmptyState title="Không tìm thấy khung câu" />}
    </div>
  );
}

// ---------------- Câu lệnh lớp học ----------------

export function PhrasesPanel({ q }: { q: string }) {
  const [group, setGroup] = useState<PhraseGroup | "">("");
  const list = searchPhrases(q).filter((p) => !group || p.group === group);
  const groups = (Object.keys(PHRASE_GROUPS) as PhraseGroup[]).filter((g) => list.some((p) => p.group === g));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <button className={chip(!group)} onClick={() => setGroup("")}>
          Tất cả
        </button>
        {(Object.keys(PHRASE_GROUPS) as PhraseGroup[]).map((g) => (
          <button key={g} className={chip(group === g)} onClick={() => setGroup(g)}>
            {PHRASE_GROUPS[g].vi}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <section key={g} className="card-lsn p-4">
            <h3 className="font-extrabold">
              {PHRASE_GROUPS[g].vi} <span className="text-en text-sm font-semibold">· {PHRASE_GROUPS[g].en}</span>
            </h3>
            <ul className="mt-2 divide-y divide-line">
              {list
                .filter((p) => p.group === g)
                .map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="text-en block font-semibold">{p.en}</span>
                      <span className="text-vi block text-sm">{p.vi}</span>
                    </span>
                    <SayButtons text={p.en} />
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      {!list.length && <EmptyState title="Không tìm thấy câu lệnh" />}
    </div>
  );
}

// ---------------- Kí hiệu toán học ----------------

/** Kí hiệu đã học đến khối đang chọn */
export function SymbolsPanel({ q, grade }: { q: string; grade?: number }) {
  const list = searchSymbols(q).filter((s) => !grade || s.grade <= grade);
  const topics = (Object.keys(SYMBOL_TOPICS) as SymbolTopic[]).filter((t) => list.some((s) => s.topic === t));
  return (
    <div className="flex flex-col gap-3">
      {topics.map((t) => (
        <section key={t} className="card-lsn p-4">
          <h3 className="font-extrabold">
            {SYMBOL_TOPICS[t].vi} <span className="text-en text-sm font-semibold">· {SYMBOL_TOPICS[t].en}</span>
          </h3>
          <ul className="mt-2 grid gap-x-6 gap-y-1 md:grid-cols-2">
            {list
              .filter((s) => s.topic === t)
              .map((s) => (
                <li key={s.id} className="flex items-center gap-3 border-b border-line py-2">
                  <span className="w-40 shrink-0 font-mono text-base font-bold break-words">{s.sym}</span>
                  <span className="min-w-0 flex-1">
                    <span className="text-en block font-semibold">{s.en}</span>
                    <span className="text-vi block text-sm">{s.vi}</span>
                    {s.note && <span className="block text-[11px] text-ink-2">{s.note}</span>}
                  </span>
                  <SayButtons text={sayOf(s)} />
                </li>
              ))}
          </ul>
        </section>
      ))}
      {!list.length && <EmptyState title="Không tìm thấy kí hiệu" />}
    </div>
  );
}

// ---------------- Học liệu (link) ----------------

export function ResourcesPanel({ q, grade, data, uid, admin }: { q: string; grade: number; data: ResourceDoc[]; uid: string | undefined; admin: boolean }) {
  const [editing, setEditing] = useState<ResourceDoc | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmEl, confirm] = useConfirm();
  const list = data.filter(
    (r) => r.grade === grade && (admin || r.status === "approved" || r.createdBy === uid) && matches(q, r.title.vi, r.title.en, r.note, curLesson(r.curLessonId)?.vi)
  );
  const canEdit = (r: ResourceDoc) => admin || (r.createdBy === uid && r.status !== "approved");

  async function act(r: ResourceDoc, fn: () => Promise<unknown>, msg: string) {
    setBusy(r.id);
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (!list.length) return <EmptyState title={`Chưa có học liệu cho lớp ${grade}`}>Bấm “Thêm học liệu” để thêm link GeoGebra, video YouTube, phiếu học tập…</EmptyState>;
  return (
    <div className="card-lsn divide-y divide-line overflow-hidden">
      {list.map((r) => {
        const I = RESOURCE_ICON[r.kind];
        const l = curLesson(r.curLessonId);
        return (
          <div key={r.id} className={cn("p-4", busy === r.id && "opacity-60")}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk sm:grid">
                <I className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <b>{r.title.vi}</b>
                  {r.title.en && <span className="text-en text-sm">· {r.title.en}</span>}
                  <StatusBadge status={r.status as LessonStatus} />
                </p>
                <p className="text-xs text-ink-2">
                  {RESOURCE_KINDS[r.kind].vi} · {l ? `Bài ${l.no}. ${l.vi}` : `Dùng chung lớp ${r.grade}`} · thêm bởi {r.createdByName}
                </p>
                {r.note && <p className="text-xs text-ink-2">{r.note}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPreview(preview === r.id ? null : r.id)}>
                  {preview === r.id ? "Ẩn" : "Xem"}
                </Button>
                {admin && r.status !== "approved" && (
                  <Button size="sm" variant="teal" disabled={!!busy} onClick={() => act(r, () => api(`/api/resources/${r.id}`, { method: "PUT", body: { status: "approved" } }), "Đã duyệt học liệu.")}>
                    <Check /> Duyệt
                  </Button>
                )}
                {admin && r.status === "approved" && (
                  <Button size="sm" variant="ghost" disabled={!!busy} title="Gỡ duyệt (học sinh sẽ không thấy)" onClick={() => act(r, () => api(`/api/resources/${r.id}`, { method: "PUT", body: { status: "draft" } }), "Đã gỡ duyệt.")}>
                    <Undo2 />
                  </Button>
                )}
                {canEdit(r) && (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setEditing(r)}>
                    <PencilLine /> Sửa
                  </Button>
                )}
                {canEdit(r) && (
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    disabled={!!busy}
                    aria-label="Xoá"
                    onClick={async () => (await confirm({ title: `Xoá “${r.title.vi}”?`, confirmText: "Xoá", danger: true })) && act(r, () => api(`/api/resources/${r.id}`, { method: "DELETE" }), "Đã xoá.")}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
            {preview === r.id && (
              <div className="mt-3 max-w-3xl">
                <ResourceView r={r} />
              </div>
            )}
          </div>
        );
      })}
      {editing && <ResourceDialog key={editing.id} open onOpenChange={(o) => !o && setEditing(null)} edit={editing} />}
      {confirmEl}
    </div>
  );
}
