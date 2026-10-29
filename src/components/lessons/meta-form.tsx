"use client";

// Thông tin tiết + bài SGK (khung chương trình) + mục tiêu 4C + mục tiêu/sản phẩm từng hoạt động (dùng khi xuất giáo án CV 5512)
import { BiField, FieldLabel, INPUT, SELECT, Section, TextField } from "@/components/lessons/fields";
import { ACTIVITIES, FOUR_C, type LessonMeta } from "@/lib/lessons/editor";
import { BOOK, chaptersOf, curLesson, GRADES, STRANDS } from "@/lib/curriculum";
import { PHASES } from "@/lib/live/timeline";
import { SUBJECT } from "@/lib/subject";

export function MetaForm({ meta, onChange }: { meta: LessonMeta; onChange: (m: LessonMeta) => void }) {
  const set = (p: Partial<LessonMeta>) => onChange({ ...meta, ...p });
  const cur = curLesson(meta.curLessonId);
  return (
    <div className="space-y-4">
      <Section title="Thông tin bài">
        <BiField label="Tên bài" value={meta.title} onChange={(title) => set({ title })} placeholder={{ en: "Pythagoras' theorem", vi: "Định lí Pythagore" }} />
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
          <TextField label="Dòng phụ trên tivi" value={meta.subtitle} onChange={(subtitle) => set({ subtitle })} placeholder="Toán 8 · Hình học" maxLength={200} />
          {/* Môn cố định "Toán" (trang KHTN dùng chung Firebase dựa vào đây để ẩn tiết Toán) */}
          <label>
            <FieldLabel>Môn</FieldLabel>
            <p className={`${INPUT} flex items-center bg-paper font-bold`}>{SUBJECT.vi}</p>
          </label>
          <label>
            <FieldLabel>Khối</FieldLabel>
            <select
              value={meta.grade}
              // Đổi khối → bỏ gắn bài SGK của khối cũ
              onChange={(e) => set({ grade: Number(e.target.value), ...(cur && cur.grade !== Number(e.target.value) ? { curLessonId: null } : {}) })}
              className={SELECT}
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
          </label>
          <label>
            <FieldLabel>Số phút</FieldLabel>
            <input type="number" min={5} max={180} value={meta.duration} onChange={(e) => set({ duration: Number(e.target.value) || 45 })} className={INPUT} />
          </label>
        </div>
        {/* Đợt B — phân bổ thời gian cho thanh thời gian trên laptop GV */}
        <div>
          <FieldLabel>
            Phân bổ thời gian (phút) · tổng {meta.timing.reduce((a, b) => a + b, 0)}/{meta.duration}
          </FieldLabel>
          <div className="grid grid-cols-5 gap-2">
            {PHASES.map((p, i) => (
              <label key={p.id} className="text-xs text-ink-2">
                {p.vi}
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={meta.timing[i]}
                  onChange={(e) => set({ timing: meta.timing.map((m, j) => (j === i ? Math.max(0, Math.min(90, Number(e.target.value) || 0)) : m)) })}
                  className={INPUT}
                />
              </label>
            ))}
          </div>
        </div>
        <TextField label="Thiết bị dạy học và học liệu" hint="mỗi dòng một ý" area rows={3} value={meta.equipment} onChange={(equipment) => set({ equipment })} placeholder="Tivi, laptop; điện thoại của HS; thước, ê ke, compa; GeoGebra…" />
      </Section>

      <Section title={`Bài trong SGK · ${BOOK.vi}`}>
        <label className="block">
          <FieldLabel>Gắn với bài (để tính Sao thành thạo theo yêu cầu cần đạt và hiện học liệu cho học sinh)</FieldLabel>
          <select value={meta.curLessonId ?? ""} onChange={(e) => set({ curLessonId: e.target.value || null })} className={SELECT}>
            <option value="">— Chưa gắn —</option>
            {chaptersOf(meta.grade).map((c) => (
              <optgroup key={c.id} label={`Chương ${c.no}. ${c.vi} (${STRANDS[c.strand].vi})`}>
                {c.lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    Bài {l.no}. {l.vi}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {cur && (
          <div className="rounded-2xl bg-paper/60 p-3">
            <p className="text-sm font-extrabold">
              Yêu cầu cần đạt <span className="text-en font-semibold">· Learning outcomes</span>
            </p>
            {cur.outcomes.length ? (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {cur.outcomes.map((o) => (
                  <li key={o.id}>
                    {o.vi} <span className="text-en text-xs">· {o.en}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-ink-2">Bài này chưa có danh sách yêu cầu cần đạt trong khung chương trình (sẽ bổ sung).</p>
            )}
            {cur.outcomes.length > 0 && <p className="mt-2 text-xs text-ink-2">Ở từng câu hỏi, đánh dấu câu đó đo yêu cầu nào.</p>}
          </div>
        )}
      </Section>

      <Section title="Mục tiêu theo khung 4C">
        {FOUR_C.map((c) => (
          <BiField key={c.key} label={`${c.vi} · ${c.en}`} hint={c.hint} value={meta.objectives[c.key]} onChange={(v) => set({ objectives: { ...meta.objectives, [c.key]: v } })} area />
        ))}
      </Section>

      <Section title="Tiến trình dạy học (CV 5512)">
        <p className="text-xs text-ink-2">Mục “Nội dung” và “Tổ chức thực hiện” của mỗi hoạt động được lấy tự động từ các trang khi xuất Word.</p>
        {ACTIVITIES.map((a, i) => (
          <div key={a.n} className="rounded-2xl bg-paper/60 p-3">
            <p className="mb-2 text-sm font-extrabold">
              Hoạt động {a.n}: {a.vi} <span className="text-en font-semibold">· {a.en}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="a) Mục tiêu" area value={meta.activities[i]?.goal ?? ""} onChange={(goal) => set({ activities: meta.activities.map((x, j) => (j === i ? { ...x, goal } : x)) })} />
              <TextField label="c) Sản phẩm" area value={meta.activities[i]?.product ?? ""} onChange={(product) => set({ activities: meta.activities.map((x, j) => (j === i ? { ...x, product } : x)) })} />
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}
