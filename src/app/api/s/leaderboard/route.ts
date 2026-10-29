// Bảng xếp hạng tuần cho HS: Trên lớp · Ở nhà · Tiến bộ nhất · Tổ (chỉ top 5 + hạng của chính em).
// Đi qua máy chủ vì HS không được đọc điểm / tên đầy đủ của bạn khác.
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { handle, ok, requireAuth } from "@/lib/server/api";
import { studentClassId } from "@/lib/server/hw";
import { weeklyBoards, type WeeklyDoc } from "@/lib/progress/boards";
import { prevWeekKey, weekKey, weekStartMs, weeklyId } from "@/lib/progress/week";
import { shortName } from "@/lib/class-utils";
import type { StudentDoc } from "@/lib/types";

export const GET = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const classId = studentClassId(user);
  const db = adminDb();
  const now = Date.now();
  const week = weekKey(now);
  const [roster, weeks] = await Promise.all([
    db.collection(COL.classes).doc(classId).collection(COL.students).get(),
    db.getAll(db.collection(COL.weekly).doc(weeklyId(classId, week)), db.collection(COL.weekly).doc(weeklyId(classId, prevWeekKey(now)))),
  ]);
  const people = roster.docs.map((d) => {
    const s = d.data() as StudentDoc;
    return { uid: d.id, name: shortName(s.fullName), team: s.team };
  });
  const [cur, prev] = weeks.map((w) => (w.exists ? (w.data() as WeeklyDoc) : null));
  return ok({ week, resetAt: weekStartMs(now) + 7 * 86_400_000, ...weeklyBoards(people, user.uid, cur, prev) });
});
