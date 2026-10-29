"use client";

// Xuất đề song ngữ từ ngân hàng câu hỏi ra Word (tạo ngay trên trình duyệt): phần đề + bảng đặc tả + đáp án
import { AlignmentType, BorderStyle, Document, Packer, PageBreak, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { BANK_LEVELS, BANK_TYPES, answerText, type BankDoc } from "@/lib/bank/questions";
import { curLesson } from "@/lib/curriculum";

const FONT = "Times New Roman";
const p = (text: string, o: { bold?: boolean; italics?: boolean; center?: boolean; size?: number; indent?: boolean } = {}) =>
  new Paragraph({
    alignment: o.center ? AlignmentType.CENTER : undefined,
    indent: o.indent ? { left: 360 } : undefined,
    spacing: { after: 60 },
    children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size, font: FONT })],
  });
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER };
const cell = (text: string, bold = false) => new TableCell({ children: [p(text, { bold })] });

export function buildBankDoc(list: BankDoc[], title: string, withAnswers: boolean): Document {
  const body: (Paragraph | Table)[] = [
    p("Trường: ……………………………   Lớp: ………   Họ và tên: ……………………………"),
    p(title.toUpperCase(), { bold: true, center: true, size: 28 }),
    p("Bilingual practice — Đề song ngữ Việt – Anh", { italics: true, center: true }),
  ];
  list.forEach((q, i) => {
    body.push(p(`Câu ${i + 1} (${BANK_LEVELS[q.level].vi}). ${q.prompt.vi}`, { bold: true }));
    if (q.prompt.en) body.push(p(`Question ${i + 1}. ${q.prompt.en}`, { italics: true }));
    if (q.type === "mcq") q.options.forEach((o, j) => body.push(p(`${"ABCD"[j]}. ${o.en}${o.vi && o.vi !== o.en ? ` (${o.vi})` : ""}`, { indent: true })));
    if (q.type === "tf") body.push(p("☐ Đúng / True      ☐ Sai / False", { indent: true }));
    if (q.type === "number" || q.type === "text") body.push(p(`Trả lời / Answer: ……………………${q.unit ? ` ${q.unit}` : ""}`, { indent: true }));
    if (q.type === "speak") body.push(p(`Đọc to / Read aloud: “${q.speakTarget}”`, { italics: true, indent: true }));
  });

  if (withAnswers) {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(p("BẢNG ĐẶC TẢ VÀ ĐÁP ÁN", { bold: true, center: true, size: 28 }));
    body.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders,
        rows: [
          new TableRow({ tableHeader: true, children: ["Câu", "Bài SGK", "Dạng", "Mức độ", "Đáp án"].map((h) => cell(h, true)) }),
          ...list.map((q, i) => {
            const l = curLesson(q.curLessonId);
            return new TableRow({ children: [cell(String(i + 1)), cell(l ? `Bài ${l.no}. ${l.vi}` : `Lớp ${q.grade}`), cell(BANK_TYPES[q.type].vi), cell(BANK_LEVELS[q.level].vi), cell(answerText(q))] });
          }),
        ],
      })
    );
    list.forEach((q, i) => {
      if (q.explain.vi || q.explain.en) {
        body.push(p(`Câu ${i + 1}: ${q.explain.vi}`));
        if (q.explain.en) body.push(p(q.explain.en, { italics: true, indent: true }));
      }
    });
  }
  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 26 } } } },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 850 } } }, children: body }],
  });
}

export async function downloadBankDoc(list: BankDoc[], title: string, withAnswers = true) {
  const blob = await Packer.toBlob(buildBankDoc(list, title, withAnswers));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/[\\/:*?"<>|]+/g, "").slice(0, 80) || "De"}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
