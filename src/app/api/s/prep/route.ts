// GĐ 4 — HS xem trước bài (thuật ngữ, yêu cầu cần đạt, hình động, video) → +5 XP, mỗi bài SGK một lần.
// Trình duyệt chỉ gửi sau khi em đã ở trang xem trước đủ lâu (PREP_SECONDS).
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { studentClassId } from "@/lib/server/hw";
import { awardXpSafe } from "@/lib/server/xp";
import { curLesson } from "@/lib/curriculum";
import { XP } from "@/lib/progress/xp";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const { curLessonId } = await readJson<{ curLessonId?: string }>(req);
  const l = curLesson(curLessonId);
  if (!l) throw new HttpError(404, "Không tìm thấy bài.");
  const classId = studentClassId(user);
  const db = adminDb();
  const grade = (await db.collection(COL.classes).doc(classId).get()).get("grade") as number | undefined;
  if (grade !== l.grade) throw new HttpError(400, "Bài này không thuộc khối lớp của em.");

  const now = Date.now();
  const [r] = await awardXpSafe([{ uid: user.uid, classId, kind: "prep", scope: "home", xp: XP.prep, key: `prep_${l.id}_${user.uid}`, note: `Bài ${l.no}. ${l.vi}`, studyDay: true }], now);
  await db.collection(COL.stats).doc(`${classId}_${user.uid}`).set({ classId, uid: user.uid, prepped: { [l.id]: now } }, { merge: true });
  return ok({ xp: r?.gained ?? 0 });
});
