import { describe, expect, it } from "vitest";
import { CHAPTERS, GRADES, chapterOf, chaptersOf, curLesson, fold, isOutcomeId, outcomesOf, starCounts, starsOf } from "@/lib/curriculum";
import { FRAMES, PHRASES, SYMBOLS, matches, sayOf, searchFrames, searchSymbols } from "@/lib/library";
import { embedUrl, geogebraId, sanitizeResource, youtubeId } from "@/lib/library/resources";
import { sanitizeLesson } from "@/lib/lessons/editor";
import { computeLevel, requirements, type Facts } from "@/lib/progress/levels";
import { masteryByUid } from "@/lib/progress/xp";
import { isMathCurId, isMathLesson, isScienceCurId, isScienceTerm } from "@/lib/subject";

describe("khung chương trình Toán 6–9 (KNTT)", () => {
  it("đủ 4 khối, số chương đúng như mục lục SGK", () => {
    expect(GRADES).toEqual([6, 7, 8, 9]);
    expect([6, 7, 8, 9].map((g) => chaptersOf(g).length)).toEqual([9, 10, 10, 10]);
    expect(chaptersOf(8).reduce((s, c) => s + c.lessons.length, 0)).toBe(39);
  });
  it("số bài liên tục đúng như SGK, id duy nhất, dùng mã Toán (k…)", () => {
    for (const g of GRADES) {
      const nos = chaptersOf(g).flatMap((c) => c.lessons.map((l) => l.no));
      expect(nos, `lớp ${g}`).toEqual(Array.from({ length: nos.length }, (_, i) => i + 1));
    }
    const ids = CHAPTERS.flatMap((c) => c.lessons.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("k"))).toBe(true);
  });
  it("bài nào cũng có YCCĐ song ngữ (bài chưa nhập dùng 1 YCCĐ chung)", () => {
    CHAPTERS.forEach((c) =>
      c.lessons.forEach((l) => {
        expect(l.outcomes.length).toBeGreaterThan(0);
        l.outcomes.forEach((o) => expect(o.vi && o.en).toBeTruthy());
      })
    );
    expect(outcomesOf(8).length).toBeGreaterThan(60);
    expect(curLesson("k6-10")!.outcomes[0]).toMatchObject({ id: "k6-10-1", vi: "Nhận biết và vận dụng được kiến thức bài «Số nguyên tố»." });
  });
  it("tra cứu bài, chương, YCCĐ", () => {
    expect(curLesson("k8-35")).toMatchObject({ vi: "Định lí Pythagore và ứng dụng", grade: 8, chapterId: "k8-c9" });
    expect(chapterOf("k8-15")?.vi).toBe("Định lí Thalès");
    expect(chapterOf("k9-19")?.strand).toBe("sd");
    expect(chapterOf("k7-18")?.strand).toBe("tk");
    expect(isOutcomeId("k8-35-2")).toBe(true);
    expect(isOutcomeId("k8-35-9")).toBe(false);
    expect(curLesson("n8-33")).toBeUndefined(); // mã bài KHTN không hợp lệ ở trang Toán
  });
  it("tìm không dấu", () => {
    expect(fold("Định lí Thalès trong tam giác")).toBe("dinh li thales trong tam giac");
    expect(matches("hang dang thuc", "Hằng đẳng thức đáng nhớ và ứng dụng")).toBe(true);
  });
});

describe("chỉ hiện dữ liệu Toán (Firebase dùng chung với KHTN — chỉ ẩn, không xoá)", () => {
  it("nhận ra tiết, học liệu Toán / KHTN", () => {
    expect(isMathLesson({ subject: "Toán", curLessonId: null })).toBe(true);
    expect(isMathLesson({ subject: "", curLessonId: "k7-16" })).toBe(true);
    expect(isMathLesson({ subject: "KHTN", curLessonId: "n6-18" })).toBe(false);
    expect(isMathCurId("k8-15")).toBe(true);
    expect(isScienceCurId("n8-33")).toBe(true);
    expect(isScienceCurId("k8-15")).toBe(false);
  });
  it("ẩn thuật ngữ của KHTN, giữ thuật ngữ Toán và thuật ngữ dùng chung", () => {
    const math = new Set(["toan8-pythagore"]);
    expect(isScienceTerm({ curLessonIds: ["n8-33"] }, math)).toBe(true);
    expect(isScienceTerm({ lessonIds: ["khtn6-te-bao"] }, math)).toBe(true);
    expect(isScienceTerm({ lessonIds: ["toan8-pythagore", "khtn6-te-bao"] }, math)).toBe(false); // dùng chung → vẫn hiện
    expect(isScienceTerm({ lessonIds: [], curLessonIds: ["k8-35"] }, math)).toBe(false);
    expect(isScienceTerm({}, math)).toBe(false); // GV tự thêm, chưa gắn bài
  });
});

describe("Sao thành thạo", () => {
  it("cần đủ số câu và tỉ lệ đúng", () => {
    expect(starsOf(undefined)).toBe(0);
    expect(starsOf({ a: 1, c: 1 })).toBe(0); // 1 câu chưa kết luận được
    expect(starsOf({ a: 2, c: 1 })).toBe(1);
    expect(starsOf({ a: 4, c: 3 })).toBe(2);
    expect(starsOf({ a: 6, c: 6 })).toBe(3);
    expect(starsOf({ a: 10, c: 4 })).toBe(0);
  });
  it("đếm số YCCĐ theo Sao", () => expect(starCounts({ x: { a: 6, c: 6 }, y: { a: 2, c: 1 }, z: { a: 1, c: 0 } })).toEqual({ seen: 3, s1: 2, s2: 1, s3: 1 }));
  it("gom câu trả lời trong tiết theo YCCĐ (luyện nói đạt từ 80)", () => {
    const m = masteryByUid(
      [
        { uid: "a", slideId: "s1", qtype: "mcq", correct: true },
        { uid: "a", slideId: "s2", qtype: "speak", score: 85 },
        { uid: "b", slideId: "s1", qtype: "mcq", correct: false },
        { uid: "b", slideId: "s9", qtype: "mcq", correct: true },
      ],
      (sid) => ({ s1: ["k8-1-1"], s2: ["k8-1-1", "k8-1-2"] })[sid]
    );
    expect(m).toEqual({ a: { "k8-1-1": { a: 2, c: 2 }, "k8-1-2": { a: 1, c: 1 } }, b: { "k8-1-1": { a: 1, c: 0 } } });
  });
  it("điều kiện Sao chỉ xét khi em đã gặp YCCĐ, và không đòi quá 80% số đã gặp", () => {
    const f = (o: Partial<Facts>): Facts => ({ termsLearned: 99, termsAvailable: 0, speakGood: 99, bestStreak: 99, ...o });
    expect(requirements(2, f({})).some((r) => r.vi.includes("1⭐"))).toBe(false);
    const r = requirements(2, f({ outcomesSeen: 3, stars1: 1 })).find((x) => x.vi.includes("1⭐"))!;
    expect(r.goal).toBe(3);
    expect(computeLevel(900, f({ outcomesSeen: 3, stars1: 1 }))).toBe(5); // kẹt ở Tập sự III
    expect(computeLevel(900, f({ outcomesSeen: 3, stars1: 3 }))).toBe(6); // Khám phá I
  });
});

describe("thư viện học liệu dựng sẵn", () => {
  it("đủ số lượng, id duy nhất, đủ 2 thứ tiếng", () => {
    expect(FRAMES).toHaveLength(60);
    expect(PHRASES).toHaveLength(150);
    expect(SYMBOLS.length).toBeGreaterThanOrEqual(30);
    expect(SYMBOLS.every((s) => s.grade >= 6 && s.grade <= 9)).toBe(true);
    for (const list of [FRAMES.map((f) => f.id), PHRASES.map((p) => p.id), SYMBOLS.map((s) => s.id)]) expect(new Set(list).size).toBe(list.length);
    FRAMES.forEach((f) => [f.e1, f.e2, f.e3].forEach((t) => expect(t.en && t.vi).toBeTruthy()));
  });
  it("tìm khung câu và kí hiệu", () => {
    expect(searchFrames("disagree").length).toBeGreaterThan(0);
    expect(searchFrames("phan vi du").length).toBeGreaterThan(0);
    expect(searchSymbols("song song")[0].sym).toBe("a ∥ b");
    expect(sayOf(SYMBOLS.find((s) => s.sym === "6 × 7")!)).toBe("six times seven");
    expect(searchSymbols("glucose")).toHaveLength(0);
  });
  it("không còn nội dung KHTN (sinh học) trong thư viện", () => {
    const all = [...FRAMES.flatMap((f) => [f.e1, f.e2, f.e3]), ...PHRASES, ...SYMBOLS].flatMap((x) => [x.en, x.vi]).join(" ");
    for (const w of ["microscope", "kính hiển vi", "cells?", "tế bào", "organs?", "photosynthesis", "quang hợp", "glucose"]) expect(all.toLowerCase()).not.toMatch(new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "u"));
  });
});

describe("học liệu (link)", () => {
  const ok = { kind: "geogebra", title: { vi: "Định lí Pythagore", en: "" }, url: "https://www.geogebra.org/m/abc123XY", grade: 8, curLessonId: "k8-35", note: "" };
  it("nhận link GeoGebra / YouTube và tạo link nhúng", () => {
    expect(geogebraId("https://www.geogebra.org/m/abc123XY")).toBe("abc123XY");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
    expect(embedUrl({ kind: "video", url: "https://youtu.be/dQw4w9WgXcQ" })).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(embedUrl({ kind: "worksheet", url: "https://docs.google.com/x" })).toBeNull();
  });
  it("kiểm tra dữ liệu GV nhập", () => {
    expect(typeof sanitizeResource(ok)).toBe("object");
    expect(sanitizeResource({ ...ok, url: "http://www.geogebra.org/m/abc123XY" })).toMatch(/https/);
    expect(sanitizeResource({ ...ok, url: "https://evil.com/m/abc" })).toMatch(/GeoGebra/);
    expect(sanitizeResource({ ...ok, kind: "video", url: "https://vimeo.com/1" })).toMatch(/YouTube/);
    expect(sanitizeResource({ ...ok, grade: 5 })).toMatch(/6 đến 9/);
    expect(sanitizeResource({ ...ok, grade: 7 })).toMatch(/không thuộc khối/);
    expect(sanitizeResource({ ...ok, curLessonId: "n8-33" })).toMatchObject({ curLessonId: null }); // mã bài KHTN không nhận
    expect(sanitizeResource({ ...ok, title: { vi: "" } })).toMatch(/tên/);
  });
});

describe("soạn bài gắn khung chương trình", () => {
  const slide = (extra: object) => ({ id: "s1", type: "mcq", title: { en: "Q", vi: "Q" }, blocks: [], question: { type: "mcq", prompt: { en: "?", vi: "?" }, options: [{ en: "a" }, { en: "b" }] }, key: { answer: 0 }, ...extra });
  it("chỉ nhận bài SGK và YCCĐ có thật", () => {
    const r = sanitizeLesson({ meta: { title: { en: "x", vi: "x" }, grade: 8, curLessonId: "k8-35" }, slides: [slide({ outcomeIds: ["k8-35-1", "bogus", "k8-35-1", "n8-33-1"] })] });
    expect(r.meta.curLessonId).toBe("k8-35");
    expect(r.meta.subject).toBe("Toán");
    expect(r.slides[0].outcomeIds).toEqual(["k8-35-1"]);
    const bad = sanitizeLesson({ meta: { title: { en: "x", vi: "x" }, curLessonId: "n8-33", subject: "KHTN" }, slides: [slide({})] });
    expect(bad.meta.subject).toBe("Toán"); // luôn ghi môn Toán
    expect(bad.meta.curLessonId).toBeNull();
    expect(bad.slides[0].outcomeIds).toBeUndefined();
  });
});
