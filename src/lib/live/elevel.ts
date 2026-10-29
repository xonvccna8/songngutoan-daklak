// Đợt C — Mức tiếng Anh riêng từng em (E1/E2/E3): gợi ý theo luật từ kết quả các tiết, GV xác nhận.
// Hàm thuần, test trong tests/elevel.test.ts.
import type { ELevel } from "@/lib/library";
import type { Lang, SessionDoc } from "@/lib/live/types";

export type { ELevel };

export const LEVEL_META: Record<ELevel, { label: string; vi: string; phone: string; lang: Lang }> = {
  e1: { label: "E1", vi: "Tiếng Việt + thuật ngữ", phone: "Tiếng Việt to, thuật ngữ tiếng Anh in đậm", lang: "vi" },
  e2: { label: "E2", vi: "Song ngữ", phone: "Tiếng Anh kèm tiếng Việt", lang: "bi" },
  e3: { label: "E3", vi: "Tiếng Anh", phone: "Chỉ tiếng Anh, bấm để xem tiếng Việt", lang: "en" },
};

/** Ngôn ngữ trên điện thoại ↔ mức */
export const langOfLevel = (l: ELevel | undefined): Lang => LEVEL_META[l ?? "e2"].lang;
export const isELevel = (x: unknown): x is ELevel => x === "e1" || x === "e2" || x === "e3";

/** Thưởng khi trả lời đúng mà không xem tiếng Việt (chỉ em mức E2/E3) */
export const NO_VI_BONUS = 10;

export interface LevelInput {
  /** Câu phần Ngôn ngữ: đã làm / đúng */
  langA: number;
  langC: number;
  /** Câu có ghi nhận việc xem tiếng Việt (tiết từ Đợt A trở đi): đã làm / có xem tiếng Việt */
  viKnown: number;
  viA: number;
  pronSum: number;
  pronN: number;
}

/** Cộng dồn kết quả của một em qua các tiết đã kết thúc */
export function levelInputOf(sessions: Pick<SessionDoc, "results">[], uid: string): LevelInput {
  const x: LevelInput = { langA: 0, langC: 0, viKnown: 0, viA: 0, pronSum: 0, pronN: 0 };
  for (const s of sessions) {
    const r = s.results?.[uid];
    if (!r) continue;
    x.langA += r.langA ?? 0;
    x.langC += r.langC ?? 0;
    x.pronSum += r.pronSum ?? 0;
    x.pronN += r.pronN ?? 0;
    // Tiết cũ chưa ghi việc xem tiếng Việt → không tính
    if (r.viA != null) {
      x.viKnown += r.answered ?? 0;
      x.viA += r.viA;
    }
  }
  return x;
}

export interface LevelSuggestion {
  level: ELevel;
  /** Đủ dữ liệu để gợi ý (chưa đủ → giữ E2) */
  enough: boolean;
  reason: string;
}

/** Ngưỡng — đổi ở đây (docs/QUY-TRINH-TIET-SONG-NGU.md mục 5) */
export const LEVEL_RULES = { minLang: 3, minVi: 4, e1Lang: 0.5, e1Vi: 0.6, e1Pron: 50, e3Lang: 0.75, e3Vi: 0.2, e3Pron: 75 };

export function suggestLevel(x: LevelInput): LevelSuggestion {
  const R = LEVEL_RULES;
  const lang = x.langA >= R.minLang ? x.langC / x.langA : null;
  const vi = x.viKnown >= R.minVi ? x.viA / x.viKnown : null;
  const pron = x.pronN >= 1 ? x.pronSum / x.pronN : null;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  if (lang == null && vi == null && pron == null) return { level: "e2", enough: false, reason: "Chưa đủ dữ liệu, giữ mức Song ngữ." };

  const weak: string[] = [];
  if (lang != null && lang < R.e1Lang) weak.push(`Ngôn ngữ đúng ${pct(lang)}`);
  if (vi != null && vi >= R.e1Vi) weak.push(`xem tiếng Việt ${pct(vi)} số câu`);
  if (pron != null && pron < R.e1Pron) weak.push(`phát âm ${Math.round(pron)}`);
  if (weak.length) return { level: "e1", enough: true, reason: `${weak.join(", ")} → cần tiếng Việt làm chính.` };

  if (lang != null && lang >= R.e3Lang && (vi == null || vi <= R.e3Vi) && (pron == null || pron >= R.e3Pron))
    return { level: "e3", enough: true, reason: `Ngôn ngữ đúng ${pct(lang)}${vi != null ? `, ít xem tiếng Việt (${pct(vi)})` : ""}${pron != null ? `, phát âm ${Math.round(pron)}` : ""} → thử chỉ tiếng Anh.` };

  return { level: "e2", enough: true, reason: `Ngôn ngữ đúng ${lang != null ? pct(lang) : "—"} → giữ song ngữ.` };
}
