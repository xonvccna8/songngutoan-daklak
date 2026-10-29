"use client";

// GV tạo / sửa dự án STEM: chọn mẫu (Toán 6–9) rồi sửa tự do, chọn lớp, hạn nộp, từ vựng song ngữ
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BiField, FieldLabel, INPUT, SELECT, TextField } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";
import { chaptersOf, curLesson, DEFAULT_GRADE } from "@/lib/curriculum";
import { STEM_TEMPLATES, sanitizeProject, type ProjectDoc, type ProjectInput, type StemTemplate } from "@/lib/stem/projects";
import type { ClassDoc } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (ms: number) => {
  const d = new Date(ms);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

export function ProjectDialog({
  open,
  onOpenChange,
  classes,
  edit,
  preset,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassDoc[];
  edit?: ProjectDoc;
  /** Mẫu chọn từ Thư viện dự án mẫu */
  preset?: StemTemplate;
  onCreated?: (id: string) => void;
}) {
  // Có mẫu → chọn sẵn lớp cùng khối với mẫu (nếu có)
  const [classId, setClassId] = useState(edit?.classId ?? (preset && classes.find((c) => c.grade === preset.grade)?.id) ?? classes[0]?.id ?? "");
  const cls = classes.find((c) => c.id === classId);
  const [v, setV] = useState<Omit<ProjectInput, "dueAt">>(() =>
    edit
      ? { title: edit.title, goal: edit.goal, brief: edit.brief, materials: edit.materials, grade: edit.grade, curLessonId: edit.curLessonId ?? null, vocab: edit.vocab ?? [] }
      : preset
        ? { title: preset.title, goal: preset.goal, brief: preset.brief, materials: preset.materials, grade: preset.grade, curLessonId: preset.curLessonId ?? null, vocab: preset.vocab }
        : { title: { en: "", vi: "" }, goal: { en: "", vi: "" }, brief: { en: "", vi: "" }, materials: "", grade: classes[0]?.grade ?? DEFAULT_GRADE, curLessonId: null, vocab: [] }
  );
  const [due, setDue] = useState(() => toLocal(edit?.dueAt ?? Date.now() + 14 * 86_400_000));
  const [busy, setBusy] = useState(false);
  const [tplId, setTplId] = useState(preset?.id ?? "");
  const set = (p: Partial<typeof v>) => setV((x) => ({ ...x, ...p }));
  const grade = cls?.grade ?? v.grade;
  // Mẫu cùng khối với lớp (+ mẫu đang chọn từ thư viện nếu khác khối)
  const templates = STEM_TEMPLATES.filter((t) => t.grade === grade || t.id === tplId);
  const tpl = STEM_TEMPLATES.find((t) => t.id === tplId);
  const otherGrade = !!tpl && !!cls && tpl.grade !== cls.grade;
  // Nhóm mẫu theo bài SGK (theo thứ tự bài)
  const groups = chaptersOf(grade)
    .flatMap((c) => c.lessons)
    .map((l) => ({ l, list: templates.filter((t) => t.curLessonId === l.id) }))
    .filter((g) => g.list.length);
  const other = templates.filter((t) => !t.curLessonId || !curLesson(t.curLessonId) || t.grade !== grade);

  async function save() {
    const body = { ...v, grade: cls?.grade ?? v.grade, dueAt: new Date(`${due.date}T${due.time}`).getTime() };
    const check = sanitizeProject(body);
    if (typeof check === "string") return toast.error(check);
    setBusy(true);
    try {
      if (edit) {
        await api(`/api/stem/${edit.id}`, { method: "PUT", body });
        toast.success("Đã lưu dự án.");
      } else {
        const r = await api<{ id: string }>("/api/stem", { body: { ...body, classId } });
        toast.success("Đã tạo dự án. Học sinh nhận thông báo trong hộp tin.");
        onCreated?.(r.id);
      }
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
          <DialogTitle className="font-display text-2xl font-extrabold">{edit ? "Sửa dự án STEM" : "Tạo dự án STEM"}</DialogTitle>
          <DialogDescription>Mỗi tổ là một nhóm dự án, làm theo 6 bước: Xác định vấn đề → Ý tưởng → Kế hoạch → Chế tạo → Thử nghiệm → Trình bày (bằng tiếng Anh).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!edit && (
            <label className="block">
              <FieldLabel>Lớp</FieldLabel>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className={SELECT}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} · {c.settings?.teams ?? 4} tổ
                  </option>
                ))}
              </select>
            </label>
          )}
          {!edit && templates.length > 0 && (
            <label className="block">
              <FieldLabel hint={`${templates.length} mẫu cho lớp ${grade} — chọn rồi sửa tự do`}>Dùng mẫu dự án</FieldLabel>
              <select
                value={tplId}
                onChange={(e) => {
                  setTplId(e.target.value);
                  const t = templates.find((x) => x.id === e.target.value);
                  if (t) setV({ title: t.title, goal: t.goal, brief: t.brief, materials: t.materials, grade: t.grade, curLessonId: t.curLessonId ?? null, vocab: t.vocab });
                }}
                className={SELECT}
              >
                <option value="">— Tự soạn dự án mới —</option>
                {groups.map((g) => (
                  <optgroup key={g.l.id} label={`Bài ${g.l.no}. ${g.l.vi}`}>
                    {g.list.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title.vi}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {other.length > 0 && (
                  <optgroup label={otherGrade ? `Mẫu lớp ${tpl!.grade}` : "Khác"}>
                    {other.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title.vi}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
          )}
          {otherGrade && (
            <p className="rounded-2xl bg-sun-soft p-3 text-sm text-[#8A5A00]">
              Mẫu này soạn cho <b>lớp {tpl!.grade}</b>, còn lớp đang chọn là <b>lớp {cls!.grade}</b>. Thầy cô vẫn tạo được (nội dung giữ nguyên) nhưng cần chọn lại Bài SGK của lớp {cls!.grade}, hoặc chọn một lớp {tpl!.grade} ở trên.
            </p>
          )}
          <label className="block">
            <FieldLabel>Bài SGK</FieldLabel>
            <select value={v.curLessonId ?? ""} onChange={(e) => set({ curLessonId: e.target.value || null })} className={SELECT}>
              <option value="">— Không gắn bài —</option>
              {chaptersOf(grade).map((c) => (
                <optgroup key={c.id} label={`Chương ${c.no}. ${c.vi}`}>
                  {c.lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Bài {l.no}. {l.vi}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <BiField label="Tên dự án" value={v.title} onChange={(title) => set({ title })} />
          <BiField label="Mục tiêu" area value={v.goal} onChange={(goal) => set({ goal })} />
          <BiField label="Yêu cầu sản phẩm" area rows={3} value={v.brief} onChange={(brief) => set({ brief })} />
          <TextField label="Vật liệu gợi ý (nhắc an toàn khi dùng dụng cụ sắc nhọn)" area value={v.materials} onChange={(materials) => set({ materials })} maxLength={600} />
          <div>
            <FieldLabel hint="học sinh có nút nghe phát âm">Từ vựng dự án</FieldLabel>
            <div className="space-y-2">
              {v.vocab.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={w.en} onChange={(e) => set({ vocab: v.vocab.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)) })} placeholder="English" className={`${INPUT} font-semibold text-blue-dk`} />
                  <input value={w.vi} onChange={(e) => set({ vocab: v.vocab.map((x, j) => (j === i ? { ...x, vi: e.target.value } : x)) })} placeholder="Tiếng Việt" className={`${INPUT} text-ink-2 italic`} />
                  <Button variant="ghost" size="icon-sm" aria-label="Xoá từ" onClick={() => set({ vocab: v.vocab.filter((_, j) => j !== i) })}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {v.vocab.length < 12 && (
                <Button size="xs" variant="outline" onClick={() => set({ vocab: [...v.vocab, { en: "", vi: "" }] })}>
                  <Plus /> Thêm từ
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <FieldLabel>Hạn nộp — ngày</FieldLabel>
              <input type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} className={INPUT} />
            </label>
            <label>
              <FieldLabel>Giờ</FieldLabel>
              <input type="time" value={due.time} onChange={(e) => setDue({ ...due, time: e.target.value })} className={INPUT} />
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={save} disabled={busy || (!edit && !cls)}>
            {busy && <Loader2 className="animate-spin" />} {edit ? "Lưu" : "Tạo dự án"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
