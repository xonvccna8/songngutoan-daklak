"use client";

// Thêm / sửa học liệu (link) — gắn với khối và bài SGK
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BiField, FieldLabel, SELECT, TextField } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";
import { chaptersOf, curLesson, GRADES } from "@/lib/curriculum";
import { RESOURCE_KINDS, sanitizeResource, type ResourceDoc, type ResourceInput, type ResourceKind } from "@/lib/library/resources";

const empty = (grade = 8, curLessonId: string | null = null): ResourceInput => ({ kind: "geogebra", title: { vi: "", en: "" }, url: "", grade, curLessonId, note: "" });

export function ResourceDialog({
  open,
  onOpenChange,
  edit,
  preset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  edit?: ResourceDoc;
  /** Mở từ một bài trong khung chương trình → chọn sẵn bài */
  preset?: { grade: number; curLessonId: string | null };
}) {
  const [v, setV] = useState<ResourceInput>(() => (edit ? { kind: edit.kind, title: edit.title, url: edit.url, grade: edit.grade, curLessonId: edit.curLessonId, note: edit.note } : empty(preset?.grade, preset?.curLessonId)));
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<ResourceInput>) => setV((x) => ({ ...x, ...p }));

  async function save() {
    const check = sanitizeResource(v);
    if (typeof check === "string") return toast.error(check);
    setBusy(true);
    try {
      if (edit) await api(`/api/resources/${edit.id}`, { method: "PUT", body: v });
      else await api("/api/resources", { body: v });
      toast.success(edit ? "Đã lưu học liệu." : "Đã thêm học liệu. Học liệu cần quản trị duyệt trước khi học sinh thấy.");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const l = curLesson(v.curLessonId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">{edit ? "Sửa học liệu" : "Thêm học liệu"}</DialogTitle>
          <DialogDescription>Chỉ lưu đường liên kết (không tải file lên). Ghi rõ nguồn, chỉ dùng tài liệu được phép chia sẻ.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <FieldLabel>Loại học liệu</FieldLabel>
            <select value={v.kind} onChange={(e) => set({ kind: e.target.value as ResourceKind })} className={SELECT}>
              {(Object.keys(RESOURCE_KINDS) as ResourceKind[]).map((k) => (
                <option key={k} value={k}>
                  {RESOURCE_KINDS[k].vi}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-ink-2">{RESOURCE_KINDS[v.kind].hint}</span>
          </label>
          <TextField label="Đường liên kết (https://…)" value={v.url} onChange={(url) => set({ url })} placeholder="https://www.geogebra.org/m/…" maxLength={500} />
          <BiField label="Tên học liệu" value={v.title} onChange={(title) => set({ title })} placeholder={{ vi: "Định lí Pythagore — hình động", en: "Pythagoras' theorem — animation" }} />
          <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
            <label>
              <FieldLabel>Khối</FieldLabel>
              <select value={v.grade} onChange={(e) => set({ grade: Number(e.target.value), curLessonId: null })} className={SELECT}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Bài trong SGK</FieldLabel>
              <select value={v.curLessonId ?? ""} onChange={(e) => set({ curLessonId: e.target.value || null })} className={SELECT}>
                <option value="">— Dùng chung cho cả khối —</option>
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
          {l && <p className="text-xs text-ink-2">Học sinh sẽ thấy học liệu này ở phần “Xem trước” của Bài {l.no} (sau khi được duyệt).</p>}
          <TextField label="Ghi chú (nguồn, cách dùng)" area value={v.note} onChange={(note) => set({ note })} maxLength={500} placeholder="Nguồn: GeoGebra (tác giả …). Dùng ở Hoạt động 2." />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
