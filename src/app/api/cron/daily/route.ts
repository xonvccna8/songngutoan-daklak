// Việc chạy hằng ngày (Vercel Cron, 18:00 giờ VN — xem vercel.json):
//  1. Nhắc trước hạn ~1 ngày các em chưa nộp bài (tin "Nhắc nhở" + thông báo đẩy; giờ yên lặng thì im lặng)
//  2. Bài đã quá hạn → ghi nhận em chưa nộp (dùng cho trạng thái "Cần nhắc" / "Chưa học")
// Vercel tự gửi "Authorization: Bearer <CRON_SECRET>".
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok } from "@/lib/server/api";
import { createMessage } from "@/lib/server/messages";
import { fmtDue } from "@/lib/format";
import type { AssignmentDoc } from "@/lib/study/types";
import type { ClassDoc } from "@/lib/types";

const HOUR = 3600_000;

export const GET = handle(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("Thiếu CRON_SECRET trong biến môi trường.");
  if (req.headers.get("authorization") !== `Bearer ${secret}`) throw new HttpError(401, "Không có quyền.");

  const db = adminDb();
  const now = Date.now();
  const classCache = new Map<string, ClassDoc | null>();
  const getClass = async (id: string) => {
    if (!classCache.has(id)) {
      const s = await db.collection(COL.classes).doc(id).get();
      classCache.set(id, s.exists ? ({ id: s.id, ...s.data() } as ClassDoc) : null);
    }
    return classCache.get(id)!;
  };
  const doneUids = async (aid: string) =>
    new Set((await db.collection(COL.assignments).doc(aid).collection(COL.submissions).where("completedAt", "!=", null).select().get()).docs.map((d) => d.id));

  // 1. Nhắc trước hạn
  let reminded = 0;
  const soon = await db
    .collection(COL.assignments)
    .where("dueAt", ">", Timestamp.fromMillis(now))
    .where("dueAt", "<=", Timestamp.fromMillis(now + 36 * HOUR))
    .get();
  for (const d of soon.docs) {
    const a = { id: d.id, ...d.data() } as AssignmentDoc;
    if (a.remindedAt) continue;
    const cls = await getClass(a.classId);
    if (!cls) continue;
    const done = await doneUids(a.id);
    const uids = a.toUids.filter((u) => !done.has(u));
    if (uids.length) {
      const due = a.dueAt.toMillis();
      await createMessage({
        cls,
        uids,
        toLabel: `${uids.length} em chưa nộp · ${a.title.vi}`,
        kind: "reminder",
        text: { vi: `Nhắc: bài “${a.title.vi}” hết hạn lúc ${fmtDue(due)}. Em nhớ làm nhé!`, en: `Reminder: “${a.title.en}” is due at ${fmtDue(due, "en")}.` },
        fromUid: "system",
        fromName: a.teacherName || "Lớp Song Ngữ",
        assignmentId: a.id,
      });
      reminded += uids.length;
    }
    await d.ref.update({ remindedAt: FieldValue.serverTimestamp() });
  }

  // 2. Đóng bài quá hạn (trong 8 ngày gần nhất, chưa đóng)
  let missed = 0;
  const past = await db
    .collection(COL.assignments)
    .where("dueAt", ">=", Timestamp.fromMillis(now - 8 * 24 * HOUR))
    .where("dueAt", "<=", Timestamp.fromMillis(now))
    .get();
  for (const d of past.docs) {
    const a = { id: d.id, ...d.data() } as AssignmentDoc;
    if (a.closedAt) continue;
    const done = await doneUids(a.id);
    const batch = db.batch();
    a.toUids
      .filter((u) => !done.has(u))
      .forEach((uid) => {
        missed++;
        batch.set(db.collection(COL.stats).doc(`${a.classId}_${uid}`), { classId: a.classId, uid, hwMissed: FieldValue.increment(1), lateLog: { [a.id]: a.dueAt.toMillis() } }, { merge: true });
      });
    batch.update(d.ref, { closedAt: FieldValue.serverTimestamp() });
    await batch.commit();
  }

  return ok({ reminded, missed, checked: soon.size + past.size });
});
