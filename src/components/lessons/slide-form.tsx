"use client";

// Biểu mẫu sửa một trang: thông tin chung, khối nội dung, câu hỏi theo loại, lời giải, ghi chú GV
import { useState } from "react";
import { BookA, MessageSquareQuote, Plus, Trash2, Volume2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BlockList } from "@/components/lessons/block-editor";
import { BiField, FieldLabel, INPUT, SELECT, Section, TextField } from "@/components/lessons/fields";
import { ACTIVITIES, KIND_META, emptyBi, kindOf, type EditorSlide } from "@/lib/lessons/editor";
import { E_LEVELS, FRAMES, FRAME_FNS, PHRASES, PHRASE_GROUPS, searchFrames, searchPhrases, type ELevel, type PhraseGroup } from "@/lib/library";
import { curLesson } from "@/lib/curriculum";
import { say } from "@/lib/live/speech";
import type { Activity, Bi, Question, Skill, TeacherKey } from "@/lib/live/types";

export function SlideForm({
  slide,
  index,
  onChange,
  onInsertTerm,
  curLessonId,
}: {
  slide: EditorSlide;
  index: number;
  onChange: (s: EditorSlide) => void;
  onInsertTerm: () => void;
  /** Bài SGK của tiết (để chọn YCCĐ cho câu hỏi) */
  curLessonId?: string | null;
}) {
  const kind = kindOf(slide);
  const [phrases, setPhrases] = useState(false);
  const setKey = (k: Partial<TeacherKey>) => onChange({ ...slide, key: { ...slide.key, ...k } });
  const setQ = (q: Partial<Question>) => onChange({ ...slide, question: { ...slide.question!, ...q } });

  return (
    <div className="space-y-4">
      <Section title={`Trang ${index + 1} · ${KIND_META[kind].label}`}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <BiField label="Tiêu đề trang" value={slide.title} onChange={(title) => onChange({ ...slide, title })} />
          <label className="sm:w-56">
            <FieldLabel>Thuộc hoạt động (CV 5512)</FieldLabel>
            <select value={slide.activity ?? 2} onChange={(e) => onChange({ ...slide, activity: Number(e.target.value) as Activity })} className={SELECT}>
              {ACTIVITIES.map((a) => (
                <option key={a.n} value={a.n}>
                  {a.n}. {a.vi}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!slide.question && !slide.speak && (
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={!!slide.phonesDown} onChange={(e) => onChange({ ...slide, phonesDown: e.target.checked || undefined })} /> Nhắc học sinh úp điện thoại khi chiếu trang này
          </label>
        )}
      </Section>

      <Section
        title="Nội dung trình chiếu"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setPhrases(true)}>
              <MessageSquareQuote /> Câu lệnh / khung câu
            </Button>
            <Button variant="outline" size="sm" onClick={onInsertTerm}>
              <BookA /> Chèn thuật ngữ
            </Button>
          </div>
        }
      >
        {slide.question && slide.blocks.length === 0 && <p className="text-xs text-ink-2">Không có khối nào thì tivi tự hiện đề bài của câu hỏi.</p>}
        <BlockList blocks={slide.blocks} onChange={(blocks) => onChange({ ...slide, blocks })} />
      </Section>

      {slide.question && (
        <Section title="Câu hỏi trên điện thoại">
          <BiField label="Đề bài" value={slide.question.prompt} onChange={(prompt) => setQ({ prompt })} area />
          <QuestionBody kind={kind} q={slide.question} k={slide.key} setQ={setQ} setKey={setKey} />
          <div className="flex flex-wrap gap-3">
            <label>
              <FieldLabel>Thời gian (giây)</FieldLabel>
              <input type="number" min={5} max={600} value={slide.question.time} onChange={(e) => setQ({ time: Number(e.target.value) || 30 })} className={`${INPUT} w-28`} />
            </label>
            <label>
              <FieldLabel>Kĩ năng (để tính điểm Toán / Ngôn ngữ)</FieldLabel>
              <select value={slide.question.skill} onChange={(e) => setQ({ skill: e.target.value as Skill })} className={`${SELECT} w-44`}>
                <option value="Toán">Toán</option>
                <option value="Ngôn ngữ">Ngôn ngữ</option>
              </select>
            </label>
          </div>
          <OutcomePicker curLessonId={curLessonId} value={slide.outcomeIds ?? []} onChange={(ids) => onChange({ ...slide, outcomeIds: ids.length ? ids : undefined })} />
        </Section>
      )}

      {slide.speak && (
        <Section title="Luyện nói">
          <div className="flex items-end gap-2">
            <TextField className="flex-1" label="Câu mẫu tiếng Anh" value={slide.speak.target} onChange={(target) => onChange({ ...slide, speak: { ...slide.speak!, target } })} maxLength={300} placeholder="The hypotenuse is the longest side." />
            <Button variant="outline" size="icon" onClick={() => say(slide.speak!.target)} aria-label="Nghe câu mẫu" title="Nghe câu mẫu">
              <Volume2 />
            </Button>
          </div>
          <label>
            <FieldLabel>Thời gian (giây)</FieldLabel>
            <input type="number" min={5} max={600} value={slide.speak.time} onChange={(e) => onChange({ ...slide, speak: { ...slide.speak!, time: Number(e.target.value) || 40 } })} className={`${INPUT} w-28`} />
          </label>
        </Section>
      )}

      {(slide.question || slide.speak) && (
        <Section title="Lời giải & gợi ý">
          <BiField label="Giải thích khi công bố đáp án" value={slide.key.explain ?? emptyBi()} onChange={(explain) => setKey({ explain })} area />
          <BiField label="Gợi ý cách làm" hint="cho bài tập về nhà, không lộ đáp án" value={slide.key.method ?? emptyBi()} onChange={(method) => setKey({ method })} area />
          {slide.question && slide.question.type !== "mcq" && (
            <TextField label="Đáp án hiển thị" hint="để trống thì tự tạo" value={slide.key.show ?? ""} onChange={(show) => setKey({ show: show || undefined })} maxLength={200} />
          )}
        </Section>
      )}

      <Section
        title="Ghi chú cho giáo viên"
        action={
          <Button variant="outline" size="sm" onClick={() => setKey({ notes: [...slide.key.notes, { en: "", vi: "" }] })}>
            <Plus /> Thêm ghi chú
          </Button>
        }
      >
        <p className="text-xs text-ink-2">Chỉ hiện trên máy giáo viên. Câu tiếng Anh có nút nghe để luyện trước khi lên lớp.</p>
        {slide.key.notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <BiField className="flex-1" value={{ en: n.en ?? "", vi: n.vi ?? "" }} onChange={(v) => setKey({ notes: slide.key.notes.map((x, j) => (j === i ? v : x)) })} area rows={1} />
            <Button variant="ghost" size="icon-sm" onClick={() => n.en && say(n.en)} disabled={!n.en} aria-label="Nghe" title="Nghe câu tiếng Anh">
              <Volume2 />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setKey({ notes: slide.key.notes.filter((_, j) => j !== i) })} aria-label="Xoá ghi chú">
              <Trash2 />
            </Button>
          </div>
        ))}
      </Section>

      <PhraseDialog
        open={phrases}
        onOpenChange={setPhrases}
        onPick={(p, where) => {
          if (where === "notes") return setKey({ notes: [...slide.key.notes, { ...p }] });
          const step = slide.blocks.length ? Math.max(...slide.blocks.map((b) => ("step" in b ? b.step : 0))) + 1 : 0;
          // Khung câu hiện thành ô có nhãn để HS nhìn mà nói/viết theo
          const block = where === "frame" ? { kind: "box" as const, step, tag: "Sentence frame", text: { ...p } } : { kind: "say" as const, step, text: { ...p } };
          onChange({ ...slide, blocks: [...slide.blocks, block] });
        }}
      />
    </div>
  );
}

function QuestionBody({ kind, q, k, setQ, setKey }: { kind: string; q: Question; k: TeacherKey; setQ: (q: Partial<Question>) => void; setKey: (k: Partial<TeacherKey>) => void }) {
  if (q.type === "mcq") {
    const opts = q.options ?? [];
    const tf = kind === "tf";
    return (
      <div className="space-y-2">
        <FieldLabel hint="bấm chữ cái để chọn đáp án đúng">Phương án</FieldLabel>
        {opts.map((o, i) => (
          <div key={i} className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setKey({ answer: i })}
              className={cn("mt-1 grid size-8 shrink-0 place-items-center rounded-lg font-bold ring-2", k.answer === i ? "bg-teal text-white ring-teal" : "bg-white text-ink-2 ring-line-2")}
              aria-label={`Chọn ${"ABCD"[i]} là đáp án đúng`}
              aria-pressed={k.answer === i}
            >
              {"ABCD"[i]}
            </button>
            {tf ? (
              <span className="pt-2 font-semibold">
                {o.en} <span className="text-vi">· {o.vi}</span>
              </span>
            ) : (
              <>
                <BiField className="flex-1" value={o} onChange={(v) => setQ({ options: opts.map((x, j) => (j === i ? v : x)) })} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={opts.length <= 2}
                  onClick={() => {
                    setQ({ options: opts.filter((_, j) => j !== i) });
                    setKey({ answer: k.answer == null ? 0 : k.answer === i ? 0 : k.answer > i ? k.answer - 1 : k.answer });
                  }}
                  aria-label="Xoá phương án"
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </div>
        ))}
        {!tf && opts.length < 4 && (
          <Button variant="outline" size="xs" onClick={() => setQ({ options: [...opts, emptyBi()] })}>
            <Plus /> Thêm phương án
          </Button>
        )}
      </div>
    );
  }
  if (q.type === "number") {
    return (
      <div className="flex flex-wrap gap-3">
        <label>
          <FieldLabel>Đáp số</FieldLabel>
          <input
            type="number"
            step="any"
            value={k.answer ?? ""}
            onChange={(e) => setKey({ answer: e.target.value === "" ? undefined : Number(e.target.value) })}
            className={`${INPUT} w-36`}
          />
        </label>
        <TextField label="Đơn vị" value={q.unit ?? ""} onChange={(unit) => setQ({ unit: unit || undefined })} placeholder="°, cm…" maxLength={20} className="w-28" />
      </div>
    );
  }
  if (q.type === "text") {
    return (
      <TextField
        label="Các câu trả lời được chấp nhận"
        hint="mỗi dòng một câu; máy chấm cho phép sai chính tả nhẹ"
        area
        rows={3}
        value={(k.accept ?? []).join("\n")}
        onChange={(v) => setKey({ accept: v.split("\n") })}
      />
    );
  }
  // Kéo nhãn
  const targets = q.targets ?? [];
  const labels = q.options ?? [];
  const order = targets.map((_, i) => k.order?.[i] ?? -1);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FieldLabel hint="nhiều hơn số ô thì có nhãn gây nhiễu">Các nhãn (thuật ngữ) để học sinh chọn</FieldLabel>
        {labels.map((l, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 w-5 text-right text-xs font-bold text-ink-2">{i + 1}</span>
            <BiField className="flex-1" value={l} onChange={(v) => setQ({ options: labels.map((x, j) => (j === i ? v : x)) })} placeholder={{ en: "vertex angle", vi: "góc ở đỉnh" }} />
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={labels.length <= targets.length}
              onClick={() => {
                setQ({ options: labels.filter((_, j) => j !== i) });
                setKey({ order: order.map((x) => (x === i ? -1 : x > i ? x - 1 : x)) });
              }}
              aria-label="Xoá nhãn"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {labels.length < 10 && (
          <Button variant="outline" size="xs" onClick={() => setQ({ options: [...labels, emptyBi()] })}>
            <Plus /> Thêm nhãn
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <FieldLabel hint="mỗi ô chọn nhãn đúng">Các ô cần gắn nhãn</FieldLabel>
        {targets.map((t, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl bg-paper/60 p-2 sm:flex-row sm:items-start">
            <span className="mt-2 w-5 text-right text-xs font-bold text-ink-2">{i + 1}</span>
            <BiField className="flex-1" value={t} onChange={(v) => setQ({ targets: targets.map((x, j) => (j === i ? v : x)) })} placeholder={{ en: "the angle at A", vi: "góc tại đỉnh A" }} />
            <select value={order[i]} onChange={(e) => setKey({ order: order.map((x, j) => (j === i ? Number(e.target.value) : x)) })} className={`${SELECT} sm:w-44`} aria-label={`Nhãn đúng của ô ${i + 1}`}>
              <option value={-1}>— nhãn đúng —</option>
              {labels.map((l, j) => (
                <option key={j} value={j}>
                  {j + 1}. {l.en || "(trống)"}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={targets.length <= 1}
              onClick={() => {
                setQ({ targets: targets.filter((_, j) => j !== i) });
                setKey({ order: order.filter((_, j) => j !== i) });
              }}
              aria-label="Xoá ô"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {targets.length < 8 && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              setQ({ targets: [...targets, emptyBi()], ...(labels.length <= targets.length ? { options: [...labels, emptyBi()] } : {}) });
              setKey({ order: [...order, -1] });
            }}
          >
            <Plus /> Thêm ô
          </Button>
        )}
      </div>
    </div>
  );
}

/** Chèn câu lệnh lớp học (vào ghi chú GV / lên tivi) hoặc khung câu cho HS (lên tivi) — từ thư viện học liệu số */
function PhraseDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (p: Bi, where: "slide" | "notes" | "frame") => void }) {
  const [tab, setTab] = useState<"phrases" | "frames">("phrases");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<PhraseGroup | "">("");
  const [level, setLevel] = useState<ELevel>("e2");
  const phrases = searchPhrases(q).filter((p) => !group || p.group === group);
  const frames = searchFrames(q);
  const pick = (p: Bi, where: "slide" | "notes" | "frame") => (onPick(p, where), onOpenChange(false));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">Câu lệnh lớp học & khung câu</DialogTitle>
          <DialogDescription>Câu lệnh: chèn vào ghi chú GV (để đọc theo) hoặc lên trang. Khung câu: chèn lên trang để HS nói/viết theo. Bấm loa để nghe.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-paper p-1" role="tablist">
            {(["phrases", "frames"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("h-8 rounded-lg px-3 text-xs font-bold", tab === t ? "bg-ink text-white" : "text-ink-2")}>
                {t === "phrases" ? `Câu lệnh (${PHRASES.length})` : `Khung câu (${FRAMES.length})`}
              </button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tiếng Việt hoặc tiếng Anh…" className={`${INPUT} h-9 min-w-40 flex-1`} />
          {tab === "phrases" ? (
            <select value={group} onChange={(e) => setGroup(e.target.value as PhraseGroup | "")} className={`${SELECT} h-9 w-auto`} aria-label="Nhóm câu lệnh">
              <option value="">Mọi nhóm</option>
              {(Object.keys(PHRASE_GROUPS) as PhraseGroup[]).map((g) => (
                <option key={g} value={g}>
                  {PHRASE_GROUPS[g].vi}
                </option>
              ))}
            </select>
          ) : (
            <select value={level} onChange={(e) => setLevel(e.target.value as ELevel)} className={`${SELECT} h-9 w-auto`} aria-label="Mức tiếng Anh">
              {(Object.keys(E_LEVELS) as ELevel[]).map((l) => (
                <option key={l} value={l}>
                  {E_LEVELS[l].label} · {E_LEVELS[l].vi}
                </option>
              ))}
            </select>
          )}
        </div>
        <ul className="divide-y divide-line">
          {tab === "phrases" &&
            phrases.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2">
                <button type="button" onClick={() => say(p.en)} className="rounded-lg p-1.5 text-ink-2 hover:bg-paper" aria-label={`Nghe: ${p.en}`}>
                  <Volume2 className="size-4" />
                </button>
                <span className="min-w-0 flex-1">
                  <span className="text-en block text-sm font-semibold">{p.en}</span>
                  <span className="text-vi block text-xs">{p.vi}</span>
                </span>
                <Button size="xs" variant="outline" onClick={() => pick(p, "notes")}>
                  Ghi chú
                </Button>
                <Button size="xs" variant="ghost" onClick={() => pick(p, "slide")}>
                  Vào trang
                </Button>
              </li>
            ))}
          {tab === "frames" &&
            frames.map((f) => {
              const t = f[level];
              return (
                <li key={f.id} className="flex items-center gap-2 py-2">
                  <button type="button" onClick={() => say(t.en.replaceAll("___", "blank"))} className="rounded-lg p-1.5 text-ink-2 hover:bg-paper" aria-label={`Nghe: ${t.en}`}>
                    <Volume2 className="size-4" />
                  </button>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold text-ink-2 uppercase">{FRAME_FNS[f.fn].vi}</span>
                    <span className="text-en block text-sm font-semibold">{t.en}</span>
                    <span className="text-vi block text-xs">{t.vi}</span>
                  </span>
                  <Button size="xs" variant="outline" onClick={() => pick(t, "frame")}>
                    Vào trang
                  </Button>
                </li>
              );
            })}
          {(tab === "phrases" ? phrases : frames).length === 0 && <li className="py-6 text-center text-sm text-ink-2">Không tìm thấy.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Chọn YCCĐ mà câu hỏi này đo — để tính Sao thành thạo của từng em */
function OutcomePicker({ curLessonId, value, onChange }: { curLessonId: string | null | undefined; value: string[]; onChange: (ids: string[]) => void }) {
  const l = curLesson(curLessonId);
  if (!l) return <p className="text-xs text-ink-2">Gắn bài trong SGK ở mục “Thông tin bài” để chọn yêu cầu cần đạt cho câu hỏi.</p>;
  if (!l.outcomes.length) return <p className="text-xs text-ink-2">Bài {l.no} chưa có danh sách yêu cầu cần đạt trong khung chương trình.</p>;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="space-y-1.5">
      <FieldLabel>Câu hỏi này đo yêu cầu cần đạt nào? (tính Sao thành thạo)</FieldLabel>
      {l.outcomes.map((o) => (
        <label key={o.id} className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
          <span>
            {o.vi} <span className="text-en text-xs">· {o.en}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
