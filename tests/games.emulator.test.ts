// Chạy thử TRỌN MỘT TRẬN trên Firestore Emulator (máy chủ thật, dữ liệu giả): npm run test:emulator
// Tạo trận → vào trận → trả lời → power-up → vòng cứu điểm → kết thúc → XP; Rung chuông vàng: loại → cứu trợ.
import { beforeAll, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { KEYS, SLIDES, TERMS } from "@/lib/lessons/pythagore";
import { answerGame, applyPower, controlGame, createGame, joinGame } from "@/lib/server/games";
import type { AuthedUser } from "@/lib/server/api";
import type { BoardDoc, GameDoc, GameKey, PlayerDoc } from "@/lib/games/types";

const on = !!process.env.FIRESTORE_EMULATOR_HOST;
const teacher: AuthedUser = { uid: "tA", role: "teacher", schoolId: "s1", classIds: [], emailVerified: true };
const st1: AuthedUser = { uid: "st_1", role: "student", schoolId: "s1", classIds: ["c1"], emailVerified: false };
const st2: AuthedUser = { uid: "st_2", role: "student", schoolId: "s1", classIds: ["c1"], emailVerified: false };

const db = () => adminDb();
const game = async (id: string) => (await db().collection(COL.games).doc(id).get()).data() as GameDoc;
const keys = async (id: string) => (await db().doc(`${COL.games}/${id}/private/key`).get()).get("keys") as GameKey[];
const player = async (id: string, uid: string) => (await db().doc(`${COL.games}/${id}/players/${uid}`).get()).data() as PlayerDoc;
const board = async (id: string) => (await db().doc(`${COL.games}/${id}/live/board`).get()).data() as BoardDoc;

/** Đáp án đúng / sai theo khoá */
const right = (k: GameKey) => (k.answer != null ? k.answer : k.num != null ? String(k.num) : k.accept?.[0] ?? "");
const wrong = (k: GameKey) => (k.answer != null ? (k.answer + 1) % 2 : "sai bét");

describe.skipIf(!on)("trận đấu trên Emulator", () => {
  beforeAll(async () => {
    const b = db().batch();
    b.set(db().doc(`${COL.classes}/c1`), { name: "7A", grade: 7, schoolId: "s1", teacherIds: ["tA"], joinCode: "ABCDEF", settings: {} });
    b.set(db().doc(`${COL.classes}/c1/students/st_1`), { fullName: "Nguyễn Văn An", number: 1, team: 1 });
    b.set(db().doc(`${COL.classes}/c1/students/st_2`), { fullName: "Trần Thị Bình", number: 2, team: 2 });
    b.set(db().doc(`${COL.lessons}/L1`), { title: { en: "x", vi: "x" }, status: "approved", grade: 7, slideIds: SLIDES.map((s) => s.id), terms: TERMS });
    SLIDES.forEach((s) => b.set(db().doc(`${COL.lessons}/L1/slides/${s.id}`), JSON.parse(JSON.stringify(s))));
    Object.entries(KEYS).forEach(([id, k]) => b.set(db().doc(`${COL.lessons}/L1/teacher/${id}`), JSON.parse(JSON.stringify(k))));
    b.set(db().doc(`${COL.sessions}/S1`), { classId: "c1", lessonId: "L1", status: "live", slideIds: SLIDES.map((s) => s.id), state: { slideIndex: 3 } });
    await b.commit();
  });

  it("Đấu trường tự do: điểm, hạng ▲▼, power-up, cứu điểm, XP", async () => {
    const { id, questions } = await createGame(teacher, { sessionId: "S1", mode: "arena", pace: "self", settings: { count: 5, qTime: 20, level: "e3" } });
    expect(questions).toBe(5);
    expect((await db().doc(`${COL.sessions}/S1`).get()).get("gameId")).toBe(id);
    // Phần công khai không có đáp án
    expect(JSON.stringify(await game(id))).not.toMatch(/"answer"|"accept"|"groups"/);

    await joinGame(st1, id);
    await joinGame(st2, id);
    await expect(answerGame(st1, id, { qi: 0, value: 0 })).rejects.toThrow(/chưa bắt đầu/);
    await controlGame(teacher, id, "start");

    const k = await keys(id);
    // Em 1 đúng hết; em 2 sai hết
    for (let i = 0; i < 5; i++) {
      const p1 = await player(id, "st_1");
      const qi1 = p1.order[p1.pos];
      const r1 = await answerGame(st1, id, { qi: qi1, value: right(k[qi1]) });
      expect(r1.last?.ok).toBe(true);
      expect(r1.last!.pts).toBeGreaterThanOrEqual(700); // 600 + tốc độ + song ngữ E3
      const p2 = await player(id, "st_2");
      const qi2 = p2.order[p2.pos];
      const r2 = await answerGame(st2, id, { qi: qi2, value: wrong(k[qi2]) });
      expect(r2.last?.ok).toBe(false);
      expect(r2.last?.pts).toBe(0);
    }
    const p1 = await player(id, "st_1");
    expect(p1.phase).toBe("done");
    expect(p1.best).toBe(5);
    expect(p1.inv.length).toBeGreaterThan(0); // chạm chuỗi 3 → chắc chắn có power-up
    // Em 2 vào vòng cứu điểm với 5 câu sai
    const p2 = await player(id, "st_2");
    expect(p2.phase).toBe("redeem");
    expect(p2.redeem).toHaveLength(5);
    // Power-up 50-50 cho câu cứu điểm (nếu là trắc nghiệm) không ẩn đáp án đúng
    await db().doc(`${COL.games}/${id}/players/st_2`).update({ inv: ["fifty"] });
    const qr = p2.redeem[0];
    if (k[qr].answer != null) {
      const pw = await applyPower(st2, id, "fifty");
      expect(pw.hidden).not.toContain(k[qr].answer);
    }
    const rr = await answerGame(st2, id, { qi: qr, value: right(k[qr]) });
    expect(rr.last?.ok).toBe(true);
    expect(rr.last!.pts).toBeLessThanOrEqual(300);
    expect(rr.last!.from).toBe(2);

    // Bảng điểm cho tivi
    const b = await board(id);
    expect(b.rows.st_1.s).toBeGreaterThan(b.rows.st_2.s);
    expect(b.stats["0"]?.a).toBeGreaterThan(0);

    // Kết thúc → XP trận + bục vinh quang; gọi lại không cộng trùng
    await controlGame(teacher, id, "end");
    await controlGame(teacher, id, "end");
    const g = await game(id);
    expect(g.status).toBe("ended");
    expect(g.podium?.[0].uid).toBe("st_1");
    const ev = await db().doc(`${COL.events}/game_${id}_st_1`).get();
    expect(ev.get("xp")).toBeGreaterThan(0);
    expect((await db().doc(`${COL.stats}/c1_st_1`).get()).get("gameBest")).toBe(p1.s);
    await controlGame(teacher, id, "close");
    expect((await db().doc(`${COL.sessions}/S1`).get()).get("gameId")).toBeNull();
  });

  it("Rung chuông vàng: sai bị loại lúc công bố, cứu trợ cho quay lại", async () => {
    const { id } = await createGame(teacher, { sessionId: "S1", mode: "bell", settings: { count: 3, qTime: 30 } });
    await joinGame(st1, id);
    await joinGame(st2, id);
    await controlGame(teacher, id, "start");
    const k = await keys(id);
    await answerGame(st1, id, { qi: 0, value: right(k[0]) });
    await answerGame(st2, id, { qi: 0, value: wrong(k[0]) });
    // Chưa công bố thì chưa bị loại (không lộ đáp án)
    expect((await player(id, "st_2")).out).toBeFalsy();
    await expect(answerGame(st2, id, { qi: 0, value: 0 })).rejects.toThrow();
    await controlGame(teacher, id, "reveal");
    expect((await player(id, "st_2")).out).toBe(true);
    expect((await game(id)).reveal?.show).toBe(k[0].show);
    await controlGame(teacher, id, "next");
    await expect(answerGame(st2, id, { qi: 1, value: 0 })).rejects.toThrow(/bị loại/);
    await controlGame(teacher, id, "rescue");
    expect((await player(id, "st_2")).out).toBe(false);
    const r = await answerGame(st2, id, { qi: 1, value: right(k[1]) });
    expect(r.last?.ok).toBe(true);
    await controlGame(teacher, id, "close");
  });

  it("GV lớp khác không điều khiển được; HS lớp khác không vào được", async () => {
    const { id } = await createGame(teacher, { sessionId: "S1", mode: "arena", settings: { count: 3 } });
    await expect(controlGame({ ...teacher, uid: "tB" }, id, "start")).rejects.toThrow(/không dạy lớp này/);
    await expect(joinGame({ ...st1, uid: "x", classIds: ["c9"] }, id)).rejects.toThrow(/không thuộc lớp/);
    await controlGame(teacher, id, "close");
  });
});
