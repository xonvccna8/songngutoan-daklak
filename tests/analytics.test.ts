import { describe, expect, it } from "vitest";
import { engagement, gradebook, progress, streak, studyDays, topWrongQuestions, topWrongWords } from "@/lib/analytics";
import { summarize, vnDayKey } from "@/lib/live/summary";
import { SLIDES } from "@/lib/lessons/pythagore";
import type { ResponseDoc, SessionDoc } from "@/lib/live/types";

const NOW = Date.UTC(2026, 9, 11, 3, 0); // 10:00 giờ VN, 11/10/2026
const DAY = 86_400_000;
const T = { activeDays: 3, inactiveLate: 2 };

describe("ngày học & trạng thái", () => {
  it("vnDayKey theo giờ Việt Nam", () => {
    expect(vnDayKey(Date.UTC(2026, 9, 10, 18, 0))).toBe("20261011"); // 01:00 sáng 11/10 giờ VN
  });
  const days = { [vnDayKey(NOW)]: true, [vnDayKey(NOW - DAY)]: true, [vnDayKey(NOW - 2 * DAY)]: true, [vnDayKey(NOW - 9 * DAY)]: true };
  it("đếm ngày học trong 7 ngày", () => expect(studyDays(days, NOW)).toBe(3));
  it("chuỗi ngày liên tiếp", () => expect(streak(days, NOW)).toBe(3));
  it("hôm nay chưa học vẫn giữ chuỗi tới hôm qua", () => expect(streak({ [vnDayKey(NOW - DAY)]: true }, NOW)).toBe(1));
  it("Tích cực / Cần nhắc / Chưa học", () => {
    expect(engagement(3, 0, T)).toBe("active");
    expect(engagement(2, 0, T)).toBe("remind");
    expect(engagement(4, 1, T)).toBe("remind");
    expect(engagement(0, 0, T)).toBe("inactive");
    expect(engagement(5, 2, T)).toBe("inactive");
  });
});

const R = (uid: string, slideId: string, p: Partial<ResponseDoc>): ResponseDoc => ({
  id: `${uid}~${slideId}`,
  uid,
  slideId,
  qtype: "mcq",
  skill: "Ngôn ngữ",
  points: 0,
  attempts: 1,
  answeredAt: 0,
  ...p,
});

describe("tóm tắt tiết & phân tích", () => {
  const resp = [
    R("a", "s1", { correct: true, points: 150, value: 1 }),
    R("b", "s1", { correct: false, value: 0 }),
    R("a", "s8", { qtype: "number", skill: "Toán", correct: true, points: 146, value: "400" }),
    // dữ liệu KHTN ghi "Khoa học" → vẫn tính vào phần Toán (không phải Ngôn ngữ)
    R("b", "s8", { qtype: "number", skill: "Khoa học" as ResponseDoc["skill"], correct: false, value: "50" }),
    R("a", "s3", { qtype: "speak", score: 80, points: 80, wrongWords: ["nucleus"] }),
  ];
  const sum = summarize(resp, [{ uid: "a", joinedAt: 1, leftCount: 0 }, { uid: "b", joinedAt: 2, leftCount: 3 }], SLIDES);
  it("điểm và tách Toán / Ngôn ngữ", () => {
    expect(sum.results.a).toMatchObject({ points: 376, answered: 2, correct: 2, mathC: 1, langC: 1, pronN: 1 });
    expect(sum.results.b).toMatchObject({ points: 0, correct: 0, leftCount: 3 });
    expect(sum.accuracy).toBe(50);
    expect(sum.questions.s8.wrong).toEqual({ "50": 1 });
    expect(sum.wrongWords).toEqual({ nucleus: 1 });
  });

  const mk = (id: string, at: number): SessionDoc =>
    ({ id, classId: "c", lessonId: "L", lessonTitle: { en: "x", vi: "Tế bào" }, status: "ended", createdAt: { toMillis: () => at }, ...sum }) as unknown as SessionDoc;
  const sessions = [mk("x2", NOW), mk("x1", NOW - DAY)];

  it("tiến bộ theo tiết (cũ → mới)", () => {
    const p = progress(sessions);
    expect(p.map((x) => x.id)).toEqual(["x1", "x2"]);
    expect(p[0]).toMatchObject({ mathPct: 50, langPct: 50 });
  });
  it("câu sai nhiều nhất + đáp án sai hay gặp", () => {
    const q = topWrongQuestions(sessions);
    expect(q[0]).toMatchObject({ wrongPct: 50, answered: 4 });
    expect(q.find((x) => x.key.endsWith("s8"))?.topWrong).toBe("50");
  });
  it("từ phát âm sai gộp các tiết", () => expect(topWrongWords(sessions)).toEqual([{ word: "nucleus", count: 2 }]));
  it("bảng điểm: vắng = trống", () => {
    const g = gradebook(sessions, ["a", "b", "c"]);
    expect(g.cols.length).toBe(2);
    expect(g.rows[0].total).toBe(752);
    expect(g.rows[2]).toMatchObject({ total: 0, avg: null, absent: 2 });
  });
});
