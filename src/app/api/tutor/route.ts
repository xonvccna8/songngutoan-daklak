// Trợ lý học tập AI cho HS. GET: cuộc trò chuyện hôm nay + còn bao nhiêu lượt. POST { text }: hỏi Trợ lý.
// An toàn: GV bật/tắt theo lớp · lọc nội dung câu hỏi và câu trả lời (OpenAI Moderation) · giới hạn lượt/ngày ·
// không gửi tên HS cho AI · lưu nhật kí (lsn_tutor, chỉ máy chủ) để GV xem.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { studentClassId } from "@/lib/server/hw";
import { aiEnabled, aiJson, aiModerate, refundQuota, reserveQuota } from "@/lib/server/ai";
import { assertAiAllowed, countAiUse } from "@/lib/server/ai-gate";
import { vnDayKey } from "@/lib/live/summary";
import { curLesson } from "@/lib/curriculum";
import { STUDENT_AI_LIMITS, TUTOR_SCHEMA, blockedReply, cleanTutorInput, tutorHistory, tutorSystem, type TutorMsg } from "@/lib/ai/student-ai";
import type { ClassDoc } from "@/lib/types";

export const maxDuration = 60;
const MAX_STORED = 80;

async function context(req: Request) {
  const user = await requireAuth(req, ["student"]);
  const classId = studentClassId(user);
  const snap = await adminDb().collection(COL.classes).doc(classId).get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy lớp.");
  const cls = { id: snap.id, ...snap.data() } as ClassDoc;
  const day = vnDayKey(Date.now());
  const ref = adminDb().collection(COL.tutor).doc(`${user.uid}_${day}`);
  const enabled = aiEnabled() && cls.settings?.aiTutor !== false;
  return { user, cls, day, ref, enabled };
}

async function used(uid: string, day: string) {
  return ((await adminDb().collection(COL.aiUsage).doc(`tutor_${uid}_${day}`).get()).get("count") as number | undefined) ?? 0;
}

export const GET = handle(async (req: Request) => {
  const { user, day, ref, enabled } = await context(req);
  const messages = ((await ref.get()).get("messages") as TutorMsg[] | undefined) ?? [];
  return ok({ enabled, messages, remaining: Math.max(0, STUDENT_AI_LIMITS.tutorPerStudent - (await used(user.uid, day))) });
});

export const POST = handle(async (req: Request) => {
  const { user, cls, day, ref, enabled } = await context(req);
  if (!enabled) throw new HttpError(403, "Thầy cô chưa bật Trợ lý AI cho lớp em.");
  const text = cleanTutorInput((await readJson<{ text?: string }>(req)).text);
  if (typeof text !== "string") throw new HttpError(400, text.error);
  await assertAiAllowed(user.uid, user.role);

  const keys: [string, number][] = [
    [`tutor_${user.uid}`, STUDENT_AI_LIMITS.tutorPerStudent],
    [`tutor_school_${cls.schoolId ?? "none"}`, STUDENT_AI_LIMITS.tutorPerSchool],
  ];
  if (!(await reserveQuota(keys))) throw new HttpError(429, `Hôm nay em đã hỏi đủ ${STUDENT_AI_LIMITS.tutorPerStudent} câu rồi. Mai hỏi tiếp nhé!`);

  const now = Date.now();
  const prev = ((await ref.get()).get("messages") as TutorMsg[] | undefined) ?? [];
  const save = async (msgs: TutorMsg[], flagged: boolean) => {
    await ref.set(
      {
        uid: user.uid,
        classId: cls.id,
        schoolId: cls.schoolId ?? null,
        day,
        messages: [...prev, ...msgs].slice(-MAX_STORED),
        count: FieldValue.increment(1),
        ...(flagged ? { flagged: FieldValue.increment(1) } : {}),
        updatedAt: now,
      },
      { merge: true }
    );
  };

  // 1) Lọc câu hỏi
  const mIn = await aiModerate(text);
  if (mIn.flagged) {
    const reply = blockedReply(mIn.selfHarm);
    await save([{ role: "user", text, at: now, flagged: true }, { role: "assistant", text: reply, at: now }], true);
    return ok({ reply, blocked: true, remaining: Math.max(0, STUDENT_AI_LIMITS.tutorPerStudent - (await used(user.uid, day))) });
  }

  // 2) Hỏi AI (chỉ gửi khối lớp + bài đang học + 10 tin gần nhất — không có tên, không có thông tin cá nhân)
  const l = curLesson(cls.curLessonId);
  let reply: string;
  try {
    const r = await aiJson<{ reply: string }>({
      name: "tutor",
      schema: TUTOR_SCHEMA,
      system: tutorSystem(cls.grade, l ? { vi: `Bài ${l.no}. ${l.vi}`, en: l.en } : null),
      history: tutorHistory(prev),
      user: text,
      maxTokens: 1500,
      timeoutMs: 40_000,
    });
    reply = String(r.data.reply ?? "").trim().slice(0, 2000);
  } catch (e) {
    await refundQuota(keys.map(([k]) => k));
    throw e;
  }
  await countAiUse(user.uid);

  // 3) Lọc câu trả lời
  const mOut = await aiModerate(reply);
  const blocked = !reply || mOut.flagged;
  if (blocked) reply = blockedReply(false);
  await save([{ role: "user", text, at: now }, { role: "assistant", text: reply, at: Date.now(), ...(blocked ? { flagged: true } : {}) }], blocked);
  return ok({ reply, blocked, remaining: Math.max(0, STUDENT_AI_LIMITS.tutorPerStudent - (await used(user.uid, day))) });
});
