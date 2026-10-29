// Tạo tin GV → HS (kèm biên nhận + thông báo đẩy). Dùng cho /api/messages, nhắc bài tập, cron hằng ngày.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { sendPush } from "@/lib/server/push";
import { awardXpSafe } from "@/lib/server/xp";
import { inQuietHours } from "@/lib/messages/rules";
import { KIND_META, type MessageKind } from "@/lib/messages/types";
import type { Bi } from "@/lib/live/types";
import { DEFAULT_CLASS_SETTINGS, type ClassDoc, type StudentDoc } from "@/lib/types";

export interface Recipients {
  all?: boolean;
  team?: number;
  uids?: string[];
}

/** Người nhận (chỉ trong lớp): cả lớp / 1 tổ / danh sách em — kèm nhãn để GV đọc */
export async function resolveRecipients(cls: ClassDoc, to: Recipients | undefined) {
  const roster = (await adminDb().collection(COL.classes).doc(cls.id).collection(COL.students).get()).docs.map((d) => ({ uid: d.id, ...d.data() }) as StudentDoc);
  const byUid = new Map(roster.map((s) => [s.uid, s]));
  let uids: string[] = [];
  let toLabel = "";
  if (to?.all) {
    uids = roster.map((s) => s.uid);
    toLabel = `Cả lớp ${cls.name}`;
  } else if (to?.team) {
    uids = roster.filter((s) => s.team === to.team).map((s) => s.uid);
    toLabel = `Tổ ${to.team} · lớp ${cls.name}`;
  } else if (Array.isArray(to?.uids)) {
    uids = [...new Set(to.uids)].filter((u) => byUid.has(u));
    toLabel = uids.length === 1 ? byUid.get(uids[0])!.fullName : `${uids.length} em · lớp ${cls.name}`;
  }
  return { uids, toLabel, roster };
}

export interface NewMessage {
  cls: ClassDoc;
  uids: string[];
  toLabel: string;
  kind: MessageKind;
  text: Bi;
  fromUid: string;
  fromName: string;
  sessionId?: string | null;
  points?: number;
  /** Gắn với bài tập (để HS bấm vào mở bài) */
  assignmentId?: string;
}

export async function createMessage(m: NewMessage) {
  const db = adminDb();
  const settings = { ...DEFAULT_CLASS_SETTINGS, ...m.cls.settings };
  const silent = m.kind === "notice" || inQuietHours(settings.quietHours, Date.now());
  const points = m.points ?? 0;

  const ref = db.collection(COL.messages).doc();
  const batch = db.batch();
  batch.set(ref, {
    classId: m.cls.id,
    schoolId: m.cls.schoolId,
    fromUid: m.fromUid,
    fromName: m.fromName,
    kind: m.kind,
    text: m.text,
    toUids: m.uids,
    toLabel: m.toLabel,
    sessionId: m.sessionId ?? null,
    assignmentId: m.assignmentId ?? null,
    points,
    silent,
    createdAt: FieldValue.serverTimestamp(),
  });
  m.uids.forEach((uid) => batch.set(ref.collection(COL.receipts).doc(uid), { uid, status: "sent", deliveredAt: null, readAt: null, ackAt: null, reply: null }));
  // Khen ngợi có điểm thưởng → đếm điểm thưởng (XP cộng riêng qua awardXp bên dưới)
  if (points > 0) {
    m.uids.forEach((uid) => batch.set(db.collection(COL.stats).doc(`${m.cls.id}_${uid}`), { classId: m.cls.id, uid, bonusPoints: FieldValue.increment(points) }, { merge: true }));
  }
  await batch.commit();
  if (points > 0) {
    // Khen = XP "Trên lớp" (GV trao); id cố định theo tin nhắn → không cộng trùng
    await awardXpSafe(m.uids.map((uid) => ({ uid, classId: m.cls.id, kind: "praise" as const, scope: "class" as const, xp: points, key: `praise_${ref.id}_${uid}`, note: m.text.vi || m.text.en })));
  }

  // Thông báo đẩy cho máy đã đóng web (không làm hỏng việc gửi nếu lỗi)
  let pushed = 0;
  try {
    pushed = await sendPush(m.uids, {
      mid: ref.id,
      kind: m.kind,
      title: `${KIND_META[m.kind].label} · ${m.fromName}`,
      body: [m.text.vi, m.text.en].filter(Boolean).join("\n"),
      silent,
      url: m.assignmentId ? `/s/hw/${m.assignmentId}` : "/s",
    });
  } catch (e) {
    console.error("push:", (e as Error).message);
  }
  return { id: ref.id, pushed, silent };
}
