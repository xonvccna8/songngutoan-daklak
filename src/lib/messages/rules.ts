// Quy tắc gửi tin (hàm thuần, có test): giờ yên lặng, giới hạn tin "Chú ý", kiểm tra nội dung
import type { Bi } from "@/lib/live/types";
import type { MessageKind } from "@/lib/messages/types";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Đang trong giờ yên lặng (giờ Việt Nam)? Hỗ trợ khoảng qua nửa đêm, vd 21:00–06:30 */
export function inQuietHours(q: { start: string; end: string }, nowMs: number): boolean {
  const d = new Date(nowMs + 7 * 3600_000);
  const cur = d.getUTCHours() * 60 + d.getUTCMinutes();
  const s = toMin(q.start),
    e = toMin(q.end);
  if (s === e) return false;
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

/** Em nào đã nhận đủ số tin "Chú ý" trong tiết này */
export function overAttentionLimit(sentToUids: string[][], uids: string[], max: number): string[] {
  const count = new Map<string, number>();
  sentToUids.flat().forEach((u) => count.set(u, (count.get(u) ?? 0) + 1));
  return uids.filter((u) => (count.get(u) ?? 0) >= max);
}

/** Chuẩn hoá nội dung tin: cắt khoảng trắng, tối đa 500 kí tự mỗi ngôn ngữ, cần ít nhất một ngôn ngữ */
export function cleanText(t: Partial<Bi> | undefined): Bi | null {
  const en = String(t?.en ?? "").trim().slice(0, 500);
  const vi = String(t?.vi ?? "").trim().slice(0, 500);
  return en || vi ? { en, vi } : null;
}

export const isKind = (k: unknown): k is MessageKind => k === "attention" || k === "reminder" || k === "praise" || k === "notice";

/** XP thưởng cho tin Khen ngợi (GĐ 3: +5 / +10 / +20) */
export const PRAISE_XP = [0, 5, 10, 20] as const;
export const cleanPoints = (kind: MessageKind, p: unknown) => (kind === "praise" ? Math.max(0, Math.min(20, Math.round(Number(p) || 0))) : 0);
