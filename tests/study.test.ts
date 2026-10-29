import { describe, expect, it } from "vitest";
import { buildQueue, review, vnDayStart, newToday } from "@/lib/study/srs";
import { creditSeconds, isStudyDay, isActiveNow } from "@/lib/study/time";
import { buildItems, gradeQuestion, hwStatus, solutionOf, tally, vocabFor } from "@/lib/study/hw";
import { badges, longestStreak } from "@/lib/study/gamify";
import { lateIn, studentRow, studyMinutes } from "@/lib/analytics";
import { vnDayKey } from "@/lib/live/summary";
import { KEYS, SLIDES, TERMS } from "@/lib/lessons/pythagore";

const NOW = Date.UTC(2026, 9, 11, 3, 0); // 10:00 giờ VN, 11/10/2026
const DAY = 86_400_000;

describe("ôn lặp ngắt quãng", () => {
  it("0:00 giờ VN", () => expect(vnDayStart(NOW)).toBe(Date.UTC(2026, 9, 10, 17, 0)));
  it("thẻ mới nhớ → ôn lại ngày mai", () => {
    const c = review(undefined, "good", NOW);
    expect(c.interval).toBe(1);
    expect(c.reps).toBe(1);
    expect(c.due).toBe(vnDayStart(NOW) + DAY);
  });
  it("nhớ liên tục → giãn khoảng ôn", () => {
    let c = review(undefined, "good", NOW);
    c = review(c, "good", NOW + DAY);
    expect(c.interval).toBe(4);
    c = review(c, "good", NOW + 5 * DAY);
    expect(c.interval).toBe(10);
  });
  it("quên → ôn lại sau 10 phút, giảm hệ số dễ, đếm lần quên", () => {
    const c1 = review(review(undefined, "good", NOW), "again", NOW + DAY);
    expect(c1.due).toBe(NOW + DAY + 10 * 60_000);
    expect(c1.reps).toBe(0);
    expect(c1.lapses).toBe(1);
    expect(c1.ease).toBeCloseTo(2.3);
  });
  it("hệ số dễ không xuống dưới 1.3", () => {
    let c = review(undefined, "again", NOW);
    for (let i = 0; i < 10; i++) c = review(c, "again", NOW);
    expect(c.ease).toBe(1.3);
  });
  it("hàng đợi: thẻ đến hạn trước, tối đa 5 thẻ mới/ngày", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const cards = { a: { ...review(undefined, "good", NOW - 3 * DAY), first: NOW - 3 * DAY }, b: review(undefined, "good", NOW) };
    const q = buildQueue(ids, cards, NOW);
    expect(q[0]).toBe("a");
    expect(q).not.toContain("b");
    expect(newToday(cards, NOW)).toBe(1);
    expect(q.length).toBe(1 + 4);
  });
});

describe("thời gian học thật", () => {
  it("không nhận quá thời gian thật từ lần gửi trước", () => expect(creditSeconds(30, NOW - 10_000, NOW)).toBe(15));
  it("tối đa 120 s một lần", () => expect(creditSeconds(9999, null, NOW)).toBe(120));
  it("dữ liệu bậy → 0", () => expect(creditSeconds("abc", null, NOW)).toBe(0));
  it("ngày học: ≥5 phút hoặc ≥1 hoạt động", () => {
    expect(isStudyDay(299, {})).toBe(false);
    expect(isStudyDay(300, {})).toBe(true);
    expect(isStudyDay(0, { cards: 1 })).toBe(true);
  });
  it("chỉ đếm khi trang hiển thị và có tương tác trong 60 s", () => {
    expect(isActiveNow(true, NOW - 59_000, NOW)).toBe(true);
    expect(isActiveNow(true, NOW - 61_000, NOW)).toBe(false);
    expect(isActiveNow(false, NOW, NOW)).toBe(false);
  });
  it("phút học 7 ngày, bài trễ 7 ngày, trạng thái", () => {
    const studySec = { [vnDayKey(NOW)]: 600, [vnDayKey(NOW - DAY)]: 300, [vnDayKey(NOW - 8 * DAY)]: 6000 };
    expect(studyMinutes(studySec, NOW)).toBe(15);
    expect(lateIn({ x: NOW - DAY, y: NOW - 10 * DAY, z: NOW + DAY }, NOW)).toBe(1);
    const days = { [vnDayKey(NOW)]: true, [vnDayKey(NOW - DAY)]: true, [vnDayKey(NOW - 2 * DAY)]: true };
    const t = { activeDays: 3, inactiveLate: 2 };
    expect(studentRow("u", { uid: "u", classId: "c", days }, NOW, t).status).toBe("active");
    expect(studentRow("u", { uid: "u", classId: "c", days, lateLog: { a: NOW - DAY } }, NOW, t).status).toBe("remind");
    expect(studentRow("u", { uid: "u", classId: "c", days, lateLog: { a: NOW - DAY, b: NOW - 2 * DAY } }, NOW, t).status).toBe("inactive");
  });
});

describe("bài tập về nhà", () => {
  const items = buildItems(SLIDES, KEYS, TERMS);
  const s8 = SLIDES.find((s) => s.id === "s8")!;
  const s9 = SLIDES.find((s) => s.id === "s9")!;
  it("chỉ lấy trang có câu hỏi / luyện nói", () => expect(items.map((i) => i.slideId)).toEqual(["s1", "s3", "s4", "s7", "s8", "s9", "s10"]));
  it("gợi ý tầng 1: thuật ngữ có trong trang", () => expect(vocabFor(SLIDES.find((s) => s.id === "s3")!, TERMS).map((t) => t.en)).toContain("hypotenuse"));
  it("gợi ý tầng 1 không lộ đáp án câu điền từ", () => expect(vocabFor(s9, TERMS).map((t) => t.en)).not.toContain("hypotenuse"));
  it("gợi ý tầng 1: không có thì lấy thuật ngữ đã học trước đó", () => expect(vocabFor(s8, TERMS).length).toBeGreaterThan(0));
  it("không lộ đáp án trong câu giao cho HS", () => expect(JSON.stringify(items)).not.toMatch(/"accept"|"answer"/));
  it("lời giải (tầng 3) có đáp án hiển thị", () => expect(solutionOf(s8, KEYS.s8).show).toBe("√(6² + 8²) = √100 = 10 cm"));
  it("chấm: đúng 100, đã xem lời giải chỉ 30, sai 0", () => {
    expect(gradeQuestion(s8, KEYS.s8, "10", false)).toEqual({ correct: true, points: 100 });
    expect(gradeQuestion(s8, KEYS.s8, "10", true)).toEqual({ correct: true, points: 30 });
    expect(gradeQuestion(s8, KEYS.s8, "50", false)).toEqual({ correct: false, points: 0 });
  });
  it("tổng hợp & hoàn thành", () => {
    const two = [{ slideId: "s8" }, { slideId: "s3" }];
    const half = tally(two, { s8: { correct: true, points: 100, attempts: 1, at: 1 } });
    expect(half).toMatchObject({ answered: 1, total: 2, score: 100, complete: false });
    const all = tally(two, { s8: { correct: true, points: 100, attempts: 1, at: 1 }, s3: { score: 80, points: 80, attempts: 2, at: 2 } });
    expect(all).toMatchObject({ answered: 2, correct: 2, score: 180, complete: true });
  });
  it("trạng thái bài", () => {
    expect(hwStatus(undefined, NOW + DAY, NOW)).toBe("todo");
    expect(hwStatus({ answered: 1 }, NOW + DAY, NOW)).toBe("doing");
    expect(hwStatus(undefined, NOW - 1, NOW)).toBe("missed");
    expect(hwStatus({ completedAt: { toMillis: () => NOW }, late: true }, NOW - 1, NOW)).toBe("late");
  });
});

describe("trò chơi hoá", () => {
  it("chuỗi dài nhất", () => {
    const days = { "20261001": true, "20261002": true, "20261003": true, "20261005": true, "20261031": true, "20261101": true };
    expect(longestStreak(days)).toBe(3);
  });
  it("huy hiệu", () => {
    // 1000 XP = 900 XP mới + 1000 điểm cũ quy đổi (÷10)
    const b = badges({ uid: "u", classId: "c", hwDone: 5, hwLate: 1, xp: 900, totalPoints: 1000, days: { "20261001": true } });
    const got = Object.fromEntries(b.map((x) => [x.id, x.earned]));
    expect(got).toMatchObject({ first: true, hw5: true, ontime: true, xp1000: true, streak3: false, speaker: false });
  });
});
