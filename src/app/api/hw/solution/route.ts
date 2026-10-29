// Gợi ý tầng 3: xem lời giải trước khi trả lời → câu đó đúng chỉ còn 30 điểm (ghi lại để GV biết)
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadAssignmentForStudent } from "@/lib/server/hw";
import { loadAssignmentKeys } from "@/lib/server/bank";
import { solutionOf } from "@/lib/study/hw";
import type { SubmissionDoc } from "@/lib/study/types";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const b = await readJson<{ aid?: string; slideId?: string }>(req);
  const { a, subRef } = await loadAssignmentForStudent(b.aid, user);
  const item = a.items.find((it) => it.slideId === b.slideId);
  if (!item) throw new HttpError(404, "Không tìm thấy câu hỏi.");
  if (item.slide.speak) throw new HttpError(400, "Câu luyện nói không có lời giải — hãy nghe mẫu.");
  const key = (await loadAssignmentKeys(a)).get(item.slideId);
  if (!key) throw new HttpError(409, "Câu hỏi đã được thầy cô sửa, hãy báo thầy cô.");
  const sol = solutionOf(item.slide, key);
  const now = Date.now();

  await adminDb().runTransaction(async (tx) => {
    const prev = ((await tx.get(subRef)).data() ?? {}) as Partial<SubmissionDoc>;
    if (prev.answers?.[item.slideId] || prev.solutionViewed?.[item.slideId]) return;
    tx.set(
      subRef,
      {
        uid: user.uid,
        classId: a.classId,
        solutionViewed: { [item.slideId]: sol },
        ...(prev.openedAt ? {} : { openedAt: Timestamp.fromMillis(now), answers: {}, score: 0, correct: 0, answered: 0, total: a.items.length, activeSeconds: 0 }),
      },
      { merge: true }
    );
  });
  return ok(sol);
});
