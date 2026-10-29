// Cộng XP — NGUỒN SỰ THẬT DUY NHẤT cho XP, cấp độ, điểm thi đua tuần (chỉ máy chủ).
// Mọi nơi (tiết học, bài về nhà, thẻ từ, GV khen) đều gọi awardXp → trong MỘT transaction:
//   ghi sự kiện lsn_events · cập nhật lsn_studentStats (xp, cấp, bộ đếm ngày) · cộng lsn_weekly của lớp.
// Có "key" → sự kiện có id cố định, gọi lại nhiều lần cũng không cộng trùng.
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { vnDayKey } from "@/lib/live/summary";
import { streak } from "@/lib/analytics";
import { computeLevel, type Facts } from "@/lib/progress/levels";
import { factsOf } from "@/lib/progress/facts";
import { weekKey, weeklyId } from "@/lib/progress/week";
import { capXp, streakBonus, xpTotal, type XpKind, type XpScope, type XpToday } from "@/lib/progress/xp";
import type { StatsDoc } from "@/lib/analytics";

export interface Award {
  uid: string;
  classId: string;
  kind: XpKind;
  scope: XpScope;
  xp: number;
  /** Id sự kiện cố định (chống cộng trùng) */
  key?: string;
  note?: string;
  /** Hoạt động này là một ngày học → xét thưởng chuỗi ngày */
  studyDay?: boolean;
  /** Cộng thêm bộ đếm trong thống kê, vd { speakGood: 1 } */
  inc?: Record<string, number>;
  /** Ghi đè bộ đếm, vd { termsLearned: 12 } */
  set?: Record<string, number>;
  /** GĐ 4 — số câu làm / đúng theo từng YCCĐ (id YCCĐ → {a, c}) → Sao thành thạo */
  mastery?: Record<string, { a: number; c: number }>;
}

export interface AwardResult {
  uid: string;
  gained: number;
  level: number;
  levelUp: boolean;
}

// Số thuật ngữ đã duyệt (bộ nhớ đệm khi hàm còn "ấm")
let termCount: { at: number; n: number } | null = null;
async function approvedTerms(): Promise<number> {
  if (!termCount || Date.now() - termCount.at > 10 * 60_000) {
    const s = await adminDb().collection(COL.terms).where("status", "==", "approved").count().get();
    termCount = { at: Date.now(), n: s.data().count };
  }
  return termCount.n;
}

export async function awardXp(awards: Award[], now = Date.now()): Promise<AwardResult[]> {
  if (!awards.length) return [];
  const db = adminDb();
  const day = vnDayKey(now);
  const week = weekKey(now);
  const termsAvailable = await approvedTerms().catch(() => 0);

  // Gom theo từng em (mỗi tài liệu chỉ ghi 1 lần trong transaction)
  const groups = new Map<string, Award[]>();
  awards.forEach((a) => {
    const k = `${a.classId}_${a.uid}`;
    groups.set(k, [...(groups.get(k) ?? []), a]);
  });
  const keys = [...groups.keys()];
  const statRefs = keys.map((k) => db.collection(COL.stats).doc(k));
  const keyed = awards.filter((a) => a.key);
  const eventRef = (id: string) => db.collection(COL.events).doc(id);
  const streakKey = (uid: string) => `streak_${uid}_${day}`;

  return db.runTransaction(async (tx) => {
    // ---- Đọc (Firestore bắt buộc đọc hết trước khi ghi) ----
    const statSnaps = await tx.getAll(...statRefs);
    const checkRefs: DocumentReference[] = [...keyed.map((a) => eventRef(a.key!)), ...keys.map((k) => eventRef(streakKey(groups.get(k)![0].uid)))];
    const checkSnaps = await tx.getAll(...checkRefs);
    const exists = new Set(checkSnaps.filter((s) => s.exists).map((s) => s.id));

    const weeklyAdd = new Map<string, Record<string, { c: number; h: number }>>();
    const results: AwardResult[] = [];

    keys.forEach((k, gi) => {
      const list = groups.get(k)!;
      const { uid, classId } = list[0];
      const s = (statSnaps[gi].data() ?? {}) as Partial<StatsDoc>;
      let today: XpToday | undefined = s.today;
      let xpAdd = 0;
      const gained = { c: 0, h: 0 };
      const inc: Record<string, number> = {};
      const set: Record<string, number> = {};
      const mast: Record<string, { a: number; c: number }> = {};
      let studyDay = false;

      for (const a of list) {
        if (a.key && exists.has(a.key)) continue; // đã cộng trước đó
        if (a.key) exists.add(a.key); // cùng key 2 lần trong 1 lượt gọi
        Object.entries(a.inc ?? {}).forEach(([f, v]) => (inc[f] = (inc[f] ?? 0) + v));
        Object.assign(set, a.set);
        Object.entries(a.mastery ?? {}).forEach(([o, v]) => (mast[o] = { a: (mast[o]?.a ?? 0) + v.a, c: (mast[o]?.c ?? 0) + v.c }));
        studyDay ||= !!a.studyDay;
        const capped = capXp(a.xp, a.scope, a.kind, today, day);
        today = capped.today;
        if (capped.xp > 0) {
          xpAdd += capped.xp;
          gained[a.scope === "class" ? "c" : "h"] += capped.xp;
        }
        // Có key thì luôn ghi (đánh dấu đã xử lý); không key thì chỉ ghi khi có XP
        if (a.key || capped.xp > 0) {
          const ref = a.key ? eventRef(a.key) : db.collection(COL.events).doc();
          tx.set(ref, { uid, classId, kind: a.kind, scope: a.scope, xp: capped.xp, at: now, day, week, note: a.note ?? null });
        }
      }

      // Thưởng chuỗi ngày (mỗi ngày tối đa 1 lần, đúng ngày chạm mốc 3 / 7 / 30)
      const days = { ...(s.days ?? {}), ...(studyDay ? { [day]: true } : {}) };
      if (studyDay && !exists.has(streakKey(uid))) {
        const len = streak(days, now);
        const bonus = streakBonus(len);
        if (bonus) {
          xpAdd += bonus;
          gained.h += bonus;
          tx.set(eventRef(streakKey(uid)), { uid, classId, kind: "streak", scope: "home", xp: bonus, at: now, day, week, note: `Chuỗi ${len} ngày` });
        }
      }

      // Sao thành thạo sau lượt này (để xét điều kiện lên hạng ngay)
      const mastery = { ...(s.mastery ?? {}) };
      Object.entries(mast).forEach(([o, v]) => (mastery[o] = { a: (mastery[o]?.a ?? 0) + v.a, c: (mastery[o]?.c ?? 0) + v.c, t: now }));

      // Cấp độ: theo XP + điều kiện; không bao giờ giảm
      const facts: Facts = factsOf(s, {
        termsLearned: set.termsLearned,
        termsAvailable,
        speakGood: (s.speakGood ?? 0) + (inc.speakGood ?? 0),
        days,
        mastery,
      });
      const total = xpTotal(s) + xpAdd;
      const first = s.level == null; // lần đầu tính cấp (dữ liệu cũ) → không báo "lên cấp"
      const stored = s.level ?? 0;
      const level = computeLevel(total, facts, stored);
      const levelUp = !first && level > stored;

      const stat: Record<string, unknown> = { classId, uid, xp: (s.xp ?? 0) + xpAdd, level, termsAvail: termsAvailable, ...set };
      if (today) stat.today = today;
      Object.entries(inc).forEach(([f, v]) => (stat[f] = FieldValue.increment(v)));
      if (Object.keys(mast).length) {
        stat.mastery = Object.fromEntries(Object.entries(mast).map(([o, v]) => [o, { a: FieldValue.increment(v.a), c: FieldValue.increment(v.c), t: now }]));
      }
      if (levelUp) {
        stat.levelPrev = stored;
        stat.levelUpAt = now;
        tx.set(eventRef(`lvl_${uid}_${level}`), { uid, classId, kind: "levelup", scope: "class", xp: 0, at: now, day, week, from: stored, to: level, note: null });
      }
      tx.set(statRefs[gi], stat, { merge: true });

      if (gained.c || gained.h) {
        const rows = weeklyAdd.get(classId) ?? {};
        rows[uid] = { c: (rows[uid]?.c ?? 0) + gained.c, h: (rows[uid]?.h ?? 0) + gained.h };
        weeklyAdd.set(classId, rows);
      }
      results.push({ uid, gained: xpAdd, level, levelUp });
    });

    // Bảng tuần: 1 lần ghi cho mỗi lớp
    weeklyAdd.forEach((rows, classId) => {
      const data: Record<string, { c: FieldValue; h: FieldValue }> = {};
      Object.entries(rows).forEach(([uid, v]) => (data[uid] = { c: FieldValue.increment(v.c), h: FieldValue.increment(v.h) }));
      tx.set(db.collection(COL.weekly).doc(weeklyId(classId, week)), { classId, week, rows: data, updatedAt: now }, { merge: true });
    });
    return results;
  });
}

/** Gọi awardXp nhưng không làm hỏng thao tác chính nếu lỗi (chỉ ghi log) */
export async function awardXpSafe(awards: Award[], now?: number) {
  try {
    return await awardXp(awards, now);
  } catch (e) {
    console.error("awardXp:", (e as Error).message);
    return [];
  }
}
