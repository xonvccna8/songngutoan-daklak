import { describe, expect, it } from "vitest";
import { buildGame, cleanSettings, fromSlides, fromTerms, matchRounds, rng } from "@/lib/games/build";
import { SCORE, drawPower, gapAbove, gradeGame, hiddenOptions, ranking, scoreAnswer, streakBonus } from "@/lib/games/scoring";
import { KEYS, SLIDES, TERMS } from "@/lib/lessons/pythagore";
import { gameXp } from "@/lib/progress/xp";
import type { GameKey, GameQ } from "@/lib/games/types";

describe("tính điểm kiểu Quizizz", () => {
  const base = { ok: true, elapsedMs: 0, limitSec: 20, streakBefore: 0 };
  it("đúng = 600 + tốc độ 0–400; sai = 0, không trừ", () => {
    expect(scoreAnswer(base).pts).toBe(1000);
    expect(scoreAnswer({ ...base, elapsedMs: 10_000 }).pts).toBe(800);
    expect(scoreAnswer({ ...base, elapsedMs: 30_000 }).pts).toBe(600);
    expect(scoreAnswer({ ...base, ok: false, streakBefore: 4 })).toEqual({ pts: 0, streak: 0 });
  });
  it("không tính giờ → mỗi câu đúng 1000", () => expect(scoreAnswer({ ...base, limitSec: 0, elapsedMs: 99_000 }).pts).toBe(SCORE.noTimer));
  it("thưởng chuỗi đúng 3–4: +100, 5–6: +200, ≥7: +300", () => {
    expect([2, 3, 4, 5, 6, 7, 12].map(streakBonus)).toEqual([0, 100, 100, 200, 200, 300, 300]);
    expect(scoreAnswer({ ...base, elapsedMs: 20_000, streakBefore: 2 })).toEqual({ pts: 700, streak: 3 });
  });
  it("song ngữ +100, nhân đôi, Power Play +50%", () => {
    expect(scoreAnswer({ ...base, elapsedMs: 20_000, bilingual: true }).pts).toBe(700);
    expect(scoreAnswer({ ...base, elapsedMs: 20_000, double: true }).pts).toBe(1200);
    expect(scoreAnswer({ ...base, elapsedMs: 20_000, powerPlay: true }).pts).toBe(900);
  });
  it("đóng băng thời gian: luôn được thưởng tốc độ tối đa", () => expect(scoreAnswer({ ...base, elapsedMs: 19_000, frozen: true }).pts).toBe(1000));
  it("câu cứu điểm tối đa 300, không đổi chuỗi", () => {
    expect(scoreAnswer({ ...base, redeem: true, streakBefore: 5 })).toEqual({ pts: 300, streak: 5 });
    expect(scoreAnswer({ ...base, redeem: true, elapsedMs: 20_000 }).pts).toBe(150);
  });
  it("Ghép bộ ba: mỗi lần ghép sai -100 (không dưới 200)", () => {
    expect(scoreAnswer({ ...base, wrongTries: 2 }).pts).toBe(800);
    expect(scoreAnswer({ ...base, elapsedMs: 20_000, wrongTries: 9 }).pts).toBe(200);
  });
});

describe("chấm đáp án", () => {
  const mcq: GameQ = { id: "a", kind: "mcq", prompt: { en: "", vi: "" }, options: [], skill: "Toán" };
  it("trắc nghiệm, nhập số (dấu phẩy), gõ chữ sai chính tả nhẹ", () => {
    expect(gradeGame(mcq, { answer: 2, show: "" }, 2).ok).toBe(true);
    expect(gradeGame({ ...mcq, kind: "number" }, { num: 2.5, show: "" }, "2,5").ok).toBe(true);
    expect(gradeGame({ ...mcq, kind: "text" }, { accept: ["cell wall"], show: "" }, "cel wall").ok).toBe(true);
    expect(gradeGame({ ...mcq, kind: "text" }, { accept: ["cell wall"], show: "" }, "").ok).toBe(false);
  });
  it("Ghép bộ ba: đúng mọi nhóm, thứ tự thẻ không quan trọng", () => {
    const key: GameKey = { groups: [["a", "b", "c"], ["d", "e", "f"]], show: "" };
    const q = { ...mcq, kind: "match" as const };
    expect(gradeGame(q, key, JSON.stringify([["c", "a", "b"], ["f", "d", "e"]])).ok).toBe(true);
    expect(gradeGame(q, key, JSON.stringify([["a", "b", "f"], ["d", "e", "c"]]))).toEqual({ ok: false, wrongGroups: 2 });
    expect(gradeGame(q, key, "rác").ok).toBe(false);
  });
});

describe("xếp hạng & power-up", () => {
  const rows = { a: { s: 900 }, b: { s: 900 }, c: { s: 500 }, d: { s: 0 } };
  it("bằng điểm cùng hạng; khoảng cách để vượt bạn ngay trên", () => {
    const r = ranking(rows);
    expect([r.get("a"), r.get("b"), r.get("c"), r.get("d")]).toEqual([1, 1, 3, 4]);
    expect(gapAbove(rows, "c")).toBe(401);
    expect(gapAbove(rows, "a")).toBeNull();
  });
  it("chạm chuỗi 3 / 6 → chắc chắn nhận power-up; ngoài ra chỉ 15%", () => {
    expect(drawPower(3, 0, () => 0.99)).not.toBeNull();
    expect(drawPower(1, 0, () => 0.5)).toBeNull();
    expect(drawPower(1, 0, () => 0.1)).not.toBeNull();
  });
  it("em đứng sau dễ nhận loại mạnh (×2 / Giữ chuỗi / Làm lại)", () => expect(["double", "saver", "immunity"]).toContain(drawPower(3, 0.9, () => 0.01)));
  it("50-50 / Cục tẩy không bao giờ ẩn đáp án đúng", () => {
    const r = rng(5);
    for (let k = 0; k < 20; k++) {
      const f = hiddenOptions(4, 1, "fifty", r);
      expect(f).toHaveLength(2);
      expect(f).not.toContain(1);
      expect(hiddenOptions(4, 3, "eraser", r)).toHaveLength(1);
    }
  });
});

describe("sinh câu hỏi từ tiết đang dạy", () => {
  it("lấy câu trắc nghiệm / nhập số / gõ chữ của tiết, giữ YCCĐ", () => {
    const slides = SLIDES.map((s) => (s.question ? { ...s, outcomeIds: ["n8-33-1"] } : s));
    const b = fromSlides(slides, KEYS, TERMS);
    expect(b.length).toBeGreaterThanOrEqual(4);
    expect(b.every((x) => ["mcq", "number", "text"].includes(x.q.kind))).toBe(true);
    expect(b.some((x) => x.q.outcomeIds?.includes("n8-33-1"))).toBe(true);
  });
  it("câu thuật ngữ: phương án đúng khớp đáp án, không lộ đáp án trong phần công khai", () => {
    const b = fromTerms(TERMS, rng(1));
    expect(b).toHaveLength(TERMS.length);
    b.forEach(({ q, key }) => {
      expect(q.options!.length).toBe(4);
      expect(q.options![key.answer!].en).toBe(key.show);
      expect(JSON.stringify(q)).not.toContain('"answer"');
    });
  });
  it("Ghép bộ ba: mỗi vòng 4 bộ = 12 thẻ, nhóm đáp án dùng đúng id thẻ", () => {
    const [m] = matchRounds(TERMS, 7, 1, rng(2));
    expect(m.q.cards).toHaveLength(12);
    const ids = new Set(m.q.cards!.map((c) => c.id));
    m.key.groups!.forEach((g) => g.forEach((id) => expect(ids.has(id)).toBe(true)));
  });
  it("cả trận: đủ số câu, cùng hạt giống ra cùng đề", () => {
    const opts = { mode: "arena" as const, slides: SLIDES, keys: KEYS, terms: TERMS, grade: 7, count: 10, seed: 42 };
    const a = buildGame(opts);
    expect(a.questions).toHaveLength(10);
    expect(a.keys).toHaveLength(10);
    expect(buildGame(opts).questions.map((q) => q.id)).toEqual(a.questions.map((q) => q.id));
  });
  it("cài đặt lạ → giá trị an toàn", () => {
    expect(cleanSettings("arena", { qTime: 7, count: 999, level: "zz" as never })).toMatchObject({ qTime: 20, count: 30, level: "e2", powerups: true });
    expect(cleanSettings("boat", {})).toMatchObject({ team: true, powerups: false });
    expect(cleanSettings("match", { qTime: 0 }).qTime).toBe(60);
  });
});

describe("XP của trận", () => {
  it("điểm ÷ 1000 (tối đa 30) + tổ thắng +10 + phá kỉ lục +5", () => {
    expect(gameXp(12_400, false, false)).toBe(12);
    expect(gameXp(80_000, true, true)).toBe(45);
    expect(gameXp(0, false, true)).toBe(0);
  });
});
