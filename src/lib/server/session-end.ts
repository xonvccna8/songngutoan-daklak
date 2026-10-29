// Ghi kết quả khi kết thúc tiết: tóm tắt vào tài liệu phiên + cộng dồn lsn_studentStats (dùng cho API và seed).
// XP của tiết cộng riêng bằng sessionAwards → awardXp (sau khi batch này đã ghi, để ngày học đã có).
import { FieldValue, Timestamp, type WriteBatch } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { vnDayKey, type SessionSummary } from "@/lib/live/summary";
import { liveXp } from "@/lib/progress/xp";
import type { Award } from "@/lib/server/xp";
import type { EnglishStat } from "@/lib/live/english";

export function writeSummary(batch: WriteBatch, sessionId: string, classId: string, summary: SessionSummary, endedAtMs: number, english?: EnglishStat) {
  const db = adminDb();
  const day = vnDayKey(endedAtMs);
  for (const [uid, r] of Object.entries(summary.results)) {
    // Ngày học = có ít nhất 1 hoạt động (vào tiết) trong ngày
    batch.set(
      db.collection(COL.stats).doc(`${classId}_${uid}`),
      {
        classId,
        uid,
        liveAttended: FieldValue.increment(1),
        mathAnswered: FieldValue.increment(r.mathA),
        mathCorrect: FieldValue.increment(r.mathC),
        langAnswered: FieldValue.increment(r.langA),
        langCorrect: FieldValue.increment(r.langC),
        pronSum: FieldValue.increment(r.pronSum),
        pronCount: FieldValue.increment(r.pronN),
        days: { [day]: true },
        lastActiveAt: Timestamp.fromMillis(endedAtMs),
      },
      { merge: true }
    );
  }
  batch.update(db.collection(COL.sessions).doc(sessionId), {
    status: "ended",
    endedAt: Timestamp.fromMillis(endedAtMs),
    results: summary.results,
    questions: summary.questions,
    wrongWords: summary.wrongWords,
    summary: { participants: summary.participants, avgPoints: summary.avgPoints, accuracy: summary.accuracy },
    ...(english ? { english } : {}),
  });
}

/** XP trên lớp + Sao thành thạo của từng em trong tiết (id sự kiện cố định theo tiết → không cộng trùng) */
export function sessionAwards(
  sessionId: string,
  classId: string,
  summary: SessionSummary,
  speakGood: Record<string, number>,
  title?: string,
  mastery: Record<string, Record<string, { a: number; c: number }>> = {}
): Award[] {
  return Object.entries(summary.results).map(([uid, r]) => ({
    mastery: mastery[uid],
    uid,
    classId,
    kind: "live",
    scope: "class",
    xp: liveXp(r, speakGood[uid] ?? 0),
    key: `live_${sessionId}_${uid}`,
    note: title,
    studyDay: true,
    inc: speakGood[uid] ? { speakGood: speakGood[uid] } : undefined,
  }));
}
