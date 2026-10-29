// Định dạng thời gian tương đối: "vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"
export function fmtAgo(ms: number | null, now: number): string {
  if (!ms || !now) return "Chưa có hoạt động";
  const m = Math.round((now - ms) / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} ngày trước` : new Date(ms).toLocaleDateString("vi-VN");
}

/** Hạn nộp theo giờ Việt Nam: "21:00 13/10" (chạy đúng cả trên máy chủ Vercel giờ UTC) */
export function fmtDue(ms: number, locale: "vi" | "en" = "vi"): string {
  const d = new Date(ms + 7 * 3600_000);
  const hh = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  const dd = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return locale === "vi" ? `${hh} ngày ${dd}` : `${hh}, ${dd}`;
}

/** Còn bao lâu tới hạn: "còn 3 giờ", "còn 2 ngày", "quá hạn" */
export function fmtLeft(dueMs: number, now: number): string {
  const m = Math.round((dueMs - now) / 60000);
  if (m <= 0) return "quá hạn";
  if (m < 60) return `còn ${m} phút`;
  const h = Math.round(m / 60);
  return h < 36 ? `còn ${h} giờ` : `còn ${Math.round(h / 24)} ngày`;
}

export const fmtMinutes = (sec: number) => (sec < 60 ? `${Math.round(sec)} giây` : `${Math.round(sec / 60)} phút`);
