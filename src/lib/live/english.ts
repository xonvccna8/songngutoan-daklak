// Đợt D — Đo tỉ lệ tiếng Anh thực tế của tiết (hàm thuần, test trong tests/english.test.ts).
// Laptop GV cộng dồn thời gian tivi ở chế độ Anh / Song ngữ / Việt mỗi lần ghi trạng thái; máy chủ cộng đoạn cuối khi kết thúc.
import type { Lang, LiveState } from "@/lib/live/types";
import type { StudentResult } from "@/lib/live/summary";

export type LangMs = Record<Lang, number>;

/** Một đoạn tối đa 20 phút: GV để máy rồi đi đâu đó không làm lệch số liệu */
export const SEGMENT_CAP_MS = 20 * 60_000;
/** Trọng số quy đổi: Anh = 1, Song ngữ = 0,5, Việt = 0 */
export const LANG_WEIGHT: LangMs = { en: 1, bi: 0.5, vi: 0 };

const zero = (): LangMs => ({ en: 0, bi: 0, vi: 0 });

/** Cộng đoạn từ lần ghi trước (ở ngôn ngữ cũ) tới bây giờ; lần ghi đầu chỉ bắt đầu đếm */
export function tickLang(prev: LiveState, next: LiveState, now: number): LiveState {
  const langMs = { ...zero(), ...(prev.langMs ?? {}) };
  if (prev.langAt != null) langMs[prev.lang] += Math.min(SEGMENT_CAP_MS, Math.max(0, now - prev.langAt));
  return { ...next, langMs, langAt: now };
}

/** Kết thúc tiết: cộng đoạn cuối (ngôn ngữ đang bật) */
export function closeLang(s: Pick<LiveState, "lang" | "langMs" | "langAt">, now: number): LangMs {
  const langMs = { ...zero(), ...(s.langMs ?? {}) };
  if (s.langAt != null) langMs[s.lang] += Math.min(SEGMENT_CAP_MS, Math.max(0, now - s.langAt));
  return langMs;
}

export interface EnglishStat {
  ms: LangMs;
  totalMs: number;
  /** Tỉ lệ tiếng Anh quy đổi theo thời gian, 0–100 */
  enPct: number;
  /** % câu trả lời không xem tiếng Việt (null: tiết chưa ghi nhận) */
  noViPct: number | null;
}

export function englishOf(ms: LangMs, results?: Record<string, Pick<StudentResult, "answered" | "viA">>): EnglishStat {
  const totalMs = ms.en + ms.bi + ms.vi;
  const enPct = totalMs ? Math.round(((ms.en * LANG_WEIGHT.en + ms.bi * LANG_WEIGHT.bi) / totalMs) * 100) : 0;
  let a = 0;
  let vi = 0;
  for (const r of Object.values(results ?? {})) {
    if (r.viA == null) continue;
    a += r.answered;
    vi += r.viA;
  }
  return { ms, totalMs, enPct, noViPct: a ? Math.round(((a - vi) / a) * 100) : null };
}

/** Năm học (bắt đầu tháng 9, giờ Việt Nam): 9/2026–8/2027 → 2026 */
export function schoolYearOf(ms: number): number {
  const d = new Date(ms + 7 * 3600_000);
  return d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
}

/** Lộ trình đề xuất (docs/QUY-TRINH-TIET-SONG-NGU.md mục 4) theo thời điểm trong năm học */
export function roadmapTarget(ms: number): { label: string; min: number; max: number } {
  const m = (new Date(ms + 7 * 3600_000).getUTCMonth() + 12 - 8) % 12; // tháng 9 = 0
  if (m < 2) return { label: "Tháng 1–2 của năm học", min: 20, max: 30 };
  if (m < 5) return { label: "Tới hết học kỳ I", min: 40, max: 50 };
  return { label: "Học kỳ II", min: 60, max: 70 };
}
