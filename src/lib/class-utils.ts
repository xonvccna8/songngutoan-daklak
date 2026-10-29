// Hàm thuần (không phụ thuộc Firebase) — có test trong tests/class-utils.test.ts
import type { ClassSettings } from "@/lib/types";

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const isTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** Kiểm tra & giới hạn cài đặt lớp do GV gửi lên */
export function sanitizeSettings(input: unknown, base: ClassSettings): ClassSettings {
  const i = (input ?? {}) as Partial<ClassSettings>;
  return {
    teams: clampInt(i.teams, 1, 8, base.teams),
    thresholds: {
      activeDays: clampInt(i.thresholds?.activeDays, 1, 7, base.thresholds.activeDays),
      inactiveLate: clampInt(i.thresholds?.inactiveLate, 1, 10, base.thresholds.inactiveLate),
    },
    quietHours: {
      start: isTime(i.quietHours?.start) ? i.quietHours.start : base.quietHours.start,
      end: isTime(i.quietHours?.end) ? i.quietHours.end : base.quietHours.end,
    },
    maxAttention: clampInt(i.maxAttention, 1, 10, base.maxAttention),
    aiTutor: typeof i.aiTutor === "boolean" ? i.aiTutor : (base.aiTutor ?? true),
  };
}

/** Bảng chữ cho mã lớp: bỏ các kí tự dễ nhầm (0/O, 1/I/L) */
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 6;

export function normalizeJoinCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, JOIN_CODE_LENGTH);
}

export function isValidJoinCode(code: string): boolean {
  if (code.length !== JOIN_CODE_LENGTH) return false;
  return [...code].every((c) => JOIN_CODE_ALPHABET.includes(c));
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/** Chuẩn hoá họ tên: bỏ khoảng trắng thừa, viết hoa chữ cái đầu mỗi từ */
export function normalizeName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("vi")
    .split(" ")
    .map((w) => (w ? w[0].toLocaleUpperCase("vi") + w.slice(1) : w))
    .join(" ");
}

export interface ParsedStudent {
  fullName: string;
  team: number | null;
}

const HEADER_WORDS = /^(stt|tt|số tt|họ( và)? tên|tên|tổ|nhóm|lớp|ghi chú)$/i;

/**
 * Đọc danh sách học sinh gõ tay hoặc dán từ Excel.
 * Mỗi dòng một em; các cột cách nhau bằng Tab, dấu chấm phẩy hoặc dấu phẩy.
 * Hiểu được: "Nguyễn Văn An", "1<Tab>Nguyễn Văn An<Tab>2", "Nguyễn Văn An; Tổ 3".
 */
export function parseStudentPaste(text: string, teamCount: number): ParsedStudent[] {
  const result: ParsedStudent[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line
      .split(/\t|;|,/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length === 0) continue;
    // Bỏ dòng tiêu đề
    if (cells.every((c) => HEADER_WORDS.test(c))) continue;

    const nameIdx = cells.findIndex((c) => /\p{L}{2,}/u.test(c) && !/^(tổ|nhóm)\s*\d+$/i.test(c));
    if (nameIdx < 0) continue;
    const fullName = normalizeName(cells[nameIdx]);
    if (fullName.length < 2 || fullName.length > 60) continue;

    let team: number | null = null;
    for (const c of cells.slice(nameIdx + 1)) {
      const m = c.match(/^(?:tổ|nhóm)?\s*(\d{1,2})$/i);
      if (m) {
        const n = Number(m[1]);
        if (n >= 1 && n <= teamCount) team = n;
        break;
      }
    }
    result.push({ fullName, team });
  }
  return result;
}

/** Chia tổ xoay vòng cho các em chưa có tổ, ưu tiên tổ đang ít người */
export function assignTeams(
  students: ParsedStudent[],
  teamCount: number,
  existingCounts: number[] = []
): { fullName: string; team: number }[] {
  const counts = Array.from({ length: teamCount }, (_, i) => existingCounts[i] ?? 0);
  students.forEach((s) => {
    if (s.team) counts[s.team - 1]++;
  });
  return students.map((s) => {
    if (s.team) return { fullName: s.fullName, team: s.team };
    const min = Math.min(...counts);
    const idx = counts.indexOf(min);
    counts[idx]++;
    return { fullName: s.fullName, team: idx + 1 };
  });
}

/** Tên ngắn để chào: "Nguyễn Văn An" → "An" */
export function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

/** Chữ cái đại diện cho avatar: "Nguyễn Văn An" → "VA" */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Kiểm tra khoá do nhập sai PIN */
export const MAX_PIN_FAILS = 5;
export const LOCK_MINUTES = 15;

export function nextFailState(
  failedCount: number,
  now: number
): { failedCount: number; lockedUntil: number | null } {
  const n = failedCount + 1;
  if (n >= MAX_PIN_FAILS) return { failedCount: 0, lockedUntil: now + LOCK_MINUTES * 60_000 };
  return { failedCount: n, lockedUntil: null };
}
