"use client";

// Sửa các khối nội dung của một trang. "Bước" = số lần GV bấm Tiếp thì khối hiện ra (0 = hiện ngay).
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BiField, FieldLabel, INPUT, SELECT, TextField } from "@/components/lessons/fields";
import { emptyBi } from "@/lib/lessons/editor";
import type { Block, FigureId } from "@/lib/live/types";

type Kind = Block["kind"];

export const BLOCK_KINDS: { kind: Kind; label: string }[] = [
  { kind: "text", label: "Văn bản" },
  { kind: "say", label: "Câu nói mẫu" },
  { kind: "box", label: "Khung nổi bật" },
  { kind: "goals", label: "Danh sách" },
  { kind: "steps", label: "Các bước" },
  { kind: "ipa", label: "Phiên âm" },
  { kind: "hero", label: "Tiêu đề lớn" },
  { kind: "figure", label: "Hình vẽ" },
  { kind: "cols", label: "Hai cột" },
  { kind: "join", label: "Mã vào lớp" },
];
const KIND_LABEL = Object.fromEntries(BLOCK_KINDS.map((k) => [k.kind, k.label])) as Record<Kind, string>;

const FIGURES: { id: FigureId; label: string }[] = [
  { id: "triangle-abc", label: "Tam giác ABC vuông tại A — hình tĩnh" },
  { id: "right-triangle", label: "Tam giác vuông — cạnh góc vuông, cạnh huyền, công thức (4 bước)" },
  { id: "pythagoras-squares", label: "Ba hình vuông trên ba cạnh (3 – 4 – 5) (4 bước)" },
  { id: "coordinate-plane", label: "Mặt phẳng toạ độ — điểm và đường thẳng y = x + 1 (3 bước)" },
  { id: "similar-triangles", label: "Hai tam giác đồng dạng tỉ số 2 (3 bước)" },
];

export function newBlock(kind: Kind, step: number): Block {
  switch (kind) {
    case "goals":
      return { kind, step, items: [emptyBi()] };
    case "steps":
      return { kind, items: [{ step, text: emptyBi() }] };
    case "ipa":
      return { kind, step, items: [{ word: "", ipa: "" }] };
    case "figure":
      return { kind, step, figure: "right-triangle" };
    case "cols":
      return { kind, left: [{ kind: "text", step, text: emptyBi() }], right: [] };
    case "join":
      return { kind, step };
    case "box":
      return { kind, step, text: emptyBi() };
    default:
      return { kind, step, text: emptyBi() };
  }
}

/** Bước lớn nhất đang dùng (để khối mới hiện sau cùng) */
const lastStep = (bs: Block[]): number =>
  bs.reduce((m, b) => Math.max(m, b.kind === "cols" ? Math.max(lastStep(b.left), lastStep(b.right)) : b.kind === "steps" ? Math.max(0, ...b.items.map((i) => i.step)) : b.step), 0);

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

function StepInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-2" title="Số lần bấm Tiếp thì khối hiện ra (0 = hiện ngay)">
      Bước
      <input type="number" min={0} max={20} value={value} onChange={(e) => onChange(Math.max(0, Math.min(20, Number(e.target.value) || 0)))} className={`${INPUT} h-8 w-16 px-2 py-0`} />
    </label>
  );
}

export function BlockList({ blocks, onChange, nested }: { blocks: Block[]; onChange: (b: Block[]) => void; nested?: boolean }) {
  const set = (i: number, b: Block) => onChange(blocks.map((x, j) => (j === i ? b : x)));
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-2xl border-2 border-line bg-paper/60 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-extrabold ring-1 ring-line-2">{KIND_LABEL[b.kind]}</span>
            {b.kind !== "steps" && b.kind !== "cols" && <StepInput value={b.step} onChange={(step) => set(i, { ...b, step })} />}
            <span className="flex-1" />
            <Button variant="ghost" size="icon-xs" onClick={() => onChange(move(blocks, i, -1))} disabled={i === 0} aria-label="Lên">
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => onChange(move(blocks, i, 1))} disabled={i === blocks.length - 1} aria-label="Xuống">
              <ArrowDown />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => onChange(blocks.filter((_, j) => j !== i))} aria-label="Xoá khối">
              <Trash2 className="text-coral-dk" />
            </Button>
          </div>
          <BlockBody b={b} onChange={(x) => set(i, x)} />
        </div>
      ))}
      <AddBlock nested={nested} onAdd={(k) => onChange([...blocks, newBlock(k, blocks.length ? lastStep(blocks) + 1 : 0)])} />
    </div>
  );
}

function AddBlock({ onAdd, nested }: { onAdd: (k: Kind) => void; nested?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-bold text-ink-2">
        <Plus className="inline size-3.5" /> Thêm khối:
      </span>
      {BLOCK_KINDS.filter((k) => !(nested && k.kind === "cols")).map((k) => (
        <button key={k.kind} type="button" onClick={() => onAdd(k.kind)} className="rounded-lg border border-line-2 bg-white px-2 py-1 text-xs font-semibold hover:border-blue hover:text-blue disabled:opacity-50">
          {k.label}
        </button>
      ))}
    </div>
  );
}

function BlockBody({ b, onChange }: { b: Block; onChange: (b: Block) => void }) {
  switch (b.kind) {
    case "text":
    case "say":
    case "hero":
      return (
        <div className="space-y-2">
          <BiField value={b.text} onChange={(text) => onChange({ ...b, text })} area={b.kind === "text"} />
          {b.kind === "text" && (
            <label className="flex items-center gap-2 text-xs text-ink-2">
              <input type="checkbox" checked={!!b.keep} onChange={(e) => onChange({ ...b, keep: e.target.checked || undefined })} /> Luôn hiện tiếng Anh (kể cả chế độ tiếng Việt)
            </label>
          )}
        </div>
      );
    case "box":
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-3">
            <TextField label="Nhãn nhỏ" value={b.tag ?? ""} onChange={(tag) => onChange({ ...b, tag: tag || undefined })} placeholder="VD: Definition · Định nghĩa" maxLength={40} className="min-w-48 flex-1" />
            <label className="flex items-center gap-2 pb-2 text-xs text-ink-2">
              <input type="checkbox" checked={!!b.highlight} onChange={(e) => onChange({ ...b, highlight: e.target.checked || undefined })} /> Viền vàng nổi bật
            </label>
          </div>
          <BiField value={b.text} onChange={(text) => onChange({ ...b, text })} area />
        </div>
      );
    case "goals":
      return <BiItems items={b.items} onChange={(items) => onChange({ ...b, items })} />;
    case "steps":
      return (
        <div className="space-y-2">
          {b.items.map((it, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <StepInput value={it.step} onChange={(step) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, step } : x)) })} />
              <BiField className="flex-1" value={it.text} onChange={(text) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, text } : x)) })} />
              <Button variant="ghost" size="icon-xs" onClick={() => onChange({ ...b, items: b.items.filter((_, j) => j !== i) })} aria-label="Xoá bước">
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="xs" onClick={() => onChange({ ...b, items: [...b.items, { step: Math.max(0, ...b.items.map((x) => x.step)) + 1, text: emptyBi() }] })}>
            <Plus /> Thêm bước
          </Button>
        </div>
      );
    case "ipa":
      return (
        <div className="space-y-2">
          {b.items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input value={it.word} placeholder="word" aria-label="Từ" onChange={(e) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, word: e.target.value } : x)) })} className={`${INPUT} font-semibold text-blue-dk`} />
              <input value={it.ipa} placeholder="/wɜːd/" aria-label="Phiên âm" onChange={(e) => onChange({ ...b, items: b.items.map((x, j) => (j === i ? { ...x, ipa: e.target.value } : x)) })} className={INPUT} />
              <Button variant="ghost" size="icon-xs" className="mt-1.5" onClick={() => onChange({ ...b, items: b.items.filter((_, j) => j !== i) })} aria-label="Xoá">
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="xs" onClick={() => onChange({ ...b, items: [...b.items, { word: "", ipa: "" }] })}>
            <Plus /> Thêm từ
          </Button>
        </div>
      );
    case "figure":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="sm:col-span-3">
            <FieldLabel>Hình</FieldLabel>
            <select value={b.figure} onChange={(e) => onChange({ ...b, figure: e.target.value as FigureId })} className={SELECT}>
              {FIGURES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <TextField label="Nhãn trên" value={b.labels?.top ?? ""} onChange={(top) => onChange({ ...b, labels: { ...b.labels, top: top || undefined } })} maxLength={40} />
          <TextField label="Nhãn trái" value={b.labels?.left ?? ""} onChange={(left) => onChange({ ...b, labels: { ...b.labels, left: left || undefined } })} maxLength={40} />
        </div>
      );
    case "cols":
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <FieldLabel>Cột trái</FieldLabel>
            <BlockList nested blocks={b.left} onChange={(left) => onChange({ ...b, left })} />
          </div>
          <div>
            <FieldLabel>Cột phải</FieldLabel>
            <BlockList nested blocks={b.right} onChange={(right) => onChange({ ...b, right })} />
          </div>
        </div>
      );
    case "join":
      return <p className="text-xs text-ink-2">Tivi hiện mã lớp + hướng dẫn học sinh vào lớp bằng điện thoại.</p>;
  }
}

function BiItems({ items, onChange }: { items: { en: string; vi: string }[]; onChange: (x: { en: string; vi: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2">
          <BiField className="flex-1" value={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} />
          <Button variant="ghost" size="icon-xs" className="mt-1.5" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Xoá mục">
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="xs" onClick={() => onChange([...items, emptyBi()])}>
        <Plus /> Thêm mục
      </Button>
    </div>
  );
}
