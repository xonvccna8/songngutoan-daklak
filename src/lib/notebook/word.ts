"use client";

// Xuất Vở ghi Toán ra Word (.docx) ngay trên trình duyệt: một bài hoặc cả quyển (các bài có vở ghi, lớp 6–9).
// Bản học sinh: có chỗ trống để làm bài. Bản giáo viên: kèm đáp án + gợi ý trả lời.
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { chapterOf, curLesson } from "@/lib/curriculum";
import { LETTERS, fillWordBox, noteOf, richParts, type VocabRow } from "@/lib/notebook";

const FONT = "Times New Roman";
const BLUE = "1F4E9A";

type RunOpts = { bold?: boolean; italics?: boolean; size?: number; color?: string; underline?: { color?: string } };
const run = (text: string, o: RunOpts = {}) => new TextRun({ text, font: FONT, ...o });

const p = (children: TextRun[] | string, o: { center?: boolean; indent?: number; after?: number; before?: number; pageBreak?: boolean; keepNext?: boolean } = {}) =>
  new Paragraph({
    alignment: o.center ? AlignmentType.CENTER : undefined,
    indent: o.indent ? { left: o.indent } : undefined,
    spacing: { after: o.after ?? 60, before: o.before },
    pageBreakBefore: o.pageBreak,
    keepNext: o.keepNext,
    children: typeof children === "string" ? [run(children)] : children,
  });

/** Chữ có **đậm** */
const rich = (s: string, base: RunOpts = {}) => richParts(s).map((x) => run(x.text, { ...base, bold: base.bold || x.bold }));

const heading = (text: string, en?: string) =>
  p([run(text, { bold: true, color: BLUE, size: 26 }), ...(en ? [run(`  ·  ${en}`, { italics: true, color: BLUE, size: 24 })] : [])], { before: 200, after: 80, keepNext: true });

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER };

const cell = (children: Paragraph[], width: number, shade?: string) =>
  new TableCell({ width: { size: width, type: WidthType.PERCENTAGE }, shading: shade ? { fill: shade } : undefined, children: children.length ? children : [p("")] });

function table(head: string[], rows: (string | TextRun[])[][], widths: number[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell([p([run(h, { bold: true })])], widths[i], "E8EEF8")) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell([p(typeof c === "string" ? rich(c) : c)], widths[i])) })),
    ],
  });
}

/** Khung 1 ô có nền (Ghi nhớ, Từ gợi ý) */
const box = (title: string, lines: Paragraph[], fill = "FFF6D6") =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ children: [cell([p([run(title, { bold: true })]), ...lines], 100, fill)] })],
  });

const dots = (n: number) => Array.from({ length: n }, () => p("…………………………………………………………………………………………………………………", { indent: 280 }));

export interface NotebookWordOpts {
  /** Kèm đáp án (bản giáo viên) */
  answers: boolean;
  /** Từ vựng từng bài (lấy từ ngân hàng thuật ngữ) */
  vocab: (lessonId: string) => VocabRow[];
}

function lessonBody(lessonId: string, o: NotebookWordOpts, first: boolean): (Paragraph | Table)[] {
  const l = curLesson(lessonId);
  const n = noteOf(lessonId);
  if (!l || !n) return [];
  const ch = chapterOf(lessonId);
  const out: (Paragraph | Table)[] = [];

  out.push(
    p([run(`Chương ${ch?.no}. ${ch?.vi ?? ""}`, { italics: true, size: 22, color: "666666" })], { center: true, pageBreak: !first }),
    p([run(`BÀI ${l.no}. ${l.vi.toUpperCase()}`, { bold: true, size: 32, color: BLUE })], { center: true, after: 20 }),
    p([run(`Lesson ${l.no}. ${l.en}`, { italics: true, size: 24 })], { center: true, after: 160 })
  );

  // Mục tiêu (YCCĐ)
  out.push(heading("MỤC TIÊU", "Learning goals"));
  l.outcomes.forEach((x) => out.push(p([run("• "), run(x.vi), run(` — ${x.en}`, { italics: true, color: "555555" })], { indent: 280 })));

  // I. Từ vựng
  const vocab = o.vocab(lessonId);
  out.push(heading("I. TỪ VỰNG", "Vocabulary"));
  out.push(table(["STT", "Tiếng Anh", "Phiên âm", "Tiếng Việt"], vocab.map((v, i) => [String(i + 1), [run(v.en, { bold: true, color: BLUE })], v.ipa, v.vi]), [8, 30, 27, 35]));

  // II. Lý thuyết
  out.push(heading("II. LÝ THUYẾT", "Theory"));
  n.theory.forEach((s, i) => {
    out.push(p([run(`${i + 1}. ${s.h}`, { bold: true }), run(` (${s.en})`, { italics: true })], { before: 100, keepNext: true }));
    s.points.forEach((pt) => out.push(p([run("– "), ...rich(pt)], { indent: 280 })));
    if (s.table) out.push(table(s.table.head, s.table.rows, s.table.head.map(() => Math.floor(100 / s.table!.head.length))), p("", { after: 40 }));
  });
  out.push(p("", { after: 40 }), box("★ GHI NHỚ · Remember", n.remember.map((r) => p([run("• "), ...rich(r)], { indent: 200 }))));

  // III. Câu tiếng Anh
  out.push(heading("III. CÂU TIẾNG ANH CẦN NHỚ", "Key sentences"));
  n.sentences.forEach((s, i) => out.push(p([run(`${i + 1}. `), run(s.en, { bold: true, color: BLUE }), run(` — ${s.vi}`, { italics: true })], { indent: 280 })));

  // IV. Bài tập
  out.push(heading("IV. BÀI TẬP", "Exercises"));
  out.push(p([run("Bài 1. Khoanh tròn chữ cái trước câu trả lời đúng.", { bold: true })], { keepNext: true }));
  n.mcq.forEach((q, i) => {
    out.push(p([run(`Câu ${i + 1}. `, { bold: true }), run(q.q)], { indent: 200, keepNext: true }));
    out.push(
      p(
        q.options.flatMap((opt, j) => [run(`${LETTERS[j]}. `, { bold: true }), run(opt, { bold: o.answers && j === q.answer, color: o.answers && j === q.answer ? "0A7A3A" : undefined }), run(j < 3 ? "      " : "")]),
        { indent: 480 }
      )
    );
  });
  if (o.answers) out.push(p([run("Đáp án: ", { bold: true, color: "0A7A3A" }), run(n.mcq.map((q, i) => `${i + 1}${LETTERS[q.answer]}`).join("   "), { color: "0A7A3A" })], { indent: 200 }));

  out.push(p([run("Bài 2. Ghi Đ (đúng) hoặc S (sai) vào ô trống.", { bold: true })], { before: 120, keepNext: true }));
  out.push(
    table(
      ["Nhận định", "Đ / S"],
      n.tf.map((t, i) => [`${i + 1}. ${t.q}`, o.answers ? [run(t.answer ? "Đ" : "S", { bold: true, color: "0A7A3A" })] : ""]),
      [86, 14]
    )
  );

  out.push(p([run("Bài 3. Điền từ tiếng Anh thích hợp vào chỗ trống. ", { bold: true }), run("Fill in the blanks.", { italics: true })], { before: 120, keepNext: true }));
  out.push(box("Từ gợi ý · Word box:", [p([run(fillWordBox(n).join("   •   "), { bold: true, color: BLUE })], { center: true })], "EEF4FF"));
  n.fill.forEach((f, i) => {
    const [a, b] = f.q.split("___");
    out.push(p([run(`${i + 1}. `), run(a), o.answers ? run(f.answer, { bold: true, color: "0A7A3A", underline: {} }) : run("…………………"), run(b ?? "")], { indent: 200, before: 60 }));
    out.push(p([run(f.vi, { italics: true, color: "666666", size: 22 })], { indent: 480 }));
  });

  out.push(p([run("Bài 4. Trả lời các câu hỏi sau.", { bold: true })], { before: 120, keepNext: true }));
  n.essay.forEach((e, i) => {
    out.push(p([run(`Câu ${i + 1}. `, { bold: true }), run(e.q)], { indent: 200, keepNext: true }));
    if (o.answers) out.push(p([run("Gợi ý: ", { bold: true, color: "0A7A3A" }), run(e.answer, { color: "0A7A3A" })], { indent: 480 }));
    else out.push(...dots(4));
  });
  return out;
}

export function buildNotebookDoc(lessonIds: string[], o: NotebookWordOpts): Document {
  const body: (Paragraph | Table)[] = [];
  body.push(
    p([run("VỞ GHI TOÁN THCS — SONG NGỮ VIỆT – ANH", { bold: true, size: 28 })], { center: true, after: 20 }),
    p([run("Bilingual Maths Notebook · Grades 6–9 · Kết nối tri thức với cuộc sống", { italics: true, size: 22 })], { center: true, after: 80 }),
    p(o.answers ? [run("BẢN GIÁO VIÊN (có đáp án)", { bold: true, color: "C0392B" })] : "Họ và tên: …………………………………………   Lớp: ……………", { center: true, after: 200 })
  );
  lessonIds.forEach((id, i) => body.push(...lessonBody(id, o, i === 0)));
  return new Document({
    creator: "Lớp Song Ngữ",
    title: "Vở ghi Toán THCS",
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1134, right: 1000 } } }, children: body }],
  });
}

/** Tạo file .docx và tải về máy */
export async function downloadNotebook(lessonIds: string[], o: NotebookWordOpts) {
  const blob = await Packer.toBlob(buildNotebookDoc(lessonIds, o));
  const one = lessonIds.length === 1 ? curLesson(lessonIds[0]) : undefined;
  const range = one ? `Toan ${one.grade} - Bai ${one.no}` : "Ca quyen";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Vo ghi Toan - ${range}${o.answers ? " (ban GV co dap an)" : ""}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
