// Bộ ngân hàng câu hỏi dựng sẵn Toán 6–9: hợp lệ, phủ đủ bài trọng tâm, chấm đúng, đáp án rải đều
import { describe, expect, it } from "vitest";
import { KHO_BANK, bankDocId } from "@/lib/bank/kho";
import { sanitizeBankInput, toKey, toSlide } from "@/lib/bank/questions";
import { gradeQuestion } from "@/lib/study/hw";
import { NOTES } from "@/lib/notebook";

// Kho câu hỏi phủ đúng các bài có Vở ghi (bài trọng tâm lớp 6–9)
const lessons = NOTES.map((n) => n.id);
const clean = (q: (typeof KHO_BANK)[number]) => {
  const { key: _k, ...input } = q;
  void _k;
  const b = sanitizeBankInput(input);
  if (typeof b === "string") throw new Error(`${bankDocId(q)}: ${b}`);
  return b;
};

describe("ngân hàng câu hỏi Toán 6–9", () => {
  it("mỗi câu hợp lệ theo đúng hàm kiểm tra của app; mã không trùng", () => {
    KHO_BANK.forEach(clean);
    const ids = KHO_BANK.map(bankDocId);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("phủ đủ các bài trọng tâm, mỗi bài ≥ 8 câu, đủ 3 mức độ và có câu tiếng Anh", () => {
    expect(new Set(KHO_BANK.map((q) => q.curLessonId))).toEqual(new Set(lessons));
    for (const l of lessons) {
      const qs = KHO_BANK.filter((q) => q.curLessonId === l);
      expect(qs.length, l).toBeGreaterThanOrEqual(8);
      expect(new Set(qs.map((q) => q.level)).size, l).toBe(3);
      expect(qs.some((q) => q.type === "text" || q.type === "speak"), l).toBe(true);
    }
  });
  it("YCCĐ gắn đúng bài (không bị bỏ khi làm sạch)", () => {
    KHO_BANK.forEach((q) => expect(clean(q).outcomeIds, bankDocId(q)).toEqual(q.outcomeIds));
  });
  it("máy chấm đúng đáp án của từng câu (trắc nghiệm, đúng/sai, gõ chữ)", () => {
    KHO_BANK.filter((q) => q.type !== "speak").forEach((q) => {
      const b = clean(q);
      const id = bankDocId(q);
      const right = b.type === "text" ? b.accept[0] : b.answer;
      expect(gradeQuestion(toSlide(id, b), toKey(b), right, false).correct, id).toBe(true);
      if (b.type === "mcq" || b.type === "tf") expect(gradeQuestion(toSlide(id, b), toKey(b), (b.answer! + 1) % b.options.length, false).correct, id).toBe(false);
      expect(b.explain.en && b.explain.vi, id).toBeTruthy();
    });
  });
  it("đáp án trắc nghiệm rải đều A/B/C/D (không đoán theo vị trí); phương án không trùng", () => {
    const mcq = KHO_BANK.filter((q) => q.type === "mcq");
    const count = [0, 1, 2, 3].map((i) => mcq.filter((q) => q.answer === i).length);
    count.forEach((n) => expect(n / mcq.length).toBeGreaterThan(0.15));
    mcq.forEach((q) => expect(new Set(q.options.map((o) => o.en)).size, bankDocId(q)).toBe(4));
  });
});
