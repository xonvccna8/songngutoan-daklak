import { describe, expect, it } from "vitest";
import { langOfLevel, levelInputOf, suggestLevel, type LevelInput } from "@/lib/live/elevel";
import { summarize } from "@/lib/live/summary";
import { SLIDES } from "@/lib/lessons/pythagore";
import type { ResponseDoc, SessionDoc } from "@/lib/live/types";

const X = (o: Partial<LevelInput>): LevelInput => ({ langA: 0, langC: 0, viKnown: 0, viA: 0, pronSum: 0, pronN: 0, ...o });

describe("gợi ý mức tiếng Anh E1/E2/E3", () => {
  it("chưa đủ dữ liệu → giữ E2", () => {
    expect(suggestLevel(X({ langA: 2, langC: 2 }))).toMatchObject({ level: "e2", enough: false });
  });
  it("E1 khi Ngôn ngữ dưới 50%, hoặc thường xem tiếng Việt, hoặc phát âm thấp", () => {
    expect(suggestLevel(X({ langA: 4, langC: 1 })).level).toBe("e1");
    expect(suggestLevel(X({ langA: 4, langC: 4, viKnown: 5, viA: 4 })).level).toBe("e1");
    expect(suggestLevel(X({ langA: 4, langC: 4, pronSum: 40, pronN: 1 })).level).toBe("e1");
    expect(suggestLevel(X({ langA: 4, langC: 1 })).reason).toMatch(/Ngôn ngữ đúng 25%/);
  });
  it("E3 khi Ngôn ngữ ≥ 75%, ít xem tiếng Việt, phát âm tốt", () => {
    expect(suggestLevel(X({ langA: 4, langC: 4, viKnown: 5, viA: 1, pronSum: 160, pronN: 2 })).level).toBe("e3");
    // xem tiếng Việt khá nhiều (40%) → giữ E2
    expect(suggestLevel(X({ langA: 4, langC: 4, viKnown: 5, viA: 2 })).level).toBe("e2");
  });
  it("mức ↔ ngôn ngữ trên điện thoại", () => {
    expect([langOfLevel("e1"), langOfLevel("e2"), langOfLevel("e3"), langOfLevel(undefined)]).toEqual(["vi", "bi", "en", "bi"]);
  });
});

describe("cộng dồn qua các tiết", () => {
  const R = (uid: string, slideId: string, skill: "Toán" | "Ngôn ngữ", correct: boolean, vi: boolean): ResponseDoc => ({ id: `${uid}~${slideId}`, uid, slideId, qtype: "mcq", skill, correct, vi, points: 0, attempts: 1, answeredAt: 1 });
  it("tóm tắt tiết đếm số câu có xem tiếng Việt; tiết cũ không có thì bỏ qua", () => {
    const sum = summarize([R("a", "s1", "Ngôn ngữ", true, true), R("a", "s4", "Ngôn ngữ", false, false), R("a", "s9", "Ngôn ngữ", true, true)], [{ uid: "a" }], SLIDES);
    expect(sum.results.a).toMatchObject({ answered: 3, viA: 2, langA: 3, langC: 2 });
    const old = { results: { a: { ...sum.results.a, viA: undefined } } } as unknown as SessionDoc;
    const x = levelInputOf([{ results: sum.results } as SessionDoc, old], "a");
    expect(x).toMatchObject({ langA: 6, langC: 4, viKnown: 3, viA: 2 });
  });
});
