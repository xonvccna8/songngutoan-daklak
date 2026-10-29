// Công bố kết quả cho HS: chép đúng/sai + điểm của câu ĐÃ CÔNG BỐ vào phiếu "mine" của từng em.
// Câu trả lời gốc (responses) có đúng/sai ngay khi chấm nên HS không đọc được lúc tiết còn đang dạy (xem firestore.rules).
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import type { ResponseDoc } from "@/lib/live/types";

/** slideIds = các câu cần công bố; bỏ trống = mọi câu (khi kết thúc tiết) */
export async function revealResults(sessionId: string, slideIds?: string[]) {
  const db = adminDb();
  const sessRef = db.collection(COL.sessions).doc(sessionId);
  const snap = await sessRef.collection(COL.responses).get();
  const want = slideIds ? new Set(slideIds) : null;
  const byUid = new Map<string, Record<string, { correct: boolean; points: number }>>();
  for (const d of snap.docs) {
    const r = d.data() as ResponseDoc;
    if (r.qtype === "speak" || (want && !want.has(r.slideId))) continue;
    const m = byUid.get(r.uid) ?? {};
    m[r.slideId] = { correct: !!r.correct, points: r.points ?? 0 };
    byUid.set(r.uid, m);
  }
  const entries = [...byUid.entries()];
  // Mỗi lô tối đa 500 lần ghi
  for (let i = 0; i < entries.length; i += 400) {
    const batch = db.batch();
    entries.slice(i, i + 400).forEach(([uid, results]) => batch.set(sessRef.collection(COL.mine).doc(uid), { results }, { merge: true }));
    await batch.commit();
  }
  return entries.length;
}
