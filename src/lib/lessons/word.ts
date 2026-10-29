"use client";

// GĐ 6 — Xuất kế hoạch bài dạy ra Word theo khung CV 5512 (tạo ngay trên trình duyệt, không gửi đi đâu)
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { ACTIVITIES, FOUR_C, KIND_META, activityOf, kindOf, type EditorSlide, type LessonMeta } from "@/lib/lessons/editor";
import { defaultShow } from "@/lib/live/grading";
import type { Bi, Block } from "@/lib/live/types";

const FONT = "Times New Roman";

const p = (text: string, o: { bold?: boolean; italics?: boolean; center?: boolean; size?: number; indent?: boolean } = {}) =>
  new Paragraph({
    alignment: o.center ? AlignmentType.CENTER : undefined,
    indent: o.indent ? { left: 360 } : undefined,
    spacing: { after: 60 },
    children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size, font: FONT })],
  });

/** Dòng song ngữ: tiếng Việt thẳng, tiếng Anh nghiêng (giáo án nộp cho tổ là tiếng Việt) */
const biLines = (b: Bi | undefined, indent = false): Paragraph[] => {
  if (!b) return [];
  const out: Paragraph[] = [];
  if (b.vi) out.push(p(b.vi, { indent }));
  if (b.en) out.push(p(b.en, { italics: true, indent }));
  return out;
};

const label = (k: string, v: string) =>
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: k, bold: true, font: FONT }), new TextRun({ text: v, font: FONT })] });

/** Chữ của các khối nội dung, theo thứ tự hiện */
function blockText(blocks: Block[]): Bi[] {
  const out: Bi[] = [];
  blocks.forEach((b) => {
    if (b.kind === "cols") out.push(...blockText(b.left), ...blockText(b.right));
    else if (b.kind === "goals") out.push(...b.items);
    else if (b.kind === "steps") out.push(...b.items.map((i) => i.text));
    else if (b.kind === "ipa") out.push({ en: b.items.map((i) => `${i.word} ${i.ipa}`).join(" · "), vi: "" });
    else if (b.kind === "figure") out.push({ en: "", vi: "[Hình vẽ minh hoạ]" });
    else if ("text" in b) out.push({ en: (b.kind === "box" && b.tag ? `${b.tag}: ` : "") + b.text.en, vi: b.text.vi });
  });
  return out;
}

const cell = (children: Paragraph[], width: number, shade = false) =>
  new TableCell({ width: { size: width, type: WidthType.PERCENTAGE }, shading: shade ? { fill: "EDEDF5" } : undefined, children: children.length ? children : [p("")] });

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER };

function slideRow(s: EditorSlide, i: number): TableRow {
  const kind = kindOf(s);
  const gv: Paragraph[] = [p(`Trang ${i + 1} · ${KIND_META[kind].label}`, { bold: true })];
  s.key.notes.forEach((n) => {
    if (n.vi) gv.push(p(`GV: ${n.vi}`));
    if (n.en) gv.push(p(`“${n.en}”`, { italics: true }));
  });
  const q = s.question;
  if (q) {
    gv.push(p(`HS trả lời trên điện thoại (${q.time} giây).`));
    const ans = q.type === "mcq" && s.key.answer != null ? `${"ABCD"[s.key.answer]}. ${q.options?.[s.key.answer]?.en ?? ""}` : (s.key.show ?? defaultShow(q, s.key));
    if (ans) gv.push(p(`Đáp án: ${ans}`, { bold: true }));
  }
  if (s.speak) gv.push(p(`HS luyện đọc to câu mẫu (${s.speak.time} giây), máy chấm phát âm.`));
  if (s.phonesDown) gv.push(p("HS úp điện thoại, nghe giảng."));

  const nd: Paragraph[] = [];
  if (s.title.vi) nd.push(p(s.title.vi, { bold: true }));
  if (s.title.en) nd.push(p(s.title.en, { bold: true, italics: true }));
  blockText(s.blocks).forEach((b) => nd.push(...biLines(b, true)));
  if (q) {
    nd.push(...biLines(q.prompt, true));
    if (q.type === "mcq") q.options?.forEach((o, j) => nd.push(p(`${"ABCD"[j]}. ${o.en}${o.vi && o.vi !== o.en ? ` (${o.vi})` : ""}`, { indent: true })));
    if (q.type === "label") {
      q.targets?.forEach((t, j) => nd.push(p(`Ô ${j + 1}: ${t.vi || t.en}`, { indent: true })));
      nd.push(p(`Nhãn: ${(q.options ?? []).map((o) => o.en).join(" · ")}`, { indent: true }));
    }
  }
  if (s.speak?.target) nd.push(p(`“${s.speak.target}”`, { italics: true, indent: true }));
  if (s.key.explain) nd.push(p("Giải thích:", { bold: true }), ...biLines(s.key.explain, true));
  return new TableRow({ children: [cell(gv, 45), cell(nd, 55)] });
}

export function buildLessonDoc(meta: LessonMeta, slides: EditorSlide[], teacher: string): Document {
  const body: (Paragraph | Table)[] = [];
  body.push(
    p(`Trường: ……………………………   Tổ: ……………………………`),
    p(`Họ và tên giáo viên: ${teacher}`),
    p("KẾ HOẠCH BÀI DẠY", { bold: true, center: true, size: 30 }),
    p(`${meta.title.vi.toUpperCase()}`, { bold: true, center: true, size: 28 }),
    p(meta.title.en, { italics: true, center: true }),
    p(`Môn học: ${meta.subject}; lớp: ${meta.grade} — dạy song ngữ Việt – Anh`, { center: true }),
    p(`Thời gian thực hiện: 1 tiết (${meta.duration} phút)`, { center: true })
  );

  body.push(p("I. MỤC TIÊU (khung 4C)", { bold: true }));
  FOUR_C.forEach((c, i) => {
    body.push(p(`${i + 1}. ${c.vi} (${c.en})`, { bold: true }), ...biLines(meta.objectives[c.key], true));
  });

  body.push(p("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", { bold: true }));
  (meta.equipment || "Tivi/máy chiếu, laptop của GV, điện thoại của HS (truy cập web Lớp Song Ngữ).").split("\n").forEach((l) => body.push(p(`- ${l}`, { indent: true })));
  if (meta.terms.length) {
    body.push(p("Thuật ngữ song ngữ của bài:", { bold: true }));
    body.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders,
        rows: [
          new TableRow({ tableHeader: true, children: [cell([p("Tiếng Anh", { bold: true })], 35, true), cell([p("Phiên âm", { bold: true })], 30, true), cell([p("Tiếng Việt", { bold: true })], 35, true)] }),
          ...meta.terms.map((t) => new TableRow({ children: [cell([p(t.en)], 35), cell([p(t.ipa)], 30), cell([p(t.vi)], 35)] })),
        ],
      })
    );
  }

  body.push(p("III. TIẾN TRÌNH DẠY HỌC", { bold: true }));
  ACTIVITIES.forEach((a, ai) => {
    const list = slides.map((s, i) => ({ s, i })).filter(({ s, i }) => activityOf(s, i, slides.length) === a.n);
    const plan = meta.activities[ai];
    body.push(p(`Hoạt động ${a.n}: ${a.vi} (${a.en})`, { bold: true }));
    body.push(label("a) Mục tiêu: ", plan?.goal || "……………………………"));
    body.push(label("b) Nội dung: ", list.length ? list.map(({ s, i }) => `trang ${i + 1} — ${s.title.vi || s.title.en}`).join("; ") : "……………………………"));
    body.push(label("c) Sản phẩm: ", plan?.product || "……………………………"));
    body.push(label("d) Tổ chức thực hiện:", ""));
    if (list.length) {
      body.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders,
          rows: [
            new TableRow({ tableHeader: true, children: [cell([p("Hoạt động của GV và HS", { bold: true })], 45, true), cell([p("Nội dung trình chiếu (song ngữ)", { bold: true })], 55, true)] }),
            ...list.map(({ s, i }) => slideRow(s, i)),
          ],
        })
      );
    }
  });

  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 26 } } } },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 850 } } }, children: body }],
  });
}

/** Tạo file .docx và tải về máy */
export async function downloadLessonDoc(meta: LessonMeta, slides: EditorSlide[], teacher: string) {
  const blob = await Packer.toBlob(buildLessonDoc(meta, slides, teacher));
  const name = (meta.title.vi || "giao-an").replace(/[\\/:*?"<>|]+/g, "").slice(0, 80);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `KHBD - ${name}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
