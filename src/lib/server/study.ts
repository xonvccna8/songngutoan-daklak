// Ghi nhận tự học (chỉ máy chủ): thời gian học thật theo ngày + số hoạt động → lsn_studyDaily, lsn_studentStats
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { vnDayKey } from "@/lib/live/summary";
import { DAILY_CAP_SEC, creditSeconds, isStudyDay } from "@/lib/study/time";
import type { StudyActivity } from "@/lib/study/types";

export interface StudyInput {
  /** Số giây trình duyệt báo (máy chủ tự giới hạn) — bỏ trống nếu chỉ ghi hoạt động */
  seconds?: number;
  activity?: StudyActivity;
  /** Số hoạt động hoàn thành (vd 1 câu bài tập, 1 lượt ôn thẻ) */
  count?: number;
  /** Cộng thêm bộ đếm trong lsn_studentStats, vd { cardReviews: 1 } */
  statInc?: Record<string, number>;
}

export async function addStudy(uid: string, classId: string, input: StudyInput, now = Date.now()) {
  const db = adminDb();
  const day = vnDayKey(now);
  const dref = db.collection(COL.studyDaily).doc(`${uid}_${day}`);
  const sref = db.collection(COL.stats).doc(`${classId}_${uid}`);
  return db.runTransaction(async (tx) => {
    const d = (await tx.get(dref)).data() ?? {};
    const prev = (d.activeSeconds as number | undefined) ?? 0;
    const credited = input.seconds != null ? creditSeconds(input.seconds, d.lastPingAt as number | undefined, now) : 0;
    const add = Math.max(0, Math.min(credited, DAILY_CAP_SEC - prev));
    const acts: Record<string, number> = { ...((d.activities as Record<string, number> | undefined) ?? {}) };
    if (input.activity && input.count) acts[input.activity] = (acts[input.activity] ?? 0) + input.count;
    const total = prev + add;

    tx.set(
      dref,
      { uid, classId, day, activeSeconds: total, activities: acts, ...(input.seconds != null ? { lastPingAt: now } : {}), updatedAt: now },
      { merge: true }
    );
    const stat: Record<string, unknown> = { classId, uid, lastActiveAt: Timestamp.fromMillis(now) };
    if (add) {
      stat.studySeconds = FieldValue.increment(add);
      stat.studySec = { [day]: total };
    }
    if (isStudyDay(total, acts)) stat.days = { [day]: true };
    Object.entries(input.statInc ?? {}).forEach(([k, v]) => (stat[k] = FieldValue.increment(v)));
    tx.set(sref, stat, { merge: true });
    return { credited: add, today: total };
  });
}
