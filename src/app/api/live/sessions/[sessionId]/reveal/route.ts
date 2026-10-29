// GV công bố đáp án (đã ghi state.reveal) → máy chủ chép đúng/sai + điểm của câu đó vào phiếu từng em
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, requireAuth } from "@/lib/server/api";
import { revealResults } from "@/lib/server/reveal";
import type { SessionDoc } from "@/lib/live/types";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/live/sessions/[sessionId]/reveal">) => {
  const { sessionId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const snap = await adminDb().collection(COL.sessions).doc(sessionId).get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const sess = snap.data() as SessionDoc;
  await getClassForStaff(sess.classId, user);
  // Chỉ công bố câu GV đã thật sự bấm công bố (không cho lộ câu đang mở)
  const slideId = sess.state?.reveal?.slideId;
  if (!slideId) throw new HttpError(409, "Câu hỏi chưa được công bố.");
  const students = await revealResults(sessionId, [slideId]);
  return ok({ slideId, students });
});
