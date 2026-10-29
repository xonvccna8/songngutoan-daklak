"use client";

// Ngân hàng câu hỏi song ngữ: lọc theo khối / bài / mức độ (TT 22) / dạng · thêm tay hoặc nhờ AI · giao bài về nhà · xuất Word
import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Database, FileDown, PencilLine, Plus, Search, Send, Sparkles, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { INPUT, SELECT, StatusBadge } from "@/components/lessons/fields";
import { QuestionDialog } from "@/components/bank/question-dialog";
import { AiBankDialog } from "@/components/bank/ai-dialog";
import { BankAssignDialog } from "@/components/bank/assign-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { api, errorMessage } from "@/lib/api-client";
import { GRADES, chaptersOf, curLesson, fold } from "@/lib/curriculum";
import { useBankQuestions } from "@/lib/bank/hooks";
import { BANK_LEVELS, BANK_TYPES, answerText, bankSearchText, type BankDoc, type BankLevel, type BankType } from "@/lib/bank/questions";
import { downloadBankDoc } from "@/lib/bank/word";

type Who = "all" | "mine" | "pending" | "ai";
const chip = (on: boolean) => cn("h-8 rounded-full border-2 px-3 text-xs font-bold whitespace-nowrap", on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink/30");

export default function QuestionBankPage() {
  const { user, role } = useAuth();
  const uid = user?.uid;
  const admin = role === "admin";
  const { data, loading } = useBankQuestions();
  const [grade, setGrade] = useState(8);
  const [lessonId, setLessonId] = useState("");
  const [level, setLevel] = useState<BankLevel | "">("");
  const [type, setType] = useState<BankType | "">("");
  const [who, setWho] = useState<Who>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<BankDoc | "new" | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmEl, confirm] = useConfirm();

  // GV thấy câu đã duyệt + câu của mình; quản trị thấy tất cả
  const visible = useMemo(() => data.filter((x) => admin || x.status === "approved" || x.createdBy === uid), [data, admin, uid]);
  const list = useMemo(() => {
    const k = fold(q.trim());
    return visible.filter(
      (x) =>
        x.grade === grade &&
        (!lessonId || x.curLessonId === lessonId) &&
        (!level || x.level === level) &&
        (!type || x.type === type) &&
        (who === "all" || (who === "mine" && x.createdBy === uid) || (who === "pending" && x.status !== "approved") || (who === "ai" && x.aiDraft)) &&
        (!k || fold(bankSearchText(x)).includes(k))
    );
  }, [visible, grade, lessonId, level, type, who, q, uid]);
  const counts = (Object.keys(BANK_LEVELS) as BankLevel[]).map((l) => ({ l, n: list.filter((x) => x.level === l).length }));
  const assignable = (x: BankDoc) => !x.aiDraft && (x.status === "approved" || x.createdBy === uid);
  const canEdit = (x: BankDoc) => admin || (x.createdBy === uid && x.status !== "approved");
  const chosen = data.filter((x) => sel.has(x.id));
  const pendingCount = data.filter((x) => x.status === "pending").length;

  const toggle = (id: string) => setSel((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));

  async function act(x: BankDoc, fn: () => Promise<unknown>, msg: string) {
    setBusy(x.id);
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-8 sm:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
            <Database className="size-8 text-blue" /> Ngân hàng câu hỏi
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Câu hỏi song ngữ gắn bài SGK, yêu cầu cần đạt và mức độ Biết / Hiểu / Vận dụng (Thông tư 22/2021). Chọn câu để giao bài về nhà (máy tự chấm) hoặc xuất đề Word.
            {admin && pendingCount > 0 && <b className="text-coral-dk"> · {pendingCount} câu chờ duyệt</b>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="coral" size="lg" onClick={() => setAiOpen(true)}>
            <Sparkles /> Tạo bằng AI
          </Button>
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus /> Thêm câu
          </Button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="inline-flex shrink-0 rounded-2xl bg-white p-1 ring-2 ring-line" role="tablist" aria-label="Khối">
            {GRADES.map((g) => (
              <button
                key={g}
                role="tab"
                aria-selected={grade === g}
                onClick={() => {
                  setGrade(g);
                  setLessonId("");
                }}
                className={cn("h-9 rounded-xl px-4 text-sm font-bold", grade === g ? "bg-ink text-white" : "text-ink-2")}
              >
                Lớp {g}
              </button>
            ))}
          </div>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={cn(SELECT, "h-11 lg:max-w-sm")} aria-label="Bài SGK">
            <option value="">Mọi bài của lớp {grade}</option>
            {chaptersOf(grade).map((c) => (
              <optgroup key={c.id} label={`Chương ${c.no}. ${c.vi}`}>
                {c.lessons.map((x) => (
                  <option key={x.id} value={x.id}>
                    Bài {x.no}. {x.vi}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <label className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong đề, phương án (Việt / Anh)…" className={`${INPUT} h-11 pl-9`} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={chip(!level)} onClick={() => setLevel("")}>
            Mọi mức độ
          </button>
          {(Object.keys(BANK_LEVELS) as BankLevel[]).map((l) => (
            <button key={l} className={chip(level === l)} onClick={() => setLevel(l)}>
              {BANK_LEVELS[l].vi}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-line-2" />
          <button className={chip(!type)} onClick={() => setType("")}>
            Mọi dạng
          </button>
          {(Object.keys(BANK_TYPES) as BankType[]).map((t) => (
            <button key={t} className={chip(type === t)} onClick={() => setType(t)}>
              {BANK_TYPES[t].vi}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-line-2" />
          {(
            [
              ["all", "Tất cả"],
              ["mine", "Câu của tôi"],
              ["pending", "Chưa duyệt"],
              ["ai", "Nháp AI"],
            ] as [Who, string][]
          ).map(([k, t]) => (
            <button key={k} className={chip(who === k)} onClick={() => setWho(k)}>
              {t}
            </button>
          ))}
        </div>
        <p className="flex flex-wrap gap-3 text-sm text-ink-2">
          <b className="text-ink">{list.length} câu</b>
          {counts.map(({ l, n }) => (
            <span key={l} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: BANK_LEVELS[l].color }} /> {BANK_LEVELS[l].vi}: {n}
            </span>
          ))}
        </p>
      </div>

      {/* Danh sách */}
      <div className="mt-4">
        {loading ? null : list.length === 0 ? (
          <EmptyState title="Chưa có câu hỏi phù hợp">Bấm “Thêm câu” để tự soạn, hoặc “Tạo bằng AI” để AI đề xuất câu song ngữ theo yêu cầu cần đạt của bài.</EmptyState>
        ) : (
          <div className="card-lsn divide-y divide-line overflow-hidden">
            {list.map((x) => {
              const l = curLesson(x.curLessonId);
              const isOpen = open === x.id;
              const on = sel.has(x.id);
              return (
                <div key={x.id} className={cn("p-4", busy === x.id && "opacity-60", on && "bg-blue-soft/50")}>
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => (assignable(x) ? toggle(x.id) : toast.info(x.aiDraft ? "Câu Nháp AI: hãy mở “Sửa”, kiểm tra rồi bấm Lưu trước khi giao." : "Câu chưa duyệt của giáo viên khác."))}
                      className={cn("mt-1 grid size-6 shrink-0 place-items-center rounded-md border-2", on ? "border-blue bg-blue text-white" : "border-line-2 bg-white", !assignable(x) && "opacity-40")}
                      aria-label="Chọn câu"
                      aria-pressed={on}
                    >
                      {on && <Check className="size-3.5" />}
                    </button>
                    <button type="button" onClick={() => setOpen(isOpen ? null : x.id)} className="min-w-0 flex-1 text-left">
                      <span className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded-full px-2 py-0.5 font-bold text-white" style={{ background: BANK_LEVELS[x.level].color }}>
                          {BANK_LEVELS[x.level].vi}
                        </span>
                        <span className="rounded-full bg-paper px-2 py-0.5 font-bold text-ink-2">{BANK_TYPES[x.type].vi}</span>
                        <span className="rounded-full bg-paper px-2 py-0.5 font-bold text-ink-2">{x.skill}</span>
                        {x.aiDraft ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-2 py-0.5 font-bold text-coral-dk">
                            <Sparkles className="size-3" /> Nháp AI
                          </span>
                        ) : (
                          <StatusBadge status={x.status} className="py-0 text-[11px]" />
                        )}
                        <span className="text-ink-2">
                          {l ? `Bài ${l.no}. ${l.vi}` : `Lớp ${x.grade}`} · {x.createdByName}
                        </span>
                      </span>
                      <span className="text-en mt-1 block font-semibold">{x.type === "speak" ? `“${x.speakTarget}”` : x.prompt.en || x.prompt.vi}</span>
                      {x.type !== "speak" && x.prompt.en && x.prompt.vi && <span className="text-vi block text-sm">{x.prompt.vi}</span>}
                    </button>
                    <button type="button" onClick={() => setOpen(isOpen ? null : x.id)} className="mt-1 text-ink-2" aria-label={isOpen ? "Thu gọn" : "Xem đáp án"}>
                      {isOpen ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="mt-3 space-y-2 pl-9 text-sm">
                      {x.type === "mcq" && (
                        <ul className="grid gap-1 sm:grid-cols-2">
                          {x.options.map((o, j) => (
                            <li key={j} className={cn("rounded-xl px-3 py-1.5", j === x.answer ? "bg-teal-soft font-bold text-[#0A6F5F]" : "bg-paper")}>
                              {"ABCD"[j]}. {o.en} {o.vi && <span className="font-normal text-ink-2 italic">· {o.vi}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p>
                        <b>Đáp án:</b> {answerText(x)}
                      </p>
                      {(x.method.vi || x.method.en) && (
                        <p>
                          <b>Cách làm:</b> {x.method.vi} <span className="text-en">{x.method.en}</span>
                        </p>
                      )}
                      {(x.explain.vi || x.explain.en) && (
                        <p>
                          <b>Lời giải:</b> {x.explain.vi} <span className="text-en">{x.explain.en}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {canEdit(x) && (
                          <Button size="sm" variant="outline" onClick={() => setEditing(x)}>
                            <PencilLine /> {x.aiDraft ? "Kiểm tra & sửa" : "Sửa"}
                          </Button>
                        )}
                        {admin && x.status !== "approved" && !x.aiDraft && (
                          <Button size="sm" variant="teal" disabled={!!busy} onClick={() => act(x, () => api(`/api/questions/${x.id}`, { method: "PUT", body: { status: "approved" } }), "Đã duyệt câu hỏi.")}>
                            <Check /> Duyệt
                          </Button>
                        )}
                        {admin && x.status === "approved" && (
                          <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act(x, () => api(`/api/questions/${x.id}`, { method: "PUT", body: { status: "draft" } }), "Đã gỡ duyệt.")}>
                            <Undo2 /> Gỡ duyệt
                          </Button>
                        )}
                        {canEdit(x) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!!busy}
                            onClick={async () => (await confirm({ title: "Xoá câu hỏi này?", confirmText: "Xoá", danger: true })) && act(x, () => api(`/api/questions/${x.id}`, { method: "DELETE" }), "Đã xoá.")}
                          >
                            <Trash2 /> Xoá
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thanh thao tác khi đã chọn câu */}
      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:pl-64">
          <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-ink p-2 pl-5 text-white shadow-2xl">
            <b className="mr-2">Đã chọn {chosen.length} câu</b>
            <Button variant="sun" onClick={() => setAssigning(true)}>
              <Send /> Giao bài về nhà
            </Button>
            <Button variant="outline" onClick={() => downloadBankDoc(chosen, `De luyen tap Toan ${grade}`).catch(() => toast.error("Không tạo được file Word."))}>
              <FileDown /> Xuất Word
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setSel(new Set())}>
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <QuestionDialog
          key={editing === "new" ? "new" : editing.id}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          edit={editing === "new" ? undefined : editing}
          preset={{ grade, curLessonId: lessonId || null }}
        />
      )}
      {aiOpen && <AiBankDialog open onOpenChange={setAiOpen} preset={{ grade, curLessonId: lessonId || null }} />}
      {assigning && <BankAssignDialog open ids={chosen.map((x) => x.id)} onOpenChange={setAssigning} onDone={() => setSel(new Set())} />}
      {confirmEl}
    </div>
  );
}
