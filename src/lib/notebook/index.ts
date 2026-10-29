// Vở ghi Toán: tra cứu theo bài + từ vựng của bài (ngân hàng thuật ngữ, dự phòng bằng kho học liệu)
import { CHAPTERS, curLesson, type CurLesson } from "@/lib/curriculum";
import { KHO_TOAN } from "@/lib/library/kho-toan";
import { termId } from "@/lib/lessons/terms";
import { ALL_LESSONS, termsOfLesson } from "@/lib/lessons/by-lesson";
import { NOTES_TOAN_67 } from "@/lib/notebook/toan-67";
import { NOTES_TOAN_8 } from "@/lib/notebook/toan-8";
import { NOTES_TOAN_9 } from "@/lib/notebook/toan-9";
import type { NoteLesson } from "@/lib/notebook/types";

export * from "@/lib/notebook/types";

export const NOTES: NoteLesson[] = [...NOTES_TOAN_67, ...NOTES_TOAN_8, ...NOTES_TOAN_9];
const BY_ID = new Map(NOTES.map((n) => [n.id, n]));

export const noteOf = (lessonId: string | null | undefined) => (lessonId ? BY_ID.get(lessonId) : undefined);

/** Bài có vở ghi, theo thứ tự SGK (lớp 6 → 9) */
export const NOTE_LESSONS: CurLesson[] = ALL_LESSONS.filter((l) => BY_ID.has(l.id));

/** Các chương có vở ghi (chỉ giữ bài có vở ghi) — để GV chọn bài */
export const NOTE_CHAPTERS = CHAPTERS.map((c) => ({ ...c, lessons: c.lessons.filter((l) => BY_ID.has(l.id)) })).filter((c) => c.lessons.length);

/** Bài có vở ghi của một khối; khối chưa có vở ghi thì trả mọi bài có vở ghi */
export function noteLessonsOf(grade: number | undefined): CurLesson[] {
  const list = NOTE_LESSONS.filter((l) => l.grade === grade);
  return list.length ? list : NOTE_LESSONS;
}

/** Tìm bài theo tham số ?bai= (mã bài, vd "k8-15") */
export const lessonByParam = (p: string | null) => NOTE_LESSONS.find((l) => l.id === p);

export interface VocabRow {
  id: string;
  en: string;
  ipa: string;
  vi: string;
}

/** Từ vựng của bài: lấy từ ngân hàng thuật ngữ (đã duyệt, có thể GV bổ sung); chưa tải được thì lấy từ kho học liệu */
export function vocabOf(lessonId: string, bank: { id: string; en: string; ipa: string; vi: string; curLessonIds?: string[] }[]): VocabRow[] {
  const fromBank = termsOfLesson(bank, lessonId);
  if (fromBank.length) return fromBank.map(({ id, en, ipa, vi }) => ({ id, en, ipa, vi }));
  return (KHO_TOAN.find((l) => l.curLessonId === lessonId)?.terms ?? []).map((t) => ({ id: termId(t.en), ...t }));
}

/** Khung từ gợi ý cho bài điền từ (xếp A→Z để không lộ thứ tự đáp án) */
export const fillWordBox = (n: NoteLesson) => [...new Set(n.fill.map((f) => f.answer))].sort((a, b) => a.localeCompare(b));

export const LETTERS = ["A", "B", "C", "D"] as const;

/** Tách "**đậm**" thành các đoạn để hiển thị / xuất Word */
export function richParts(s: string): { text: string; bold: boolean }[] {
  return s
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((p) => (p.startsWith("**") && p.endsWith("**") ? { text: p.slice(2, -2), bold: true } : { text: p, bold: false }));
}

/** Bỏ dấu ** khi cần chữ thuần */
export const plain = (s: string) => s.replace(/\*\*/g, "");

/** Nhãn đầy đủ của bài */
export const noteTitle = (lessonId: string) => {
  const l = curLesson(lessonId);
  return l ? `Toán ${l.grade} · Bài ${l.no}. ${l.vi}` : lessonId;
};
