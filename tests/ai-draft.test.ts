import { describe, expect, it } from "vitest";
import { AI_DRAFT_SCHEMA, draftToLesson, type AiDraft, type AiSlide } from "@/lib/lessons/ai-draft";
import { kindOf, problemsOf } from "@/lib/lessons/editor";

const B = (en: string, vi: string) => ({ en, vi });
const E = B("", "");
const slide = (p: Partial<AiSlide>): AiSlide => ({
  activity: 2,
  kind: "content",
  title: B("Title", "Tiêu đề"),
  points: [],
  prompt: E,
  options: [],
  answer_index: 0,
  answer_number: null,
  unit: "",
  accept: [],
  targets: [],
  speak_target: "",
  explain: E,
  notes: [],
  skill: "Toán",
  ...p,
});

const DRAFT: AiDraft = {
  title: B("Cells", "Tế bào"),
  subtitle: "KHTN 6",
  equipment: "Tivi",
  objectives: { content: B("a", "b"), communication: B("c", "d"), cognition: B("e", "f"), culture: B("g", "h") },
  activities: [
    { goal: "g1", product: "p1" },
    { goal: "g2", product: "p2" },
  ],
  terms: [
    { en: "nucleus", ipa: "/ˈnjuːkliəs/", vi: "nhân tế bào", slide: 1 },
    { en: "Nucleus", ipa: "", vi: "trùng", slide: 0 },
  ],
  slides: [
    slide({ activity: 4, kind: "final", title: B("Summary", "Tổng kết"), points: [B("All living things are made of cells", "Mọi sinh vật đều cấu tạo từ tế bào")] }),
    slide({ activity: 2, kind: "content", points: [B("A", "a"), B("B", "b")], notes: [B("Look at the board.", "Nhìn lên bảng.")] }),
    slide({ activity: 1, kind: "tf", prompt: B("Is it true?", "Đúng không?"), answer_index: 1 }),
    slide({ activity: 3, kind: "mcq", prompt: B("Pick", "Chọn"), options: [B("x", "x")], answer_index: 7 }),
    slide({ activity: 3, kind: "number", prompt: B("Temperature?", "Nhiệt độ?"), answer_number: 37, unit: "°C" }),
    slide({ activity: 3, kind: "label", prompt: B("Label", "Gắn nhãn"), options: [B("chloroplast", "lục lạp"), B("nucleus", "nhân tế bào")], targets: [{ en: "green parts", vi: "phần màu xanh", label_index: 0 }, { en: "pink circle", vi: "hình tròn hồng", label_index: 5 }] }),
    slide({ activity: 2, kind: "speak", speak_target: "The cell is the basic unit of life." }),
    slide({ activity: 3, kind: "text", prompt: B("Write", "Viết"), accept: [" The nucleus controls the cell. ", ""], skill: "Ngôn ngữ" }),
  ],
};

describe("khuôn JSON cho AI (strict)", () => {
  it("mọi object: đủ required, không thêm trường", () => {
    const walk = (s: Record<string, unknown>) => {
      if (s.type === "object") {
        expect(s.additionalProperties).toBe(false);
        expect(new Set(s.required as string[])).toEqual(new Set(Object.keys(s.properties as object)));
        Object.values(s.properties as object).forEach((x) => walk(x as Record<string, unknown>));
      }
      if (s.type === "array") walk(s.items as Record<string, unknown>);
    };
    walk(AI_DRAFT_SCHEMA as unknown as Record<string, unknown>);
  });
});

describe("kết quả AI → tiết nháp", () => {
  const { meta, slides } = draftToLesson(DRAFT, 7);

  it("sắp theo hoạt động 1 → 4, trang tổng kết ở cuối", () => {
    expect(slides.map((s) => s.activity)).toEqual([1, 2, 2, 3, 3, 3, 3, 4]);
    expect(slides.at(-1)!.type).toBe("final");
  });
  it("đúng/sai lưu như trắc nghiệm True/False", () => {
    expect(kindOf(slides[0])).toBe("tf");
    expect(slides[0].key.answer).toBe(1);
  });
  it("trang nội dung: mỗi ý một bước, giữ ghi chú GV", () => {
    expect(slides[1].blocks).toEqual([
      { kind: "text", step: 0, text: B("A", "a") },
      { kind: "text", step: 1, text: B("B", "b") },
    ]);
    expect(slides[1].key.notes).toEqual([B("Look at the board.", "Nhìn lên bảng.")]);
  });
  it("trắc nghiệm thiếu phương án → thêm ô trống, đáp án trong phạm vi", () => {
    const mcq = slides.find((s) => s.type === "mcq" && kindOf(s) === "mcq")!;
    expect(mcq.question!.options).toHaveLength(2);
    expect(mcq.key.answer).toBe(1);
  });
  it("nhập số giữ đáp số + đơn vị", () => {
    const n = slides.find((s) => s.type === "number")!;
    expect(n.key.answer).toBe(37);
    expect(n.question!.unit).toBe("°C");
  });
  it("kéo nhãn: chỉ số sai → -1 (GV phải chọn lại)", () => expect(slides.find((s) => s.type === "label")!.key.order).toEqual([0, -1]));
  it("gõ chữ: bỏ câu trống", () => expect(slides.find((s) => s.type === "text")!.key.accept).toEqual(["The nucleus controls the cell."]));
  it("thuật ngữ: bỏ trùng, trỏ đúng trang sau khi sắp", () => expect(meta.terms).toEqual([{ en: "nucleus", ipa: "/ˈnjuːkliəs/", vi: "nhân tế bào", at: 1 }]));
  it("đủ 4 hoạt động trong giáo án", () => {
    expect(meta.activities).toHaveLength(4);
    expect(meta.activities[0]).toEqual({ goal: "g1", product: "p1" });
    expect(meta.grade).toBe(7); // khối GV chọn (6–9)
  });
  it("bộ kiểm tra chỉ ra chỗ AI làm thiếu", () => {
    const msgs = problemsOf(meta, slides).map((p) => p.msg);
    expect(msgs).toContain("Có phương án còn trống.");
    expect(msgs).toContain("Chưa chọn nhãn đúng cho mọi ô.");
  });
  it("AI không trả trang nào → báo lỗi dễ hiểu", () => expect(() => draftToLesson({ ...DRAFT, slides: [] }, 7)).toThrow(/chưa đề xuất/));
});
