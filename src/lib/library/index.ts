// Thư viện học liệu số dựng sẵn (khung câu, câu lệnh lớp học, kí hiệu) + tìm kiếm Việt/Anh không dấu
import { fold } from "@/lib/curriculum";
import { FRAMES, type Frame } from "@/lib/library/frames";
import { PHRASES, type Phrase } from "@/lib/library/phrases";
import { SYMBOLS, type MathSymbol } from "@/lib/library/symbols";

export * from "@/lib/library/frames";
export * from "@/lib/library/phrases";
export * from "@/lib/library/symbols";

/** Mức tiếng Anh: E1 chủ yếu tiếng Việt kèm thuật ngữ · E2 song song · E3 chủ yếu tiếng Anh */
export type ELevel = "e1" | "e2" | "e3";
export const E_LEVELS: Record<ELevel, { label: string; vi: string }> = {
  e1: { label: "E1", vi: "Mức 1 · cụm ngắn" },
  e2: { label: "E2", vi: "Mức 2 · câu đầy đủ" },
  e3: { label: "E3", vi: "Mức 3 · câu học thuật" },
};

/** Khớp chuỗi tìm (không dấu, không phân biệt hoa thường) với một trong các chuỗi */
export const matches = (q: string, ...texts: (string | undefined)[]) => {
  const s = fold(q.trim());
  return !s || texts.some((t) => t && fold(t).includes(s));
};

export const searchFrames = (q: string): Frame[] => FRAMES.filter((f) => matches(q, f.e1.en, f.e1.vi, f.e2.en, f.e2.vi, f.e3.en, f.e3.vi));
export const searchPhrases = (q: string): Phrase[] => PHRASES.filter((p) => matches(q, p.en, p.vi));
export const searchSymbols = (q: string): MathSymbol[] => SYMBOLS.filter((s) => matches(q, s.sym, s.en, s.vi));
