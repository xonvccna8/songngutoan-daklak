// HS gửi câu trả lời → máy chủ chấm (HS không tự ghi đúng/sai, điểm)
// Luyện nói: điểm phát âm do điện thoại chấm (Web Speech) gửi lên; máy chủ giữ điểm cao nhất.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL, responseId } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { pointsFor } from "@/lib/live/grading";
import { gradeWithAi } from "@/lib/server/ai-grade";
import { NO_VI_BONUS } from "@/lib/live/elevel";
import type { SessionDoc } from "@/lib/live/types";

interface Body {
  sessionId?: string;
  slideId?: string;
  value?: string | number;
  score?: number;
  transcript?: string;
  wrongWords?: string[];
  /** Đợt A — em có xem đề tiếng Việt khi trả lời (để chẩn đoán vướng tiếng Anh) */
  vi?: boolean;
}

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const b = await readJson<Body>(req);
  if (!b.sessionId || !b.slideId) throw new HttpError(400, "Thiếu thông tin câu trả lời.");

  const db = adminDb();
  const sessRef = db.collection(COL.sessions).doc(b.sessionId);
  const snap = await sessRef.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const sess = snap.data() as SessionDoc;
  if (!user.classIds?.includes(sess.classId)) throw new HttpError(403, "Em không thuộc lớp này.");
  if (sess.status !== "live") throw new HttpError(409, "Tiết học đã kết thúc.");
  if (sess.slideIds[sess.state.slideIndex] !== b.slideId || sess.state.phase !== "open") {
    throw new HttpError(409, "Câu hỏi đã đóng.");
  }

  const { slides, keys } = await loadLessonForGrading(sess.lessonId);
  const slide = slides.get(b.slideId);
  const key = keys.get(b.slideId);
  if (!slide || !key) throw new HttpError(404, "Không tìm thấy câu hỏi.");

  const respCol = sessRef.collection(COL.responses);
  const respRef = respCol.doc(responseId(user.uid, b.slideId));
  const partRef = sessRef.collection(COL.participants).doc(user.uid);
  // Phiếu của em (HS đọc được): chỉ câu đã gửi; kết quả đúng/sai ghi khi GV công bố
  const mineRef = sessRef.collection(COL.mine).doc(user.uid);
  const now = Date.now();

  // ----- Luyện nói: giữ điểm cao nhất -----
  if (slide.speak) {
    const score = Math.max(0, Math.min(100, Math.round(Number(b.score))));
    if (!Number.isFinite(score)) throw new HttpError(400, "Điểm phát âm không hợp lệ.");
    const transcript = String(b.transcript ?? "").slice(0, 300);
    // Từ đọc chưa đúng — chỉ nhận từ có trong câu mẫu (không tin dữ liệu tự do từ điện thoại)
    const targetWords = new Set(slide.speak.target.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean));
    const wrongWords = (Array.isArray(b.wrongWords) ? b.wrongWords : [])
      .map((w) => String(w).toLowerCase().replace(/[^a-z']/g, ""))
      .filter((w) => targetWords.has(w))
      .slice(0, 20);
    const result = await db.runTransaction(async (tx) => {
      const prev = await tx.get(respRef);
      const best = (prev.get("score") as number | undefined) ?? -1;
      const attempts = ((prev.get("attempts") as number | undefined) ?? 0) + 1;
      if (score <= best) {
        tx.update(respRef, { attempts });
        tx.set(mineRef, { speak: { [b.slideId!]: { score: best, attempts } } }, { merge: true });
        return { best, attempts };
      }
      // Điểm phát âm do chính điện thoại chấm → không cần giấu
      tx.set(mineRef, { speak: { [b.slideId!]: { score, attempts } } }, { merge: true });
      tx.set(respRef, {
        uid: user.uid,
        slideId: b.slideId,
        qtype: "speak",
        skill: "Ngôn ngữ",
        score,
        points: score,
        transcript,
        wrongWords,
        attempts,
        answeredAt: now,
      });
      tx.set(partRef, { points: FieldValue.increment(score - Math.max(best, 0)) }, { merge: true });
      return { best: score, attempts };
    });
    return ok(result);
  }

  // ----- Câu hỏi: chỉ nhận lần trả lời đầu tiên -----
  const q = slide.question;
  if (!q) throw new HttpError(400, "Trang này không có câu hỏi.");
  const raw = typeof b.value === "number" ? b.value : String(b.value ?? "").trim().slice(0, 300);
  if (raw === "") throw new HttpError(400, "Em chưa nhập câu trả lời.");
  // Câu gõ chữ: máy chấm sai → hỏi AI có đúng ý không (đệm kết quả; AI lỗi thì giữ kết quả máy)
  if ((await respRef.get()).exists) throw new HttpError(409, "Em đã trả lời câu này rồi.");
  const g = await gradeWithAi(slide, key, raw, sess.schoolId);
  const correct = g.correct;
  // Đợt C — đúng mà không xem tiếng Việt: +10 cho em mức E2/E3 (mức do GV xác nhận, đọc ở máy chủ)
  const eLevel = correct && b.vi !== true ? ((await db.doc(`${COL.classes}/${sess.classId}/${COL.students}/${user.uid}`).get()).get("eLevel") as string | undefined) : undefined;
  const bonus = eLevel === "e2" || eLevel === "e3" ? NO_VI_BONUS : 0;
  // Bộ đếm số em đúng của câu này: đọc + tăng TRONG giao dịch → hai em gửi cùng lúc không thể trùng hạng
  const statRef = sessRef.collection(COL.qstats).doc(b.slideId);

  const created = await db.runTransaction(async (tx) => {
    if ((await tx.get(respRef)).exists) return false;
    let rank = 0;
    if (correct) {
      rank = ((await tx.get(statRef)).get("correct") as number | undefined) ?? 0;
      tx.set(statRef, { correct: rank + 1 }, { merge: true });
    }
    const points = pointsFor(correct, rank) + bonus;
    tx.set(mineRef, { answers: { [b.slideId!]: { value: raw, at: now } } }, { merge: true });
    tx.set(respRef, {
      uid: user.uid,
      slideId: b.slideId,
      qtype: q.type,
      skill: q.skill,
      value: raw,
      correct,
      points,
      attempts: 1,
      answeredAt: now,
      vi: b.vi === true,
      ...(g.ai ? { aiGraded: true, aiFeedback: g.feedback ?? null } : {}),
    });
    if (points) tx.set(partRef, { points: FieldValue.increment(points) }, { merge: true });
    return true;
  });
  if (!created) throw new HttpError(409, "Em đã trả lời câu này rồi.");
  // Không trả đúng/sai ngay — HS chỉ biết kết quả khi GV công bố
  return ok({ received: true });
});
