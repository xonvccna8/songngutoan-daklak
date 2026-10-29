// Tổng hợp kết quả một tiết (hàm thuần) — ghi vào lsn_sessions/{id}.results/questions/wrongWords khi kết thúc,
// để trang lớp chỉ cần đọc 1 tài liệu / tiết thay vì hàng nghìn câu trả lời.
import type { ResponseDoc, Slide } from "@/lib/live/types";

export interface StudentResult {
  points: number;
  answered: number;
  correct: number;
  mathA: number;
  mathC: number;
  langA: number;
  langC: number;
  pronSum: number;
  pronN: number;
  joinedAt: number | null;
  leftCount: number;
  /** Đợt C — số câu em trả lời khi có xem tiếng Việt (để gợi ý mức E1/E2/E3); tiết cũ không có */
  viA?: number;
}

export interface QuestionStat {
  slideId: string;
  title: string;
  skill: string;
  qtype: string;
  answered: number;
  correct: number;
  /** Đáp án sai hay gặp: giá trị → số em */
  wrong: Record<string, number>;
}

export interface SessionSummary {
  results: Record<string, StudentResult>;
  questions: Record<string, QuestionStat>;
  wrongWords: Record<string, number>;
  participants: number;
  avgPoints: number;
  accuracy: number;
}

export interface ParticipantLite {
  uid: string;
  joinedAt?: number | null;
  leftCount?: number;
}

const empty = (): StudentResult => ({ points: 0, answered: 0, correct: 0, mathA: 0, mathC: 0, langA: 0, langC: 0, pronSum: 0, pronN: 0, joinedAt: null, leftCount: 0, viA: 0 });

/** Khoá an toàn cho map Firestore (không có . / [ ] ~ * và không rỗng) */
export const safeKey = (s: string) => s.toLowerCase().replace(/[.\/\[\]~*`]/g, "").trim().slice(0, 40) || "_";

export function summarize(responses: ResponseDoc[], participants: ParticipantLite[], slides: Slide[]): SessionSummary {
  const results: Record<string, StudentResult> = {};
  const get = (uid: string) => (results[uid] ??= empty());
  participants.forEach((p) => {
    const r = get(p.uid);
    r.joinedAt = p.joinedAt ?? null;
    r.leftCount = p.leftCount ?? 0;
  });

  const bySlide = new Map(slides.map((s) => [s.id, s]));
  const questions: Record<string, QuestionStat> = {};
  const wrongWords: Record<string, number> = {};

  for (const resp of responses) {
    const r = get(resp.uid);
    r.points += resp.points ?? 0;
    const slide = bySlide.get(resp.slideId);
    if (resp.qtype === "speak") {
      r.pronSum += resp.score ?? 0;
      r.pronN++;
      (resp.wrongWords ?? []).forEach((w) => {
        const k = safeKey(w);
        wrongWords[k] = (wrongWords[k] ?? 0) + 1;
      });
      continue;
    }
    r.answered++;
    if (resp.correct) r.correct++;
    if (resp.vi) r.viA = (r.viA ?? 0) + 1;
    // mathA/mathC: phần Toán (mọi kĩ năng khác "Ngôn ngữ", kể cả "Khoa học" của dữ liệu KHTN)
    if (resp.skill === "Ngôn ngữ") {
      r.langA++;
      if (resp.correct) r.langC++;
    } else {
      r.mathA++;
      if (resp.correct) r.mathC++;
    }
    const q = (questions[resp.slideId] ??= {
      slideId: resp.slideId,
      title: slide?.question?.prompt.vi ?? slide?.title.vi ?? resp.slideId,
      skill: resp.skill,
      qtype: resp.qtype,
      answered: 0,
      correct: 0,
      wrong: {},
    });
    q.answered++;
    if (resp.correct) q.correct++;
    else {
      // Trắc nghiệm: lưu chữ của đáp án (vd. "a square") thay vì số thứ tự
      const opt = resp.qtype === "mcq" ? slide?.question?.options?.[Number(resp.value)]?.en : undefined;
      const k = safeKey(opt ?? String(resp.value ?? ""));
      q.wrong[k] = (q.wrong[k] ?? 0) + 1;
    }
  }

  const joined = Object.values(results);
  const answered = joined.reduce((s, r) => s + r.answered, 0);
  const correct = joined.reduce((s, r) => s + r.correct, 0);
  return {
    results,
    questions,
    wrongWords,
    participants: participants.length,
    avgPoints: joined.length ? Math.round(joined.reduce((s, r) => s + r.points, 0) / joined.length) : 0,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
  };
}

/** Ngày theo giờ Việt Nam (UTC+7) dạng yyyymmdd */
export function vnDayKey(ms: number): string {
  const d = new Date(ms + 7 * 3600_000);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}
