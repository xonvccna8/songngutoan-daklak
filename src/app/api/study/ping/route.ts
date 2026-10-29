// Nhịp tự học: trình duyệt gửi số giây học thật (trang hiển thị + có tương tác) mỗi 30 s.
// event=true & activity="speak": vừa luyện phát âm xong 1 câu (tính là 1 hoạt động).
// ref = id bài tập đang làm → cộng thời gian làm bài, ghi giờ mở bài.
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadAssignmentForStudent, studentClassId } from "@/lib/server/hw";
import { addStudy } from "@/lib/server/study";
import { awardXpSafe } from "@/lib/server/xp";
import type { StudyActivity } from "@/lib/study/types";

const ACTIVITIES: StudyActivity[] = ["hw", "cards", "speak", "review", "home", "game"];

interface Body {
  seconds?: number;
  activity?: StudyActivity;
  ref?: string;
  event?: boolean;
}

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student"]);
  const b = await readJson<Body>(req);
  if (!b.activity || !ACTIVITIES.includes(b.activity)) throw new HttpError(400, "Hoạt động không hợp lệ.");
  const classId = studentClassId(user);
  const speak = b.event === true && b.activity === "speak";
  // Chơi xong 1 lượt trò chơi ôn tập (ref = mã bài, vd "n8-33")
  const game = b.event === true && b.activity === "game";

  const r = await addStudy(user.uid, classId, {
    seconds: Number(b.seconds) || 0,
    activity: b.activity,
    count: speak || game ? 1 : 0,
    statInc: speak ? { speakPractice: 1 } : game ? { gamePlays: 1 } : undefined,
  });
  // Luyện nói tự do / trò chơi ôn tập: điểm do trình duyệt báo nên không cộng XP, chỉ xét thưởng chuỗi ngày học
  if (speak || game) await awardXpSafe([{ uid: user.uid, classId, kind: speak ? "speak" : "game", scope: "home", xp: 0, studyDay: true, note: game && b.ref ? `Trò chơi ôn tập ${String(b.ref).slice(0, 20)}` : undefined }]);

  if (b.activity === "hw" && b.ref) {
    const { a, subRef } = await loadAssignmentForStudent(b.ref, user);
    const snap = await subRef.get();
    if (!snap.exists) {
      await subRef.set({ uid: user.uid, classId: a.classId, answers: {}, score: 0, correct: 0, answered: 0, total: a.items.length, openedAt: Timestamp.now(), completedAt: null, activeSeconds: r.credited });
    } else if (r.credited) {
      await subRef.update({ activeSeconds: FieldValue.increment(r.credited), ...(snap.get("openedAt") ? {} : { openedAt: Timestamp.now() }) });
    }
  }
  return ok(r);
});
