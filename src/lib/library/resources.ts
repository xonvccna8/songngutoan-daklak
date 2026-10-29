// Học liệu do GV thêm (lsn_resources): link GeoGebra, video, phiếu học tập, trang web — gắn với bài SGK.
// Chỉ lưu LINK (không tải file lên) để nhẹ và không vướng bản quyền. GV thêm → Chờ duyệt; quản trị duyệt.
// Hàm thuần (máy chủ + trình duyệt), có test trong tests/curriculum.test.ts
import type { Bi } from "@/lib/live/types";
import { curLesson, isCurLessonId, isGrade } from "@/lib/curriculum";

export type ResourceKind = "geogebra" | "video" | "simulation" | "model3d" | "worksheet" | "web";
export type ResourceStatus = "pending" | "approved" | "draft";

export const RESOURCE_KINDS: Record<ResourceKind, { vi: string; en: string; hint: string }> = {
  geogebra: { vi: "Hình động GeoGebra", en: "GeoGebra applet", hint: "Link geogebra.org/m/… — chiếu được ngay trên trang" },
  video: { vi: "Video", en: "Video", hint: "Link YouTube — xem ngay trên trang (nên có phụ đề Anh/Việt)" },
  simulation: {
    vi: "Mô phỏng Toán",
    en: "Simulation",
    hint: "Link PhET (phet.colorado.edu — đổi được Anh/Việt) hoặc ứng dụng GeoGebra (geogebra.org/geometry, /graphing, /3d) — chạy ngay trên trang",
  },
  model3d: { vi: "Mô hình 3D", en: "3D model", hint: "Link sketchfab.com/3d-models/… — xoay, phóng to mô hình 3D ngay trên trang" },
  worksheet: { vi: "Phiếu học tập", en: "Worksheet", hint: "Link Google Drive / Docs (đặt quyền “Bất kì ai có đường liên kết”)" },
  web: { vi: "Trang web", en: "Web page", hint: "Trang tham khảo khác" },
};

export interface ResourceDoc {
  id: string;
  kind: ResourceKind;
  title: Bi;
  url: string;
  grade: number;
  /** Bài SGK (id khung chương trình) */
  curLessonId: string | null;
  note: string;
  status: ResourceStatus;
  createdBy: string;
  createdByName: string;
  schoolId: string | null;
  createdAt?: { toMillis(): number } | null;
}

export type ResourceInput = Pick<ResourceDoc, "kind" | "title" | "url" | "grade" | "curLessonId" | "note">;

const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");

/** Làm sạch dữ liệu GV gửi lên; trả chuỗi lỗi nếu không hợp lệ */
export function sanitizeResource(x: unknown): ResourceInput | string {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const kind = o.kind as ResourceKind;
  if (!(kind in RESOURCE_KINDS)) return "Loại học liệu không hợp lệ.";
  const t = (o.title && typeof o.title === "object" ? o.title : {}) as Record<string, unknown>;
  const title = { vi: str(t.vi, 160), en: str(t.en, 160) };
  if (!title.vi) return "Cần nhập tên học liệu (tiếng Việt).";
  const url = str(o.url, 500);
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "Đường liên kết không hợp lệ.";
  }
  if (u.protocol !== "https:") return "Chỉ nhận đường liên kết bắt đầu bằng https://";
  if (kind === "geogebra" && !geogebraId(url)) return "Link GeoGebra cần có dạng https://www.geogebra.org/m/…";
  if (kind === "video" && !youtubeId(url)) return "Hiện chỉ nhận video YouTube (youtube.com/watch?v=… hoặc youtu.be/…).";
  if (kind === "simulation" && !simSource(url)) return "Mô phỏng cần là link PhET (phet.colorado.edu/…), ứng dụng GeoGebra (www.geogebra.org/geometry…), NetLogo Web hoặc Learn.Genetics.";
  if (kind === "model3d" && !sketchfabId(url)) return "Link mô hình 3D cần có dạng https://sketchfab.com/3d-models/…";
  const grade = Math.round(Number(o.grade));
  if (!isGrade(grade)) return "Khối lớp phải từ 6 đến 9.";
  const curLessonId = isCurLessonId(o.curLessonId) ? o.curLessonId : null;
  if (curLessonId && curLesson(curLessonId)!.grade !== grade) return "Bài SGK không thuộc khối đã chọn.";
  return { kind, title, url: u.toString(), grade, curLessonId, note: str(o.note, 500) };
}

/** Mã hình GeoGebra từ link geogebra.org/m/ID, /classic/ID, /material/show/id/ID */
export function geogebraId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)geogebra\.org$/.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(?:m|classic|calculator|geometry|graphing|material\/show\/id|material\/iframe\/id)\/([A-Za-z0-9]{4,20})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Mã video YouTube */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Mã mô phỏng PhET (vd "natural-selection") từ link phet.colorado.edu/sims/html/ID/… hoặc /en/simulations/ID */
export function phetSlug(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "phet.colorado.edu") return null;
    const m = u.pathname.match(/^\/sims\/html\/([a-z0-9-]{3,60})\//) ?? u.pathname.match(/^\/[a-z]{2}(?:_[A-Z]{2})?\/simulations?\/([a-z0-9-]{3,60})\/?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Ứng dụng GeoGebra nhúng được (không cần mã hình): hình học, đồ thị, 3D, bản cổ điển */
const GEOGEBRA_APPS = ["/geometry", "/graphing", "/3d", "/classic", "/calculator"];

/**
 * Nguồn mô phỏng được nhận (đã kiểm tra cho phép nhúng iframe):
 * PhET (ĐH Colorado) · ứng dụng GeoGebra · NetLogo Web (ĐH Northwestern) · Learn.Genetics (ĐH Utah)
 */
export function simSource(url: string): "phet" | "geogebra" | "netlogo" | "utah" | null {
  if (phetSlug(url)) return "phet";
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (u.hostname === "www.geogebra.org" && GEOGEBRA_APPS.includes(u.pathname.replace(/\/$/, ""))) return "geogebra";
    if (u.hostname === "www.netlogoweb.org" && (u.pathname === "/web" || u.pathname === "/launch") && /\.nlogo/i.test(decodeURIComponent(u.search + u.hash))) return "netlogo";
    if (u.hostname === "learn.genetics.utah.edu" && u.pathname.startsWith("/content/")) return "utah";
  } catch {}
  return null;
}

/** Link chạy mô hình NetLogo Web từ thư viện mẫu, vd netlogoUrl("Biology/Wolf Sheep Predation") */
export const netlogoUrl = (path: string) => `https://www.netlogoweb.org/web?https://www.netlogoweb.org/assets/modelslib/Sample%20Models/${path.split("/").map(encodeURIComponent).join("/")}.nlogo`;

/** Link chạy mô phỏng PhET; locale "vi" = giao diện tiếng Việt (sim chưa dịch thì PhET tự dùng tiếng Anh) */
export const phetUrl = (slug: string, locale: "en" | "vi" = "en") => `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_all.html?locale=${locale}`;

/** Mã mô hình Sketchfab (32 kí tự hex) từ link sketchfab.com/3d-models/ten-ID hoặc /models/ID */
export function sketchfabId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, "") !== "sketchfab.com") return null;
    const m = u.pathname.match(/^\/3d-models\/(?:[^/]*-)?([0-9a-f]{32})\/?$/) ?? u.pathname.match(/^\/models\/([0-9a-f]{32})(?:\/embed)?\/?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Link nhúng (iframe) — null = chỉ mở trong tab mới */
export function embedUrl(r: Pick<ResourceDoc, "kind" | "url">, locale: "en" | "vi" = "en"): string | null {
  if (r.kind === "simulation") {
    const slug = phetSlug(r.url);
    if (slug) return phetUrl(slug, locale);
    return simSource(r.url) ? r.url : null;
  }
  if (r.kind === "model3d") {
    const id = sketchfabId(r.url);
    return id ? `https://sketchfab.com/models/${id}/embed?autostart=1&ui_infos=0&ui_watermark=0` : null;
  }
  if (r.kind === "geogebra") {
    const id = geogebraId(r.url);
    return id ? `https://www.geogebra.org/material/iframe/id/${id}/width/800/height/500/border/888888/rc/false/ai/false/sdz/true/smb/false/stb/false/stbh/false/ld/false/sri/true` : null;
  }
  if (r.kind === "video") {
    const id = youtubeId(r.url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?cc_load_policy=1&rel=0` : null;
  }
  return null;
}
