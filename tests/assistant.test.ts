import { describe, expect, it } from "vitest";
import { suggest } from "@/lib/live/assistant";
import { makePairs, partnersOf, swapInPairs } from "@/lib/live/pairing";
import { markPhase, phaseOf, planMinutes, timelineView } from "@/lib/live/timeline";
import { SLIDES } from "@/lib/lessons/pythagore";
import { INITIAL_STATE, type LiveState, type ParticipantDoc, type ResponseDoc } from "@/lib/live/types";

const M = 60_000;
const idx = (id: string) => SLIDES.findIndex((s) => s.id === id);
const st = (o: Partial<LiveState>): LiveState => ({ ...INITIAL_STATE, ...o });
const resp = (uid: string, slideId: string, correct: boolean, vi = false): ResponseDoc => ({ id: `${uid}~${slideId}`, uid, slideId, qtype: "mcq", skill: "Toán", value: correct ? 1 : 0, correct, vi, points: 0, attempts: 1, answeredAt: 1 });
const people = (n: number): ParticipantDoc[] => Array.from({ length: n }, (_, i) => ({ uid: `u${i}`, visible: true, leftCount: 0 }));
const name = (u: string) => `Em ${u}`;

describe("thanh thời gian 4 hoạt động", () => {
  it("kế hoạch: mặc định 5/15/12/10/3 cho 45 phút, co giãn theo số phút, GV soạn thì theo GV", () => {
    expect(planMinutes(45)).toEqual([5, 15, 12, 10, 3]);
    expect(planMinutes(90)).toEqual([10, 30, 24, 20, 6]);
    expect(planMinutes(45, [3, 20, 10, 10, 2])).toEqual([3, 20, 10, 10, 2]);
  });
  it("chặng của trang + chỉ ghi mốc lần đầu chiếu tới", () => {
    expect(phaseOf(SLIDES, idx("s11"))).toBe(5);
    expect(phaseOf(SLIDES, idx("s1"))).toBe(1);
    expect(phaseOf(SLIDES, idx("s4"))).toBe(2);
    expect(phaseOf(SLIDES, idx("s8"))).toBe(3);
    // Tiết cũ chưa gắn hoạt động → suy theo vị trí
    expect(phaseOf([{ type: "content" }, { type: "mcq" }, { type: "mcq" }, { type: "final" }], 0)).toBe(1);
    const a = markPhase(st({ slideIndex: 0 }), SLIDES, 1000);
    expect(a.actStarts?.[1]).toBe(1000);
    expect(markPhase(a, SLIDES, 5000).actStarts?.[1]).toBe(1000);
  });
  it("kế hoạch so với thực tế; quá hơn 1 phút mới báo vượt", () => {
    const v = timelineView([5, 15, 12, 10, 3], { 1: 0, 2: 6 * M }, 2, 23 * M);
    expect(v[0]).toMatchObject({ status: "done", usedMs: 6 * M, over: false });
    expect(v[1]).toMatchObject({ status: "current", usedMs: 17 * M, over: true });
    expect(v[2]).toMatchObject({ status: "upcoming", usedMs: 0 });
  });
});

describe("ghép cặp", () => {
  it("em mạnh tiếng Anh nhất ghép với em mạnh kiến thức nhất; em chưa có dữ liệu ghép với nhau; lẻ → nhóm 3", () => {
    const pairs = makePairs(
      [
        { uid: "anh", lang: 0.95, sci: 0.4 },
        { uid: "kt", lang: 0.3, sci: 0.95 },
        { uid: "deu", lang: 0.7, sci: 0.7 },
        { uid: "deu2", lang: 0.6, sci: 0.65 },
        { uid: "moi1", lang: null, sci: null },
      ],
      () => 0.5
    );
    expect(pairs[0]).toEqual({ a: "anh", b: "kt" });
    expect(pairs.flatMap((p) => [p.a, p.b, p.c]).filter(Boolean).sort()).toEqual(["anh", "deu", "deu2", "kt", "moi1"]);
    expect(pairs.at(-1)!.c).toBeDefined();
    expect(partnersOf(pairs, "kt")).toEqual(["anh"]);
  });
  it("GV đổi chỗ hai em", () => {
    const p = swapInPairs([{ a: "x", b: "y" }, { a: "z", b: "w" }], "y", "z");
    expect(p).toEqual([{ a: "x", b: "z" }, { a: "y", b: "w" }]);
  });
});

describe("trợ lý gợi ý cho GV", () => {
  const s1 = idx("s1");
  it("câu đang mở: đủ 80% trả lời → gợi ý khoá; sắp hết giờ mà ít em trả lời → +30 giây", () => {
    const P = people(5);
    const lock = suggest({ state: st({ slideIndex: s1, phase: "open" }), slides: SLIDES, responses: ["u0", "u1", "u2", "u3"].map((u) => resp(u, "s1", true)), participants: P, name, left: 20_000, now: 0 });
    expect(lock.find((x) => x.action?.kind === "lock")).toBeDefined();
    const more = suggest({ state: st({ slideIndex: s1, phase: "open" }), slides: SLIDES, responses: [resp("u0", "s1", true)], participants: P, name, left: 8_000, now: 0 });
    expect(more.find((x) => x.action?.kind === "addTime")).toMatchObject({ action: { sec: 30 } });
  });
  it("sau khoá: lớp sai nhiều → giảng lại, tách vướng tiếng Anh / kiến thức", () => {
    const R = [resp("u0", "s1", false), resp("u1", "s1", false), resp("u2", "s1", false), resp("u3", "s1", true, true), resp("u4", "s1", true, true)];
    const g = suggest({ state: st({ slideIndex: s1, phase: "locked" }), slides: SLIDES, responses: R, participants: people(5), name, left: null, now: 0 });
    expect(g.find((x) => x.id === "reteach:s1")?.text).toMatch(/chỉ đọc tiếng Anh/);
  });
  it("hai câu liền đúng ≥ 85% → gợi ý chuyển Chỉ tiếng Anh", () => {
    const R = ["s1", "s4"].flatMap((sid) => ["u0", "u1", "u2", "u3"].map((u) => resp(u, sid, true)));
    const g = suggest({ state: st({ slideIndex: idx("s4"), phase: "reveal", lang: "bi" }), slides: SLIDES, responses: R, participants: people(4), name, left: null, now: 0 });
    expect(g.find((x) => x.action?.kind === "langEn")).toBeDefined();
    const en = suggest({ state: st({ slideIndex: idx("s4"), phase: "reveal", lang: "en" }), slides: SLIDES, responses: R, participants: people(4), name, left: null, now: 0 });
    expect(en.find((x) => x.action?.kind === "langEn")).toBeUndefined();
  });
  it("từng em: im lặng 3 câu, đang rời trang, giơ tay lâu; tối đa 5 gợi ý, cảnh báo trước", () => {
    const R = ["s1", "s4", "s8"].flatMap((sid) => ["u0", "u1"].map((u) => resp(u, sid, true)));
    const P: ParticipantDoc[] = [...people(2), { uid: "im", visible: true, leftCount: 0 }, { uid: "roi", visible: false, leftCount: 3 }, { uid: "tay", visible: true, raisedHandAt: 1 }];
    const g = suggest({ state: st({ slideIndex: idx("s8"), phase: "reveal", lang: "en" }), slides: SLIDES, responses: R, participants: P, name, left: null, now: 2 * M });
    expect(g.some((x) => x.id.startsWith("silent:im") && x.action?.kind === "call")).toBe(true);
    expect(g.some((x) => x.id.startsWith("away:roi") && x.action?.kind === "bell")).toBe(true);
    expect(g.some((x) => x.id.startsWith("hand:tay"))).toBe(true);
    expect(g.length).toBeLessThanOrEqual(5);
    expect(g[0].tone).toBe("warn");
  });
  it("vượt thời gian chặng đang dạy → gợi ý chuyển hoạt động", () => {
    const timeline = timelineView([5, 15, 12, 10, 3], { 1: 0 }, 1, 8 * M);
    const g = suggest({ state: st({ slideIndex: 0 }), slides: SLIDES, responses: [], participants: people(3), name, left: null, now: 8 * M, timeline });
    expect(g.find((x) => x.id === "over:1")?.text).toMatch(/quá kế hoạch 3 phút/);
  });
});
