// Đợt A — HS gửi Đèn hiểu bài (🟢🟡🔴) hoặc Phiếu ra về 3-2-1. Máy chủ ghi vào hồ sơ có mặt của em (participants),
// nơi GV vốn đọc được; HS không đọc được của bạn. Vị trí đèn (trang + bước) lấy từ trạng thái tiết, không tin điện thoại.
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { cleanExit, lightKey } from "@/lib/live/diagnose";
import type { Light, SessionDoc, Term } from "@/lib/live/types";

interface Body {
  sessionId?: string;
  kind?: "light" | "exit";
  v?: string;
  words?: unknown;
  ideas?: unknown;
  question?: unknown;
}

const LIGHTS: Light[] = ["g", "y", "r"];

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const b = await readJson<Body>(req);
  if (!b.sessionId) throw new HttpError(400, "Thiếu tiết học.");

  const db = adminDb();
  const sessRef = db.collection(COL.sessions).doc(b.sessionId);
  const snap = await sessRef.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const sess = snap.data() as SessionDoc;
  if (!user.classIds?.includes(sess.classId)) throw new HttpError(403, "Em không thuộc lớp này.");
  if (sess.status !== "live") throw new HttpError(409, "Tiết học đã kết thúc.");
  const partRef = sessRef.collection(COL.participants).doc(user.uid);
  if (!(await partRef.get()).exists) throw new HttpError(409, "Em chưa vào lớp.");

  const slideId = sess.slideIds[sess.state.slideIndex];
  const { slides } = await loadLessonForGrading(sess.lessonId);
  const slide = slides.get(slideId);
  if (!slide) throw new HttpError(404, "Không tìm thấy trang.");

  if (b.kind === "light") {
    const v = b.v as Light;
    if (!LIGHTS.includes(v)) throw new HttpError(400, "Đèn không hợp lệ.");
    // Đèn dành cho phần giảng (không phải lúc đang trả lời câu hỏi)
    if (slide.question && sess.state.phase !== "idle") throw new HttpError(409, "Đang trả lời câu hỏi.");
    const key = lightKey(slideId, sess.state.step);
    await partRef.set({ lights: { [key]: v } }, { merge: true });
    return ok({ key, v });
  }

  if (b.kind === "exit") {
    if (slide.type !== "final") throw new HttpError(409, "Phiếu ra về mở ở trang Tổng kết.");
    const lesson = await db.collection(COL.lessons).doc(sess.lessonId).get();
    const terms = ((lesson.get("terms") as Term[] | undefined) ?? []).map((t) => t.en);
    const exit = cleanExit(b, terms, Date.now());
    if (typeof exit === "string") throw new HttpError(400, exit);
    await partRef.set({ exit }, { merge: true });
    return ok({ exit });
  }

  throw new HttpError(400, "Không rõ loại gửi.");
});
