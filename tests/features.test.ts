// Test 4 chức năng: hình học động / mô phỏng, ngân hàng câu hỏi (+ AI), dự án STEM, cộng đồng học tập
import { describe, expect, it } from "vitest";
import { LAB_SIMS, isBuiltInSim, searchSims, simLaunchUrl } from "@/lib/lab/sims";
import { embedUrl, netlogoUrl, phetSlug, sanitizeResource, simSource, sketchfabId } from "@/lib/library/resources";
import { answerText, emptyBankInput, sanitizeBankInput, toKey, toSlide } from "@/lib/bank/questions";
import { aiToBank, type AiQuestion } from "@/lib/bank/ai";
import { gradeQuestion, solutionOf } from "@/lib/study/hw";
import { curLesson } from "@/lib/curriculum";
import { rubricScore10, sanitizeLinks, sanitizeProject, sanitizeScores, stagesDone, stemXp } from "@/lib/stem/projects";
import { cleanPostText, displayName } from "@/lib/community/posts";
import { XP } from "@/lib/progress/xp";

const NOW = Date.UTC(2026, 9, 23, 3, 0);
const L18 = curLesson("k8-35")!; // Toán 8 · Bài 35. Định lí Pythagore

describe("hình học động · mô phỏng Toán", () => {
  it("mã mô phỏng duy nhất", () => expect(new Set(LAB_SIMS.map((s) => s.slug)).size).toBe(LAB_SIMS.length));
  it("mỗi mô phỏng có nhiệm vụ + từ vựng song ngữ", () => {
    LAB_SIMS.forEach((s) => {
      expect(s.tasks.length).toBeGreaterThanOrEqual(2);
      s.tasks.forEach((t) => expect(t.en && t.vi).toBeTruthy());
      expect(s.vocab.length).toBeGreaterThan(0);
    });
  });
  it("lọc theo khối, tìm không dấu; khối nào cũng có mô phỏng", () => {
    expect(searchSims({ grade: 8 }).every((s) => s.grades.includes(8))).toBe(true);
    for (const g of [6, 7, 8, 9]) expect(searchSims({ grade: g }).length, `lớp ${g}`).toBeGreaterThanOrEqual(4);
    expect(LAB_SIMS.every((s) => s.grades.every((g) => g >= 6 && g <= 9))).toBe(true);
    expect(searchSims({ q: "phan so" }).map((s) => s.slug)).toContain("fractions-intro");
    expect(searchSims({ q: "parabol" }).map((s) => s.slug)).toContain("graphing-quadratics");
  });
  it("PhET và GeoGebra mở theo ngôn ngữ chọn", () => {
    expect(simLaunchUrl(LAB_SIMS.find((s) => s.slug === "graphing-lines")!, "vi")).toBe("https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_all.html?locale=vi");
    expect(simLaunchUrl(LAB_SIMS.find((s) => s.slug === "geogebra-geometry")!, "vi")).toBe("https://www.geogebra.org/geometry?lang=vi");
  });
  it("đọc link PhET và Sketchfab", () => {
    expect(phetSlug("https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_all.html")).toBe("natural-selection");
    expect(phetSlug("https://phet.colorado.edu/en/simulations/neuron")).toBe("neuron");
    expect(phetSlug("https://evil.com/sims/html/x/latest/x.html")).toBeNull();
    const id = "a".repeat(32);
    expect(sketchfabId(`https://sketchfab.com/3d-models/animal-cell-${id}`)).toBe(id);
    expect(embedUrl({ kind: "simulation", url: "https://phet.colorado.edu/en/simulations/neuron" }, "vi")).toContain("locale=vi");
  });
  it("mô phỏng nhận PhET, ứng dụng GeoGebra, NetLogo Web, Learn.Genetics; từ chối nguồn lạ", () => {
    expect(simSource("https://www.geogebra.org/graphing")).toBe("geogebra");
    expect(simSource("https://www.geogebra.org/m/abc123XY")).toBeNull(); // hình GeoGebra có mã → loại "Hình động GeoGebra"
    const base = { title: { vi: "Mô phỏng", en: "" }, grade: 8, curLessonId: null, note: "" };
    const nl = netlogoUrl("Biology/Wolf Sheep Predation");
    expect(nl).toBe("https://www.netlogoweb.org/web?https://www.netlogoweb.org/assets/modelslib/Sample%20Models/Biology/Wolf%20Sheep%20Predation.nlogo");
    expect(simSource(nl)).toBe("netlogo");
    expect(simSource("https://learn.genetics.utah.edu/content/addiction/mouse/")).toBe("utah");
    expect(simSource("https://phet.colorado.edu/en/simulations/neuron")).toBe("phet");
    expect(simSource("https://evil.example/web?x.nlogo")).toBeNull();
    expect(simSource("http://learn.genetics.utah.edu/content/x")).toBeNull();
    expect(sanitizeResource({ ...base, kind: "simulation", url: nl })).toMatchObject({ kind: "simulation" });
    expect(embedUrl({ kind: "simulation", url: nl })).toBe(nl);
    expect(typeof sanitizeResource({ ...base, kind: "simulation", url: "https://example.com/sim" })).toBe("string");
  });
  it("mô phỏng dựng sẵn không hiện trùng với học liệu cùng link", () => {
    expect(isBuiltInSim("https://phet.colorado.edu/en/simulations/graphing-lines")).toBe(true);
    expect(isBuiltInSim("https://www.geogebra.org/geometry")).toBe(true);
    expect(isBuiltInSim("https://phet.colorado.edu/en/simulations/projectile-motion")).toBe(false);
    expect(LAB_SIMS.length).toBeGreaterThanOrEqual(20);
    LAB_SIMS.filter((s) => s.url).forEach((s) => expect(simSource(s.url!), s.slug).toBe(s.source));
  });
  it("học liệu loại mới: kiểm link", () => {
    const base = { title: { vi: "Tim 3D", en: "" }, grade: 8, curLessonId: null, note: "" };
    expect(typeof sanitizeResource({ ...base, kind: "model3d", url: "https://youtube.com/watch?v=abc" })).toBe("string");
    expect(sanitizeResource({ ...base, kind: "model3d", url: `https://sketchfab.com/models/${"b".repeat(32)}` })).toMatchObject({ kind: "model3d" });
  });
});

describe("ngân hàng câu hỏi", () => {
  const mcq = { ...emptyBankInput(8, "k8-35"), prompt: { en: "What is the longest side of a right triangle?", vi: "Cạnh dài nhất của tam giác vuông là cạnh nào?" }, options: [{ en: "hypotenuse", vi: "cạnh huyền" }, { en: "leg", vi: "cạnh góc vuông" }, { en: "altitude", vi: "đường cao" }, { en: "median", vi: "đường trung tuyến" }], answer: 0, outcomeIds: [L18.outcomes[0]?.id ?? "x", "khong-co"] };

  it("làm sạch trắc nghiệm, bỏ YCCĐ không thuộc bài", () => {
    const b = sanitizeBankInput(mcq);
    if (typeof b === "string") throw new Error(b);
    expect(b.outcomeIds).toEqual(["k8-35-1"]);
  });
  it("báo lỗi khi thiếu phương án / đáp số / câu chấp nhận", () => {
    expect(typeof sanitizeBankInput({ ...mcq, options: [{ en: "a", vi: "" }, { en: "", vi: "" }] })).toBe("string");
    expect(typeof sanitizeBankInput({ ...mcq, type: "number", answer: "abc" })).toBe("string");
    expect(typeof sanitizeBankInput({ ...mcq, type: "text", accept: [] })).toBe("string");
    expect(typeof sanitizeBankInput({ ...mcq, grade: 9 })).toBe("string"); // bài lớp 8 không thuộc khối 9
    expect(typeof sanitizeBankInput({ ...mcq, grade: 5 })).toBe("string"); // ngoài lớp 6–9
  });
  it("chấm như bài về nhà: trắc nghiệm, đúng/sai, nhập số, gõ chữ", () => {
    const grade = (input: object, value: unknown) => {
      const b = sanitizeBankInput(input);
      if (typeof b === "string") throw new Error(b);
      return gradeQuestion(toSlide("q1", b), toKey(b), value, false).correct;
    };
    expect(grade(mcq, 0)).toBe(true);
    expect(grade(mcq, 2)).toBe(false);
    expect(grade({ ...mcq, type: "tf", answer: 1 }, 1)).toBe(true);
    expect(grade({ ...mcq, type: "number", answer: 2.5, unit: "g" }, "2,5")).toBe(true);
    expect(grade({ ...mcq, type: "text", accept: ["hypotenuse"] }, "hypotenuze")).toBe(true);
  });
  it("trang không chứa đáp án; lời giải có sau khi trả lời", () => {
    const b = sanitizeBankInput({ ...mcq, explain: { en: "The hypotenuse is opposite the right angle.", vi: "Cạnh huyền đối diện góc vuông." } });
    if (typeof b === "string") throw new Error(b);
    const slide = toSlide("q1", b);
    expect(JSON.stringify(slide)).not.toContain("answer");
    expect(solutionOf(slide, toKey(b))).toMatchObject({ answer: 0, explain: { vi: "Cạnh huyền đối diện góc vuông." } });
    expect(answerText(b)).toBe("A. hypotenuse");
  });
  it("luyện nói thành trang speak", () => {
    const b = sanitizeBankInput({ ...mcq, type: "speak", speakTarget: "The hypotenuse is the longest side." });
    if (typeof b === "string") throw new Error(b);
    expect(toSlide("q2", b).speak?.target).toBe("The hypotenuse is the longest side.");
    expect(b.skill).toBe("Ngôn ngữ");
  });
  it("kết quả AI: giữ câu hợp lệ, bỏ câu lỗi, gắn bài + YCCĐ", () => {
    const base: AiQuestion = { type: "mcq", level: "know", skill: "Toán", outcome_index: 1, prompt: { en: "Q?", vi: "Hỏi?" }, options: mcq.options, answer_index: 1, answer_number: null, unit: "", accept: [], speak_target: "", method: { en: "", vi: "" }, explain: { en: "", vi: "" } };
    const out = aiToBank([base, { ...base, options: [] }, { ...base, type: "number", answer_number: null }], L18);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ curLessonId: "k8-35", grade: 8, answer: 1 });
  });
});

describe("dự án STEM", () => {
  it("kiểm hạn nộp và tên", () => {
    expect(typeof sanitizeProject({ title: { vi: "" }, grade: 8, dueAt: NOW + 86_400_000 }, NOW)).toBe("string");
    expect(typeof sanitizeProject({ title: { vi: "Đo cột cờ" }, grade: 8, dueAt: NOW + 60_000 }, NOW)).toBe("string");
    expect(sanitizeProject({ title: { vi: "Đo cột cờ" }, grade: 8, dueAt: NOW + 86_400_000, vocab: [{ en: "shadow", vi: "bóng" }, { en: "", vi: "x" }] }, NOW)).toMatchObject({ vocab: [{ en: "shadow" }] });
  });
  it("link sản phẩm chỉ https", () => {
    expect(typeof sanitizeLinks([{ url: "http://a.com" }])).toBe("string");
    expect(sanitizeLinks([{ url: "https://drive.google.com/x", label: "Video" }, { url: "" }])).toEqual([{ url: "https://drive.google.com/x", label: "Video" }]);
  });
  it("rubric → thang 10 và XP", () => {
    expect(typeof sanitizeScores({ science: 4 })).toBe("string");
    const s = { science: 4, product: 4, teamwork: 4, english: 4 };
    expect(rubricScore10(s)).toBe(10);
    expect(stemXp(s)).toBe(XP.stemMax);
    expect(rubricScore10({ science: 2, product: 2, teamwork: 2, english: 2 })).toBe(5);
    expect(stagesDone({ stages: { ask: { done: true, note: "", at: 0, by: "" }, plan: { done: false, note: "", at: 0, by: "" } } })).toBe(1);
  });
});

describe("cộng đồng học tập", () => {
  it("HS không đăng link, số điện thoại", () => {
    expect(cleanPostText("Xem www.abc.com nhé", "student")).toHaveProperty("error");
    expect(cleanPostText("Gọi mình 0912 345 678", "student")).toHaveProperty("error");
    expect(cleanPostText("Xem https://phet.colorado.edu", "teacher")).toBe("Xem https://phet.colorado.edu");
  });
  it("độ dài và kí tự lạ", () => {
    expect(cleanPostText("hi", "student")).toHaveProperty("error");
    expect(cleanPostText("  Why do leaves look green?\u0007  ", "student")).toBe("Why do leaves look green?");
  });
  it("chỉ hiện tên gọi", () => expect(displayName("Nguyễn Thị Lan")).toBe("Lan"));
});
