import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { KIND_META, kindOf, metaOf, newSlide, problemsOf, sanitizeLesson, sanitizeSlide, type EditorKind, type EditorSlide } from "@/lib/lessons/editor";
import { sanitizeTerm, termId } from "@/lib/lessons/terms";
import { buildLessonDoc } from "@/lib/lessons/word";
import { defaultShow, evaluate, fmtAnswer, parseLabels } from "@/lib/live/grading";
import { revealQ } from "@/lib/live/controller";
import { INITIAL_STATE } from "@/lib/live/types";
import { KEYS, LESSON, SLIDES, TERMS } from "@/lib/lessons/pythagore";

// Tiết mẫu ở dạng trình soạn (giống lúc nhân bản)
const SAMPLE: EditorSlide[] = SLIDES.map((s) => ({ ...s, key: KEYS[s.id] }));
const SAMPLE_META = metaOf({ ...LESSON, terms: TERMS });

describe("làm sạch dữ liệu tiết", () => {
  it("tiết mẫu Định lí Pythagore đi qua bộ làm sạch không mất nội dung", () => {
    const { slides, meta } = sanitizeLesson(JSON.parse(JSON.stringify({ meta: SAMPLE_META, slides: SAMPLE })));
    expect(slides).toHaveLength(SLIDES.length);
    slides.forEach((s, i) => {
      expect(s.blocks).toEqual(SLIDES[i].blocks);
      expect(s.question).toEqual(SLIDES[i].question);
      expect(s.speak).toEqual(SLIDES[i].speak);
      expect(s.key.answer).toEqual(KEYS[s.id].answer);
      expect(s.key.accept).toEqual(KEYS[s.id].accept);
      expect(s.key.notes).toEqual(KEYS[s.id].notes.map((n) => ({ en: n.en ?? "", vi: n.vi ?? "" })));
    });
    expect(meta.terms).toEqual(TERMS);
  });

  it("tiết mẫu không có lỗi khi kiểm tra trước duyệt", () => expect(problemsOf(SAMPLE_META, SAMPLE)).toEqual([]));

  it("mọi loại trang mới đều hợp lệ về cấu trúc", () => {
    (Object.keys(KIND_META) as EditorKind[]).forEach((k) => {
      const s = newSlide(k);
      expect(() => sanitizeSlide(JSON.parse(JSON.stringify(s)), 0)).not.toThrow();
      expect(kindOf(s)).toBe(k);
    });
  });

  it("chặn khối lạ, mã trang lạ, lồng hai cột", () => {
    const base = newSlide("content");
    expect(() => sanitizeSlide({ ...base, blocks: [{ kind: "script", step: 0 }] }, 0)).toThrow();
    expect(() => sanitizeSlide({ ...base, id: "../x" }, 0)).toThrow();
    expect(() => sanitizeSlide({ ...base, blocks: [{ kind: "cols", left: [{ kind: "cols", left: [], right: [] }], right: [] }] }, 0)).toThrow();
    expect(() => sanitizeLesson({ meta: {}, slides: [base, base] })).toThrow(/trùng/);
  });

  it("cắt chuỗi quá dài, giới hạn bước, bỏ trường lạ", () => {
    const s = sanitizeSlide({ ...newSlide("content"), title: { en: "x".repeat(999), vi: "y" }, blocks: [{ kind: "text", step: 99, text: { en: "a", vi: "b" }, evil: 1 }], hacked: true }, 3);
    expect(s.title.en).toHaveLength(300);
    expect(s.blocks[0]).toEqual({ kind: "text", step: 20, text: { en: "a", vi: "b" } });
    expect("hacked" in s).toBe(false);
    expect(s.order).toBe(3);
  });

  it("đáp án trắc nghiệm nằm trong số phương án", () => {
    const s = sanitizeSlide({ ...newSlide("mcq"), key: { answer: 9, notes: [] } }, 0);
    expect(s.key.answer).toBe(3);
  });
});

describe("kiểm tra trước khi gửi duyệt", () => {
  const meta = { ...SAMPLE_META };
  it("báo thiếu đề, đáp án, nhãn", () => {
    const mcq = newSlide("mcq");
    const label = newSlide("label");
    label.key.order = [0, 0];
    const p = problemsOf(meta, [mcq, newSlide("number"), newSlide("text"), label, newSlide("speak")]);
    const msgs = p.map((x) => `${x.slide}:${x.msg}`);
    expect(msgs).toContain("0:Thiếu đề bài tiếng Anh.");
    expect(msgs).toContain("0:Có phương án còn trống.");
    expect(msgs).toContain("1:Chưa nhập đáp số.");
    expect(msgs).toContain("2:Chưa có câu trả lời được chấp nhận.");
    expect(msgs).toContain("3:Hai ô dùng chung một nhãn.");
    expect(msgs).toContain("4:Thiếu câu mẫu luyện nói.");
  });
  it("thiếu tên bài", () => expect(problemsOf({ ...meta, title: { en: "", vi: "x" } }, SAMPLE)[0].msg).toMatch(/tên bài/));
});

describe("câu kéo nhãn", () => {
  const q = {
    type: "label" as const,
    time: 30,
    skill: "Ngôn ngữ" as const,
    prompt: { en: "Label the parts", vi: "Gắn nhãn" },
    targets: [
      { en: "green parts", vi: "Phần màu xanh" },
      { en: "pink circle", vi: "Hình tròn hồng" },
    ],
    options: [
      { en: "nucleus", vi: "nhân tế bào" },
      { en: "chloroplast", vi: "lục lạp" },
      { en: "vacuole", vi: "không bào" },
    ],
  };
  const key = { order: [1, 0], notes: [] };
  it("đúng khi ghép đủ và đúng", () => expect(evaluate(q, key, "1,0")).toBe(true));
  it("sai khi đảo, thiếu, thừa", () => {
    expect(evaluate(q, key, "0,1")).toBe(false);
    expect(evaluate(q, key, "1")).toBe(false);
    expect(evaluate(q, key, "1,0,2")).toBe(false);
    expect(evaluate(q, key, "1,")).toBe(false);
  });
  it("không có đáp án thì không bao giờ đúng", () => expect(evaluate(q, { notes: [] }, "")).toBe(false));
  it("đọc chuỗi trả lời an toàn", () => expect(parseLabels("2, x,,1")).toEqual([2, -1, -1, 1]));
  it("hiển thị đáp án", () => {
    expect(defaultShow(q, key)).toBe("Phần màu xanh → chloroplast · Hình tròn hồng → nucleus");
    expect(fmtAnswer(q, "0,9")).toBe("Phần màu xanh → nucleus · Hình tròn hồng → ?");
  });
  it("công bố trên lớp tự tạo đáp án hiển thị", () => {
    const slide = { ...newSlide("label"), question: q };
    const st = revealQ({ ...INITIAL_STATE, slideIndex: 0 }, { slides: [slide], keys: { [slide.id]: key } });
    expect(st.reveal?.show).toBe("Phần màu xanh → chloroplast · Hình tròn hồng → nucleus");
  });
});

describe("ngân hàng thuật ngữ", () => {
  it("mã thuật ngữ", () => expect(termId("Cell  Membrane!")).toBe("cell-membrane"));
  it("bắt buộc tiếng Anh + tiếng Việt", () => {
    expect(sanitizeTerm({ en: "", vi: "x" })).toMatch(/tiếng Anh/);
    expect(sanitizeTerm({ en: "leg", vi: " " })).toMatch(/tiếng Việt/);
  });
  it("chỉ nhận hình https", () => expect(sanitizeTerm({ en: "leg", vi: "cạnh bên", imageUrl: "javascript:alert(1)" })).toMatch(/https/));
  it("làm sạch", () =>
    expect(sanitizeTerm({ en: "  base   angle ", vi: "góc ở đáy", grade: 12, example: { en: "", vi: "" } })).toEqual({
      en: "base angle",
      vi: "góc ở đáy",
      ipa: "",
      grade: 8, // khối khác 8 → về lớp 8
      readAs: undefined,
      imageUrl: null,
      example: undefined,
    }));
});

describe("xuất Word", () => {
  it("tạo được file .docx từ tiết mẫu", async () => {
    const buf = await Packer.toBuffer(buildLessonDoc(SAMPLE_META, SAMPLE, "GV Mẫu"));
    expect(buf.byteLength).toBeGreaterThan(5000);
    expect(buf.subarray(0, 2).toString()).toBe("PK"); // tệp docx là tệp zip
  });
});
