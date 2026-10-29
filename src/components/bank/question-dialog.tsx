"use client";

// Thêm / sửa một câu trong ngân hàng: dạng câu, mức độ, bài SGK + YCCĐ, đề song ngữ, đáp án, gợi ý cách làm, lời giải
import { useState } from "react";
import { Check, Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BiField, FieldLabel, INPUT, SELECT, TextField } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";
import { chaptersOf, curLesson, GRADES } from "@/lib/curriculum";
import { BANK_LEVELS, BANK_TYPES, emptyBankInput, sanitizeBankInput, type BankDoc, type BankInput, type BankLevel, type BankType } from "@/lib/bank/questions";

const fromDoc = (d: BankDoc): BankInput => {
  const base = emptyBankInput(d.grade, d.curLessonId);
  const keys = Object.keys(base) as (keyof BankInput)[];
  return Object.fromEntries(keys.map((k) => [k, d[k] ?? base[k]])) as unknown as BankInput;
};

export function QuestionDialog({ open, onOpenChange, edit, preset }: { open: boolean; onOpenChange: (v: boolean) => void; edit?: BankDoc; preset?: { grade: number; curLessonId: string | null } }) {
  const [v, setV] = useState<BankInput>(() => {
    if (edit) {
      const x = fromDoc(edit);
      // Trắc nghiệm luôn hiện đủ 4 ô
      if (x.type === "mcq") x.options = [0, 1, 2, 3].map((i) => x.options[i] ?? { en: "", vi: "" });
      return x;
    }
    return emptyBankInput(preset?.grade, preset?.curLessonId);
  });
  const [acceptText, setAcceptText] = useState(() => v.accept.join("\n"));
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<BankInput>) => setV((x) => ({ ...x, ...p }));
  const l = curLesson(v.curLessonId);

  function changeType(type: BankType) {
    set({
      type,
      answer: type === "number" ? null : 0,
      options: type === "mcq" ? (v.options.length === 4 ? v.options : [0, 1, 2, 3].map(() => ({ en: "", vi: "" }))) : v.options,
      skill: type === "speak" || type === "text" ? "Ngôn ngữ" : v.skill,
    });
  }

  async function save() {
    const body = { ...v, accept: acceptText.split("\n") };
    const check = sanitizeBankInput(body);
    if (typeof check === "string") return toast.error(check);
    setBusy(true);
    try {
      if (edit) await api(`/api/questions/${edit.id}`, { method: "PUT", body });
      else await api("/api/questions", { body });
      toast.success(edit ? "Đã lưu câu hỏi." : "Đã thêm câu hỏi vào ngân hàng.");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">{edit ? "Sửa câu hỏi" : "Thêm câu hỏi"}</DialogTitle>
          <DialogDescription>Nhập đủ hai cột Anh | Việt (không dịch máy). Đáp án chỉ giáo viên thấy; học sinh nhận câu hỏi qua bài tập về nhà.</DialogDescription>
        </DialogHeader>
        {edit?.aiDraft && (
          <p className="flex items-start gap-2 rounded-2xl bg-sun-soft p-3 text-sm text-[#8A5A00]">
            <Sparkles className="mt-0.5 size-4 shrink-0" /> Câu do AI đề xuất. Hãy kiểm tra kiến thức, đáp án và câu chữ tiếng Anh, sửa nếu cần rồi bấm Lưu. Sau khi lưu, câu mới giao bài được.
          </p>
        )}
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <FieldLabel>Dạng câu</FieldLabel>
              <select value={v.type} onChange={(e) => changeType(e.target.value as BankType)} className={SELECT}>
                {(Object.keys(BANK_TYPES) as BankType[]).map((k) => (
                  <option key={k} value={k}>
                    {BANK_TYPES[k].vi}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel hint="TT 22">Mức độ</FieldLabel>
              <select value={v.level} onChange={(e) => set({ level: e.target.value as BankLevel })} className={SELECT}>
                {(Object.keys(BANK_LEVELS) as BankLevel[]).map((k) => (
                  <option key={k} value={k}>
                    {BANK_LEVELS[k].vi}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Phần chấm</FieldLabel>
              <select value={v.skill} onChange={(e) => set({ skill: e.target.value as BankInput["skill"] })} className={SELECT} disabled={v.type === "speak"}>
                <option value="Toán">Toán</option>
                <option value="Ngôn ngữ">Ngôn ngữ (tiếng Anh)</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
            <label>
              <FieldLabel>Khối</FieldLabel>
              <select value={v.grade} onChange={(e) => set({ grade: Number(e.target.value), curLessonId: null, outcomeIds: [] })} className={SELECT}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Bài trong SGK</FieldLabel>
              <select value={v.curLessonId ?? ""} onChange={(e) => set({ curLessonId: e.target.value || null, outcomeIds: [] })} className={SELECT}>
                <option value="">— Chưa gắn bài —</option>
                {chaptersOf(v.grade).map((c) => (
                  <optgroup key={c.id} label={`Chương ${c.no}. ${c.vi}`}>
                    {c.lessons.map((x) => (
                      <option key={x.id} value={x.id}>
                        Bài {x.no}. {x.vi}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
          {l && l.outcomes.length > 0 && (
            <div>
              <FieldLabel hint="để tính Sao thành thạo">Câu đo yêu cầu cần đạt nào</FieldLabel>
              <ul className="space-y-1">
                {l.outcomes.map((o) => {
                  const on = v.outcomeIds.includes(o.id);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => set({ outcomeIds: on ? v.outcomeIds.filter((x) => x !== o.id) : [...v.outcomeIds, o.id] })}
                        className={cn("flex w-full items-start gap-2 rounded-xl border-2 p-2 text-left text-sm", on ? "border-blue bg-blue-soft" : "border-line bg-white")}
                      >
                        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2", on ? "border-blue bg-blue text-white" : "border-line-2")}>{on && <Check className="size-3" />}</span>
                        <span>{o.vi}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <BiField label={v.type === "speak" ? "Lời dặn (không bắt buộc)" : "Đề bài"} area value={v.prompt} onChange={(prompt) => set({ prompt })} placeholder={{ en: "Which side of a right triangle is the longest?", vi: "Cạnh nào của tam giác vuông dài nhất?" }} />

          {v.type === "mcq" && (
            <div className="space-y-2">
              <FieldLabel hint="bấm chữ cái để chọn đáp án đúng">Các phương án</FieldLabel>
              {v.options.map((o, i) => (
                <div key={i} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => set({ answer: i })}
                    className={cn("mt-1 grid size-9 shrink-0 place-items-center rounded-xl border-2 font-display font-extrabold", v.answer === i ? "border-teal bg-teal text-white" : "border-line-2 bg-white text-ink-2")}
                    aria-label={`Chọn ${"ABCD"[i]} là đáp án đúng`}
                  >
                    {"ABCD"[i]}
                  </button>
                  <BiField className="flex-1" value={o} onChange={(nv) => set({ options: v.options.map((x, j) => (j === i ? nv : x)) })} />
                </div>
              ))}
            </div>
          )}
          {v.type === "tf" && (
            <div>
              <FieldLabel>Đáp án</FieldLabel>
              <div className="flex gap-2">
                {["Đúng / True", "Sai / False"].map((t, i) => (
                  <button key={t} type="button" onClick={() => set({ answer: i })} className={cn("h-10 rounded-xl border-2 px-4 text-sm font-bold", v.answer === i ? "border-teal bg-teal text-white" : "border-line-2 bg-white text-ink-2")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {v.type === "number" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <FieldLabel>Đáp số</FieldLabel>
                <input type="number" step="any" value={v.answer ?? ""} onChange={(e) => set({ answer: e.target.value === "" ? null : Number(e.target.value) })} className={INPUT} />
              </label>
              <TextField label="Đơn vị (không bắt buộc)" value={v.unit} onChange={(unit) => set({ unit })} placeholder="g/cm³" maxLength={20} />
            </div>
          )}
          {v.type === "text" && (
            <TextField label="Câu trả lời chấp nhận (mỗi dòng một cách viết)" area rows={3} value={acceptText} onChange={setAcceptText} placeholder={"hypotenuse\nthe hypotenuse"} />
          )}
          {v.type === "speak" && <TextField label="Câu tiếng Anh học sinh đọc to" value={v.speakTarget} onChange={(speakTarget) => set({ speakTarget })} placeholder="The hypotenuse is the longest side." maxLength={200} />}

          <BiField label="Gợi ý cách làm (tầng 2, không lộ đáp án)" area value={v.method} onChange={(method) => set({ method })} />
          <BiField label="Lời giải (tầng 3)" area value={v.explain} onChange={(explain) => set({ explain })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X /> Huỷ
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : edit ? <Check /> : <Plus />} Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
