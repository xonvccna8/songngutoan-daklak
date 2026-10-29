// Thời gian học thật (docs/DU-LIEU.md): chỉ tính khi trang hiển thị và có tương tác trong 60 s gần nhất.
// Trình duyệt đếm giây rồi gửi mỗi 30 s; máy chủ chặn gian lận bằng khoảng thời gian thật giữa 2 lần gửi.

/** Tối đa số giây nhận trong một lần gửi */
export const MAX_PING_SEC = 120;
/** Tối đa thời gian học được tính trong một ngày */
export const DAILY_CAP_SEC = 4 * 3600;
/** Ngày học = ≥ 5 phút học thật hoặc ≥ 1 hoạt động */
export const STUDY_DAY_SEC = 300;
/** Không tương tác quá lâu thì ngừng đếm */
export const IDLE_MS = 60_000;
/** Mục tiêu mỗi ngày (phút) hiện trên trang chủ HS */
export const DAILY_GOAL_MIN = 10;

/** Số giây được ghi nhận: không vượt quá thời gian thật kể từ lần gửi trước (+5 s sai lệch mạng) */
export function creditSeconds(sent: unknown, lastPingAt: number | null | undefined, now: number): number {
  const s = Math.max(0, Math.min(MAX_PING_SEC, Math.floor(Number(sent) || 0)));
  if (lastPingAt == null) return s;
  const elapsed = Math.floor((now - lastPingAt) / 1000) + 5;
  return Math.max(0, Math.min(s, elapsed));
}

export function isStudyDay(activeSeconds: number, activities: Record<string, number> | undefined): boolean {
  return activeSeconds >= STUDY_DAY_SEC || Object.values(activities ?? {}).some((n) => n > 0);
}

/** Đếm giây tích cực: gọi mỗi giây */
export const isActiveNow = (visible: boolean, lastInteractAt: number, now: number) => visible && now - lastInteractAt <= IDLE_MS;
