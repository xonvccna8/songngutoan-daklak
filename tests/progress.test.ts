import { describe, expect, it } from "vitest";
import { prevWeekKey, weekKey, weekStartMs, weeklyId } from "@/lib/progress/week";
import { MAX_LEVEL, computeLevel, levelFromXp, levelInfo, levelXp, nextStep, requirements, type Facts } from "@/lib/progress/levels";
import { XP, capXp, hwAnswerXp, hwDoneXp, liveXp, speakGoodCounts, streakBonus, xpTotal } from "@/lib/progress/xp";
import { rankBoard, weeklyBoards } from "@/lib/progress/boards";
import { journeyOf } from "@/lib/progress/facts";

const f = (o: Partial<Facts> = {}): Facts => ({ termsLearned: 0, termsAvailable: 0, speakGood: 0, bestStreak: 0, ...o });

describe("tuần thi đua (thứ Hai giờ VN)", () => {
  it("13/10/2026 thuộc tuần 42", () => expect(weekKey(Date.UTC(2026, 9, 13, 3))).toBe("2026-W42"));
  it("23:30 Chủ nhật VN vẫn là tuần cũ, 0:10 thứ Hai là tuần mới", () => {
    expect(weekKey(Date.UTC(2026, 9, 18, 16, 30))).toBe("2026-W42");
    expect(weekKey(Date.UTC(2026, 9, 18, 17, 10))).toBe("2026-W43");
  });
  it("giáp năm theo chuẩn ISO (1/1/2027 thuộc tuần 53 của 2026)", () => expect(weekKey(Date.UTC(2027, 0, 1, 3))).toBe("2026-W53"));
  it("tuần trước + mốc đầu tuần", () => {
    const now = Date.UTC(2026, 9, 13, 3);
    expect(prevWeekKey(now)).toBe("2026-W41");
    expect(weekStartMs(now)).toBe(Date.UTC(2026, 9, 11, 17)); // 0:00 thứ Hai 12/10 giờ VN
    expect(weeklyId("c1", "2026-W42")).toBe("c1_2026-W42");
  });
});

describe("cấp độ 8 hạng × 3 bậc", () => {
  it("mốc XP từng cấp", () => {
    expect([0, 1, 2, 3, 4, 5].map(levelXp)).toEqual([0, 100, 200, 300, 470, 630]);
    expect(levelXp(21)).toBe(12000);
    expect(levelXp(MAX_LEVEL)).toBe(16000);
  });
  it("tên cấp song ngữ", () => {
    expect(levelInfo(0)).toMatchObject({ vi: "Nhập môn I", en: "Novice I" });
    expect(levelInfo(7).vi).toBe("Khám phá II");
    expect(levelInfo(99).vi).toBe("Huyền thoại III");
  });
  it("XP quyết định cấp khi chưa tới hạng mới", () => {
    expect(levelFromXp(0)).toBe(0);
    expect(levelFromXp(250)).toBe(2);
    expect(levelFromXp(99999)).toBe(MAX_LEVEL);
  });
  it("đủ XP nhưng thiếu điều kiện → dừng ở bậc III của hạng cũ", () => {
    expect(computeLevel(500, f())).toBe(2); // chưa nhớ đủ 10 thuật ngữ
    expect(computeLevel(500, f({ termsLearned: 10 }))).toBe(4); // Tập sự II
  });
  it("ngân hàng ít thuật ngữ → chỉ đòi 80% số đang có", () => {
    expect(requirements(1, f({ termsAvailable: 9 }))[0].goal).toBe(8);
    expect(computeLevel(500, f({ termsLearned: 8, termsAvailable: 9 }))).toBe(4);
  });
  it("không bao giờ rớt cấp", () => expect(computeLevel(0, f(), 6)).toBe(6));
  it("bước tiếp theo: còn bao nhiêu XP, thiếu điều kiện nào", () => {
    const s = nextStep(250, f(), 2);
    expect(s.next?.vi).toBe("Tập sự I");
    expect(s.xpNeeded).toBe(50);
    expect(s.requirements).toHaveLength(1);
    const blocked = nextStep(400, f(), 2);
    expect(blocked.xpNeeded).toBe(0);
    expect(blocked.blocked).toBe(true);
    expect(nextStep(20000, f(), MAX_LEVEL).next).toBeNull();
  });
});

describe("bảng tích XP", () => {
  it("tiết học: tham gia + đúng + ngôn ngữ", () => expect(liveXp({ answered: 3, correct: 2, langC: 1, pronN: 1 }, 1)).toBe(38));
  it("bài về nhà", () => {
    expect(hwAnswerXp(true, false)).toBe(XP.hwCorrect + XP.hwNoHint);
    expect(hwAnswerXp(true, true)).toBe(XP.hwCorrect);
    expect(hwAnswerXp(false, false)).toBe(0);
    expect(hwDoneXp(false)).toBe(30);
    expect(hwDoneXp(true)).toBe(20);
  });
  it("đếm câu nói đạt yêu cầu", () =>
    expect(speakGoodCounts([{ uid: "a", qtype: "speak", score: 85 }, { uid: "a", qtype: "speak", score: 60 }, { uid: "b", qtype: "mcq", score: 100 }])).toEqual({ a: 1 }));
  it("thưởng chuỗi đúng mốc", () => expect([2, 3, 7, 30, 31].map(streakBonus)).toEqual([0, 10, 30, 100, 0]));
  it("giới hạn XP ở nhà 200/ngày", () => {
    const r = capXp(20, "home", "hw", { day: "20261013", home: 190, cards: 0 }, "20261013");
    expect(r.xp).toBe(10);
    expect(r.today.home).toBe(200);
    expect(capXp(20, "class", "live", { day: "20261013", home: 200, cards: 0 }, "20261013").xp).toBe(20); // trên lớp không giới hạn
  });
  it("thẻ từ tối đa 30/ngày, sang ngày mới đếm lại", () => {
    expect(capXp(1, "home", "cards", { day: "20261013", home: 50, cards: 30 }, "20261013").xp).toBe(0);
    expect(capXp(1, "home", "cards", { day: "20261012", home: 200, cards: 30 }, "20261013")).toEqual({ xp: 1, today: { day: "20261013", home: 1, cards: 1 } });
  });
  it("tổng XP = XP mới + điểm cũ ÷ 10", () => expect(xpTotal({ xp: 120, totalPoints: 4567 })).toBe(577));
  it("dữ liệu cũ chưa có cấp → tính tạm cùng công thức", () => expect(journeyOf({ uid: "u", classId: "c", totalPoints: 2500 }).level).toBe(2));
});

describe("bảng xếp hạng tuần", () => {
  const ppl = Array.from({ length: 8 }, (_, i) => ({ uid: `u${i}`, name: `HS ${i}`, team: (i % 2) + 1, points: [500, 400, 400, 300, 200, 100, 50, 0][i] }));
  it("top 5, bằng điểm cùng hạng, em đứng cuối vẫn biết hạng mình", () => {
    const b = rankBoard(ppl, "u7");
    expect(b.top.map((r) => r.rank)).toEqual([1, 2, 2, 4, 5]);
    expect(b.me).toEqual({ rank: 8, points: 0, total: 8, above: { name: "HS 6", gap: 50 } });
  });
  it("bạn ngay trên phải có điểm cao hơn (không tính bạn bằng điểm)", () => expect(rankBoard(ppl, "u2").me?.above).toEqual({ name: "HS 0", gap: 100 }));
  it("tuần mới chưa ai có điểm → top trống", () => expect(rankBoard(ppl.map((p) => ({ ...p, points: 0 })), "u1").top).toEqual([]));
  it("trên lớp / ở nhà / tiến bộ / tổ", () => {
    const people = [
      { uid: "a", name: "An", team: 1 },
      { uid: "b", name: "Bình", team: 2 },
    ];
    const cur = { classId: "c", week: "w", rows: { a: { c: 50, h: 10 }, b: { c: 20, h: 80 } } };
    const prev = { classId: "c", week: "w0", rows: { a: { c: 70, h: 30 }, b: { c: 10, h: 10 } } };
    const w = weeklyBoards(people, "a", cur, prev);
    expect(w.class.top[0].name).toBe("An");
    expect(w.home.top[0].name).toBe("Bình");
    expect(w.improve.top).toEqual([{ rank: 1, name: "Bình", team: 2, points: 80, isMe: false }]); // An giảm → 0, không vào top
    expect(w.teams.map((t) => t.avg)).toEqual([100, 60]);
  });
});
