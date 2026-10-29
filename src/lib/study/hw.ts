// Bài tập về nhà: dựng câu từ trang của tiết, gợi ý 3 tầng, chấm điểm — hàm thuần, có test
import { defaultShow, evaluate } from "@/lib/live/grading";
import type { Bi, Block, Slide, TeacherKey, Term } from "@/lib/live/types";
import type { HwAnswer, HwItem, VocabHint } from "@/lib/study/types";

/** Điểm một câu đúng; đã xem lời giải trước khi trả lời thì chỉ còn 30 */
export const HW_POINTS = 100;
export const HW_POINTS_AFTER_SOLUTION = 30;

export const isHomeworkSlide = (s: Pick<Slide, "question" | "speak">) => !!(s.question || s.speak);

/** Gom toàn bộ chữ tiếng Anh của trang (đề, đáp án, khối nội dung) */
function slideText(s: Slide): string {
  const out: string[] = [s.title.en, s.question?.prompt.en ?? "", ...(s.question?.options ?? []).map((o) => o.en), s.speak?.target ?? ""];
  const walk = (bs: Block[]) =>
    bs.forEach((b) => {
      if (b.kind === "cols") {
        walk(b.left);
        walk(b.right);
      } else if (b.kind === "steps") b.items.forEach((it) => out.push(it.text.en));
      else if (b.kind === "goals") b.items.forEach((it) => out.push(it.en));
      else if ("text" in b) out.push(b.text.en);
    });
  walk(s.blocks);
  return out.join(" ").toLowerCase();
}

/** Tầng 1: thuật ngữ xuất hiện trong trang; không có thì lấy 3 thuật ngữ gần nhất đã học trước trang này */
export function vocabFor(slide: Slide, terms: Term[]): VocabHint[] {
  const text = slideText(slide);
  const hit = terms.filter((t) => new RegExp(`\\b${t.en.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text));
  const list = hit.length ? hit : terms.filter((t) => t.at <= slide.order).slice(-3);
  return list.slice(0, 5).map(({ en, ipa, vi }) => ({ en, ipa, vi }));
}

const METHOD: Record<string, Bi> = {
  number: {
    en: "Find the numbers in the question, check the unit, then work it out step by step.",
    vi: "Tìm các số liệu trong đề, chú ý đơn vị, rồi tính từng bước.",
  },
  mcq: {
    en: "Rule out the options that are clearly wrong, then check the rest against the definition or property.",
    vi: "Loại các đáp án chắc chắn sai, rồi đối chiếu đáp án còn lại với định nghĩa / tính chất.",
  },
  text: {
    en: "Find the key sentence in the lesson with the same pattern. Remember “a / an”.",
    vi: "Tìm câu then chốt trong bài có cùng cấu trúc. Nhớ mạo từ “a / an”.",
  },
  label: {
    en: "Read each box carefully, match the labels you are sure about first, then the rest.",
    vi: "Đọc kĩ từng ô, gắn trước những nhãn em chắc chắn, rồi mới đến các nhãn còn lại.",
  },
  speak: {
    en: "Listen slowly first, then read phrase by phrase. Stress the difficult words.",
    vi: "Nghe mẫu chậm trước, đọc theo từng cụm, nhấn rõ các từ khó.",
  },
};

/** Tầng 2: cách làm — GV ghi trong đáp án (method), nếu không có thì dùng gợi ý chung theo loại câu */
export const methodFor = (slide: Slide, key: TeacherKey | undefined): Bi => key?.method ?? METHOD[slide.speak ? "speak" : (slide.question?.type ?? "mcq")];

export function buildItems(slides: Slide[], keys: Map<string, TeacherKey> | Record<string, TeacherKey>, terms: Term[]): HwItem[] {
  const get = (id: string) => (keys instanceof Map ? keys.get(id) : keys[id]);
  return slides.filter(isHomeworkSlide).map((slide) => ({ slideId: slide.id, slide, vocab: vocabFor(slide, terms), method: methodFor(slide, get(slide.id)) }));
}

/** Tầng 3 (lời giải) — chỉ máy chủ đọc từ đáp án */
export function solutionOf(slide: Slide, key: TeacherKey): Pick<HwAnswer, "answer" | "show" | "explain"> {
  const out: Pick<HwAnswer, "answer" | "show" | "explain"> = {};
  if (slide.question?.type === "mcq" && key.answer != null) out.answer = key.answer;
  const show = key.show ?? defaultShow(slide.question, key);
  if (show) out.show = show;
  if (key.explain) out.explain = key.explain;
  return out;
}

/** Chấm một câu hỏi (không phải luyện nói) */
export function gradeQuestion(slide: Slide, key: TeacherKey, value: unknown, usedSolution: boolean): { correct: boolean; points: number } {
  const correct = !!slide.question && evaluate(slide.question, key, value);
  return { correct, points: correct ? (usedSolution ? HW_POINTS_AFTER_SOLUTION : HW_POINTS) : 0 };
}

/** Tổng hợp bài làm từ các câu đã trả lời */
export function tally(items: Pick<HwItem, "slideId">[], answers: Record<string, HwAnswer>) {
  const done = items.filter((it) => answers[it.slideId]);
  return {
    answered: done.length,
    total: items.length,
    correct: done.filter((it) => answers[it.slideId].correct || (answers[it.slideId].score ?? 0) >= 60).length,
    score: done.reduce((s, it) => s + (answers[it.slideId].points ?? 0), 0),
    complete: items.length > 0 && done.length === items.length,
  };
}

/** Trạng thái bài của một em */
export type HwStatus = "todo" | "doing" | "done" | "late" | "missed";
export function hwStatus(sub: { completedAt?: { toMillis(): number } | null; answered?: number; late?: boolean } | undefined, dueMs: number, now: number): HwStatus {
  if (sub?.completedAt) return sub.late ? "late" : "done";
  if (now > dueMs) return "missed";
  return sub?.answered ? "doing" : "todo";
}

export const HW_STATUS_META: Record<HwStatus, { label: string; bg: string; fg: string }> = {
  todo: { label: "Chưa làm", bg: "#E9F1EC", fg: "#4A6158" },
  doing: { label: "Đang làm", bg: "#E3EAFF", fg: "#1E40B8" },
  done: { label: "Đã nộp", bg: "#DDF7EE", fg: "#0A6F5F" },
  late: { label: "Nộp trễ", bg: "#FFF1D2", fg: "#8A5A00" },
  missed: { label: "Chưa nộp", bg: "#FFE3DD", fg: "#A3301B" },
};
