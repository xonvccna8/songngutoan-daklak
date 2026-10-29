// Dữ liệu mẫu 3 tuần cho lớp 7A (đánh dấu isSample) để trang Tổng quan / Bảng điểm / Phân tích có số liệu.
//   npm run seed:history     (chạy lại sẽ xoá dữ liệu mẫu cũ rồi tạo lại — không cộng dồn trùng)
// Điểm được mô phỏng: mỗi em có năng lực Khoa học / tiếng Anh riêng, tiến bộ dần qua các tiết, thỉnh thoảng vắng.
import { existsSync } from "node:fs";
import { Timestamp } from "firebase-admin/firestore";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { adminDb } = await import("../src/lib/firebase/admin");
const { COL, responseId } = await import("../src/lib/namespace");
const { LESSON, LESSON_ID, SLIDES, KEYS } = await import("../src/lib/lessons/pythagore");
const { summarize } = await import("../src/lib/live/summary");
const { sessionAwards, writeSummary } = await import("../src/lib/server/session-end");
const { awardXp } = await import("../src/lib/server/xp");
const { masteryByUid, speakGoodCounts } = await import("../src/lib/progress/xp");
const { pointsFor } = await import("../src/lib/live/grading");
type ResponseDoc = import("../src/lib/live/types").ResponseDoc;

// Số ngẫu nhiên cố định (chạy lại ra cùng kết quả)
let seed = 20261011;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

const DAYS_AGO = [20, 18, 15, 13, 11, 8, 6, 4, 1];
const TITLES = ["Tế bào", "Tế bào · Luyện tập 1", "Tế bào · Luyện tập 2", "Tế bào · Ôn tập"];
const HARD = new Set(["cell", "basic", "unit", "shapes", "sizes"]);

try {
  const db = adminDb();
  const found = await db.collection(COL.classes).where("isSample", "==", true).get();
  const cls = found.docs.find((d) => d.get("name") === "7A");
  if (!cls) throw new Error("Chưa có lớp 7A mẫu — chạy npm run seed trước.");
  const classId = cls.id;

  // Xoá dữ liệu mẫu cũ của lớp (tiết + thống kê)
  const old = await db.collection(COL.sessions).where("classId", "==", classId).get();
  await Promise.all(old.docs.filter((d) => d.get("isSample")).map((d) => db.recursiveDelete(d.ref)));
  const oldStats = await db.collection(COL.stats).where("classId", "==", classId).get();
  await Promise.all(oldStats.docs.map((d) => d.ref.delete()));
  // XP / bảng tuần của lớp mẫu (GĐ 3 mới)
  for (const col of [COL.events, COL.weekly]) {
    const old2 = await db.collection(col).where("classId", "==", classId).get();
    await Promise.all(old2.docs.map((d) => d.ref.delete()));
  }

  const students = (await cls.ref.collection(COL.students).orderBy("number").get()).docs.map((d) => d.id);
  // Năng lực riêng từng em: Khoa học & tiếng Anh, mức chú ý
  const ability = new Map(students.map((uid) => [uid, { math: 0.45 + rnd() * 0.5, lang: 0.35 + rnd() * 0.55, focus: rnd() }]));

  const questionSlides = SLIDES.filter((s) => s.question);
  const speakSlides = SLIDES.filter((s) => s.speak);
  const teacherId = (cls.get("teacherIds") as string[])[0];

  for (const [si, ago] of DAYS_AGO.entries()) {
    const start = new Date();
    start.setUTCHours(1, 0, 0, 0); // 8:00 sáng giờ VN
    const startMs = start.getTime() - ago * 86_400_000;
    const endMs = startMs + 40 * 60_000;
    const growth = si * 0.025; // tiến bộ dần
    const ref = db.collection(COL.sessions).doc();

    const present = students.filter((uid) => rnd() < 0.62 + ability.get(uid)!.focus * 0.33);
    const participants = present.map((uid) => ({
      uid,
      joinedAt: startMs + Math.floor(rnd() * 4 * 60_000),
      leftCount: rnd() < 0.25 + (1 - ability.get(uid)!.focus) * 0.35 ? 1 + Math.floor(rnd() * 3) : 0,
    }));

    const responses: ResponseDoc[] = [];
    for (const sl of questionSlides) {
      const q = sl.question!;
      const key = KEYS[sl.id];
      const answers = present
        .filter(() => rnd() < 0.93)
        .map((uid) => {
          const a = ability.get(uid)!;
          const p = Math.min(0.97, (q.skill === "Ngôn ngữ" ? a.lang : a.math) + growth);
          return { uid, correct: rnd() < p, t: rnd() };
        })
        .sort((x, y) => x.t - y.t);
      let rank = 0;
      for (const ans of answers) {
        let value: string | number;
        if (q.type === "mcq") value = ans.correct ? key.answer! : pick((q.options ?? []).map((_, i) => i).filter((i) => i !== key.answer));
        else if (q.type === "number") value = ans.correct ? String(key.answer) : pick(["50", "40", "4", "14"]);
        else value = ans.correct ? pick(key.accept!) : pick(["a nucleus", "a membrane", "cytoplasm", "a vacuole"]);
        const points = pointsFor(ans.correct, ans.correct ? rank++ : 0);
        responses.push({ id: responseId(ans.uid, sl.id), uid: ans.uid, slideId: sl.id, qtype: q.type, skill: q.skill, value, correct: ans.correct, points, attempts: 1, answeredAt: startMs + 60_000 * (5 + SLIDES.indexOf(sl) * 3) + Math.floor(ans.t * 20_000) });
      }
    }
    for (const sl of speakSlides) {
      const words = sl.speak!.target.split(" ");
      for (const uid of present.filter(() => rnd() < 0.85)) {
        const a = ability.get(uid)!;
        const score = Math.max(35, Math.min(100, Math.round((a.lang + growth) * 100 + (rnd() * 24 - 12))));
        const wrong = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter((w) => rnd() < (1 - score / 100) * (HARD.has(w) ? 2.2 : 0.4));
        responses.push({ id: responseId(uid, sl.id), uid, slideId: sl.id, qtype: "speak", skill: "Ngôn ngữ", score, points: score, transcript: "", wrongWords: [...new Set(wrong)], attempts: 1 + Math.floor(rnd() * 3), answeredAt: startMs + 60_000 * (5 + SLIDES.indexOf(sl) * 3) });
      }
    }

    // Ghi phiên + người tham gia + câu trả lời
    const title = TITLES[Math.min(TITLES.length - 1, Math.floor(si / 2.5))];
    const b1 = db.batch();
    b1.set(ref, {
      classId,
      schoolId: cls.get("schoolId"),
      lessonId: LESSON_ID,
      lessonTitle: { en: LESSON.title.en, vi: title },
      teacherId,
      status: "ended",
      slideIds: SLIDES.map((s) => s.id),
      state: { slideIndex: SLIDES.length - 1, step: 0, phase: "idle", lang: "bi", timerMs: null, writtenAt: endMs, called: null, calledUids: [], pinned: {}, reveal: null },
      createdAt: Timestamp.fromMillis(startMs),
      isSample: true,
    });
    participants.forEach((p) =>
      b1.set(ref.collection(COL.participants).doc(p.uid), { joinedAt: Timestamp.fromMillis(p.joinedAt), lastSeenAt: Timestamp.fromMillis(endMs), visible: true, leftCount: p.leftCount, raisedHandAt: null })
    );
    responses.forEach(({ id, ...r }) => b1.set(ref.collection(COL.responses).doc(id), r));
    await b1.commit();

    const b2 = db.batch();
    const summary = summarize(responses, participants, SLIDES);
    writeSummary(b2, ref.id, classId, summary, endMs);
    await b2.commit();
    const bySlide = new Map(SLIDES.map((s) => [s.id, s]));
    await awardXp(sessionAwards(ref.id, classId, summary, speakGoodCounts(responses), title, masteryByUid(responses, (sid) => bySlide.get(sid)?.outcomeIds)), endMs);
    console.log(`✔ ${new Date(startMs).toLocaleDateString("vi-VN")} · ${title}: ${present.length}/${students.length} em, ${responses.length} câu trả lời`);
  }
  console.log(`✔ Xong: ${DAYS_AGO.length} tiết mẫu cho lớp 7A.`);
  process.exit(0);
} catch (e) {
  console.error("✘ " + (e instanceof Error ? e.message : e));
  process.exit(1);
}
