// Kiểm tra dữ liệu kho học liệu Toán 6–9 trước khi nạp
import { describe, expect, it } from "vitest";
import { KHO_COMMON, KHO_TOAN, khoCommonId, khoResourceId } from "@/lib/library/kho-toan";
import { sanitizeResource } from "@/lib/library/resources";
import { CHAPTERS, curLesson } from "@/lib/curriculum";
import { termId } from "@/lib/lessons/terms";

describe("kho học liệu Toán 6–9", () => {
  it("phủ đủ mọi bài SGK lớp 6–9, mỗi bài một lần", () => {
    const want = CHAPTERS.flatMap((c) => c.lessons.map((l) => l.id));
    expect(KHO_TOAN.map((l) => l.curLessonId).sort()).toEqual([...want].sort());
  });
  it("mọi học liệu hợp lệ theo đúng hàm kiểm tra của app", () => {
    KHO_COMMON.forEach((r) => expect(typeof sanitizeResource({ ...r, grade: 8, curLessonId: null }), r.url).toBe("object"));
    KHO_TOAN.flatMap((l) => l.resources.map((r) => ({ r, l: l.curLessonId }))).forEach(({ r, l }) => {
      const out = sanitizeResource({ ...r, grade: curLesson(l)!.grade, curLessonId: l });
      expect(typeof out, `${r.url}: ${out}`).toBe("object");
      expect(r.title.vi && r.title.en && r.note).toBeTruthy();
    });
  });
  it("mỗi bài có ít nhất 2 thuật ngữ (lớp 8: 5); không trùng link / thuật ngữ trong bài", () => {
    KHO_TOAN.forEach((l) => {
      expect(l.terms.length, l.curLessonId).toBeGreaterThanOrEqual(curLesson(l.curLessonId)!.grade === 8 ? 5 : 2);
      expect(new Set(l.resources.map((r) => r.url)).size).toBe(l.resources.length);
      expect(new Set(l.terms.map((t) => termId(t.en))).size, l.curLessonId).toBe(l.terms.length);
    });
  });
  it("thuật ngữ có IPA dạng /…/, nghĩa tiếng Việt; cùng một từ thì cùng nghĩa, cùng phiên âm", () => {
    const seen = new Map<string, string>();
    KHO_TOAN.flatMap((l) => l.terms).forEach((t) => {
      expect(t.ipa, t.en).toMatch(/^\/[^/]+\/$/);
      expect(t.vi, t.en).toBeTruthy();
      const key = `${t.vi}|${t.ipa}`;
      const id = termId(t.en);
      if (seen.has(id)) expect(key, t.en).toBe(seen.get(id));
      seen.set(id, key);
    });
  });
  it("mã học liệu cố định, không trùng", () => {
    const ids = KHO_TOAN.flatMap((l) => l.resources.map((_, i) => khoResourceId(l.curLessonId, i)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(khoResourceId("k8-35", 0)).toBe("kho-k8-35-01");
    expect(khoCommonId(6, 1)).toBe("kho-k6-chung-02");
    expect(curLesson("k8-35")?.vi).toBe("Định lí Pythagore và ứng dụng");
  });
});
