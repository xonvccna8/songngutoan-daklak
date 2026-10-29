import { describe, expect, it } from "vitest";
import { cleanExit, diagnoseQuestion, diagnoseStudent, lightKey, summarizeExits, tallyLights } from "@/lib/live/diagnose";

type R = { qtype: "mcq" | "speak"; skill: "Toán" | "Ngôn ngữ"; correct?: boolean; vi?: boolean };
const r = (skill: R["skill"], correct: boolean, vi = false): R => ({ qtype: "mcq", skill, correct, vi });

describe("đèn hiểu bài", () => {
  const P = (uid: string, v?: "g" | "y" | "r") => ({ uid, lights: v ? { [lightKey("s2", 3)]: v } : {} });
  it("đếm theo trang + bước, chỉ tính em đã bấm", () => {
    const t = tallyLights([P("a", "g"), P("b", "r"), P("c", "y"), P("d")], "s2:3");
    expect(t).toMatchObject({ g: 1, y: 1, r: 1, total: 3, red: ["b"], yellow: ["c"] });
    expect(tallyLights([P("a", "g")], "s2:4").total).toBe(0);
  });
  it("cảnh báo khi đỏ ≥ 30% và có ít nhất 3 em bấm", () => {
    expect(tallyLights([P("a", "r"), P("b", "g"), P("c", "g")], "s2:3").alert).toBe(true);
    expect(tallyLights([P("a", "r"), P("b", "g"), P("c", "g"), P("d", "g")], "s2:3").alert).toBe(false);
    expect(tallyLights([P("a", "r"), P("b", "r")], "s2:3").alert).toBe(false); // mới 2 em
  });
});

describe("chẩn đoán từng em", () => {
  it("vướng tiếng Anh: đúng phần Toán, sai phần Ngôn ngữ", () => {
    expect(diagnoseStudent([r("Toán", true), r("Toán", true), r("Ngôn ngữ", false), r("Ngôn ngữ", false)]).barrier).toBe("language");
  });
  it("vướng kiến thức: sai phần Toán, đúng phần Ngôn ngữ", () => {
    expect(diagnoseStudent([r("Toán", false), r("Toán", false), r("Ngôn ngữ", true), r("Ngôn ngữ", true)]).barrier).toBe("content");
  });
  it("vướng cả hai, ổn", () => {
    expect(diagnoseStudent([r("Toán", false), r("Toán", false), r("Ngôn ngữ", false), r("Ngôn ngữ", false)]).barrier).toBe("both");
    expect(diagnoseStudent([r("Toán", true), r("Toán", true), r("Ngôn ngữ", true), r("Ngôn ngữ", false)]).barrier).toBe("ok");
  });
  it("chỉ đọc tiếng Anh thì sai, có tiếng Việt thì đúng → vướng tiếng Anh", () => {
    const d = diagnoseStudent([r("Toán", false), r("Toán", false, false), r("Toán", true, true), r("Toán", true, true), r("Toán", true, true)]);
    expect(d.en).toEqual({ a: 2, c: 0 });
    expect(d.vi).toEqual({ a: 3, c: 3 });
    expect(d.barrier).toBe("language");
  });
  it("quá ít câu → chưa đủ dữ liệu; luyện nói không tính", () => {
    expect(diagnoseStudent([r("Toán", false)]).barrier).toBe("unknown");
    expect(diagnoseStudent([{ qtype: "speak", skill: "Ngôn ngữ" }, { qtype: "speak", skill: "Ngôn ngữ" }]).barrier).toBe("unknown");
  });
});

describe("chẩn đoán từng câu", () => {
  const A = (correct: boolean, vi: boolean, value: string) => ({ correct, vi, value });
  it("sai nhiều khi chỉ đọc tiếng Anh, đúng khi có tiếng Việt → vướng tiếng Anh", () => {
    const q = diagnoseQuestion([A(false, false, "0"), A(false, false, "0"), A(false, false, "2"), A(true, true, "1"), A(true, true, "1"), A(false, true, "0")]);
    expect(q.verdict).toBe("language");
    expect(q.topWrong).toBe("0");
  });
  it("sai cả khi có tiếng Việt → vướng kiến thức", () => {
    expect(diagnoseQuestion([A(false, false, "3"), A(false, false, "3"), A(false, true, "3"), A(false, true, "3"), A(true, true, "1")]).verdict).toBe("content");
  });
  it("lớp nắm được; quá ít em", () => {
    expect(diagnoseQuestion([A(true, false, "1"), A(true, true, "1"), A(true, false, "1"), A(false, false, "0")]).verdict).toBe("ok");
    expect(diagnoseQuestion([A(false, false, "0")]).verdict).toBe("few");
  });
});

describe("phiếu ra về 3-2-1", () => {
  const terms = ["cell", "nucleus", "cell wall", "chloroplast"];
  it("chỉ nhận từ có trong thuật ngữ của tiết, tối đa 3 từ / 2 ý / 1 câu hỏi", () => {
    const e = cleanExit({ words: ["Cell", "hacker", "nucleus", "cell", "cell wall", "chloroplast"], ideas: ["  Tế bào là đơn vị sống ", "", "ý 3"], question: "Why do plant cells have a wall?" }, terms, 1);
    expect(e).toEqual({ words: ["cell", "nucleus", "cell wall"], ideas: ["Tế bào là đơn vị sống", "ý 3"], question: "Why do plant cells have a wall?", at: 1 });
    expect(cleanExit({}, terms, 1)).toMatch(/chưa điền/);
  });
  it("tổng hợp cho GV: từ được chọn nhiều nhất, ý chính, câu hỏi", () => {
    const s = summarizeExits([
      { uid: "a", exit: { words: ["cell", "nucleus"], ideas: ["x"], question: "q1", at: 1 } },
      { uid: "b", exit: { words: ["cell"], ideas: [], question: "", at: 2 } },
      { uid: "c" },
    ]);
    expect(s.count).toBe(2);
    expect(s.words[0]).toEqual({ word: "cell", n: 2 });
    expect(s.questions).toEqual([{ uid: "a", text: "q1" }]);
  });
});
