// Bộ dự án STEM mẫu Toán 6–9: đủ số lượng, phủ đủ 4 khối, dữ liệu hợp lệ
import { describe, expect, it } from "vitest";
import { STEM_TEMPLATES, sanitizeProject } from "@/lib/stem/projects";
import { GRADES, curLesson } from "@/lib/curriculum";

const NOW = Date.UTC(2026, 9, 23);

describe("dự án STEM mẫu Toán 6–9", () => {
  it("có ít nhất 16 dự án, mã không trùng, khối nào cũng có ≥ 3 mẫu", () => {
    expect(STEM_TEMPLATES.length).toBeGreaterThanOrEqual(16);
    const ids = STEM_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GRADES) expect(STEM_TEMPLATES.filter((t) => t.grade === g).length, `lớp ${g}`).toBeGreaterThanOrEqual(3);
  });
  it("gắn đúng bài SGK Toán cùng khối", () => {
    STEM_TEMPLATES.forEach((t) => {
      const l = curLesson(t.curLessonId);
      expect(l, t.id).toBeDefined();
      expect(l!.grade, t.id).toBe(t.grade);
    });
  });
  it("song ngữ đầy đủ, có từ vựng, có tiêu chí; không bị cắt khi lưu", () => {
    STEM_TEMPLATES.forEach((t) => {
      for (const f of [t.title, t.goal, t.brief]) expect(f.en && f.vi, t.id).toBeTruthy();
      expect(t.vocab.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.brief.vi, t.id).toMatch(/Tiêu chí/);
      expect(t.brief.vi.length, t.id).toBeLessThanOrEqual(2000);
      expect(t.brief.en.length, t.id).toBeLessThanOrEqual(2000);
      expect(t.materials.length, t.id).toBeLessThanOrEqual(600);
      expect(t.title.vi.length, t.id).toBeLessThanOrEqual(160);
      const p = sanitizeProject({ ...t, dueAt: NOW + 14 * 86_400_000 }, NOW);
      if (typeof p === "string") throw new Error(`${t.id}: ${p}`);
      expect(p).toMatchObject({ title: t.title, brief: t.brief, materials: t.materials, curLessonId: t.curLessonId });
    });
  });
  it("bài SGK của dự án phải cùng khối", () => {
    // Bài lớp 8 gắn vào dự án lớp 7 → bỏ gắn bài; mã bài KHTN → bỏ gắn bài; khối ngoài 6–9 → từ chối
    expect(sanitizeProject({ title: { vi: "X" }, grade: 7, curLessonId: "k8-35", dueAt: NOW + 86_400_000 }, NOW)).toMatchObject({ curLessonId: null });
    expect(sanitizeProject({ title: { vi: "X" }, grade: 8, curLessonId: "n8-33", dueAt: NOW + 86_400_000 }, NOW)).toMatchObject({ curLessonId: null });
    expect(typeof sanitizeProject({ title: { vi: "X" }, grade: 5, dueAt: NOW + 86_400_000 }, NOW)).toBe("string");
  });
});
