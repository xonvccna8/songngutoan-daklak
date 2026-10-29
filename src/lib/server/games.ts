// GĐ 5 — Trò chơi (chỉ máy chủ): tạo trận, vào chơi, chấm câu trả lời, power-up, điều khiển, kết thúc + cộng XP.
// Máy chủ giữ đáp án và tính giờ trả lời → điện thoại không gian lận được, em mạng chậm không bị thiệt.
import { FieldPath, FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, type AuthedUser } from "@/lib/server/api";
import { loadLessonForGrading } from "@/lib/server/lessons";
import { awardXpSafe, type Award } from "@/lib/server/xp";
import { buildGame, cleanSettings, rng, shuffle } from "@/lib/games/build";
import { SERVER_POWERS, drawPower, gapAbove, gradeGame, hiddenOptions, ranking, scoreAnswer } from "@/lib/games/scoring";
import { MODE_META, type BoardDoc, type BoardRow, type GameDoc, type GameKey, type GameMode, type GameSettings, type LastResult, type PlayerDoc, type PowerKind } from "@/lib/games/types";
import { gameXp } from "@/lib/progress/xp";
import type { LessonDoc, SessionDoc, Slide } from "@/lib/live/types";
import type { StatsDoc } from "@/lib/analytics";

const db = () => adminDb();
const gameRef = (id: string) => db().collection(COL.games).doc(id);
const boardRef = (id: string) => gameRef(id).collection(COL.gameLive).doc("board");
const keyRef = (id: string) => gameRef(id).collection(COL.gamePrivate).doc("key");
const playerRef = (id: string, uid: string) => gameRef(id).collection(COL.gamePlayers).doc(uid);

/** Thời gian ân hạn cho mạng chậm (ms) */
const GRACE = 1500;

// Đáp án ít thay đổi → nhớ tạm trong bộ nhớ khi hàm còn "ấm"
const keyCache = new Map<string, { at: number; keys: GameKey[] }>();
async function loadKeys(id: string): Promise<GameKey[]> {
  const hit = keyCache.get(id);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.keys;
  const snap = await keyRef(id).get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy đáp án của trò chơi.");
  const keys = snap.get("keys") as GameKey[];
  keyCache.set(id, { at: Date.now(), keys });
  return keys;
}

async function loadGame(id: string): Promise<{ ref: DocumentReference; game: GameDoc }> {
  const ref = gameRef(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy trò chơi.");
  return { ref, game: { id: snap.id, ...snap.data() } as GameDoc };
}

// ======================= Tạo trận =======================

export async function createGame(user: AuthedUser, body: { sessionId?: string; mode?: string; pace?: string; settings?: Partial<GameSettings> }) {
  const mode = (Object.keys(MODE_META) as GameMode[]).find((m) => m === body.mode);
  if (!mode) throw new HttpError(400, "Trò chơi không hợp lệ.");
  const sref = db().collection(COL.sessions).doc(String(body.sessionId ?? ""));
  const ssnap = await sref.get();
  if (!ssnap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  const sess = { id: ssnap.id, ...ssnap.data() } as SessionDoc;
  const { cls } = await getClassForStaff(sess.classId, user);
  if (sess.status !== "live") throw new HttpError(409, "Tiết học đã kết thúc.");

  // Trận cũ chưa đóng → kết thúc luôn (tránh hai trận cùng lúc)
  if (sess.gameId) {
    const old = await gameRef(sess.gameId).get();
    if (old.exists && old.get("status") !== "ended") await endGame(sess.gameId);
  }

  const settings = cleanSettings(mode, body.settings);
  const meta = MODE_META[mode];
  const pace = meta.pace === "either" ? (body.pace === "teacher" ? "teacher" : "self") : meta.pace;
  const [{ slides, keys }, lessonSnap] = await Promise.all([loadLessonForGrading(sess.lessonId), db().collection(COL.lessons).doc(sess.lessonId).get()]);
  const lesson = lessonSnap.data() as LessonDoc;
  const built = buildGame({
    mode,
    slides: (lesson.slideIds ?? []).map((sid) => slides.get(sid)).filter((s): s is Slide => !!s),
    keys: Object.fromEntries(keys),
    terms: lesson.terms ?? [],
    grade: cls.grade,
    count: settings.count,
    seed: Date.now() % 2147483647,
  });
  if (!built.questions.length)
    throw new HttpError(422, mode === "match" ? "Chưa đủ thuật ngữ (cần có phiên âm) hay kí hiệu để chơi Ghép bộ ba." : "Tiết này chưa có câu hỏi hay thuật ngữ để tạo trò chơi.");

  const ref = db().collection(COL.games).doc();
  const now = Date.now();
  const game: Omit<GameDoc, "id"> = {
    sessionId: sess.id,
    classId: sess.classId,
    schoolId: cls.schoolId ?? null,
    teacherId: user.uid,
    lessonId: sess.lessonId,
    title: { vi: meta.vi, en: meta.en },
    mode,
    pace,
    settings,
    status: "lobby",
    questions: built.questions,
    cur: null,
    reveal: null,
    powerPlayUntil: null,
    createdAt: now,
    startedAt: null,
    resumedAt: null,
    pausedAt: null,
    endedAt: null,
  };
  const board: BoardDoc = { rows: {}, stats: {}, ev: null, updatedAt: now };
  const batch = db().batch();
  batch.set(ref, JSON.parse(JSON.stringify(game)));
  batch.set(boardRef(ref.id), board);
  batch.set(keyRef(ref.id), JSON.parse(JSON.stringify({ keys: built.keys })));
  batch.update(sref, { gameId: ref.id });
  await batch.commit();
  keyCache.set(ref.id, { at: now, keys: built.keys });
  return { id: ref.id, questions: built.questions.length };
}

// ======================= Học sinh vào chơi =======================

function assertStudent(game: GameDoc, user: AuthedUser) {
  if (!user.classIds?.includes(game.classId)) throw new HttpError(403, "Em không thuộc lớp này.");
}

export async function joinGame(user: AuthedUser, id: string) {
  const { game } = await loadGame(id);
  assertStudent(game, user);
  if (game.status === "ended") throw new HttpError(409, "Trò chơi đã kết thúc.");
  const pref = playerRef(id, user.uid);
  const snap = await pref.get();
  // now = giờ máy chủ, để điện thoại bù lệch đồng hồ khi hiện thanh thời gian
  if (snap.exists) return { ok: true, now: Date.now() };
  const team = ((await db().collection(COL.classes).doc(game.classId).collection(COL.students).doc(user.uid).get()).get("team") as number | undefined) ?? 1;
  // Tự làm: mỗi em một thứ tự câu riêng (khó nhìn bài nhau)
  const seed = [...user.uid].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const idx = game.questions.map((_, i) => i);
  const order = game.pace === "self" && game.mode !== "match" ? shuffle(idx, rng(seed)) : idx;
  const now = Date.now();
  const p: PlayerDoc = { uid: user.uid, team, order, pos: 0, qStart: now, redeem: [], redeemPos: 0, phase: "q", answers: {}, s: 0, st: 0, best: 0, c: 0, n: 0, inv: [], fx: {}, last: null };
  await pref.set(p);
  const row: BoardRow = { s: 0, st: 0, best: 0, c: 0, n: 0, team };
  await boardRef(id).update(new FieldPath("rows", user.uid), row, "updatedAt", now);
  return { ok: true, now };
}

// ======================= Câu hiện tại của một em =======================

function currentQ(game: GameDoc, p: PlayerDoc): { qi: number; redeem: boolean } | null {
  if (game.pace === "teacher") return game.cur && game.cur.phase === "q" && !p.answers[game.cur.i] ? { qi: game.cur.i, redeem: false } : null;
  if (p.phase === "q") return p.pos < p.order.length ? { qi: p.order[p.pos], redeem: false } : null;
  if (p.phase === "redeem") return p.redeemPos < p.redeem.length ? { qi: p.redeem[p.redeemPos], redeem: true } : null;
  return null;
}

/** Lúc bắt đầu tính giờ câu hiện tại */
function startOf(game: GameDoc, p: PlayerDoc) {
  if (game.pace === "teacher") return game.cur?.startedAt ?? Date.now();
  return Math.max(p.qStart, game.startedAt ?? 0, game.resumedAt ?? 0);
}

// ======================= Trả lời =======================

export async function answerGame(user: AuthedUser, id: string, body: { qi?: number; value?: unknown; flip?: boolean }) {
  const [{ game }, keys, boardSnap] = await Promise.all([loadGame(id), loadKeys(id), boardRef(id).get()]);
  assertStudent(game, user);
  if (game.status === "paused") throw new HttpError(409, "Thầy cô đang tạm dừng trò chơi.");
  if (game.status !== "play") throw new HttpError(409, game.status === "lobby" ? "Trò chơi chưa bắt đầu." : "Trò chơi đã kết thúc.");
  const board = boardSnap.data() as BoardDoc;
  const now = Date.now();
  const limit = game.settings.qTime;

  const res = await db().runTransaction(async (tx) => {
    const pref = playerRef(id, user.uid);
    const ps = await tx.get(pref);
    if (!ps.exists) throw new HttpError(409, "Em chưa vào trò chơi.");
    const p = ps.data() as PlayerDoc;
    if (p.out) throw new HttpError(409, "Em đã bị loại — chờ thầy cô cứu trợ nhé!");
    const cur = currentQ(game, p);
    if (!cur || cur.qi !== Number(body.qi)) throw new HttpError(409, "Câu hỏi đã đổi, em xem câu mới nhé.");
    const q = game.questions[cur.qi];
    const key = keys[cur.qi];
    const elapsed = now - startOf(game, p);
    const frozen = p.fx.freeze === cur.qi;
    const late = limit > 0 && !frozen && elapsed > limit * 1000 + GRACE;
    const timeout = body.value == null || late;
    const g = timeout ? { ok: false } : gradeGame(q, key, body.value);

    // Ghép sai nhưng còn giờ → ghép lại (mỗi lần sai bị trừ một ít)
    if (!g.ok && !timeout && q.kind === "match") {
      const tries = (p.wrongTries?.[cur.qi] ?? 0) + 1;
      tx.update(pref, { [`wrongTries.${cur.qi}`]: tries });
      return { retry: true as const, wrongGroups: (g as { wrongGroups?: number }).wrongGroups ?? 0 };
    }
    // Power-up "Làm lại": sai thì được trả lời lại câu này một lần
    if (!g.ok && !timeout && p.fx.immunity === cur.qi) {
      tx.update(pref, { "fx.immunity": FieldValue.delete() });
      return { retry: true as const, immunity: true };
    }

    const saver = !g.ok && !!p.fx.saver && p.st > 0;
    const scored = scoreAnswer({
      ok: g.ok,
      elapsedMs: elapsed,
      limitSec: limit,
      streakBefore: p.st,
      double: !!p.fx.double,
      powerPlay: !!game.powerPlayUntil && now < game.powerPlayUntil,
      bilingual: game.settings.level === "e3" && !body.flip && p.fx.flip !== cur.qi,
      frozen,
      redeem: cur.redeem,
      wrongTries: p.wrongTries?.[cur.qi],
    });
    const streak = saver ? p.st : scored.streak;
    const s = p.s + scored.pts;
    const c = p.c + (g.ok ? 1 : 0);
    const n = p.n + (cur.redeem ? 0 : 1);
    const best = Math.max(p.best, streak);

    // Hạng trước / sau (từ bảng điểm vừa đọc — gần đúng, đủ cho hiệu ứng ▲▼)
    const rows: Record<string, Pick<BoardRow, "s">> = { ...board.rows, [user.uid]: { s: p.s } };
    const from = ranking(rows).get(user.uid) ?? Object.keys(rows).length;
    rows[user.uid] = { s };
    const rk = ranking(rows);
    const to = rk.get(user.uid) ?? from;
    const total = Object.keys(rows).length;

    // Power-up mới (chỉ Đấu trường, sau câu đúng, tối đa 3)
    let gift: PowerKind | null = null;
    if (game.settings.powerups && g.ok && !cur.redeem && p.inv.length < 3) gift = drawPower(streak, total > 1 ? (to - 1) / (total - 1) : 0, Math.random);

    // Sang câu sau / vòng cứu điểm / xong
    const upd: Record<string, unknown> = {
      [`answers.${cur.qi}`]: { v: timeout ? "" : String(body.value).slice(0, 400), ok: g.ok, pts: scored.pts, ...(cur.redeem ? { r: true } : {}) },
      s,
      st: streak,
      best,
      c,
      n,
      qStart: now,
      fx: { ...p.fx, double: undefined, freeze: undefined, immunity: undefined, hidden: undefined, flip: undefined, saver: saver ? undefined : p.fx.saver },
      ...(gift ? { inv: [...p.inv, gift] } : {}),
    };
    let done = false;
    if (game.pace === "self") {
      if (cur.redeem) {
        upd.redeemPos = p.redeemPos + 1;
        done = p.redeemPos + 1 >= p.redeem.length;
      } else {
        upd.pos = p.pos + 1;
        if (p.pos + 1 >= p.order.length) {
          // Vòng cứu điểm: chỉ Đấu trường, các câu sai làm lại 1 lần
          const wrong = game.mode === "arena" ? p.order.filter((qi) => !(qi === cur.qi ? g.ok : p.answers[qi]?.ok)) : [];
          if (wrong.length) Object.assign(upd, { phase: "redeem", redeem: wrong, redeemPos: 0 });
          else done = true;
        }
      }
      if (done) upd.phase = "done";
    }
    // (Rung chuông vàng: em sai bị loại lúc thầy cô công bố đáp án — xem controlGame "reveal", để không lộ đáp án sớm)

    const last: LastResult = {
      qi: cur.qi,
      ok: g.ok,
      pts: scored.pts,
      from,
      to,
      total,
      gap: gapAbove(rows, user.uid),
      streak,
      gift,
      // GV điều khiển: đáp án chỉ hiện khi thầy cô công bố
      ...(game.pace === "self" ? { show: key.show, ...(key.explain ? { explain: key.explain } : {}) } : {}),
      at: now,
    };
    upd.last = last;
    tx.update(pref, JSON.parse(JSON.stringify(upd)));
    const row: BoardRow = { s, st: streak, best, c, n, team: p.team, ...(done ? { done: true } : {}) };
    return { retry: false as const, last, row, passed: to < from, streakHit: g.ok && [3, 5, 7, 10].includes(streak), qi: cur.qi, ok: g.ok, timeout, redeem: cur.redeem, value: body.value };
  });

  if (res.retry) return res;

  // Bảng điểm (tivi + GV): dòng của em + thống kê câu + sự kiện cho dòng chữ chạy
  const upd: unknown[] = [new FieldPath("rows", user.uid), res.row, "updatedAt", now];
  if (!res.redeem) {
    upd.push(new FieldPath("stats", String(res.qi), "a"), FieldValue.increment(1));
    if (res.ok) upd.push(new FieldPath("stats", String(res.qi), "c"), FieldValue.increment(1));
    if (game.questions[res.qi].kind === "mcq" && !res.timeout) upd.push(new FieldPath("stats", String(res.qi), "pick", String(Number(res.value))), FieldValue.increment(1));
  }
  const ev = res.passed && res.last.to <= 3 ? { kind: "pass", uid: user.uid, n: res.last.to } : res.streakHit ? { kind: "streak", uid: user.uid, n: res.last.streak } : null;
  if (ev) upd.push("ev", { t: now, ...ev });
  await (boardRef(id).update as (...a: unknown[]) => Promise<unknown>)(...upd);
  return { retry: false, last: res.last };
}

// ======================= Power-up =======================

export async function applyPower(user: AuthedUser, id: string, kind: PowerKind) {
  const [{ game }, keys] = await Promise.all([loadGame(id), loadKeys(id)]);
  assertStudent(game, user);
  if (game.status !== "play") throw new HttpError(409, "Trò chơi đang không diễn ra.");
  const now = Date.now();
  const r = await db().runTransaction(async (tx) => {
    const pref = playerRef(id, user.uid);
    const p = (await tx.get(pref)).data() as PlayerDoc | undefined;
    if (!p) throw new HttpError(409, "Em chưa vào trò chơi.");
    const at = p.inv.indexOf(kind);
    if (at < 0) throw new HttpError(409, "Em không có power-up này.");
    const cur = currentQ(game, p);
    if (!cur && kind !== "powerplay") throw new HttpError(409, "Chờ câu hỏi tiếp theo rồi dùng nhé.");
    const inv = p.inv.filter((_, i) => i !== at);
    const fx = { ...p.fx };
    let hidden: number[] | undefined;
    if (kind === "fifty" || kind === "eraser") {
      const q = cur ? game.questions[cur.qi] : null;
      const ans = cur ? keys[cur.qi].answer : undefined;
      if (!q || q.kind !== "mcq" || ans == null) throw new HttpError(409, "Power-up này chỉ dùng cho câu trắc nghiệm.");
      const already = fx.hidden?.qi === cur!.qi ? fx.hidden.opts : [];
      const more = hiddenOptions(q.options!.length, ans, kind, Math.random).filter((x) => !already.includes(x));
      hidden = [...new Set([...already, ...(more.length ? more : hiddenOptions(q.options!.length, ans, "eraser", Math.random))])].sort();
      fx.hidden = { qi: cur!.qi, opts: hidden };
    } else if (kind === "double") fx.double = true;
    else if (kind === "freeze") fx.freeze = cur!.qi;
    else if (kind === "saver") fx.saver = true;
    else if (kind === "immunity") fx.immunity = cur!.qi;
    else if (kind === "flip") fx.flip = cur!.qi;
    tx.update(pref, JSON.parse(JSON.stringify({ inv, fx })));
    if (kind === "powerplay") tx.update(gameRef(id), { powerPlayUntil: now + 20_000 });
    return { hidden };
  });
  if (kind === "powerplay") await boardRef(id).update("ev", { t: now, kind: "power", uid: user.uid }, "updatedAt", now);
  return { ok: true, ...r, server: SERVER_POWERS.includes(kind) };
}

// ======================= GV điều khiển =======================

export type GameAction = "start" | "reveal" | "next" | "pause" | "resume" | "rescue" | "end" | "close";

export async function controlGame(user: AuthedUser, id: string, action: GameAction) {
  const { ref, game } = await loadGame(id);
  await getClassForStaff(game.classId, user);
  const now = Date.now();
  const endsAt = (t: number) => (game.settings.qTime > 0 ? t + game.settings.qTime * 1000 : null);

  switch (action) {
    case "start":
      if (game.status !== "lobby") return { ok: true };
      await ref.update({ status: "play", startedAt: now, ...(game.pace === "teacher" ? { cur: { i: 0, phase: "q", startedAt: now, endsAt: endsAt(now) } } : {}) });
      return { ok: true };
    case "pause":
      if (game.status === "play") await ref.update({ status: "paused", pausedAt: now });
      return { ok: true };
    case "resume": {
      if (game.status !== "paused") return { ok: true };
      const shift = now - (game.pausedAt ?? now);
      // GV điều khiển: dời mốc giờ câu hiện tại; Tự làm: câu đang dở tính giờ lại từ lúc tiếp tục
      const cur = game.cur ? { ...game.cur, startedAt: game.cur.startedAt + shift, endsAt: game.cur.endsAt ? game.cur.endsAt + shift : null } : null;
      await ref.update({ status: "play", pausedAt: null, resumedAt: now, ...(cur ? { cur } : {}) });
      return { ok: true };
    }
    case "reveal": {
      if (game.pace !== "teacher" || !game.cur || game.cur.phase !== "q") return { ok: true };
      const keys = await loadKeys(id);
      const k = keys[game.cur.i];
      await ref.update(JSON.parse(JSON.stringify({ cur: { ...game.cur, phase: "reveal" }, reveal: { i: game.cur.i, answer: k.answer, show: k.show, explain: k.explain } })));
      // Rung chuông vàng: em trả lời sai hoặc chưa trả lời câu này bị loại
      if (game.mode === "bell") {
        const players = await ref.collection(COL.gamePlayers).get();
        const miss = players.docs.filter((d) => !d.get("out") && !(d.get("answers") as PlayerDoc["answers"])?.[game.cur!.i]?.ok);
        if (miss.length) {
          const b = db().batch();
          miss.forEach((d) => {
            b.update(d.ref, { out: true });
            b.update(boardRef(id), new FieldPath("rows", d.id, "out"), true);
          });
          b.update(boardRef(id), { ev: { t: now, kind: "out", n: miss.length }, updatedAt: now });
          await b.commit();
        }
      }
      return { ok: true };
    }
    case "next": {
      if (game.pace !== "teacher" || !game.cur) return { ok: true };
      const i = game.cur.i + 1;
      if (i >= game.questions.length) return endGame(id);
      await ref.update({ cur: { i, phase: "q", startedAt: now, endsAt: endsAt(now) }, reveal: null });
      return { ok: true };
    }
    case "rescue": {
      // Rung chuông vàng: cứu trợ — mọi em bị loại được quay lại
      const outs = await ref.collection(COL.gamePlayers).where("out", "==", true).get();
      const b = db().batch();
      outs.docs.forEach((d) => {
        b.update(d.ref, { out: false });
        b.update(boardRef(id), new FieldPath("rows", d.id, "out"), false);
      });
      b.update(boardRef(id), { ev: { t: now, kind: "rescue", n: outs.size }, updatedAt: now });
      await b.commit();
      return { ok: true, rescued: outs.size };
    }
    case "end":
      return endGame(id);
    case "close":
      // Về lại bài học (đúng trang đang dạy)
      await db().collection(COL.sessions).doc(game.sessionId).update({ gameId: null });
      if (game.status !== "ended") await endGame(id);
      return { ok: true };
  }
}

// ======================= Kết thúc trận + XP =======================

export async function endGame(id: string) {
  const ref = gameRef(id);
  // Đánh dấu kết thúc trong transaction → gọi hai lần cũng chỉ cộng XP một lần (XP còn có key cố định)
  const game = await db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) throw new HttpError(404, "Không tìm thấy trò chơi.");
    const g = { id: s.id, ...s.data() } as GameDoc;
    if (g.status === "ended") return null;
    tx.update(ref, { status: "ended", endedAt: Date.now(), cur: g.cur ? { ...g.cur, phase: "reveal" } : null });
    return g;
  });
  if (!game) return { ok: true, already: true };

  const players = (await ref.collection(COL.gamePlayers).get()).docs.map((d) => d.data() as PlayerDoc);
  // Tổ thắng: điểm trung bình mỗi bạn (công bằng khi tổ đông / ít khác nhau)
  let winnerTeam: number | null = null;
  if (game.settings.team && players.length) {
    const t = new Map<number, { s: number; n: number }>();
    players.forEach((p) => {
      const x = t.get(p.team) ?? { s: 0, n: 0 };
      x.s += p.s;
      x.n++;
      t.set(p.team, x);
    });
    winnerTeam = [...t.entries()].sort((a, b) => b[1].s / b[1].n - a[1].s / a[1].n)[0][0];
  }
  const podium = [...players].sort((a, b) => b.s - a.s).slice(0, 3).map((p) => ({ uid: p.uid, s: p.s }));
  await ref.update({ podium, winnerTeam });

  // XP: điểm ÷ 1000 (≤ 30) + tổ thắng + phá kỉ lục; Sao thành thạo theo YCCĐ của câu
  const stats = players.length ? await db().getAll(...players.map((p) => db().collection(COL.stats).doc(`${game.classId}_${p.uid}`))) : [];
  const awards: Award[] = players.map((p, i) => {
    const prevBest = ((stats[i]?.data() ?? {}) as Partial<StatsDoc>).gameBest ?? 0;
    const newBest = p.s > prevBest;
    const mastery: Record<string, { a: number; c: number }> = {};
    Object.entries(p.answers).forEach(([qi, a]) => {
      if (a.r) return;
      (game.questions[Number(qi)]?.outcomeIds ?? []).forEach((o) => {
        mastery[o] = { a: (mastery[o]?.a ?? 0) + 1, c: (mastery[o]?.c ?? 0) + (a.ok ? 1 : 0) };
      });
    });
    return {
      uid: p.uid,
      classId: game.classId,
      kind: "game",
      scope: "class",
      xp: gameXp(p.s, winnerTeam != null && p.team === winnerTeam, newBest),
      key: `game_${id}_${p.uid}`,
      note: `${MODE_META[game.mode].vi} · ${p.s.toLocaleString("vi-VN")} điểm`,
      studyDay: p.n > 0,
      ...(newBest ? { set: { gameBest: p.s } } : {}),
      ...(Object.keys(mastery).length ? { mastery } : {}),
    };
  });
  await awardXpSafe(awards);
  return { ok: true };
}
