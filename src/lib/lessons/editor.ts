// GĐ 6 — Soạn bài: mô hình trình soạn, mẫu trang, câu lệnh lớp học, làm sạch + kiểm tra dữ liệu.
// Hàm thuần (máy chủ + trình duyệt dùng chung), có test trong tests/editor.test.ts
import type { Activity, ActivityPlan, Bi, Block, FigureId, LessonDoc, Objectives4C, QType, Question, Skill, Slide, SlideType, TeacherKey, Term } from "@/lib/live/types";
import { DEFAULT_GRADE, GRADES, isCurLessonId, isOutcomeId } from "@/lib/curriculum";
import { SUBJECT } from "@/lib/subject";

/** Một trang trong trình soạn = nội dung (HS đọc được) + đáp án/ghi chú (chỉ GV) */
export interface EditorSlide extends Slide {
  key: TeacherKey;
}

export type LessonMeta = Pick<LessonDoc, "title" | "subtitle" | "subject" | "grade" | "terms"> & {
  /** Bài trong SGK (khung chương trình) — null = chưa gắn */
  curLessonId: string | null;
  duration: number;
  /** Đợt B — số phút: Mở đầu, Hình thành KT, Luyện tập, Vận dụng, Tổng kết (thanh thời gian trên laptop GV) */
  timing: number[];
  equipment: string;
  objectives: Objectives4C;
  activities: ActivityPlan[];
};

export const emptyBi = (): Bi => ({ en: "", vi: "" });

/** 4 hoạt động theo Công văn 5512 */
export const ACTIVITIES: { n: Activity; vi: string; en: string }[] = [
  { n: 1, vi: "Mở đầu", en: "Warm-up" },
  { n: 2, vi: "Hình thành kiến thức mới", en: "New knowledge" },
  { n: 3, vi: "Luyện tập", en: "Practice" },
  { n: 4, vi: "Vận dụng", en: "Application" },
];

/** Khung 4C của CLIL, kèm gợi ý ghi */
export const FOUR_C: { key: keyof Objectives4C; vi: string; en: string; hint: string }[] = [
  { key: "content", vi: "Nội dung", en: "Content", hint: "Kiến thức Toán học sinh nắm được" },
  { key: "communication", vi: "Giao tiếp", en: "Communication", hint: "Thuật ngữ, mẫu câu tiếng Anh học sinh dùng được" },
  { key: "cognition", vi: "Tư duy", en: "Cognition", hint: "Kĩ năng tư duy: nhận biết, so sánh, suy luận…" },
  { key: "culture", vi: "Văn hoá", en: "Culture", hint: "Liên hệ thực tế, hợp tác, phẩm chất" },
];

// Câu lệnh lớp học & khung câu: xem src/lib/library (GĐ 4 — học liệu số)

/** Loại trang trong trình soạn ("tf" = đúng/sai, lưu như trắc nghiệm 2 phương án) */
export type EditorKind = "content" | "mcq" | "tf" | "number" | "text" | "label" | "speak" | "final";

export const KIND_META: Record<EditorKind, { label: string; hint: string }> = {
  content: { label: "Nội dung", hint: "Trình bày kiến thức, hiện dần từng bước" },
  mcq: { label: "Trắc nghiệm", hint: "2–4 phương án, chọn một" },
  tf: { label: "Đúng / Sai", hint: "Học sinh chọn True hoặc False" },
  number: { label: "Nhập số", hint: "Đáp án là một số" },
  text: { label: "Gõ chữ", hint: "Gõ câu tiếng Anh, chấm gần đúng" },
  label: { label: "Kéo nhãn", hint: "Ghép nhãn (thuật ngữ) vào đúng ô" },
  speak: { label: "Luyện nói", hint: "Đọc to câu mẫu, máy chấm phát âm" },
  final: { label: "Tổng kết", hint: "Tóm tắt bài + bảng vàng điểm" },
};

const TF_OPTIONS: Bi[] = [
  { en: "True", vi: "Đúng" },
  { en: "False", vi: "Sai" },
];

export function kindOf(s: Pick<Slide, "type" | "question">): EditorKind {
  if (s.type === "mcq" && s.question?.options?.length === 2 && s.question.options[0].en === "True" && s.question.options[1].en === "False") return "tf";
  return s.type;
}

export const newSlideId = () => "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Trang mới theo loại (tiêu đề để trống cho GV điền) */
export function newSlide(kind: EditorKind, activity: Activity = 2): EditorSlide {
  const base: EditorSlide = { id: newSlideId(), order: 0, type: kind === "tf" ? "mcq" : kind, title: emptyBi(), blocks: [], activity, key: { notes: [] } };
  const q = (type: QType, extra: Partial<Question> = {}): Question => ({ type, time: 30, skill: "Toán", prompt: emptyBi(), ...extra });
  switch (kind) {
    case "content":
      return { ...base, blocks: [{ kind: "text", step: 0, text: emptyBi() }] };
    case "mcq":
      return { ...base, question: q("mcq", { options: [emptyBi(), emptyBi(), emptyBi(), emptyBi()] }), key: { answer: 0, notes: [] } };
    case "tf":
      return { ...base, question: q("mcq", { time: 20, options: TF_OPTIONS.map((o) => ({ ...o })) }), key: { answer: 0, notes: [] } };
    case "number":
      return { ...base, question: q("number", { time: 45 }), key: { notes: [] } };
    case "text":
      return { ...base, question: q("text", { time: 60, skill: "Ngôn ngữ" }), key: { accept: [], notes: [] } };
    case "label":
      return { ...base, question: q("label", { time: 60, skill: "Ngôn ngữ", targets: [emptyBi(), emptyBi()], options: [emptyBi(), emptyBi()] }), key: { order: [0, 1], notes: [] } };
    case "speak":
      return { ...base, speak: { target: "", time: 40 } };
    case "final":
      return { ...base, activity: 4, title: { en: "Summary", vi: "Tổng kết" }, blocks: [{ kind: "goals", step: 0, items: [emptyBi()] }] };
  }
}

export function emptyMeta(): LessonMeta {
  return {
    title: emptyBi(),
    subtitle: "",
    subject: SUBJECT.short,
    grade: DEFAULT_GRADE,
    terms: [],
    curLessonId: null,
    duration: 45,
    timing: [5, 15, 12, 10, 3],
    equipment: "",
    objectives: { content: emptyBi(), communication: emptyBi(), cognition: emptyBi(), culture: emptyBi() },
    activities: ACTIVITIES.map(() => ({ goal: "", product: "" })),
  };
}

/** Ghép thông tin tiết đã lưu với giá trị mặc định (tiết mẫu cũ thiếu trường mới) */
export function metaOf(l: Partial<LessonDoc>): LessonMeta {
  const e = emptyMeta();
  return {
    title: l.title ?? e.title,
    subtitle: l.subtitle ?? "",
    subject: l.subject ?? e.subject,
    grade: l.grade ?? e.grade,
    terms: l.terms ?? [],
    curLessonId: l.curLessonId ?? null,
    duration: l.duration ?? e.duration,
    timing: l.timing?.length === 5 ? l.timing : e.timing,
    equipment: l.equipment ?? "",
    objectives: { ...e.objectives, ...(l.objectives ?? {}) },
    activities: e.activities.map((a, i) => ({ ...a, ...(l.activities?.[i] ?? {}) })),
  };
}

/** Hoạt động của trang (tiết mẫu cũ chưa gắn → suy theo vị trí) */
export function activityOf(s: Pick<Slide, "activity" | "type">, index: number, total: number): Activity {
  if (s.activity) return s.activity;
  if (s.type === "final") return 4;
  if (index === 0) return 1;
  return index >= total - 2 ? 3 : 2;
}

// ===================== Làm sạch dữ liệu gửi lên (máy chủ) =====================

export const LIMITS = { slides: 80, blocks: 30, terms: 60, options: 10, targets: 8, notes: 10, accept: 10, outcomes: 5 };
const FIGURES: FigureId[] = ["triangle-abc", "right-triangle", "pythagoras-squares", "coordinate-plane", "similar-triangles"];
const SLIDE_TYPES: SlideType[] = ["content", "mcq", "number", "text", "label", "speak", "final"];

class Bad extends Error {}
const fail = (m: string): never => {
  throw new Bad(m);
};
export const isSanitizeError = (e: unknown): e is Error => e instanceof Bad;

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const arr = (x: unknown, max: number, what: string): unknown[] => {
  if (x == null) return [];
  if (!Array.isArray(x)) fail(`${what} không hợp lệ.`);
  if ((x as unknown[]).length > max) fail(`${what}: tối đa ${max}.`);
  return x as unknown[];
};
const str = (x: unknown, max = 500) => (typeof x === "string" || typeof x === "number" ? String(x).trim().slice(0, max) : "");
const int = (x: unknown, min: number, max: number, def: number) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const bi = (x: unknown, max = 1000): Bi => ({ en: str(obj(x).en, max), vi: str(obj(x).vi, max) });
const step = (x: unknown) => int(x, 0, 20, 0);

function block(x: unknown, top: boolean): Block {
  const b = obj(x);
  switch (b.kind) {
    case "hero":
    case "text":
    case "say":
      return { kind: b.kind, step: step(b.step), text: bi(b.text), ...(b.kind === "text" && b.keep ? { keep: true } : {}) };
    case "join":
      return { kind: "join", step: step(b.step) };
    case "goals":
      return { kind: "goals", step: step(b.step), items: arr(b.items, 12, "Danh sách mục").map((i) => bi(i, 400)) };
    case "steps":
      return { kind: "steps", items: arr(b.items, 12, "Các bước").map((i) => ({ step: step(obj(i).step), text: bi(obj(i).text, 400) })) };
    case "ipa":
      return { kind: "ipa", step: step(b.step), items: arr(b.items, 12, "Phiên âm").map((i) => ({ word: str(obj(i).word, 80), ipa: str(obj(i).ipa, 80) })) };
    case "box":
      return {
        kind: "box",
        step: step(b.step),
        text: bi(b.text),
        ...(str(b.tag, 40) ? { tag: str(b.tag, 40) } : {}),
        ...(b.highlight ? { highlight: true } : {}),
        ...(b.small ? { small: true } : {}),
      };
    case "figure": {
      if (!FIGURES.includes(b.figure as FigureId)) fail("Hình vẽ không hợp lệ.");
      const l = obj(b.labels);
      const labels = { ...(str(l.top, 40) ? { top: str(l.top, 40) } : {}), ...(str(l.left, 40) ? { left: str(l.left, 40) } : {}) };
      return { kind: "figure", step: step(b.step), figure: b.figure as FigureId, ...(Object.keys(labels).length ? { labels } : {}) };
    }
    case "cols":
      if (!top) fail("Không lồng hai cột trong hai cột.");
      return { kind: "cols", left: arr(b.left, LIMITS.blocks, "Cột trái").map((y) => block(y, false)), right: arr(b.right, LIMITS.blocks, "Cột phải").map((y) => block(y, false)) };
    default:
      return fail("Khối nội dung không hợp lệ.");
  }
}

function key(x: unknown, s: Slide): TeacherKey {
  const k = obj(x);
  const out: TeacherKey = {
    notes: arr(k.notes, LIMITS.notes, "Ghi chú").map((n) => ({ en: str(obj(n).en, 600), vi: str(obj(n).vi, 600) })),
  };
  const q = s.question;
  if (q?.type === "mcq") out.answer = int(k.answer, 0, (q.options?.length ?? 1) - 1, 0);
  if (q?.type === "number" && str(k.answer) !== "" && Number.isFinite(Number(k.answer))) out.answer = Number(k.answer);
  if (q?.type === "text") out.accept = arr(k.accept, 40, "Đáp án chấp nhận").map((a) => str(a, 200)).filter(Boolean).slice(0, LIMITS.accept);
  if (q?.type === "label") out.order = (q.targets ?? []).map((_, i) => int(arr(k.order, LIMITS.targets, "Đáp án ghép nhãn")[i], -1, (q.options?.length ?? 0) - 1, -1));
  if (str(k.show, 200)) out.show = str(k.show, 200);
  const explain = bi(k.explain);
  if (explain.en || explain.vi) out.explain = explain;
  const method = bi(k.method, 600);
  if (method.en || method.vi) out.method = method;
  return out;
}

export function sanitizeSlide(x: unknown, order: number): EditorSlide {
  const s = obj(x);
  const id = str(s.id, 40);
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) fail("Mã trang không hợp lệ.");
  if (!SLIDE_TYPES.includes(s.type as SlideType)) fail("Loại trang không hợp lệ.");
  const type = s.type as SlideType;
  const out: Slide = {
    id,
    order,
    type,
    title: bi(s.title, 300),
    blocks: arr(s.blocks, LIMITS.blocks, "Khối nội dung").map((b) => block(b, true)),
    activity: int(s.activity, 1, 4, 2) as Activity,
  };
  if (s.phonesDown) out.phonesDown = true;
  // YCCĐ mà trang này đo (chỉ nhận id có trong khung chương trình)
  const outcomeIds = [...new Set(arr(s.outcomeIds, 20, "Yêu cầu cần đạt").filter(isOutcomeId))].slice(0, LIMITS.outcomes);
  if (outcomeIds.length) out.outcomeIds = outcomeIds;
  if (type === "mcq" || type === "number" || type === "text" || type === "label") {
    const q = obj(s.question);
    const question: Question = {
      type,
      time: int(q.time, 5, 600, 30),
      skill: (q.skill === "Ngôn ngữ" ? "Ngôn ngữ" : "Toán") as Skill,
      prompt: bi(q.prompt),
    };
    if (type === "mcq") {
      const opts = arr(q.options, 4, "Phương án").map((o) => bi(o, 300));
      if (opts.length < 2) fail("Câu trắc nghiệm cần ít nhất 2 phương án.");
      question.options = opts;
    }
    if (type === "label") {
      question.options = arr(q.options, LIMITS.options, "Nhãn").map((o) => bi(o, 120));
      question.targets = arr(q.targets, LIMITS.targets, "Ô gắn nhãn").map((o) => bi(o, 300));
      if (question.targets.length < 1 || question.options.length < question.targets.length) fail("Câu kéo nhãn cần số nhãn ≥ số ô.");
    }
    if (type === "number" && str(q.unit, 20)) question.unit = str(q.unit, 20);
    out.question = question;
  }
  if (type === "speak") out.speak = { target: str(obj(s.speak).target, 300), time: int(obj(s.speak).time, 5, 600, 40) };
  return { ...out, key: key(s.key, out) };
}

export function sanitizeMeta(x: unknown, slideCount: number): LessonMeta {
  const m = obj(x);
  const o = obj(m.objectives);
  return {
    title: bi(m.title, 200),
    subtitle: str(m.subtitle, 200),
    // Luôn ghi môn "Toán" → trang KHTN (dùng chung Firebase) tự ẩn tiết này
    subject: SUBJECT.short,
    grade: int(m.grade, GRADES[0], GRADES[GRADES.length - 1], DEFAULT_GRADE),
    curLessonId: isCurLessonId(m.curLessonId) ? m.curLessonId : null,
    duration: int(m.duration, 5, 180, 45),
    timing: [0, 1, 2, 3, 4].map((i) => int((Array.isArray(m.timing) ? m.timing : [5, 15, 12, 10, 3])[i], 0, 90, [5, 15, 12, 10, 3][i])),
    equipment: str(m.equipment, 2000),
    objectives: { content: bi(o.content), communication: bi(o.communication), cognition: bi(o.cognition), culture: bi(o.culture) },
    activities: ACTIVITIES.map((_, i) => {
      const a = obj(arr(m.activities, 4, "Hoạt động")[i]);
      return { goal: str(a.goal, 1500), product: str(a.product, 1500) };
    }),
    terms: arr(m.terms, LIMITS.terms, "Thuật ngữ")
      .map((t): Term => ({ en: str(obj(t).en, 80), ipa: str(obj(t).ipa, 80), vi: str(obj(t).vi, 120), at: int(obj(t).at, 0, Math.max(0, slideCount - 1), 0) }))
      .filter((t) => t.en),
  };
}

export function sanitizeLesson(body: unknown): { meta: LessonMeta; slides: EditorSlide[] } {
  const b = obj(body);
  const slides = arr(b.slides, LIMITS.slides, "Số trang").map((s, i) => sanitizeSlide(s, i));
  if (new Set(slides.map((s) => s.id)).size !== slides.length) fail("Có hai trang trùng mã.");
  return { meta: sanitizeMeta(b.meta, slides.length), slides };
}

// ===================== Kiểm tra trước khi gửi duyệt =====================

export interface Problem {
  slide?: number;
  msg: string;
}

/** Những chỗ còn thiếu — phải sửa hết mới gửi duyệt / duyệt được */
export function problemsOf(meta: LessonMeta, slides: EditorSlide[]): Problem[] {
  const p: Problem[] = [];
  if (!meta.title.vi || !meta.title.en) p.push({ msg: "Thiếu tên bài (cả tiếng Việt và tiếng Anh)." });
  if (!slides.length) p.push({ msg: "Tiết chưa có trang nào." });
  slides.forEach((s, i) => {
    const add = (msg: string) => p.push({ slide: i, msg });
    if (!s.title.en && !s.title.vi) add("Thiếu tiêu đề trang.");
    const q = s.question;
    if (q) {
      if (!q.prompt.en) add("Thiếu đề bài tiếng Anh.");
      if (q.type === "mcq") {
        if ((q.options ?? []).some((o) => !o.en)) add("Có phương án còn trống.");
        if (s.key.answer == null) add("Chưa chọn đáp án đúng.");
      }
      if (q.type === "number" && !Number.isFinite(s.key.answer)) add("Chưa nhập đáp số.");
      if (q.type === "text" && !s.key.accept?.some((a) => a.trim())) add("Chưa có câu trả lời được chấp nhận.");
      if (q.type === "label") {
        if ((q.targets ?? []).some((t) => !t.en && !t.vi) || (q.options ?? []).some((o) => !o.en)) add("Có ô hoặc nhãn còn trống.");
        const order = s.key.order ?? [];
        if (order.length !== (q.targets ?? []).length || order.some((x) => x < 0)) add("Chưa chọn nhãn đúng cho mọi ô.");
        else if (new Set(order).size !== order.length) add("Hai ô dùng chung một nhãn.");
      }
    }
    if (s.type === "speak" && !s.speak?.target) add("Thiếu câu mẫu luyện nói.");
  });
  return p;
}
