// Đợt D — tỉ lệ tiếng Anh thực tế + bài về nhà từ câu sai
import { describe, expect, it } from "vitest";
import { SEGMENT_CAP_MS, closeLang, englishOf, roadmapTarget, schoolYearOf, tickLang } from "@/lib/live/english";
import { classRemedial, eachRemedial } from "@/lib/study/remedial";
import type { LiveState } from "@/lib/live/types";

const base = { slideIndex: 0, step: 0, phase: "idle", lang: "bi", timerMs: null, writtenAt: 0, called: null, calledUids: [], pinned: {}, reveal: null } as LiveState;
const MIN = 60_000;

describe("tickLang / closeLang", () => {
  it("lần ghi đầu chỉ bắt đầu đếm; sau đó cộng vào ngôn ngữ ĐANG bật trước lần ghi", () => {
    let s = tickLang(base, base, 1000);
    expect(s.langMs).toEqual({ en: 0, bi: 0, vi: 0 });
    expect(s.langAt).toBe(1000);
    // 5 phút song ngữ rồi GV đổi sang tiếng Anh
    s = tickLang(s, { ...s, lang: "en" }, 1000 + 5 * MIN);
    expect(s.langMs).toEqual({ en: 0, bi: 5 * MIN, vi: 0 });
    // 10 phút tiếng Anh rồi bấm Tiếp
    s = tickLang(s, { ...s, slideIndex: 1 }, 1000 + 15 * MIN);
    expect(s.langMs!.en).toBe(10 * MIN);
    // Kết thúc sau 3 phút nữa (vẫn tiếng Anh)
    expect(closeLang(s, 1000 + 18 * MIN)).toEqual({ en: 13 * MIN, bi: 5 * MIN, vi: 0 });
  });

  it("một đoạn tối đa 20 phút; tiết cũ không có số liệu → 0", () => {
    const s = tickLang(tickLang(base, base, 0), base, 3 * 3600_000);
    expect(s.langMs!.bi).toBe(SEGMENT_CAP_MS);
    expect(closeLang(base, 5000)).toEqual({ en: 0, bi: 0, vi: 0 });
  });
});

describe("englishOf", () => {
  it("quy đổi Anh = 1, Song ngữ = 0,5, Việt = 0; % câu không xem tiếng Việt bỏ qua tiết cũ", () => {
    const e = englishOf({ en: 20 * MIN, bi: 10 * MIN, vi: 10 * MIN }, { a: { answered: 4, viA: 1 }, b: { answered: 4, viA: 3 }, c: { answered: 5 } });
    expect(e.totalMs).toBe(40 * MIN);
    expect(e.enPct).toBe(63); // (20 + 5) / 40
    expect(e.noViPct).toBe(50); // 8 câu, 4 câu xem tiếng Việt; em c (không ghi nhận) bỏ qua
    expect(englishOf({ en: 0, bi: 0, vi: 0 }).enPct).toBe(0);
    expect(englishOf({ en: 0, bi: 0, vi: 0 }).noViPct).toBeNull();
  });

  it("năm học và lộ trình theo giờ Việt Nam", () => {
    expect(schoolYearOf(Date.UTC(2026, 9, 23))).toBe(2026);
    expect(schoolYearOf(Date.UTC(2027, 3, 1))).toBe(2026);
    expect(schoolYearOf(Date.UTC(2026, 7, 31, 18))).toBe(2026); // 01/9 giờ VN
    expect(roadmapTarget(Date.UTC(2026, 9, 23))).toMatchObject({ min: 20, max: 30 });
    expect(roadmapTarget(Date.UTC(2026, 11, 1))).toMatchObject({ min: 40 });
    expect(roadmapTarget(Date.UTC(2027, 2, 1))).toMatchObject({ min: 60 });
  });
});

describe("báo cáo minh chứng", () => {
  const ts = (ms: number) => ({ toMillis: () => ms });
  const S = (id: string, ms: number, uids: string[], enPct?: number, status: "ended" | "live" = "ended") =>
    ({
      id,
      status,
      lessonTitle: { vi: `Bài ${id}`, en: "" },
      endedAt: ts(ms),
      results: Object.fromEntries(uids.map((u) => [u, { answered: 1 }])),
      english: enPct == null ? undefined : { ms: { en: 0, bi: 0, vi: 0 }, totalMs: 40 * MIN, enPct, noViPct: 70 },
    }) as never;
  const list = [
    S("a", Date.UTC(2026, 8, 10), ["x", "y"], 30),
    S("b", Date.UTC(2026, 9, 5), ["x", "z"], 60),
    S("c", Date.UTC(2026, 9, 20), ["y"]), // tiết trước Đợt D: chưa đo
    S("d", Date.UTC(2026, 9, 21), ["x"], 90, "live"), // chưa kết thúc
    S("e", Date.UTC(2026, 4, 1), ["x"], 80), // năm học trước
  ];

  it("đếm tiết, tiết chủ yếu tiếng Anh, HS khác nhau, theo tháng; bỏ tiết chưa xong và năm khác", async () => {
    const { evidenceOf, yearsOf, evidenceCsv } = await import("@/lib/live/evidence");
    const e = evidenceOf(list, 2026);
    expect(e).toMatchObject({ sessions: 3, measured: 2, enSessions: 1, avgEnPct: 45, students: 3, participations: 5 });
    expect(e.months).toEqual([
      { key: "2026-09", n: 1, avgEnPct: 30 },
      { key: "2026-10", n: 2, avgEnPct: 60 },
    ]);
    expect(yearsOf(list)).toEqual([2026, 2025]);
    const csv = evidenceCsv(e, "6A");
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(4);
    expect(csv).toContain('"6A","2026-2027","2026-10-05","Bài b","2","40","60","70"');
  });
});

describe("bài về nhà từ câu sai", () => {
  const R = (uid: string, slideId: string, correct: boolean, qtype: "mcq" | "speak" = "mcq") => ({ uid, slideId, correct, qtype });
  const responses = [
    R("a", "q1", true), R("b", "q1", true), R("c", "q1", true), R("d", "q1", false),
    R("a", "q2", false), R("b", "q2", true), R("c", "q2", false), // d bỏ trống q2
    R("a", "sp", false, "speak"),
  ];
  const joined = ["a", "b", "c", "d"];
  const qs = ["q1", "q2", "q3"]; // q3 chưa mở trong tiết

  it("cả lớp: câu sai/bỏ trống từ 40%; bỏ câu chưa mở và luyện nói", () => {
    expect(classRemedial(responses, joined, qs)).toEqual([{ slideId: "q2", wrongPct: 0.75 }]);
    expect(classRemedial(responses, [], qs)).toEqual([]);
  });

  it("từng em: câu sai hoặc bỏ trống, gộp em giống nhau, em đúng hết không nhận", () => {
    expect(eachRemedial(responses, joined, qs)).toEqual([
      { uids: ["a", "c"], slideIds: ["q2"] },
      { uids: ["d"], slideIds: ["q1", "q2"] },
    ]);
  });
});
