// Đợt D — Báo cáo minh chứng theo tiêu chí 3 mức độ (dự thảo): số tiết song ngữ, tỉ lệ tiếng Anh, số HS tham gia.
// Hàm thuần, test trong tests/english.test.ts. Danh sách tiết đưa vào đã lọc bỏ bài Toán cũ.
import { schoolYearOf } from "@/lib/live/english";
import type { SessionDoc } from "@/lib/live/types";

/** Dự thảo: Mức 2 cần tối thiểu 105 tiết dạy bằng tiếng Anh / năm */
export const LEVEL2_SESSIONS = 105;
/** Tiết có tỉ lệ tiếng Anh quy đổi từ mức này được tính là "tiết chủ yếu bằng tiếng Anh" */
export const EN_SESSION_MIN = 50;

type S = Pick<SessionDoc, "id" | "status" | "lessonTitle" | "results" | "english" | "summary" | "createdAt" | "endedAt">;

export interface EvidenceRow {
  id: string;
  at: number;
  title: string;
  participants: number;
  minutes: number | null;
  enPct: number | null;
  noViPct: number | null;
}

export interface Evidence {
  year: number;
  rows: EvidenceRow[];
  /** Số tiết song ngữ đã dạy xong */
  sessions: number;
  /** Số tiết đã đo tỉ lệ tiếng Anh (từ Đợt D) */
  measured: number;
  /** Số tiết đạt tỉ lệ tiếng Anh từ EN_SESSION_MIN */
  enSessions: number;
  avgEnPct: number | null;
  /** Số em khác nhau đã tham gia ít nhất 1 tiết */
  students: number;
  participations: number;
  months: { key: string; n: number; avgEnPct: number | null }[];
}

const atOf = (s: S) => s.endedAt?.toMillis?.() ?? s.createdAt?.toMillis?.() ?? 0;
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const monthKey = (ms: number) => {
  const d = new Date(ms + 7 * 3600_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

export function evidenceOf(sessions: S[], year: number): Evidence {
  const ended = sessions.filter((s) => s.status === "ended" && atOf(s) && schoolYearOf(atOf(s)) === year).sort((a, b) => atOf(a) - atOf(b));
  const rows: EvidenceRow[] = ended.map((s) => ({
    id: s.id,
    at: atOf(s),
    title: s.lessonTitle?.vi ?? "",
    participants: s.results ? Object.keys(s.results).length : (s.summary?.participants ?? 0),
    minutes: s.english?.totalMs ? Math.round(s.english.totalMs / 60_000) : null,
    enPct: s.english?.totalMs ? s.english.enPct : null,
    noViPct: s.english?.noViPct ?? null,
  }));
  const uids = new Set(ended.flatMap((s) => Object.keys(s.results ?? {})));
  const measured = rows.filter((r) => r.enPct != null);
  const months = new Map<string, EvidenceRow[]>();
  rows.forEach((r) => months.set(monthKey(r.at), [...(months.get(monthKey(r.at)) ?? []), r]));
  return {
    year,
    rows,
    sessions: rows.length,
    measured: measured.length,
    enSessions: measured.filter((r) => r.enPct! >= EN_SESSION_MIN).length,
    avgEnPct: avg(measured.map((r) => r.enPct!)),
    students: uids.size,
    participations: rows.reduce((a, r) => a + r.participants, 0),
    months: [...months.entries()].map(([key, rs]) => ({ key, n: rs.length, avgEnPct: avg(rs.filter((r) => r.enPct != null).map((r) => r.enPct!)) })),
  };
}

/** Năm học có tiết, mới nhất trước */
export function yearsOf(sessions: S[]): number[] {
  return [...new Set(sessions.filter((s) => s.status === "ended" && atOf(s)).map((s) => schoolYearOf(atOf(s))))].sort((a, b) => b - a);
}

/** CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt) */
export function evidenceCsv(e: Evidence, className: string): string {
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const date = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10);
  const lines = [
    ["Lớp", "Năm học", "Ngày", "Bài", "Số HS tham gia", "Số phút đo", "Tỉ lệ tiếng Anh (%)", "Câu trả lời không xem tiếng Việt (%)"],
    ...e.rows.map((r) => [className, `${e.year}-${e.year + 1}`, date(r.at), r.title, r.participants, r.minutes ?? "", r.enPct ?? "", r.noViPct ?? ""]),
  ];
  return "﻿" + lines.map((l) => l.map(q).join(",")).join("\r\n");
}
