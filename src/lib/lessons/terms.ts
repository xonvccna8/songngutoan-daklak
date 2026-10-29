// GĐ 6 — Ngân hàng thuật ngữ: mã thuật ngữ + làm sạch dữ liệu (hàm thuần, có test). Không dịch máy tự động.
import { DEFAULT_GRADE, isCurLessonId, isGrade } from "@/lib/curriculum";
import type { TermDoc } from "@/lib/study/types";

/** Mã tài liệu = tiếng Anh viết thường, nối bằng "-" (trùng với script nạp tiết mẫu) */
export const termId = (en: string) =>
  en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type TermInput = Pick<TermDoc, "en" | "ipa" | "vi" | "grade" | "readAs" | "imageUrl" | "example" | "curLessonIds">;

const s = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");

/** Trả về thuật ngữ đã làm sạch, hoặc chuỗi lỗi tiếng Việt */
export function sanitizeTerm(x: unknown): TermInput | string {
  const t = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const en = s(t.en, 80).replace(/\s+/g, " ");
  const vi = s(t.vi, 120);
  if (!en || !termId(en)) return "Thiếu thuật ngữ tiếng Anh.";
  if (!vi) return "Thiếu nghĩa tiếng Việt.";
  const grade = Math.round(Number(t.grade));
  const imageUrl = s(t.imageUrl, 500);
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) return "Đường dẫn hình phải bắt đầu bằng https://";
  const ex = (t.example && typeof t.example === "object" ? t.example : {}) as Record<string, unknown>;
  const example = { en: s(ex.en, 300), vi: s(ex.vi, 300) };
  return {
    en,
    vi,
    ipa: s(t.ipa, 80),
    grade: isGrade(grade) ? grade : DEFAULT_GRADE,
    readAs: s(t.readAs, 120) || undefined,
    imageUrl: imageUrl || null,
    example: example.en || example.vi ? example : undefined,
    // Bài SGK chứa thuật ngữ (để HS học theo từng bài); không gửi → giữ nguyên khi sửa
    curLessonIds: Array.isArray(t.curLessonIds) ? [...new Set(t.curLessonIds.filter(isCurLessonId))].slice(0, 6) : undefined,
  };
}
