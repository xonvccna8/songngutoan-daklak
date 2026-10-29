import { describe, expect, it } from "vitest";
import { evaluate, maxStep, pointsFor, scoreSpeech } from "@/lib/live/grading";
import * as C from "@/lib/live/controller";
import { KEYS, SLIDES } from "@/lib/lessons/pythagore";
import { INITIAL_STATE, type LiveState } from "@/lib/live/types";

const ctx = { slides: SLIDES, keys: KEYS };
const s0: LiveState = { ...INITIAL_STATE };

describe("chấm điểm", () => {
  const mcq = SLIDES.find((s) => s.id === "s1")!.question!;
  const num = SLIDES.find((s) => s.id === "s8")!.question!;
  const txt = SLIDES.find((s) => s.id === "s9")!.question!;
  it("trắc nghiệm", () => {
    expect(evaluate(mcq, KEYS.s1, 1)).toBe(true);
    expect(evaluate(mcq, KEYS.s1, 0)).toBe(false);
  });
  it("nhập số (chấp nhận dấu phẩy)", () => {
    expect(evaluate(num, KEYS.s8, "10")).toBe(true);
    expect(evaluate(num, KEYS.s8, "10,0")).toBe(true);
    expect(evaluate(num, KEYS.s8, "50")).toBe(false);
  });
  it("gõ chữ cho phép sai chính tả nhẹ", () => {
    expect(evaluate(txt, KEYS.s9, "The hypotenuse.")).toBe(true);
    expect(evaluate(txt, KEYS.s9, "the hypotenus")).toBe(true);
    expect(evaluate(txt, KEYS.s9, "a leg")).toBe(false);
  });
  it("điểm: 100 + thưởng tốc độ giảm 4 theo thứ hạng", () => {
    expect(pointsFor(true, 0)).toBe(150);
    expect(pointsFor(true, 3)).toBe(138);
    expect(pointsFor(true, 20)).toBe(100);
    expect(pointsFor(false, 0)).toBe(0);
  });
  it("phát âm: chấm theo từng từ", () => {
    const r = scoreSpeech("The cell is the basic unit of life.", [{ t: "the cell is the basic unit of life" }]);
    expect(r?.score).toBe(100);
    const r2 = scoreSpeech("The cell is the basic unit of life.", [{ t: "the is the of life" }]);
    expect(r2!.score).toBeLessThan(80);
    expect(r2!.ok[1]).toBe(false); // "cell" bị thiếu
  });
});

describe("nút Tiếp / Lùi", () => {
  it("trang định nghĩa có 5 bước (0–4): hình 4 bước + ý chính", () => expect(maxStep(SLIDES[2])).toBe(4));
  it("hiện hết bước rồi sang trang", () => {
    let s = s0;
    s = C.next(s, ctx);
    expect(s.step).toBe(1);
    s = C.next(s, ctx);
    expect(s.slideIndex).toBe(1);
    expect(s.step).toBe(0);
  });
  it("trang câu hỏi: bước → mở → khoá → công bố → sang trang", () => {
    let s = C.goSlide(s0, 1, ctx);
    s = C.next(s, ctx); // hiện bước 2
    s = C.next(s, ctx);
    expect(s.phase).toBe("open");
    expect(s.timerMs).toBe(30_000);
    s = C.next(s, ctx);
    expect(s.phase).toBe("locked");
    s = C.next(s, ctx);
    expect(s.phase).toBe("reveal");
    expect(s.reveal).toMatchObject({ slideId: "s1", answer: 1 });
    s = C.next(s, ctx);
    expect(s.slideIndex).toBe(2);
    expect(s.reveal).toBeNull();
  });
  it("Lùi từ công bố về khoá, rồi về chưa mở", () => {
    let s = C.revealQ(C.lockQ(C.openQ(C.goSlide(s0, 1, ctx), ctx)), ctx);
    s = C.prev(s, ctx);
    expect(s.phase).toBe("locked");
    s = C.prev(s, ctx);
    expect(s.phase).toBe("idle");
  });
  it("Lùi sang trang trước thì hiện đủ bước", () => {
    const s = C.prev(C.goSlide(s0, 3, ctx), ctx);
    expect(s.slideIndex).toBe(2);
    expect(s.step).toBe(4);
  });
  it("gọi tên ưu tiên em chưa gọi", () => {
    const pool = [
      { uid: "a", name: "An" },
      { uid: "b", name: "Bình" },
    ];
    const r = C.pickName(pool, ["a"], () => 0);
    expect(r?.pick.uid).toBe("b");
    const r2 = C.pickName(pool, ["a", "b"], () => 0);
    expect(r2?.calledUids).toEqual(["a"]);
  });
  it("đồng hồ không bị đặt lại khi ghi thao tác khác", () => {
    const prevS = { ...s0, timerMs: 30_000, writtenAt: 0 };
    const out = C.stamp({ ...prevS, lang: "en" }, prevS, 1000, 11_000);
    expect(out.timerMs).toBe(20_000);
    expect(out.writtenAt).toBe(11_000);
  });
});
