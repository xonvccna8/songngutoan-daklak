// GĐ 6b — Trợ lý AI soạn bài: khuôn JSON yêu cầu AI trả về, lời nhắc, và chuyển kết quả thành tiết Nháp.
// Hàm thuần (có test trong tests/ai-draft.test.ts). Kết quả luôn đi qua sanitizeLesson như khi GV lưu tay.
import { emptyMeta, newSlideId, sanitizeLesson, type EditorSlide, type LessonMeta } from "@/lib/lessons/editor";
import type { Activity, Bi, Block } from "@/lib/live/types";

export const AI_LIMITS = { perTeacherPerDay: 20, perSchoolPerDay: 100, maxPlanChars: 8000, minPlanChars: 80 };

type AiKind = "content" | "mcq" | "tf" | "number" | "text" | "label" | "speak" | "final";

export interface AiSlide {
  activity: number;
  kind: AiKind;
  title: Bi;
  points: Bi[];
  prompt: Bi;
  options: Bi[];
  answer_index: number;
  answer_number: number | null;
  unit: string;
  accept: string[];
  targets: { en: string; vi: string; label_index: number }[];
  speak_target: string;
  explain: Bi;
  notes: Bi[];
  skill: "Toán" | "Ngôn ngữ";
}

export interface AiDraft {
  title: Bi;
  subtitle: string;
  equipment: string;
  objectives: { content: Bi; communication: Bi; cognition: Bi; culture: Bi };
  activities: { goal: string; product: string }[];
  terms: { en: string; ipa: string; vi: string; slide: number }[];
  slides: AiSlide[];
}

// ---------- Khuôn JSON (structured output, strict: mọi trường bắt buộc, không thêm trường) ----------
const S = { type: "string" } as const;
const BI = { type: "object", additionalProperties: false, required: ["en", "vi"], properties: { en: S, vi: S } } as const;
const obj = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });

export const AI_DRAFT_SCHEMA = obj({
  title: BI,
  subtitle: S,
  equipment: S,
  objectives: obj({ content: BI, communication: BI, cognition: BI, culture: BI }),
  activities: { type: "array", items: obj({ goal: S, product: S }) },
  terms: { type: "array", items: obj({ en: S, ipa: S, vi: S, slide: { type: "integer" } }) },
  slides: {
    type: "array",
    items: obj({
      activity: { type: "integer", enum: [1, 2, 3, 4] },
      kind: { type: "string", enum: ["content", "mcq", "tf", "number", "text", "label", "speak", "final"] },
      title: BI,
      points: { type: "array", items: BI },
      prompt: BI,
      options: { type: "array", items: BI },
      answer_index: { type: "integer" },
      answer_number: { type: ["number", "null"] },
      unit: S,
      accept: { type: "array", items: S },
      targets: { type: "array", items: obj({ en: S, vi: S, label_index: { type: "integer" } }) },
      speak_target: S,
      explain: BI,
      notes: { type: "array", items: BI },
      skill: { type: "string", enum: ["Toán", "Ngôn ngữ"] },
    }),
  },
});

export function systemPrompt(grade: number): string {
  return [
    `Bạn là giáo viên Toán THCS Việt Nam dạy song ngữ Việt–Anh theo phương pháp CLIL, soạn tiết cho lớp ${grade} (sách Kết nối tri thức với cuộc sống).`,
    "Nhiệm vụ: từ giáo án tiếng Việt của giáo viên, đề xuất các trang trình chiếu song ngữ cho MỘT tiết 45 phút, theo 4 hoạt động của Công văn 5512: 1 Mở đầu, 2 Hình thành kiến thức mới, 3 Luyện tập, 4 Vận dụng.",
    "Quy tắc:",
    "- Chỉ dùng kiến thức có trong giáo án; không bịa số liệu, định lí, công thức hay tên người. Thuật ngữ tiếng Việt đúng SGK Toán Việt Nam.",
    "- Tiếng Anh đơn giản (A2–B1), câu ngắn, đúng thuật ngữ toán học (số học, đại số, hình học, thống kê – xác suất); mọi chữ đều có cả en và vi.",
    "- Viết đúng kí hiệu toán học bằng kí tự Unicode: luỹ thừa x², x³; căn √; góc ∠ABC, 90°; song song ∥, vuông góc ⊥; ≠ ≤ ≥ π. Tiếng Việt dùng dấu phẩy thập phân (2,5) và toạ độ A(2; 3); tiếng Anh dùng dấu chấm (2.5) và A(2, 3). Lời giải trình bày từng bước ngắn gọn.",
    "- 10–16 trang, sắp theo hoạt động 1→4. Trang đầu là khởi động (activity 1). Trang cuối kind=final (tổng kết, activity 4).",
    "- Trang content: 2–5 ý trong points (mỗi ý một câu, hiện lần lượt). Câu hỏi: points để trống.",
    "- Có 4–6 câu hỏi đa dạng: mcq (đúng 4 options, answer_index 0–3), tf (options rỗng, answer_index 0 = True, 1 = False), number (answer_number là số, unit như \"cm\", \"cm²\" hoặc \"°\"), text (accept: 1–3 câu tiếng Anh ngắn được chấp nhận), label (options = 3–5 nhãn là thuật ngữ tiếng Anh, targets = 2–4 ô mô tả bằng en/vi, label_index = chỉ số nhãn đúng, mỗi ô một nhãn khác nhau).",
    "- Mỗi ví dụ / bài tập có đáp số trong giáo án nên thành một câu hỏi riêng. Nếu Hoạt động 4 có bài vận dụng thì tạo câu hỏi cho bài đó (activity 4) TRƯỚC trang tổng kết.",
    "- Câu text: đáp án chấp nhận là câu ngắn (≤ 10 từ), đúng mẫu câu đã dạy trong bài.",
    "- Có 1 trang speak: speak_target là một câu tiếng Anh then chốt của bài (≤ 15 từ).",
    "- explain: lời giải ngắn song ngữ cho mỗi câu hỏi; trang khác để chuỗi rỗng.",
    "- notes: 1–2 câu lệnh lớp học / lời giáo viên nói (tiếng Anh + nghĩa tiếng Việt) cho mỗi trang.",
    "- skill: \"Toán\" cho câu hỏi kiến thức/khái niệm/tính toán/chứng minh, \"Ngôn ngữ\" cho câu hỏi về thuật ngữ/câu tiếng Anh.",
    "- terms: 5–10 thuật ngữ then chốt, ipa có dấu gạch chéo, slide = chỉ số trang (từ 0) nơi thuật ngữ xuất hiện lần đầu.",
    "- objectives theo khung 4C; activities đúng 4 phần tử (mục tiêu, sản phẩm của từng hoạt động, tiếng Việt).",
    "- Trường không dùng tới: chuỗi rỗng, mảng rỗng, answer_index 0, answer_number null.",
    "- Không bao giờ đưa tên hay thông tin học sinh.",
  ].join("\n");
}

export const userPrompt = (plan: string, title: string) => `${title ? `Tên bài: ${title}\n` : ""}Giáo án của giáo viên:\n"""\n${plan}\n"""`;

// ---------- Chuyển kết quả AI → tiết Nháp ----------
const bi = (x: Partial<Bi> | undefined): Bi => ({ en: String(x?.en ?? "").trim(), vi: String(x?.vi ?? "").trim() });
/** AI trả thiếu phương án → thêm ô trống để GV tự điền (bộ kiểm tra sẽ nhắc) */
const pad = (list: Bi[], n: number) => [...list, ...Array.from({ length: Math.max(0, n - list.length) }, () => ({ en: "", vi: "" }))];
const TF: Bi[] = [
  { en: "True", vi: "Đúng" },
  { en: "False", vi: "Sai" },
];

function toSlide(a: AiSlide): EditorSlide {
  const activity = Math.min(4, Math.max(1, Math.round(a.activity) || 2)) as Activity;
  const notes = (a.notes ?? []).map(bi).filter((n) => n.en || n.vi);
  const base = { id: newSlideId(), order: 0, title: bi(a.title), activity, blocks: [] as Block[] };
  const explain = bi(a.explain);
  const key = { notes, ...(explain.en || explain.vi ? { explain } : {}) };
  const q = { time: 30, skill: a.skill === "Ngôn ngữ" ? ("Ngôn ngữ" as const) : ("Toán" as const), prompt: bi(a.prompt) };
  const points = (a.points ?? []).map(bi).filter((p) => p.en || p.vi);

  switch (a.kind) {
    case "mcq": {
      const options = pad((a.options ?? []).map(bi).slice(0, 4), 2);
      return { ...base, type: "mcq", question: { ...q, type: "mcq", options }, key: { ...key, answer: Math.min(Math.max(0, a.answer_index), Math.max(0, options.length - 1)) } };
    }
    case "tf":
      return { ...base, type: "mcq", question: { ...q, type: "mcq", time: 20, options: TF.map((o) => ({ ...o })) }, key: { ...key, answer: a.answer_index === 1 ? 1 : 0 } };
    case "number":
      return { ...base, type: "number", question: { ...q, type: "number", time: 45, ...(a.unit ? { unit: a.unit.trim() } : {}) }, key: { ...key, ...(a.answer_number != null ? { answer: a.answer_number } : {}) } };
    case "text":
      return { ...base, type: "text", question: { ...q, type: "text", time: 60 }, key: { ...key, accept: (a.accept ?? []).map((x) => x.trim()).filter(Boolean) } };
    case "label": {
      const targets = (a.targets ?? []).slice(0, 8);
      if (!targets.length) targets.push({ en: "", vi: "", label_index: -1 });
      const options = pad((a.options ?? []).map(bi).slice(0, 10), targets.length);
      return {
        ...base,
        type: "label",
        question: { ...q, type: "label", time: 60, options, targets: targets.map(bi) },
        key: { ...key, order: targets.map((t) => (Number.isInteger(t.label_index) && t.label_index >= 0 && t.label_index < options.length ? t.label_index : -1)) },
      };
    }
    case "speak":
      return { ...base, type: "speak", speak: { target: String(a.speak_target ?? "").trim(), time: 40 }, key };
    case "final":
      return { ...base, type: "final", activity: 4, blocks: points.length ? [{ kind: "goals", step: 0, items: points }] : [], key };
    default:
      // Nội dung: mỗi ý hiện ở một bước (ý đầu hiện ngay)
      return { ...base, type: "content", blocks: points.map((text, i) => ({ kind: "text", step: i, text })), key };
  }
}

/** Kết quả AI → { meta, slides } đã làm sạch (ném lỗi tiếng Việt nếu không dùng được) */
export function draftToLesson(d: AiDraft, grade: number): { meta: LessonMeta; slides: EditorSlide[] } {
  const slides = (d.slides ?? []).slice(0, 30).map(toSlide);
  if (!slides.length) throw new Error("AI chưa đề xuất được trang nào. Thử dán giáo án chi tiết hơn.");
  // Giữ thứ tự theo hoạt động 1 → 4
  const ordered = slides.map((s, i) => ({ s, i })).sort((a, b) => (a.s.activity ?? 2) - (b.s.activity ?? 2) || a.i - b.i);
  const newIndex = new Map(ordered.map((x, j) => [x.i, j]));
  const e = emptyMeta();
  const meta: LessonMeta = {
    ...e,
    title: bi(d.title),
    subtitle: String(d.subtitle ?? "").trim(),
    grade,
    equipment: String(d.equipment ?? "").trim(),
    objectives: { content: bi(d.objectives?.content), communication: bi(d.objectives?.communication), cognition: bi(d.objectives?.cognition), culture: bi(d.objectives?.culture) },
    activities: e.activities.map((_, i) => ({ goal: String(d.activities?.[i]?.goal ?? "").trim(), product: String(d.activities?.[i]?.product ?? "").trim() })),
    terms: (d.terms ?? [])
      .filter((t) => t.en?.trim())
      .filter((t, i, arr) => arr.findIndex((x) => x.en.trim().toLowerCase() === t.en.trim().toLowerCase()) === i)
      .map((t) => ({ en: t.en.trim(), ipa: String(t.ipa ?? "").trim(), vi: String(t.vi ?? "").trim(), at: newIndex.get(Math.round(t.slide)) ?? 0 })),
  };
  return sanitizeLesson(JSON.parse(JSON.stringify({ meta, slides: ordered.map((x) => x.s) })));
}
