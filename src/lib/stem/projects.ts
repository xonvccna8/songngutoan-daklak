// Dự án STEM theo tổ (lsn_projects + teams/{số tổ}): quy trình thiết kế kĩ thuật 6 bước, rubric 4 tiêu chí,
// nhật kí song ngữ của tổ, link sản phẩm (ảnh / video / slide). Hàm thuần, có test trong tests/stem.test.ts
import type { Bi } from "@/lib/live/types";
import { XP } from "@/lib/progress/xp";
import { curLesson, isCurLessonId, isGrade } from "@/lib/curriculum";
import { STEM_TEMPLATES_TOAN } from "@/lib/stem/templates-toan";

export const STEM_STAGES = [
  { key: "ask", vi: "Xác định vấn đề", en: "Ask", hint: { vi: "Vấn đề cần giải quyết là gì? Ai cần sản phẩm này?", en: "What is the problem? Who needs it?" } },
  { key: "imagine", vi: "Đề xuất ý tưởng", en: "Imagine", hint: { vi: "Mỗi bạn nêu một ý tưởng, cả tổ chọn ý tưởng tốt nhất.", en: "Share ideas and choose the best one." } },
  { key: "plan", vi: "Lập kế hoạch", en: "Plan", hint: { vi: "Vẽ bản thiết kế, liệt kê vật liệu, chia việc.", en: "Draw a design, list materials, share the jobs." } },
  { key: "create", vi: "Chế tạo", en: "Create", hint: { vi: "Làm sản phẩm theo bản thiết kế. Chụp ảnh quá trình.", en: "Build it. Take photos as you work." } },
  { key: "improve", vi: "Thử nghiệm – Cải tiến", en: "Test & improve", hint: { vi: "Thử sản phẩm, ghi kết quả, sửa chỗ chưa tốt.", en: "Test it, record results, make it better." } },
  { key: "share", vi: "Trình bày", en: "Share", hint: { vi: "Giới thiệu sản phẩm bằng tiếng Anh (có thể kèm tiếng Việt).", en: "Present your product in English." } },
] as const;
export type StageKey = (typeof STEM_STAGES)[number]["key"];
export const isStageKey = (k: unknown): k is StageKey => STEM_STAGES.some((s) => s.key === k);

export const RUBRIC = [
  // Mã "science" giữ nguyên để đọc được điểm đã chấm trên Firebase; hiển thị là kiến thức Toán
  { key: "science", vi: "Kiến thức Toán", en: "Maths knowledge" },
  { key: "product", vi: "Sản phẩm", en: "Product" },
  { key: "teamwork", vi: "Hợp tác", en: "Teamwork" },
  { key: "english", vi: "Trình bày tiếng Anh", en: "Presenting in English" },
] as const;
export type RubricKey = (typeof RUBRIC)[number]["key"];
/** Mức rubric 1–4: Chưa đạt · Đạt · Tốt · Xuất sắc */
export const RUBRIC_LEVELS = ["Chưa đạt", "Đạt", "Tốt", "Xuất sắc"] as const;

export interface ProjectInput {
  title: Bi;
  goal: Bi;
  brief: Bi;
  materials: string;
  grade: number;
  /** Bài SGK của dự án (id khung chương trình, vd "k8-35"); dự án cũ có thể chưa có */
  curLessonId?: string | null;
  vocab: { en: string; vi: string }[];
  dueAt: number;
}

export interface ProjectDoc extends Omit<ProjectInput, "dueAt"> {
  id: string;
  classId: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  teams: number;
  dueAt: number;
  status: "open" | "closed";
  createdAt?: { toMillis(): number } | null;
}

export interface TeamDoc {
  team: number;
  stages: Partial<Record<StageKey, { done: boolean; note: string; at: number; by: string }>>;
  links: { url: string; label: string }[];
  reflection: Bi;
  submittedAt: number | null;
  scores: Partial<Record<RubricKey, number>> | null;
  feedback: string;
  scoredAt: number | null;
  updatedAt?: number;
}

export const emptyTeam = (team: number): TeamDoc => ({ team, stages: {}, links: [], reflection: { en: "", vi: "" }, submittedAt: null, scores: null, feedback: "", scoredAt: null });

export type StemTemplate = Omit<ProjectInput, "dueAt"> & { id: string };

/** Tất cả mẫu dự án STEM Toán 6–9 (GV chọn rồi sửa tự do) — nội dung ở templates-toan.ts */
export const STEM_TEMPLATES: StemTemplate[] = STEM_TEMPLATES_TOAN;

const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");
const bi = (x: unknown, max: number): Bi => {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  return { en: str(o.en, max), vi: str(o.vi, max) };
};
const DAY = 86_400_000;

export function sanitizeProject(x: unknown, now = Date.now()): ProjectInput | string {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const title = bi(o.title, 160);
  if (!title.vi) return "Cần nhập tên dự án (tiếng Việt).";
  const grade = Math.round(Number(o.grade));
  if (!isGrade(grade)) return "Khối lớp phải từ 6 đến 9.";
  const dueAt = Number(o.dueAt);
  if (!Number.isFinite(dueAt) || dueAt < now + 60 * 60_000) return "Hạn nộp phải sau thời điểm hiện tại ít nhất 1 giờ.";
  if (dueAt > now + 120 * DAY) return "Hạn nộp tối đa 120 ngày.";
  const vocab = (Array.isArray(o.vocab) ? o.vocab : [])
    .map((v) => bi(v, 60))
    .filter((v) => v.en)
    .slice(0, 12);
  const curLessonId = isCurLessonId(o.curLessonId) && curLesson(o.curLessonId)!.grade === grade ? o.curLessonId : null;
  return { title, goal: bi(o.goal, 500), brief: bi(o.brief, 2000), materials: str(o.materials, 600), grade, curLessonId, vocab, dueAt };
}

/** Link sản phẩm: chỉ https, tối đa 6 link */
export function sanitizeLinks(x: unknown): { url: string; label: string }[] | string {
  const list = Array.isArray(x) ? x : [];
  if (list.length > 6) return "Tối đa 6 đường liên kết.";
  const out: { url: string; label: string }[] = [];
  for (const it of list) {
    const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
    const url = str(o.url, 500);
    if (!url) continue;
    try {
      if (new URL(url).protocol !== "https:") return "Chỉ nhận đường liên kết bắt đầu bằng https://";
    } catch {
      return "Đường liên kết không hợp lệ.";
    }
    out.push({ url, label: str(o.label, 80) });
  }
  return out;
}

export function sanitizeScores(x: unknown): Record<RubricKey, number> | string {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const out = {} as Record<RubricKey, number>;
  for (const r of RUBRIC) {
    const v = Math.round(Number(o[r.key]));
    if (!(v >= 1 && v <= 4)) return `Hãy chấm tiêu chí “${r.vi}” (mức 1–4).`;
    out[r.key] = v;
  }
  return out;
}

/** Tổng điểm rubric quy về thang 10 */
export const rubricScore10 = (s: Partial<Record<RubricKey, number>> | null | undefined) => {
  if (!s) return null;
  const vals = RUBRIC.map((r) => s[r.key]).filter((v): v is number => typeof v === "number");
  if (vals.length !== RUBRIC.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / (RUBRIC.length * 4)) * 100) / 10;
};

/** XP mỗi em trong tổ nhận khi GV chấm (tối đa XP.stemMax) */
export const stemXp = (s: Partial<Record<RubricKey, number>> | null | undefined) => {
  const v = rubricScore10(s);
  return v == null ? 0 : Math.round((v / 10) * XP.stemMax);
};

/** Tiến độ của tổ: số bước đã xong / 6 */
export const stagesDone = (t: Pick<TeamDoc, "stages"> | null | undefined) => STEM_STAGES.filter((s) => t?.stages?.[s.key]?.done).length;
