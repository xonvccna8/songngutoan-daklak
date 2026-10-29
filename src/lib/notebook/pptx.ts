"use client";

// Bài giảng PowerPoint song ngữ cho từng bài Toán có Vở ghi, dựng từ Vở ghi ngay trên trình duyệt.
// Trình tự: bìa → mục tiêu → từ vựng → lý thuyết → ghi nhớ → câu tiếng Anh → luyện tập (đề + đáp án) → vận dụng → kết thúc.
// Mỗi trang có ghi chú cho GV (lời giảng song ngữ, đáp án) ở phần Notes của PowerPoint.
import type PptxGenJS from "pptxgenjs";
import { chapterOf, curLesson } from "@/lib/curriculum";
import { LETTERS, fillWordBox, noteOf, plain, type VocabRow } from "@/lib/notebook";
import { BODY, C, CW, FONT, H, X0, bullets, choiceBoxes, closing, cover, downloadDeck, frame, lines, newDeck, paginate, rich, type Ctx, type Run, type Slide } from "@/lib/pptx/kit";

function titleSlide(c: Ctx, lessonId: string) {
  const l = curLesson(lessonId)!;
  const ch = chapterOf(lessonId);
  cover(c, {
    kicker: `Toán ${l.grade} · Chương ${ch?.no ?? ""}. ${ch?.vi ?? ""}`,
    vi: `Bài ${l.no}. ${l.vi}`,
    en: `Lesson ${l.no}. ${l.en}`,
    badge: "Bài giảng song ngữ Việt – Anh",
    sub: "Bilingual lesson · Lớp Song Ngữ",
    notes: `Mở đầu tiết học. Teacher: "Good morning, class! Today we are going to learn Lesson ${l.no}: ${l.en}." — Hôm nay chúng ta học Bài ${l.no}: ${l.vi}.`,
  });
}

function goalsSlide(c: Ctx, lessonId: string) {
  const l = curLesson(lessonId)!;
  const s = frame(c, "Mục tiêu bài học", "Learning goals", undefined, `Teacher: "By the end of this lesson, you will be able to…" — GV đọc mục tiêu, HS đọc phần tiếng Anh theo.`);
  const items = l.outcomes.map((o): Run[] => [
    { text: o.vi, options: { fontSize: 20, color: C.ink, breakLine: true } },
    { text: o.en, options: { fontSize: 16, color: C.greenDk } },
  ]);
  s.addText(bullets(items), { ...BODY, fontFace: FONT, valign: "top", fit: "shrink" });
}

/** Bảng từ vựng (8 từ/trang) — dùng chung cho bài giảng tự soạn */
export function vocabSlides(c: Ctx, vocab: { en: string; ipa: string; vi: string }[]) {
  // 8 từ/trang; 9–10 từ vẫn để một trang (chữ nhỏ hơn chút) để không có trang lẻ 1–2 từ
  const per = vocab.length <= 10 ? 10 : 8;
  const pages = paginate(vocab, () => 1, per);
  pages.forEach((page, pi) => {
    const dense = page.length > 8;
    const s = frame(
      c,
      `Từ vựng${pages.length > 1 ? ` (${pi + 1}/${pages.length})` : ""}`,
      "Vocabulary",
      undefined,
      `GV đọc mẫu từng từ, HS đọc theo 2 lần. Teacher: "Listen and repeat."\n` + page.map((v) => `${v.en} ${v.ipa} — ${v.vi}`).join("\n")
    );
    const head = (t: string): PptxGenJS.TableCell => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.green } } });
    const rows: PptxGenJS.TableRow[] = [
      [head("#"), head("English"), head("Phiên âm"), head("Tiếng Việt")],
      ...page.map((v, i): PptxGenJS.TableRow => [
        { text: String(pi * per + i + 1), options: { align: "center", color: C.grey } },
        { text: v.en, options: { bold: true, color: C.greenDk } },
        { text: v.ipa || "", options: { color: C.grey } },
        { text: v.vi, options: { color: C.ink } },
      ]),
    ];
    s.addTable(rows, { x: X0, y: 1.9, w: CW, colW: [0.7, 3.9, 3.0, CW - 7.6], fontFace: FONT, fontSize: dense ? 16 : 18, rowH: dense ? 0.44 : 0.52, valign: "middle", border: { type: "solid", pt: 1, color: C.line }, fill: { color: C.white } });
  });
}

const isLong = (t: { rows: string[][] }) => t.rows.some((r) => r.join(" ").length > 110);

function tableOn(c: Ctx, s: Slide, t: { head: string[]; rows: string[][] }, y: number) {
  const cols = t.head.length;
  const rows: PptxGenJS.TableRow[] = [
    t.head.map((h) => ({ text: h, options: { bold: true, color: C.white, fill: { color: C.green } } })),
    ...t.rows.map((r) => r.map((cell, k): PptxGenJS.TableCell => ({ text: rich(cell, { bold: k === 0 }) }))),
  ];
  const long = t.rows.length > 5 || isLong(t);
  s.addTable(rows, {
    x: X0,
    y,
    w: CW,
    colW: Array.from({ length: cols }, () => CW / cols),
    fontFace: FONT,
    fontSize: long ? 14 : 16,
    color: C.ink,
    valign: "middle",
    border: { type: "solid", pt: 1, color: C.line },
    fill: { color: C.white },
    autoPage: true,
    autoPageRepeatHeader: true,
    autoPageHeaderRows: 1,
    autoPageSlideStartY: 1.9,
  });
}

function theorySlides(c: Ctx, lessonId: string) {
  const n = noteOf(lessonId)!;
  const TAG = "Hình thành kiến thức · New knowledge";
  n.theory.forEach((sec, i) => {
    const talk = `Teacher: "Let's learn about ${sec.en.toLowerCase()}."`;
    // Mục chỉ 1–2 dòng chữ + bảng → chung một trang (chữ trên, bảng dưới)
    if (sec.table && sec.points.reduce((t, p) => t + lines(p), 0) <= 2.8) {
      const s = frame(c, `${i + 1}. ${sec.h}`, sec.en, TAG, `${talk} GV cho HS đọc bảng, hỏi nhanh từng dòng.`);
      s.addText(bullets(sec.points.map((p) => rich(p, { fontSize: 20, color: C.ink }))), { x: BODY.x, y: BODY.y, w: BODY.w, h: 0.8, fontFace: FONT, valign: "top", fit: "shrink" });
      tableOn(c, s, sec.table, 2.75);
      return;
    }
    // Bảng lớn → trang riêng; bảng nhỏ + ít chữ → chung trang (chữ trên, bảng dưới)
    const bigTable = !!sec.table && (sec.table.rows.length > 4 || isLong(sec.table));
    const shared = !!sec.table && !bigTable;
    const pages = paginate(sec.points, (p) => lines(p), shared ? 4 : 10);
    if (shared && !pages.length) pages.push([]);
    pages.forEach((page, pi) => {
      const s = frame(c, `${i + 1}. ${sec.h}${pages.length > 1 ? ` (${pi + 1}/${pages.length})` : ""}`, sec.en, TAG, `${talk}\n` + page.map(plain).join("\n"));
      const size = page.reduce((t, p) => t + lines(p), 0) > 7 ? 18 : 21;
      const withTable = shared && pi === pages.length - 1;
      if (page.length) s.addText(bullets(page.map((p) => rich(p, { fontSize: size, color: C.ink }))), { x: BODY.x, y: BODY.y, w: BODY.w, h: withTable ? 1.7 : BODY.h, fontFace: FONT, valign: "top", fit: "shrink" });
      if (withTable) tableOn(c, s, sec.table!, page.length ? 3.75 : 1.9);
    });
    if (bigTable) tableOn(c, frame(c, `${i + 1}. ${sec.h} — Bảng`, sec.en, TAG, "GV cho HS đọc bảng, hỏi nhanh từng dòng."), sec.table!, 1.9);
  });
}

function rememberSlide(c: Ctx, lessonId: string) {
  const n = noteOf(lessonId)!;
  const s = frame(c, "Ghi nhớ", "Remember", "Tổng kết · Summary", "HS chép phần ghi nhớ vào vở. Teacher: \"Copy this into your notebook.\"");
  s.addShape(c.pptx.ShapeType.roundRect, { ...BODY, fill: { color: C.sunSoft }, line: { color: C.sun, width: 2 }, rectRadius: 0.08 });
  s.addText(bullets(n.remember.map((r) => rich(r, { fontSize: 21, color: C.ink })), { bullet: { code: "2605" } }), { x: BODY.x + 0.3, y: BODY.y + 0.2, w: BODY.w - 0.6, h: BODY.h - 0.4, fontFace: FONT, valign: "top", fit: "shrink" });
}

/** Câu tiếng Anh cần nhớ (3 câu/trang) — dùng chung cho bài giảng tự soạn */
export function sentenceSlides(c: Ctx, sentences: { en: string; vi: string }[]) {
  paginate(sentences, () => 1, 3).forEach((page, pi, all) => {
    const s = frame(c, `Câu tiếng Anh cần nhớ${all.length > 1 ? ` (${pi + 1}/${all.length})` : ""}`, "Key sentences — read aloud", "Luyện nói · Speaking", `GV đọc mẫu, cả lớp đọc theo, gọi 2–3 HS đọc to. Teacher: "Read after me."`);
    page.forEach((t, k) => {
      const y = 1.95 + k * 1.6;
      s.addShape(c.pptx.ShapeType.roundRect, { x: X0, y, w: CW, h: 1.4, fill: { color: C.white }, line: { color: C.line, width: 1.5 }, rectRadius: 0.1 });
      s.addText(String(pi * 3 + k + 1), { x: X0 + 0.25, y: y + 0.4, w: 0.6, h: 0.6, shape: c.pptx.ShapeType.ellipse, fill: { color: C.greenSoft }, fontFace: FONT, fontSize: 18, bold: true, color: C.greenDk, align: "center", valign: "middle" });
      s.addText(
        [
          { text: t.en, options: { fontSize: 22, bold: true, color: C.greenDk, breakLine: !!t.vi } },
          { text: t.vi, options: { fontSize: 16, italic: true, color: C.grey } },
        ],
        { x: X0 + 1.1, y: y + 0.1, w: CW - 1.3, h: 1.2, fontFace: FONT, valign: "middle", fit: "shrink" }
      );
    });
  });
}

/** Trắc nghiệm: trang đề + trang đáp án (ô đúng tô xanh) */
function mcqSlides(c: Ctx, lessonId: string) {
  const n = noteOf(lessonId)!;
  n.mcq.forEach((q, i) => {
    [false, true].forEach((reveal) => {
      const s = frame(
        c,
        `Câu ${i + 1}${reveal ? " — Đáp án" : ""}`,
        reveal ? "Answer" : "Choose the correct answer",
        "Luyện tập · Practice",
        reveal ? `Đáp án: ${LETTERS[q.answer]}. ${plain(q.options[q.answer])}` : `Teacher: "Choose the correct answer. You have 30 seconds." — HS giơ thẻ A/B/C/D hoặc trả lời trên điện thoại.`
      );
      choiceBoxes(
        c,
        s,
        rich(q.q, { fontSize: 24, bold: true, color: C.ink }),
        q.options.map((o) => rich(o, { fontSize: 20, color: C.ink })),
        q.answer,
        reveal
      );
    });
  });
}

/** Đúng / Sai: bảng nhận định, trang sau có đáp án */
function tfSlides(c: Ctx, lessonId: string) {
  const n = noteOf(lessonId)!;
  [false, true].forEach((reveal) => {
    const s = frame(c, `Đúng hay sai?${reveal ? " — Đáp án" : ""}`, "True or false?", "Luyện tập · Practice", reveal ? n.tf.map((t, i) => `${i + 1}. ${t.answer ? "Đúng" : "Sai"}`).join("\n") : `Teacher: "True or false? Stand up if it's true!" — HS đứng lên nếu Đúng, ngồi nếu Sai.`);
    const rows: PptxGenJS.TableRow[] = [
      [
        { text: "Nhận định · Statement", options: { bold: true, color: C.white, fill: { color: C.green } } },
        { text: "Đ / S", options: { bold: true, color: C.white, fill: { color: C.green }, align: "center" } },
      ],
      ...n.tf.map((t, i): PptxGenJS.TableRow => [
        { text: `${i + 1}. ${plain(t.q)}` },
        reveal ? { text: t.answer ? "Đ" : "S", options: { bold: true, align: "center", color: t.answer ? C.green : C.coral, fill: { color: t.answer ? C.greenSoft : C.coralSoft } } } : { text: "" },
      ]),
    ];
    s.addTable(rows, { x: X0, y: 1.95, w: CW, colW: [CW - 1.6, 1.6], fontFace: FONT, fontSize: n.tf.length > 4 ? 16 : 19, color: C.ink, rowH: 0.7, valign: "middle", border: { type: "solid", pt: 1, color: C.line }, fill: { color: C.white } });
  });
}

/** Điền từ: khung từ gợi ý + câu, trang sau có đáp án */
function fillSlides(c: Ctx, lessonId: string) {
  const n = noteOf(lessonId)!;
  if (!n.fill.length) return;
  [false, true].forEach((reveal) => {
    const s = frame(c, `Điền từ vào chỗ trống${reveal ? " — Đáp án" : ""}`, "Fill in the blanks", "Luyện tập · Practice", reveal ? n.fill.map((f, i) => `${i + 1}. ${f.answer}`).join("\n") : `Teacher: "Fill in the blanks with the words in the box."`);
    s.addShape(c.pptx.ShapeType.roundRect, { x: X0, y: 1.9, w: CW, h: 0.7, fill: { color: C.greenSoft }, line: { color: C.green, width: 1 }, rectRadius: 0.2 });
    s.addText(
      [
        { text: "Word box:  ", options: { color: C.grey, fontSize: 16 } },
        { text: fillWordBox(n).join("   •   "), options: { bold: true, color: C.greenDk, fontSize: 20 } },
      ],
      { x: X0, y: 1.9, w: CW, h: 0.7, fontFace: FONT, align: "center", valign: "middle" }
    );
    const runs: Run[] = n.fill.flatMap((f, i): Run[] => {
      const [a, b] = f.q.split("___");
      return [
        { text: `${i + 1}. ${a}`, options: { fontSize: 21, color: C.ink } },
        reveal ? { text: f.answer, options: { fontSize: 21, bold: true, color: C.green, underline: { style: "sng" } } } : { text: "……………", options: { fontSize: 21, color: C.grey } },
        { text: b ?? "", options: { fontSize: 21, color: C.ink, breakLine: true } },
        { text: f.vi, options: { fontSize: 15, italic: true, color: C.grey, breakLine: i < n.fill.length - 1, paraSpaceAfter: 12 } },
      ];
    });
    s.addText(runs, { x: X0, y: 2.8, w: CW, h: H - 3.4, fontFace: FONT, valign: "top", fit: "shrink" });
  });
}

function essaySlides(c: Ctx, lessonId: string) {
  const n = noteOf(lessonId)!;
  if (!n.essay.length) return;
  [false, true].forEach((reveal) => {
    const s = frame(c, reveal ? "Vận dụng — Gợi ý trả lời" : "Vận dụng", reveal ? "Suggested answers" : "Apply what you learned", "Vận dụng · Application", n.essay.map((e, i) => `Câu ${i + 1}. Gợi ý: ${e.answer}`).join("\n\n"));
    const items = n.essay.map((e, i): Run[] =>
      reveal
        ? [
            { text: `Câu ${i + 1}. ${e.q}`, options: { fontSize: 17, bold: true, color: C.ink, breakLine: true } },
            { text: e.answer, options: { fontSize: 16, color: C.greenDk } },
          ]
        : [{ text: `Câu ${i + 1}. ${e.q}`, options: { fontSize: 22, color: C.ink } }]
    );
    s.addText(bullets(items, { bullet: false }), { ...BODY, fontFace: FONT, valign: "top", fit: "shrink" });
  });
}

/** Dựng bài giảng một bài */
export async function buildLessonPptx(lessonId: string, vocab: VocabRow[]) {
  const l = curLesson(lessonId);
  const n = noteOf(lessonId);
  if (!l || !n) throw new Error("Bài này chưa có nội dung vở ghi.");
  const c = await newDeck(`Bài ${l.no}. ${l.vi} — ${l.en}`, `Toán ${l.grade} · Bài ${l.no}. ${l.vi} · Lớp Song Ngữ`, `Toán ${l.grade} — bài giảng song ngữ Việt – Anh`);

  titleSlide(c, lessonId);
  goalsSlide(c, lessonId);
  if (vocab.length) vocabSlides(c, vocab);
  theorySlides(c, lessonId);
  rememberSlide(c, lessonId);
  sentenceSlides(c, n.sentences);
  mcqSlides(c, lessonId);
  tfSlides(c, lessonId);
  fillSlides(c, lessonId);
  essaySlides(c, lessonId);
  closing(c, `Mở web Lớp Song Ngữ → Tự học → Vở ghi Bài ${l.no} và chơi "Trò chơi ôn tập" bài ${l.no}.`, "Dặn dò: ôn từ vựng, đọc to các câu tiếng Anh cần nhớ, làm bài tập về nhà trên điện thoại.");
  return c.pptx;
}

/** Tạo file .pptx và tải về máy */
export async function downloadLessonPptx(lessonId: string, vocab: VocabRow[]) {
  const pptx = await buildLessonPptx(lessonId, vocab);
  await downloadDeck({ pptx, footer: "" }, `Bai giang song ngu Toan ${curLesson(lessonId)!.grade} - Bai ${curLesson(lessonId)!.no}.pptx`);
}
