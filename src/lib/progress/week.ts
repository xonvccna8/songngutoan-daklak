// Tuần thi đua: bắt đầu 0:00 thứ Hai giờ Việt Nam (tuần ISO) — hàm thuần, có test trong tests/progress.test.ts
const DAY = 86_400_000;
const VN = 7 * 3600_000;

/** Khoá tuần ISO theo giờ VN, vd "2026-W42" */
export function weekKey(ms: number): string {
  const d = new Date(ms + VN);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = thứ Hai
  // Thứ Năm của tuần quyết định tuần thuộc năm nào (chuẩn ISO 8601)
  const thu = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow + 3);
  const year = new Date(thu).getUTCFullYear();
  const week = 1 + Math.floor((thu - Date.UTC(year, 0, 1)) / (7 * DAY));
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Khoá tuần trước */
export const prevWeekKey = (ms: number) => weekKey(ms - 7 * DAY);

/** 0:00 thứ Hai (giờ VN) của tuần chứa ms — để hiện "bảng làm mới sau …" */
export function weekStartMs(ms: number): number {
  const d = new Date(ms + VN);
  const dow = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow) - VN;
}

/** Id tài liệu bảng tuần của lớp: lsn_weekly/{classId}_{tuần} */
export const weeklyId = (classId: string, week: string) => `${classId}_${week}`;
