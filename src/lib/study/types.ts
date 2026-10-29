// Tự học (GĐ 5): bài tập về nhà, thẻ từ vựng, thời gian học — xem docs/DU-LIEU.md
import type { Bi, Slide } from "@/lib/live/types";

/** Thuật ngữ trong ngân hàng lsn_terms */
export interface TermDoc {
  id: string;
  en: string;
  ipa: string;
  vi: string;
  example?: Bi;
  /** Cách đọc kí hiệu, vd "carbon dioxide" cho CO₂ */
  readAs?: string;
  lessonIds: string[];
  /** Bài SGK (khung chương trình) dùng thuật ngữ này — kho học liệu gắn sẵn, hiện ở "Xem trước bài" + trình soạn bài */
  curLessonIds?: string[];
  grade: number;
  status: "draft" | "pending" | "approved";
  /** GĐ 6 — ngân hàng thuật ngữ */
  imageUrl?: string | null;
  createdBy?: string | null;
  createdByName?: string;
  schoolId?: string | null;
}

export interface VocabHint {
  en: string;
  ipa: string;
  vi: string;
}

/** Một câu trong bài về nhà: chép nội dung trang (không có đáp án) + 2 tầng gợi ý công khai */
export interface HwItem {
  slideId: string;
  slide: Slide;
  /** Tầng 1: từ vựng cần dùng */
  vocab: VocabHint[];
  /** Tầng 2: cách làm */
  method: Bi;
}

export interface AssignmentDoc {
  id: string;
  classId: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  title: Bi;
  lessonId: string;
  items: HwItem[];
  toUids: string[];
  toLabel: string;
  dueAt: { toMillis(): number };
  createdAt?: { toMillis(): number } | null;
  /** Đã gửi nhắc trước hạn 1 ngày */
  remindedAt?: { toMillis(): number } | null;
  /** Đã quá hạn và đã ghi nhận các em chưa nộp */
  closedAt?: { toMillis(): number } | null;
  isSample?: boolean;
}

/** Kết quả một câu (máy chủ chấm) — tầng 3 (lời giải) chỉ có sau khi trả lời hoặc xin xem */
export interface HwAnswer {
  value?: string | number;
  correct?: boolean;
  points: number;
  /** Luyện nói: điểm cao nhất 0–100 */
  score?: number;
  transcript?: string;
  attempts: number;
  usedSolution?: boolean;
  answer?: number;
  show?: string;
  explain?: Bi;
  /** Câu gõ chữ do AI chấm (máy so khớp chấm sai) + nhận xét song ngữ */
  aiGraded?: boolean;
  aiFeedback?: Bi;
  at: number;
}

export interface SubmissionDoc {
  uid: string;
  classId: string;
  answers: Record<string, HwAnswer>;
  /** Câu đã xin xem lời giải trước khi trả lời */
  solutionViewed?: Record<string, Pick<HwAnswer, "answer" | "show" | "explain">>;
  openedAt?: { toMillis(): number } | null;
  completedAt?: { toMillis(): number } | null;
  activeSeconds?: number;
  score: number;
  correct: number;
  answered: number;
  total: number;
  late?: boolean;
}

/** Trạng thái một thẻ từ vựng (SM-2 rút gọn) */
export interface CardState {
  ease: number;
  /** Khoảng cách ôn (ngày) */
  interval: number;
  reps: number;
  lapses: number;
  /** Lần ôn kế tiếp (ms) */
  due: number;
  first: number;
  last: number;
}

export interface CardsDoc {
  uid: string;
  classId: string;
  cards: Record<string, CardState>;
}

export type StudyActivity = "hw" | "cards" | "speak" | "review" | "home" | "game";
