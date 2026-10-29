// Thống kê theo dõi học sinh (GĐ 3) — hàm thuần, có test trong tests/analytics.test.ts
import { vnDayKey } from "@/lib/live/summary";
import type { SessionDoc } from "@/lib/live/types";
import type { ClassSettings } from "@/lib/types";
import { xpTotal } from "@/lib/progress/xp";
import { journeyOf } from "@/lib/progress/facts";

export interface StatsDoc {
  uid: string;
  classId: string;
  totalPoints?: number;
  liveAttended?: number;
  mathAnswered?: number;
  mathCorrect?: number;
  langAnswered?: number;
  langCorrect?: number;
  pronSum?: number;
  pronCount?: number;
  days?: Record<string, boolean>;
  lastActiveAt?: { toMillis(): number } | null;
  // ----- GĐ 5: tự học -----
  bonusPoints?: number;
  hwDone?: number;
  hwLate?: number;
  hwMissed?: number;
  /** Bài trễ / không nộp: id bài → hạn nộp (ms) */
  lateLog?: Record<string, number>;
  studySeconds?: number;
  /** Số giây học thật theo ngày yyyymmdd */
  studySec?: Record<string, number>;
  cardReviews?: number;
  speakPractice?: number;
  speakBest?: number;
  /** Số lượt chơi hết trò chơi ôn tập */
  gamePlays?: number;
  // ----- GĐ 3 mới: XP & cấp độ (chỉ máy chủ ghi, src/lib/server/xp.ts) -----
  /** XP kiếm từ GĐ 3 (tổng hiển thị = xpTotal(): cộng thêm điểm cũ quy đổi) */
  xp?: number;
  /** Cấp 0…23 (8 hạng × 3 bậc). Không có = chưa được tính lần nào */
  level?: number;
  levelPrev?: number;
  levelUpAt?: number;
  /** Bộ đếm trong ngày để giới hạn XP ở nhà */
  today?: { day: string; home: number; cards: number };
  /** Số thuật ngữ đã nhớ (thẻ "Nhớ" ≥ 2 lần) */
  termsLearned?: number;
  /** Số thuật ngữ đã duyệt lúc tính cấp gần nhất */
  termsAvail?: number;
  /** Số câu nói đạt yêu cầu (≥ 80 điểm) */
  speakGood?: number;
  // ----- GĐ 4: thành thạo theo yêu cầu cần đạt (id YCCĐ → số câu làm / đúng) -----
  mastery?: Record<string, import("@/lib/curriculum").MasteryCell>;
  /** Bài SGK đã xem trước (id bài → ms) */
  prepped?: Record<string, number>;
  /** GĐ 5 — điểm trò chơi cao nhất (kỉ lục cá nhân) */
  gameBest?: number;
}

export type Engagement = "active" | "remind" | "inactive";

export const ENGAGEMENT_META: Record<Engagement, { label: string; bg: string; fg: string }> = {
  active: { label: "Tích cực", bg: "#DDF7EE", fg: "#0E6377" },
  remind: { label: "Cần nhắc", bg: "#FFF1D2", fg: "#8A5A00" },
  inactive: { label: "Chưa học", bg: "#FFE3DD", fg: "#A3301B" },
};

const DAY = 86_400_000;

/** Số ngày có học trong n ngày gần nhất (tính cả hôm nay, giờ Việt Nam) */
export function studyDays(days: Record<string, boolean> | undefined, now: number, n = 7): number {
  if (!days) return 0;
  let c = 0;
  for (let i = 0; i < n; i++) if (days[vnDayKey(now - i * DAY)]) c++;
  return c;
}

/** Chuỗi ngày học liên tiếp tính tới hôm nay (hôm nay chưa học thì tính tới hôm qua) */
export function streak(days: Record<string, boolean> | undefined, now: number): number {
  if (!days) return 0;
  let i = days[vnDayKey(now)] ? 0 : 1;
  let c = 0;
  while (days[vnDayKey(now - i * DAY)]) {
    c++;
    i++;
  }
  return c;
}

/** Trạng thái 7 ngày theo ngưỡng cài đặt lớp (docs/DU-LIEU.md). late = số bài trễ (có từ GĐ 5) */
export function engagement(days7: number, late: number, t: ClassSettings["thresholds"]): Engagement {
  if (days7 === 0 || late >= t.inactiveLate) return "inactive";
  if (days7 >= t.activeDays && late === 0) return "active";
  return "remind";
}

export const pct = (c: number, a: number) => (a > 0 ? Math.round((c / a) * 100) : null);

/** Số bài trễ / không nộp có hạn trong n ngày gần nhất */
export const lateIn = (lateLog: Record<string, number> | undefined, now: number, n = 7) =>
  Object.values(lateLog ?? {}).filter((due) => due <= now && due > now - n * DAY).length;

/** Số phút học thật trong n ngày gần nhất (tính cả hôm nay) */
export function studyMinutes(studySec: Record<string, number> | undefined, now: number, n = 7): number {
  if (!studySec) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += studySec[vnDayKey(now - i * DAY)] ?? 0;
  return Math.round(s / 60);
}

/** Phút học từng ngày (cũ → mới) cho biểu đồ */
export function studySeries(studySec: Record<string, number> | undefined, now: number, n = 7) {
  return Array.from({ length: n }, (_, k) => {
    const ms = now - (n - 1 - k) * DAY;
    return {
      key: vnDayKey(ms),
      label: new Date(ms).toLocaleDateString("vi-VN", { weekday: "short", timeZone: "Asia/Ho_Chi_Minh" }),
      minutes: Math.round((studySec?.[vnDayKey(ms)] ?? 0) / 60),
    };
  });
}

export interface StudentRow {
  uid: string;
  /** Tổng XP */
  points: number;
  /** Cấp 0…23 */
  level: number;
  attended: number;
  correctPct: number | null;
  mathPct: number | null;
  langPct: number | null;
  pron: number | null;
  days7: number;
  streak: number;
  status: Engagement;
  lastActive: number | null;
  /** Bài trễ / không nộp trong 7 ngày */
  late7: number;
  /** Phút tự học thật trong 7 ngày */
  studyMin7: number;
  hwDone: number;
}

export function studentRow(uid: string, s: StatsDoc | undefined, now: number, t: ClassSettings["thresholds"]): StudentRow {
  const d7 = studyDays(s?.days, now);
  const ma = s?.mathAnswered ?? 0,
    mc = s?.mathCorrect ?? 0,
    la = s?.langAnswered ?? 0,
    lc = s?.langCorrect ?? 0;
  const late7 = lateIn(s?.lateLog, now);
  return {
    uid,
    points: xpTotal(s),
    level: journeyOf(s).level,
    attended: s?.liveAttended ?? 0,
    correctPct: pct(mc + lc, ma + la),
    mathPct: pct(mc, ma),
    langPct: pct(lc, la),
    pron: s?.pronCount ? Math.round((s.pronSum ?? 0) / s.pronCount) : null,
    days7: d7,
    streak: streak(s?.days, now),
    status: engagement(d7, late7, t),
    lastActive: s?.lastActiveAt?.toMillis?.() ?? null,
    late7,
    studyMin7: studyMinutes(s?.studySec, now),
    hwDone: s?.hwDone ?? 0,
  };
}

export const ended = (sessions: SessionDoc[]) =>
  sessions.filter((s) => s.status === "ended" && s.results).sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));

/** Điểm trung bình mỗi em mỗi tiết trong 7 ngày qua */
export function weeklyAvgPoints(sessions: SessionDoc[], now: number): number | null {
  const pts: number[] = [];
  ended(sessions)
    .filter((s) => (s.createdAt?.toMillis() ?? 0) >= now - 7 * DAY)
    .forEach((s) => Object.values(s.results!).forEach((r) => pts.push(r.points)));
  return pts.length ? Math.round(pts.reduce((a, b) => a + b, 0) / pts.length) : null;
}

export interface ProgressPoint {
  id: string;
  label: string;
  at: number;
  title: string;
  mathPct: number | null;
  langPct: number | null;
  avgPoints: number;
  participants: number;
}

/** Tiến bộ theo từng tiết: tỉ lệ đúng Toán / Ngôn ngữ (mathPct = phần Toán) */
export function progress(sessions: SessionDoc[]): ProgressPoint[] {
  return ended(sessions).map((s) => {
    const rs = Object.values(s.results!);
    const sum = (k: "mathA" | "mathC" | "langA" | "langC") => rs.reduce((a, r) => a + r[k], 0);
    const at = s.createdAt?.toMillis() ?? 0;
    return {
      id: s.id,
      at,
      label: new Date(at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      title: s.lessonTitle?.vi ?? "",
      mathPct: pct(sum("mathC"), sum("mathA")),
      langPct: pct(sum("langC"), sum("langA")),
      avgPoints: rs.length ? Math.round(rs.reduce((a, r) => a + r.points, 0) / rs.length) : 0,
      participants: rs.length,
    };
  });
}

export interface WrongQuestion {
  key: string;
  title: string;
  lesson: string;
  skill: string;
  answered: number;
  wrongPct: number;
  topWrong: string | null;
}

/** Câu sai nhiều nhất (gộp các lần dạy cùng một câu) */
export function topWrongQuestions(sessions: SessionDoc[], n = 6): WrongQuestion[] {
  const m = new Map<string, { title: string; lesson: string; skill: string; a: number; c: number; wrong: Record<string, number> }>();
  ended(sessions).forEach((s) =>
    Object.values(s.questions ?? {}).forEach((q) => {
      const key = `${s.lessonId}:${q.slideId}`;
      const e = m.get(key) ?? { title: q.title, lesson: s.lessonTitle?.vi ?? "", skill: q.skill, a: 0, c: 0, wrong: {} };
      e.a += q.answered;
      e.c += q.correct;
      Object.entries(q.wrong).forEach(([v, k]) => (e.wrong[v] = (e.wrong[v] ?? 0) + k));
      m.set(key, e);
    })
  );
  return [...m.entries()]
    .filter(([, e]) => e.a > 0)
    .map(([key, e]) => {
      const top = Object.entries(e.wrong).sort((a, b) => b[1] - a[1])[0];
      return { key, title: e.title, lesson: e.lesson, skill: e.skill, answered: e.a, wrongPct: Math.round(((e.a - e.c) / e.a) * 100), topWrong: top ? top[0] : null };
    })
    .sort((a, b) => b.wrongPct - a.wrongPct)
    .slice(0, n);
}

/** Từ chức năng ngắn (máy nhận giọng hay bỏ sót) — không có ích cho GV khi luyện phát âm */
const STOP_WORDS = new Set(["a", "an", "the", "is", "are", "am", "in", "on", "of", "to", "it", "its", "two", "and", "if", "then", "with", "has", "have", "be"]);
export const meaningfulWord = (w: string) => w.length > 2 && !STOP_WORDS.has(w);

/** Từ phát âm sai nhiều nhất */
export function topWrongWords(sessions: SessionDoc[], n = 10): { word: string; count: number }[] {
  const m: Record<string, number> = {};
  ended(sessions).forEach((s) => Object.entries(s.wrongWords ?? {}).forEach(([w, c]) => meaningfulWord(w) && (m[w] = (m[w] ?? 0) + c)));
  return Object.entries(m)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export interface GradeColumn {
  id: string;
  label: string;
  title: string;
  questions: number;
}

/** Bảng điểm: cột = tiết (cũ → mới); ô = điểm hoặc null nếu vắng */
export function gradebook(sessions: SessionDoc[], uids: string[]) {
  const cols: GradeColumn[] = ended(sessions).map((s) => ({
    id: s.id,
    label: new Date(s.createdAt?.toMillis() ?? 0).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    title: s.lessonTitle?.vi ?? "",
    questions: Object.keys(s.questions ?? {}).length,
  }));
  const byId = new Map(ended(sessions).map((s) => [s.id, s]));
  const rows = uids.map((uid) => {
    const cells = cols.map((c) => {
      const r = byId.get(c.id)!.results![uid];
      return r ? { points: r.points, correct: r.correct, answered: r.answered } : null;
    });
    const present = cells.filter(Boolean) as { points: number }[];
    return {
      uid,
      cells,
      total: present.reduce((a, x) => a + x.points, 0),
      avg: present.length ? Math.round(present.reduce((a, x) => a + x.points, 0) / present.length) : null,
      absent: cells.length - present.length,
    };
  });
  return { cols, rows };
}
