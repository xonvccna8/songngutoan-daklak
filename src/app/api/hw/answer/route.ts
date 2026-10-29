// HS trả lời một câu bài về nhà → máy chủ chấm, trả đúng/sai + lời giải ngay (tự học cần phản hồi tức thì).
// Câu hỏi: chỉ nhận lần đầu. Luyện nói: được thử nhiều lần, giữ điểm cao nhất.
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadAssignmentForStudent } from "@/lib/server/hw";
import { loadAssignmentKeys } from "@/lib/server/bank";
import { addStudy } from "@/lib/server/study";
import { awardXpSafe, type Award } from "@/lib/server/xp";
import { SPEAK_GOOD, XP, hwAnswerXp, hwDoneXp } from "@/lib/progress/xp";
import { HW_POINTS, HW_POINTS_AFTER_SOLUTION, solutionOf, tally } from "@/lib/study/hw";
import { gradeWithAi } from "@/lib/server/ai-grade";
import type { HwAnswer, SubmissionDoc } from "@/lib/study/types";

interface Body {
  aid?: string;
  slideId?: string;
  value?: string | number;
  score?: number;
  transcript?: string;
}

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const b = await readJson<Body>(req);
  const { a, subRef } = await loadAssignmentForStudent(b.aid, user);
  const item = a.items.find((it) => it.slideId === b.slideId);
  if (!item) throw new HttpError(404, "Không tìm thấy câu hỏi.");
  const keys = await loadAssignmentKeys(a);
  const key = keys.get(item.slideId);
  if (!key) throw new HttpError(409, "Câu hỏi đã được thầy cô sửa, hãy báo thầy cô.");

  const db = adminDb();
  const now = Date.now();
  const due = a.dueAt.toMillis();
  const statRef = db.collection(COL.stats).doc(`${a.classId}_${user.uid}`);

  // Chuẩn bị câu trả lời trước khi vào transaction
  let speakScore: number | null = null;
  let raw: string | number = "";
  if (item.slide.speak) {
    speakScore = Math.round(Number(b.score));
    if (!Number.isFinite(speakScore)) throw new HttpError(400, "Điểm phát âm không hợp lệ.");
    speakScore = Math.max(0, Math.min(100, speakScore));
  } else {
    raw = typeof b.value === "number" ? b.value : String(b.value ?? "").trim().slice(0, 300);
    if (raw === "") throw new HttpError(400, "Em chưa nhập câu trả lời.");
  }
  // Chấm trước transaction (câu gõ chữ có thể cần hỏi AI). Đã trả lời rồi thì không gọi AI.
  const answered = speakScore == null && !!((await subRef.get()).get("answers") as Record<string, unknown> | undefined)?.[item.slideId];
  const g = speakScore == null && !answered ? await gradeWithAi(item.slide, key, raw, a.schoolId) : { correct: false, ai: false };

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(subRef);
    const prev = (snap.data() ?? {}) as Partial<SubmissionDoc>;
    const answers: Record<string, HwAnswer> = { ...(prev.answers ?? {}) };
    const old = answers[item.slideId];
    const sol = solutionOf(item.slide, key);

    // XP của lần trả lời này (cộng sau transaction, qua awardXp)
    const awards: Award[] = [];
    const base = { uid: user.uid, classId: a.classId, scope: "home" as const, studyDay: true, note: a.title?.vi };
    if (speakScore != null) {
      const best = old?.score ?? -1;
      // Lần đầu đạt yêu cầu ở câu nói này → +XP và đếm 1 câu nói đạt
      if (speakScore >= SPEAK_GOOD && best < SPEAK_GOOD)
        awards.push({ ...base, kind: "speak", xp: XP.speakGood, key: `hwspeak_${a.id}_${item.slideId}_${user.uid}`, inc: { speakGood: 1 } });
      else awards.push({ ...base, kind: "speak", xp: 0 });
      answers[item.slideId] = {
        ...(old ?? {}),
        score: Math.max(best, speakScore),
        points: Math.max(best, speakScore, 0),
        transcript: speakScore > best ? String(b.transcript ?? "").slice(0, 300) : (old?.transcript ?? ""),
        attempts: (old?.attempts ?? 0) + 1,
        at: now,
      };
    } else {
      if (old) throw new HttpError(409, "Em đã trả lời câu này rồi.");
      const usedSolution = !!prev.solutionViewed?.[item.slideId];
      const points = g.correct ? (usedSolution ? HW_POINTS_AFTER_SOLUTION : HW_POINTS) : 0;
      answers[item.slideId] = { value: raw, correct: g.correct, points, attempts: 1, usedSolution, ...sol, ...(g.ai ? { aiGraded: true, ...(g.feedback ? { aiFeedback: g.feedback } : {}) } : {}), at: now };
      // Sao thành thạo: câu đo những YCCĐ nào (GV gắn khi soạn)
      const mastery = Object.fromEntries((item.slide.outcomeIds ?? []).map((o) => [o, { a: 1, c: g.correct ? 1 : 0 }]));
      awards.push({ ...base, kind: "hw", xp: hwAnswerXp(g.correct, usedSolution), key: `hw_${a.id}_${item.slideId}_${user.uid}`, mastery });
    }

    const t = tally(a.items, answers);
    const newlyDone = t.complete && !prev.completedAt;
    const late = newlyDone ? now > due : !!prev.late;
    tx.set(
      subRef,
      {
        uid: user.uid,
        classId: a.classId,
        answers,
        score: t.score,
        correct: t.correct,
        answered: t.answered,
        total: t.total,
        openedAt: prev.openedAt ?? Timestamp.fromMillis(now),
        completedAt: newlyDone ? Timestamp.fromMillis(now) : (prev.completedAt ?? null),
        late,
        activeSeconds: prev.activeSeconds ?? 0,
      },
      { merge: true }
    );

    // Thống kê: cộng phần điểm bài tăng thêm; nộp xong → đếm bài, trễ → ghi vào nhật ký trễ
    const stat: Record<string, unknown> = { classId: a.classId, uid: user.uid };
    const delta = t.score - (prev.score ?? 0);
    if (delta) stat.hwPoints = FieldValue.increment(delta);
    if (newlyDone) {
      awards.push({ ...base, kind: "hw_done", xp: hwDoneXp(late), key: `hwdone_${a.id}_${user.uid}` });
      stat.hwDone = FieldValue.increment(1);
      if (late) {
        stat.hwLate = FieldValue.increment(1);
        stat.lateLog = { [a.id]: due };
        // Đã bị tính "chưa nộp" lúc đóng bài → chuyển thành "nộp trễ"
        if (a.closedAt) stat.hwMissed = FieldValue.increment(-1);
      }
    }
    if (Object.keys(stat).length > 2) tx.set(statRef, stat, { merge: true });
    return { answer: answers[item.slideId], tally: t, completed: newlyDone, late, awards };
  });

  const { awards, ...rest } = result;
  await addStudy(user.uid, a.classId, { activity: "hw", count: 1 }, now).catch((e) => console.error("addStudy:", (e as Error).message));
  // Sau addStudy để ngày học hôm nay đã được ghi (xét thưởng chuỗi)
  const [xp] = await awardXpSafe(awards, now);
  return ok({ ...rest, xp: xp?.gained ?? 0 });
});
