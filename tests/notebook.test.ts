// Thuật ngữ chia theo bài + Vở ghi Toán: đủ bài, dữ liệu hợp lệ, xuất Word được
import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { KHO_TOAN } from "@/lib/library/kho-toan";
import { LOOSE, groupByLesson, lessonsOf, termsOfLesson } from "@/lib/lessons/by-lesson";
import { sanitizeTerm } from "@/lib/lessons/terms";
import { NOTES, NOTE_CHAPTERS, NOTE_LESSONS, fillWordBox, lessonByParam, noteLessonsOf, noteOf, noteTitle, plain, richParts, vocabOf } from "@/lib/notebook";
import { buildNotebookDoc } from "@/lib/notebook/word";

const t = (id: string, curLessonIds?: string[]) => ({ id, en: id, ipa: "", vi: id, curLessonIds });

describe("thuật ngữ chia theo bài", () => {
  it("nhóm đúng thứ tự SGK (lớp 6 → 9), từ trong bài theo thứ tự kho, nhóm chưa gắn bài ở cuối", () => {
    const g = groupByLesson([t("leg", ["k8-35"]), t("hypotenuse", ["k8-35"]), t("prime-number", ["k6-10"]), t("zebra"), t("sine", ["k9-11"])]);
    expect(g.map((x) => x.lesson?.id ?? LOOSE)).toEqual(["k6-10", "k8-35", "k9-11", LOOSE]);
    expect(g[1].terms.map((x) => x.id)).toEqual(["hypotenuse", "leg"]); // theo thứ tự trong kho bài 35
    expect(g[3].terms.map((x) => x.id)).toEqual(["zebra"]);
  });
  it("một từ thuộc nhiều bài hiện ở cả hai bài", () => {
    const list = [t("parallel", ["k7-10", "k8-15"])];
    expect(termsOfLesson(list, "k7-10")).toHaveLength(1);
    expect(termsOfLesson(list, "k8-15")).toHaveLength(1);
  });
  it("kho học liệu có từ vựng cho mọi bài lớp 8 (≥ 5 từ)", () => {
    expect(lessonsOf(8)).toHaveLength(39);
    lessonsOf(8).forEach((l) => expect(KHO_TOAN.find((k) => k.curLessonId === l.id)?.terms.length, l.id).toBeGreaterThanOrEqual(5));
  });
  it("GV gắn bài cho thuật ngữ: chỉ nhận mã bài Toán có thật, bỏ trùng", () => {
    const r = sanitizeTerm({ en: "hypotenuse", vi: "cạnh huyền", grade: 8, curLessonIds: ["k8-35", "k8-35", "n8-33", 5] });
    if (typeof r === "string") throw new Error(r);
    expect(r.curLessonIds).toEqual(["k8-35"]);
    const keep = sanitizeTerm({ en: "hypotenuse", vi: "cạnh huyền" });
    expect(typeof keep !== "string" && keep.curLessonIds).toBeUndefined(); // không gửi → giữ nguyên khi sửa
  });
});

describe("vở ghi Toán", () => {
  it("có vở ghi cho cả 4 khối, không trùng, mọi mã bài đều có thật", () => {
    expect(NOTES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(NOTES.map((n) => n.id)).size).toBe(NOTES.length);
    expect(NOTE_LESSONS).toHaveLength(NOTES.length);
    expect(new Set(NOTE_LESSONS.map((l) => l.grade))).toEqual(new Set([6, 7, 8, 9]));
    expect(NOTE_CHAPTERS.flatMap((c) => c.lessons)).toHaveLength(NOTES.length);
    expect(lessonByParam("k8-35")?.no).toBe(35);
    expect(lessonByParam("k8-2")).toBeUndefined();
    expect(noteLessonsOf(9).every((l) => l.grade === 9)).toBe(true);
    expect(noteTitle("k8-35")).toBe("Toán 8 · Bài 35. Định lí Pythagore và ứng dụng");
  });
  it("mỗi bài có lý thuyết, ghi nhớ, câu tiếng Anh và đủ 4 dạng bài tập hợp lệ", () => {
    NOTES.forEach((n) => {
      expect(n.theory.length, n.id).toBeGreaterThanOrEqual(2);
      n.theory.forEach((s) => {
        expect(s.h && s.en && s.points.length, n.id).toBeTruthy();
        s.table?.rows.forEach((r) => expect(r.length, `${n.id} ${s.h}`).toBe(s.table!.head.length));
      });
      expect(n.remember.length, n.id).toBeGreaterThanOrEqual(3);
      n.sentences.forEach((x) => expect(x.en && x.vi, n.id).toBeTruthy());
      expect(n.mcq.length, n.id).toBeGreaterThanOrEqual(4);
      n.mcq.forEach((q) => {
        expect(q.answer >= 0 && q.answer < 4, `${n.id}: ${q.q}`).toBe(true);
        expect(new Set(q.options).size, `${n.id}: ${q.q}`).toBe(4);
      });
      expect(n.tf.length, n.id).toBeGreaterThanOrEqual(4);
      expect(n.tf.some((x) => x.answer) && n.tf.some((x) => !x.answer), `${n.id}: Đ/S nên có cả đúng và sai`).toBe(true);
      n.fill.forEach((f) => {
        expect(f.q.split("___").length, `${n.id}: ${f.q}`).toBe(2);
        expect(f.answer.trim(), n.id).toBe(f.answer);
      });
      expect(fillWordBox(n).length, n.id).toBe(new Set(n.fill.map((f) => f.answer)).size);
      expect(n.essay.length, n.id).toBeGreaterThanOrEqual(2);
      n.essay.forEach((e) => expect(e.q && e.answer, n.id).toBeTruthy());
      // Không còn sót dấu ** lẻ
      [...n.theory.flatMap((s) => s.points), ...n.remember].forEach((p) => expect((p.match(/\*\*/g) ?? []).length % 2, `${n.id}: ${p}`).toBe(0));
    });
  });
  it("chữ đậm và chữ thuần", () => {
    expect(richParts("Tam giác có **cạnh huyền** dài nhất")).toEqual([
      { text: "Tam giác có ", bold: false },
      { text: "cạnh huyền", bold: true },
      { text: " dài nhất", bold: false },
    ]);
    expect(plain("**a** b")).toBe("a b");
  });
  it("từ vựng của bài: lấy ngân hàng thuật ngữ, chưa có thì lấy kho", () => {
    expect(vocabOf("k8-35", [t("right-angle", ["k8-35"])]).map((v) => v.id)).toEqual(["right-angle"]);
    expect(vocabOf("k8-35", []).map((v) => v.en)).toContain("hypotenuse");
    expect(noteOf("n8-33")).toBeUndefined();
  });
  it("xuất Word được cả quyển, bản HS và bản GV", async () => {
    for (const answers of [false, true]) {
      const doc = buildNotebookDoc(
        NOTE_LESSONS.map((l) => l.id),
        { answers, vocab: (id) => vocabOf(id, []) }
      );
      const buf = await Packer.toBuffer(doc);
      expect(buf.length).toBeGreaterThan(15_000);
    }
  });
});
