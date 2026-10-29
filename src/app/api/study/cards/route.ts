// Ôn thẻ từ vựng: HS tự đánh giá (Chưa nhớ / Khó / Nhớ / Dễ) → máy chủ tính lịch ôn kế tiếp (SM-2 rút gọn)
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { studentClassId } from "@/lib/server/hw";
import { addStudy } from "@/lib/server/study";
import { isGrade, isLearned, review } from "@/lib/study/srs";
import { awardXpSafe } from "@/lib/server/xp";
import { XP } from "@/lib/progress/xp";
import type { CardState } from "@/lib/study/types";

// Danh sách thuật ngữ hợp lệ (bộ nhớ đệm khi hàm còn "ấm")
let termCache: { at: number; ids: Set<string> } | null = null;
async function termExists(id: string) {
  if (!termCache || Date.now() - termCache.at > 5 * 60_000) {
    const s = await adminDb().collection(COL.terms).select().get();
    termCache = { at: Date.now(), ids: new Set(s.docs.map((d) => d.id)) };
  }
  return termCache.ids.has(id);
}

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const b = await readJson<{ termId?: string; grade?: string }>(req);
  if (!isGrade(b.grade)) throw new HttpError(400, "Mức nhớ không hợp lệ.");
  const grade = b.grade;
  if (typeof b.termId !== "string" || b.termId.length > 80 || !(await termExists(b.termId))) throw new HttpError(404, "Không tìm thấy thẻ từ.");
  const termId = b.termId;
  const classId = studentClassId(user);
  const db = adminDb();
  const ref = db.collection(COL.cards).doc(user.uid);
  const now = Date.now();

  const { card, learned } = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.get(new FieldPath("cards", termId)) as CardState | undefined;
    const next = review(prev, grade, now);
    tx.set(ref, { uid: user.uid, classId, cards: { [termId]: next }, updatedAt: now }, { merge: true });
    // Số thuật ngữ đã nhớ sau lượt ôn này (điều kiện lên hạng)
    const all: Record<string, CardState> = { ...((snap.get("cards") as Record<string, CardState> | undefined) ?? {}), [termId]: next };
    return { card: next, learned: Object.values(all).filter(isLearned).length };
  });
  await addStudy(user.uid, classId, { activity: "cards", count: 1, statInc: { cardReviews: 1 } }, now).catch((e) => console.error("addStudy:", (e as Error).message));
  const [xp] = await awardXpSafe([{ uid: user.uid, classId, kind: "cards", scope: "home", xp: XP.card, studyDay: true, set: { termsLearned: learned } }], now);
  return ok({ card, xp: xp?.gained ?? 0 });
});
