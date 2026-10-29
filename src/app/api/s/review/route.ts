// Xem lại tiết đã học: sau khi tiết kết thúc, HS được xem đáp án + lời giải từng câu
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, requireAuth } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { solutionOf } from "@/lib/study/hw";
import type { SessionDoc } from "@/lib/live/types";

export const GET = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId || sessionId.length > 64) throw new HttpError(400, "Thiếu tiết học.");
  const snap = await adminDb().collection(COL.sessions).doc(sessionId).get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const s = snap.data() as SessionDoc;
  if (!user.classIds?.includes(s.classId)) throw new HttpError(403, "Em không thuộc lớp này.");
  if (s.status !== "ended") throw new HttpError(409, "Tiết học chưa kết thúc.");
  const { slides, keys } = await loadLessonForGrading(s.lessonId);
  const solutions: Record<string, ReturnType<typeof solutionOf>> = {};
  for (const [id, slide] of slides) {
    const k = keys.get(id);
    if (slide.question && k) solutions[id] = solutionOf(slide, k);
  }
  return ok({ solutions });
});
