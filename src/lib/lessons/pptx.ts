"use client";

// Xuất bài giảng GV tự soạn (trình soạn bài) ra PowerPoint song ngữ — để chiếu khi lớp không dùng điện thoại,
// hoặc nộp kèm giáo án. Mỗi câu hỏi có trang đề + trang đáp án; lời giảng/ghi chú của GV nằm ở phần Notes.
import { curLesson } from "@/lib/curriculum";
import { ACTIVITIES, FOUR_C, activityOf, kindOf, type EditorSlide, type LessonMeta } from "@/lib/lessons/editor";
import { defaultShow } from "@/lib/live/grading";
import type { Bi, Block, FigureId } from "@/lib/live/types";
import { sentenceSlides, vocabSlides } from "@/lib/notebook/pptx";
import { BODY, C, CW, FONT, X0, answerBox, bullets, choiceBoxes, closing, cover, downloadDeck, frame, newDeck, paginate, safeName, type Ctx, type Run } from "@/lib/pptx/kit";

const FIGURE_NAME: Record<FigureId, string> = {
  "triangle-abc": "Tam giác ABC · Triangle ABC",
  "right-triangle": "Tam giác vuông · Right triangle",
  "pythagoras-squares": "Định lí Pythagore · Pythagoras' theorem",
  "coordinate-plane": "Mặt phẳng toạ độ · Coordinate plane",
  "similar-triangles": "Tam giác đồng dạng · Similar triangles",
};

/** Một dòng song ngữ: tiếng Anh (chính) + tiếng Việt nghiêng xám */
const biRuns = (b: Bi, size = 22, prefix = ""): Run[] => {
  const out: Run[] = [];
  if (b.en) out.push({ text: prefix + b.en, options: { fontSize: size, color: C.ink, bold: false, breakLine: !!b.vi } });
  if (b.vi) out.push({ text: (b.en ? "" : prefix) + b.vi, options: { fontSize: Math.round(size * 0.78), italic: true, color: C.grey } });
  return out;
};

/** Các dòng chữ của khối nội dung theo thứ tự hiện */
function blockItems(blocks: Block[]): Run[][] {
  const out: Run[][] = [];
  blocks.forEach((b) => {
    if (b.kind === "cols") out.push(...blockItems(b.left), ...blockItems(b.right));
    else if (b.kind === "goals") b.items.forEach((x) => out.push(biRuns(x, 20)));
    else if (b.kind === "steps") b.items.forEach((x) => out.push(biRuns(x.text, 20)));
    else if (b.kind === "ipa") out.push([{ text: b.items.map((i) => `${i.word} ${i.ipa}`).join("   ·   "), options: { fontSize: 20, color: C.greenDk, bold: true } }]);
    else if (b.kind === "figure") out.push([{ text: `[Hình: ${FIGURE_NAME[b.figure] ?? b.figure} — chiếu hình động trên web Lớp Song Ngữ]`, options: { fontSize: 16, italic: true, color: C.grey } }]);
    else if (b.kind === "join") out.push([{ text: "Mở web Lớp Song Ngữ trên điện thoại để vào lớp · Join the class", options: { fontSize: 18, color: C.greenDk } }]);
    else if ("text" in b) {
      const tag = b.kind === "box" && b.tag ? `${b.tag}: ` : "";
      const runs = biRuns(b.text, b.kind === "hero" ? 28 : 22, tag);
      if ((b.kind === "box" && b.highlight) || b.kind === "hero") runs.forEach((r) => r.options && r.text && (r.options.bold = r.options.italic ? false : true));
      if (runs.length) out.push(runs);
    }
  });
  return out;
}

/** Chiều cao ước lượng (đơn vị = 1 dòng cỡ 22pt): chữ nhỏ thì vừa nhiều chữ hơn/dòng và dòng thấp hơn */
const itemLen = (runs: Run[]) =>
  runs.reduce((t, r) => {
    const size = Number(r.options?.fontSize ?? 22);
    return t + Math.max(1, Math.ceil(((r.text ?? "").length * size) / (88 * 22))) * (size / 22);
  }, 0.35);

/** Trang ít chữ → phóng to cho dễ đọc trên tivi (tối đa ×1.3) */
const scaled = (page: Run[][]): Run[][] => {
  const total = page.reduce((t, x) => t + itemLen(x), 0);
  const k = total < 4 ? 1.3 : total < 7 ? 1.15 : 1;
  return k === 1 ? page : page.map((runs) => runs.map((r) => ({ ...r, options: { ...r.options, fontSize: Math.round(Number(r.options?.fontSize ?? 22) * k) } })));
};

const notesOf = (s: EditorSlide, extra = "") =>
  [...s.key.notes.map((n) => [n.vi && `GV: ${n.vi}`, n.en && `“${n.en}”`].filter(Boolean).join(" ")), extra].filter(Boolean).join("\n");

/** Trang nội dung (chia nhiều trang nếu dài). Trả về false nếu trang không có chữ nào */
function contentSlides(c: Ctx, s: EditorSlide, tag: string, title: Bi): boolean {
  const items = blockItems(s.blocks);
  if (!items.length) return false;
  const pages = paginate(items, itemLen, 12);
  pages.forEach((page, pi) => {
    const sl = frame(c, `${title.vi || title.en}${pages.length > 1 ? ` (${pi + 1}/${pages.length})` : ""}`, title.vi ? title.en : "", tag, notesOf(s));
    sl.addText(bullets(scaled(page)), { ...BODY, fontFace: FONT, valign: "top", fit: "shrink" });
  });
  return true;
}

const promptRuns = (p: Bi): Run[] => [
  { text: p.en || p.vi, options: { fontSize: 24, bold: true, color: C.ink, breakLine: !!(p.en && p.vi) } },
  ...(p.en && p.vi ? [{ text: p.vi, options: { fontSize: 18, italic: true, color: C.grey } }] : []),
];

function questionSlides(c: Ctx, s: EditorSlide, tag: string, title: Bi, no: number) {
  const q = s.question!;
  const kind = kindOf(s);
  const explain = s.key.explain && (s.key.explain.en || s.key.explain.vi) ? s.key.explain : null;
  const name = `Câu ${no}`;
  const answerText = q.type === "mcq" && s.key.answer != null ? `${"ABCD"[s.key.answer]}. ${q.options?.[s.key.answer]?.en ?? ""}` : (s.key.show ?? defaultShow(q, s.key) ?? "");

  [false, true].forEach((reveal) => {
    if (reveal && !answerText && !explain) return;
    const sl = frame(
      c,
      `${name}${reveal ? " — Đáp án" : ""}${title.vi ? ` · ${title.vi}` : ""}`,
      reveal ? "Answer" : title.en || "Question",
      tag,
      reveal ? notesOf(s, `Đáp án: ${answerText}${explain ? `\nGiải thích: ${explain.vi} / ${explain.en}` : ""}`) : notesOf(s, `HS trả lời trên điện thoại (${q.time} giây) hoặc giơ thẻ. Teacher: "You have ${q.time} seconds."`)
    );
    if (q.type === "mcq") {
      const opts = (q.options ?? []).map((o): Run[] => [
        { text: o.en, options: { fontSize: kind === "tf" ? 26 : 20, color: C.ink, breakLine: !!(o.vi && o.vi !== o.en) } },
        ...(o.vi && o.vi !== o.en ? [{ text: o.vi, options: { fontSize: 15, italic: true, color: C.grey } }] : []),
      ]);
      choiceBoxes(c, sl, promptRuns(q.prompt), opts, s.key.answer, reveal);
    } else if (q.type === "label") {
      sl.addText(promptRuns(q.prompt), { x: X0, y: 1.85, w: CW, h: 1.1, fontFace: FONT, valign: "middle", fit: "shrink" });
      const labels = q.options ?? [];
      const rows: Run[][] = (q.targets ?? []).map((t, j) => {
        const lab = reveal && s.key.order ? labels[s.key.order[j]] : undefined;
        return [
          { text: `Ô ${j + 1}: ${t.vi || t.en}  →  `, options: { fontSize: 20, color: C.ink } },
          { text: lab ? lab.en : "……………", options: { fontSize: 20, bold: !!lab, color: lab ? C.green : C.grey } },
        ];
      });
      sl.addText(bullets(rows, { bullet: false }), { x: X0, y: 3.05, w: CW, h: 2.6, fontFace: FONT, valign: "top", fit: "shrink" });
      sl.addText(`Nhãn · Labels: ${labels.map((l) => l.en).join("   •   ")}`, { x: X0, y: 5.75, w: CW, h: 0.6, fontFace: FONT, fontSize: 16, bold: true, color: C.greenDk, fill: { color: C.greenSoft }, align: "center", valign: "middle" });
    } else {
      // Nhập số / gõ chữ
      sl.addText(promptRuns(q.prompt), { x: X0, y: 1.85, w: CW, h: 2.0, fontFace: FONT, valign: "middle", fit: "shrink" });
      if (reveal) answerBox(c, sl, "Đáp án:", answerText || "—");
      else answerBox(c, sl, q.type === "number" ? "Em tính được:" : "Em viết:", `…………………${q.unit ? ` ${q.unit}` : ""}`);
    }
    if (reveal && explain && q.type !== "number" && q.type !== "text") {
      // Giải thích đặt ở chân trang đáp án (trắc nghiệm, kéo nhãn) — các dạng khác đã có ô đáp án lớn
      sl.addText(biRuns(explain, 17), { x: X0, y: 6.4, w: CW, h: 0.65, fontFace: FONT, valign: "middle", fit: "shrink" });
    } else if (reveal && explain) {
      sl.addText(biRuns(explain, 18), { x: X0, y: 5.65, w: CW, h: 1.2, fontFace: FONT, valign: "top", fit: "shrink" });
    }
  });
}

function speakSlide(c: Ctx, s: EditorSlide, tag: string, title: Bi) {
  const sl = frame(c, title.vi || "Luyện nói", title.en || "Speaking", tag, notesOf(s, `GV đọc mẫu 2 lần, cả lớp đọc theo; HS đọc to trên điện thoại để máy chấm phát âm (${s.speak!.time} giây).`));
  sl.addShape(c.pptx.ShapeType.roundRect, { x: X0, y: 2.3, w: CW, h: 2.6, fill: { color: C.white }, line: { color: C.green, width: 2 }, rectRadius: 0.1 });
  sl.addText([{ text: `“${s.speak!.target}”`, options: { fontSize: 34, bold: true, color: C.greenDk } }], { x: X0 + 0.4, y: 2.3, w: CW - 0.8, h: 2.6, fontFace: FONT, align: "center", valign: "middle", fit: "shrink" });
  sl.addText("Read aloud · Đọc to câu trên", { x: X0, y: 5.2, w: CW, h: 0.5, fontFace: FONT, fontSize: 18, color: C.grey, align: "center" });
}

function objectivesSlide(c: Ctx, meta: LessonMeta) {
  const items: Run[][] = FOUR_C.filter((k) => meta.objectives[k.key]?.en || meta.objectives[k.key]?.vi).map((k) => [
    { text: `${k.vi} (${k.en}): `, options: { fontSize: 18, bold: true, color: C.green } },
    { text: meta.objectives[k.key].vi || meta.objectives[k.key].en, options: { fontSize: 18, color: C.ink, breakLine: !!(meta.objectives[k.key].vi && meta.objectives[k.key].en) } },
    ...(meta.objectives[k.key].vi && meta.objectives[k.key].en ? [{ text: meta.objectives[k.key].en, options: { fontSize: 15, italic: true, color: C.grey } }] : []),
  ]);
  if (!items.length) return;
  const s = frame(c, "Mục tiêu bài học", "Learning goals (4C)", undefined, `Teacher: "By the end of this lesson, you will be able to…"`);
  s.addText(bullets(items), { ...BODY, fontFace: FONT, valign: "top", fit: "shrink" });
}

export async function buildEditorPptx(meta: LessonMeta, slides: EditorSlide[], teacher: string) {
  const cur = curLesson(meta.curLessonId);
  const title = meta.title.vi || meta.title.en || "Bài giảng";
  const c = await newDeck(`${title}${meta.title.en ? ` — ${meta.title.en}` : ""}`, `${meta.subject} ${meta.grade} · ${title} · Lớp Song Ngữ`, `${meta.subject} ${meta.grade} — bài giảng song ngữ Việt – Anh`);

  cover(c, {
    kicker: `${meta.subject} ${meta.grade}${cur ? ` · Bài ${cur.no} SGK` : ""}`,
    vi: meta.title.vi,
    en: meta.title.en,
    badge: "Bài giảng song ngữ Việt – Anh",
    sub: `${teacher ? `GV: ${teacher} · ` : ""}${meta.duration} phút · Lớp Song Ngữ`,
    notes: `Teacher: "Good morning, class! Today's lesson: ${meta.title.en}." — Hôm nay: ${meta.title.vi}.`,
  });
  objectivesSlide(c, meta);
  if (meta.terms.length) vocabSlides(c, meta.terms);

  let qNo = 0;
  slides.forEach((s, i) => {
    const a = ACTIVITIES[activityOf(s, i, slides.length) - 1];
    const tag = `Hoạt động ${a.n}. ${a.vi} · ${a.en}`;
    if (s.question) {
      // Trang câu hỏi có thêm nội dung (đoạn đọc, hình) → chiếu nội dung trước
      contentSlides(c, s, tag, s.title);
      questionSlides(c, s, tag, s.title, ++qNo);
    } else if (s.speak) {
      contentSlides(c, s, tag, s.title);
      speakSlide(c, s, tag, s.title);
    } else if (!contentSlides(c, s, tag, s.title)) {
      // Trang trống nội dung (vd chỉ có tiêu đề) vẫn giữ để đúng trình tự tiết dạy
      frame(c, s.title.vi || s.title.en || `Trang ${i + 1}`, s.title.vi ? s.title.en : "", tag, notesOf(s));
    }
  });

  // Câu luyện nói của cả tiết → 1 cụm trang ôn lại cuối bài
  const speaks = slides.filter((s) => s.speak?.target).map((s) => ({ en: s.speak!.target, vi: "" }));
  if (speaks.length > 1) sentenceSlides(c, speaks);
  closing(c, "Mở web Lớp Song Ngữ → Tự học: làm bài về nhà, ôn từ vựng và chơi Trò chơi ôn tập.", "Dặn dò bài về nhà.");
  return c;
}

/** Tạo file .pptx và tải về máy */
export async function downloadEditorPptx(meta: LessonMeta, slides: EditorSlide[], teacher: string) {
  const c = await buildEditorPptx(meta, slides, teacher);
  await downloadDeck(c, `Bai giang - ${safeName(meta.title.vi || meta.title.en || "bai giang")}.pptx`);
}
