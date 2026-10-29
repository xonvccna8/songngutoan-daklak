// Kết thúc tiết: khoá phiên, tóm tắt kết quả (lưu vào tài liệu phiên), cộng dồn thống kê từng em
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, requireAuth } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { sessionAwards, writeSummary } from "@/lib/server/session-end";
import { revealResults } from "@/lib/server/reveal";
import { awardXpSafe } from "@/lib/server/xp";
import { endGame } from "@/lib/server/games";
import { masteryByUid, speakGoodCounts } from "@/lib/progress/xp";
import { summarize } from "@/lib/live/summary";
import { closeLang, englishOf } from "@/lib/live/english";
import type { ResponseDoc, SessionDoc } from "@/lib/live/types";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/live/sessions/[sessionId]/end">) => {
  const { sessionId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const db = adminDb();
  const ref = db.collection(COL.sessions).doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const sess = snap.data() as SessionDoc;
  await getClassForStaff(sess.classId, user);
  if (sess.status === "ended") return ok({ ok: true, already: true });

  const [responses, participants, lesson] = await Promise.all([
    ref.collection(COL.responses).get(),
    ref.collection(COL.participants).get(),
    loadLessonForGrading(sess.lessonId),
  ]);
  const resp = responses.docs.map((d) => d.data() as ResponseDoc);
  const summary = summarize(
    resp,
    participants.docs.map((d) => ({
      uid: d.id,
      joinedAt: (d.get("joinedAt") as { toMillis(): number } | undefined)?.toMillis?.() ?? null,
      leftCount: (d.get("leftCount") as number | undefined) ?? 0,
    })),
    [...lesson.slides.values()]
  );

  // Trò chơi còn mở → kết thúc (cộng XP trận) trước khi khoá tiết
  if (sess.gameId) await endGame(sess.gameId).catch((e) => console.error("endGame:", (e as Error).message));

  const now = Date.now();
  const batch = db.batch();
  // Đợt D — tỉ lệ tiếng Anh thực tế: cộng đoạn cuối (ngôn ngữ đang bật tới lúc kết thúc)
  writeSummary(batch, sessionId, sess.classId, summary, now, englishOf(closeLang(sess.state, now), summary.results));
  await batch.commit();
  // Kết thúc tiết → HS xem được kết quả mọi câu (kể cả câu GV chưa bấm công bố)
  await revealResults(sessionId).catch((e) => console.error("revealResults:", (e as Error).message));
  if (sess.gameId) await ref.update({ gameId: null });
  // XP trên lớp + bảng thi đua tuần (lỗi XP không làm hỏng việc kết thúc tiết)
  const mastery = masteryByUid(resp, (sid) => lesson.slides.get(sid)?.outcomeIds);
  await awardXpSafe(sessionAwards(sessionId, sess.classId, summary, speakGoodCounts(resp), sess.lessonTitle?.vi, mastery), now);
  return ok({ ok: true });
});
