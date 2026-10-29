// Môn học của ứng dụng: Toán THCS (lớp 6–9) — tên môn hiển thị lấy từ đây.
// Kỹ năng câu hỏi (Skill) tách 2 phần: kiến thức môn ("Toán") và tiếng Anh ("Ngôn ngữ").
export const SUBJECT = {
  vi: "Toán",
  short: "Toán",
  en: "Mathematics",
  /** Tên ngắn tiếng Anh dùng trên logo, nhãn */
  enShort: "Maths",
} as const;

// ---- Dữ liệu của trang KHTN ----
// Firebase DÙNG CHUNG với trang KHTN → trang Toán chỉ ẨN dữ liệu KHTN khi hiển thị, KHÔNG xoá / sửa trên Firebase.

/** Mã bài thuộc khung chương trình Toán (vd "k8-15") */
export const isMathCurId = (id: string | null | undefined) => /^k\d/.test(id ?? "");

/** Mã bài thuộc khung chương trình KHTN (vd "n8-30") */
export const isScienceCurId = (id: string | null | undefined) => /^n\d/.test(id ?? "");

/** Tiết học Toán: môn "Toán" hoặc gắn bài SGK Toán — cùng quy tắc với trang KHTN nên hai trang chia dữ liệu khớp nhau */
export const isMathLesson = (l: { subject?: string | null; curLessonId?: string | null }) => l.subject === "Toán" || isMathCurId(l.curLessonId);

/** Thuật ngữ của KHTN: gắn bài SGK KHTN, hoặc chỉ nằm trong các tiết không phải Toán */
export const isScienceTerm = (t: { lessonIds?: string[]; curLessonIds?: string[] }, mathLessonIds: ReadonlySet<string>) =>
  (t.curLessonIds ?? []).some(isScienceCurId) || ((t.lessonIds?.length ?? 0) > 0 && !t.lessonIds!.some((id) => mathLessonIds.has(id)));

/** Mô tả ứng dụng (metadata, manifest, chân trang) */
export const APP_DESCRIPTION = `Dạy và học ${SUBJECT.vi} song ngữ Việt – Anh cho THCS (lớp 6–9)`;
