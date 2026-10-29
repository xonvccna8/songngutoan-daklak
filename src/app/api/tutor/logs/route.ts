// GV xem nhật kí Trợ lý AI của lớp mình (7 ngày gần nhất, mới nhất trước). Chỉ GV / quản trị của lớp.
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, requireAuth } from "@/lib/server/api";
import { vnDayKey } from "@/lib/live/summary";
import type { TutorMsg } from "@/lib/ai/student-ai";
import type { StudentDoc } from "@/lib/types";

export const GET = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const classId = new URL(req.url).searchParams.get("classId");
  if (!classId) throw new HttpError(400, "Thiếu lớp.");
  const { ref: classRef } = await getClassForStaff(classId, user);
  const days = new Set(Array.from({ length: 7 }, (_, i) => vnDayKey(Date.now() - i * 86_400_000)));
  const [logs, roster] = await Promise.all([adminDb().collection(COL.tutor).where("classId", "==", classId).get(), classRef.collection(COL.students).get()]);
  const names = new Map(roster.docs.map((d) => [d.id, (d.data() as StudentDoc).fullName]));
  const list = logs.docs
    .map((d) => d.data() as { uid: string; day: string; messages?: TutorMsg[]; flagged?: number; updatedAt?: number })
    .filter((x) => days.has(x.day))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .map((x) => ({ uid: x.uid, name: names.get(x.uid) ?? "(đã rời lớp)", day: x.day, flagged: x.flagged ?? 0, messages: x.messages ?? [] }));
  return ok({ logs: list });
});
