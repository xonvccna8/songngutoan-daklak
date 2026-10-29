// Truy vấn khung chương trình (dữ liệu tĩnh trong mã nguồn → không tốn lượt đọc Firestore) + tính Sao thành thạo
import { KNTT } from "@/lib/curriculum/kntt";
import type { Chapter, CurLesson, Outcome } from "@/lib/curriculum/types";

export * from "@/lib/curriculum/types";

/** Toán THCS: lớp 6–9 */
export const GRADES = [6, 7, 8, 9] as const;
export const DEFAULT_GRADE = 8;
export const isGrade = (g: number) => (GRADES as readonly number[]).includes(g);
export const BOOK = { id: "kntt", vi: "Kết nối tri thức với cuộc sống", en: "Connecting Knowledge with Life" } as const;

function build(): Chapter[] {
  const out: Chapter[] = [];
  for (const [g, chapters] of Object.entries(KNTT)) {
    const grade = Number(g);
    for (const [no, strand, vi, en, lessons] of chapters) {
      // Tiền tố "k" (Toán) — khác "n" của trang KHTN dùng chung Firebase → không lẫn bài của hai trang
      const id = `k${grade}-c${no}`;
      out.push({
        id,
        no,
        grade,
        strand,
        vi,
        en,
        lessons: lessons.map(([lno, lvi, len, outs]) => ({
          id: `k${grade}-${lno}`,
          no: lno,
          grade,
          chapterId: id,
          vi: lvi,
          en: len,
          // Bài chưa nhập YCCĐ chi tiết → 1 YCCĐ chung để vẫn giao câu hỏi, tính Sao thành thạo được
          outcomes: (outs?.length ? outs : ([[`Nhận biết và vận dụng được kiến thức bài «${lvi}».`, `Understand and apply: ${len}.`]] as [string, string][])).map(([ovi, oen], i) => ({
            id: `k${grade}-${lno}-${i + 1}`,
            vi: ovi,
            en: oen,
          })),
        })),
      });
    }
  }
  return out;
}

export const CHAPTERS: Chapter[] = build();
const LESSONS = new Map<string, CurLesson>(CHAPTERS.flatMap((c) => c.lessons.map((l) => [l.id, l] as const)));
const OUTCOMES = new Map<string, Outcome & { lessonId: string }>([...LESSONS.values()].flatMap((l) => l.outcomes.map((o) => [o.id, { ...o, lessonId: l.id }] as const)));
const CHAPTER_BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]));

export const chaptersOf = (grade: number) => CHAPTERS.filter((c) => c.grade === grade);
export const curLesson = (id: string | null | undefined) => (id ? LESSONS.get(id) : undefined);
export const chapterOf = (lessonId: string | null | undefined) => CHAPTER_BY_ID.get(curLesson(lessonId)?.chapterId ?? "");
export const outcome = (id: string) => OUTCOMES.get(id);
export const isOutcomeId = (id: unknown): id is string => typeof id === "string" && OUTCOMES.has(id);
export const isCurLessonId = (id: unknown): id is string => typeof id === "string" && LESSONS.has(id);
/** Tất cả YCCĐ của một khối */
export const outcomesOf = (grade: number) => chaptersOf(grade).flatMap((c) => c.lessons.flatMap((l) => l.outcomes));

/** Nhãn ngắn "Bài 15 · Định lí Thalès trong tam giác" */
export const lessonLabel = (l: CurLesson) => `Bài ${l.no} · ${l.vi}`;

/** Tìm bài theo chữ tiếng Việt hoặc tiếng Anh (không dấu, không phân biệt hoa thường) */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

// ---------------- Sao thành thạo theo YCCĐ ----------------

/** Bộ đếm của một YCCĐ: số câu đã làm / làm đúng */
export interface MasteryCell {
  a: number;
  c: number;
  /** lần làm gần nhất (ms) */
  t?: number;
}

/**
 * 0–3 Sao: cần đủ số câu VÀ đủ tỉ lệ đúng (ít câu thì chưa kết luận được).
 * 1⭐ ≥ 2 câu, đúng ≥ 50% · 2⭐ ≥ 4 câu, ≥ 70% · 3⭐ ≥ 6 câu, ≥ 85%
 */
export function starsOf(m: MasteryCell | undefined): 0 | 1 | 2 | 3 {
  if (!m || m.a < 2) return 0;
  const p = m.c / m.a;
  if (m.a >= 6 && p >= 0.85) return 3;
  if (m.a >= 4 && p >= 0.7) return 2;
  return p >= 0.5 ? 1 : 0;
}

/** Đếm số YCCĐ đạt từ n Sao trở lên, và số YCCĐ em đã gặp */
export function starCounts(cells: Record<string, MasteryCell> | undefined) {
  const list = Object.values(cells ?? {});
  const s = list.map(starsOf);
  return { seen: list.length, s1: s.filter((x) => x >= 1).length, s2: s.filter((x) => x >= 2).length, s3: s.filter((x) => x >= 3).length };
}
