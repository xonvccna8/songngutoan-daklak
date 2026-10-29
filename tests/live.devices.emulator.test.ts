// Thử TRỌN MỘT TIẾT DẠY TRỰC TIẾP với nhiều thiết bị ở các mạng khác nhau — Firestore + Auth Emulator (dữ liệu giả, không đụng Firebase thật).
// Chạy: firebase emulators:exec --only firestore,auth --project demo-lsn "vitest run tests/live.devices.emulator.test.ts"
//
// Mỗi thiết bị = một kết nối Firebase riêng, đăng nhập tài khoản riêng (rules thật), gọi API thật (máy chủ chấm điểm).
// "Mạng khác nhau" được giả lập bằng độ trễ / dao động riêng cho từng máy, và rớt mạng thật (disableNetwork) rồi vào lại.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithCustomToken } from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  disableNetwork,
  doc,
  enableNetwork,
  getDoc,
  getDocs,
  increment,
  initializeFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { CLAIM, COL, responseId } from "@/lib/namespace";
import * as C from "@/lib/live/controller";
import { LESSON, LESSON_ID, KEYS, SLIDES, TERMS } from "@/lib/lessons/pythagore";
import type { LiveState, ResponseDoc, SessionDoc } from "@/lib/live/types";
import { POST as createSession } from "@/app/api/live/sessions/route";
import { POST as answerApi } from "@/app/api/live/answer/route";
import { POST as endApi } from "@/app/api/live/sessions/[sessionId]/end/route";
import { POST as revealApi } from "@/app/api/live/sessions/[sessionId]/reveal/route";
import { POST as pulseApi } from "@/app/api/live/pulse/route";
import { POST as levelsApi } from "@/app/api/classes/[classId]/levels/route";
import { POST as remedialApi } from "@/app/api/live/sessions/[sessionId]/remedial/route";
import { tickLang } from "@/lib/live/english";
import { eachRemedial } from "@/lib/study/remedial";
import { isHomeworkSlide } from "@/lib/study/hw";
import type { AssignmentDoc } from "@/lib/study/types";
import { diagnoseQuestion, diagnoseStudent, lightKey, summarizeExits, tallyLights } from "@/lib/live/diagnose";
import { markPhase, planMinutes, timelineView } from "@/lib/live/timeline";
import { makePairs, partnersOf, swapInPairs } from "@/lib/live/pairing";
import { suggest } from "@/lib/live/assistant";

const on = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const PROJECT = "demo-lsn";
const ctx: C.Ctx = { slides: SLIDES, keys: KEYS };
const idx = (sid: string) => SLIDES.findIndex((s) => s.id === sid);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hồ sơ mạng: độ trễ một chiều trung bình + dao động (ms) */
interface Net {
  label: string;
  latency: number;
  jitter: number;
}
const NET = {
  school: { label: "Wi-Fi trường (máy chiếu)", latency: 15, jitter: 10 },
  home: { label: "Wi-Fi nhà", latency: 40, jitter: 20 },
  m4g: { label: "4G", latency: 120, jitter: 80 },
  m3g: { label: "3G yếu", latency: 450, jitter: 250 },
  flaky: { label: "4G chập chờn (rớt mạng)", latency: 200, jitter: 150 },
} satisfies Record<string, Net>;

type Handler = (req: Request, ctx?: unknown) => Promise<Response>;
const findings: string[] = [];

/** Một thiết bị: kết nối Firebase riêng + độ trễ mạng riêng */
class Device {
  app!: FirebaseApp;
  db!: Firestore;
  token = "";
  state: LiveState | null = null;
  status: string | null = null;
  watchError: string | null = null;
  /** writtenAt → thời điểm máy này "nhận" được (để đo độ trễ đồng bộ) */
  arrivals = new Map<number, number>();
  private applyAt = 0;
  private unsub: (() => void) | null = null;

  constructor(
    public name: string,
    public net: Net,
    public uid: string,
    public claims: Record<string, unknown>
  ) {}

  lag() {
    return this.net.latency + Math.random() * this.net.jitter;
  }

  async connect() {
    this.app = initializeApp({ projectId: PROJECT, apiKey: "demo-key", authDomain: `${PROJECT}.firebaseapp.com` }, this.name);
    const auth = getAuth(this.app);
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    // Giống cấu hình app thật (src/lib/firebase/client.ts)
    this.db = initializeFirestore(this.app, { ignoreUndefinedProperties: true });
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(":");
    connectFirestoreEmulator(this.db, host, Number(port));
    await signInWithCustomToken(auth, await adminAuth().createCustomToken(this.uid, this.claims));
    this.token = await auth.currentUser!.getIdToken();
  }

  /** Gọi API thật qua "mạng" của máy này (trễ cả chiều đi lẫn chiều về) */
  async api(handler: Handler, body: unknown, routeCtx?: unknown) {
    await sleep(this.lag());
    const res = await handler(
      new Request("http://localhost/api", { method: "POST", headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" }, body: JSON.stringify(body) }),
      routeCtx
    );
    const json = (await res.json()) as Record<string, unknown>;
    await sleep(this.lag());
    return { status: res.status, json };
  }

  /** Theo dõi tiết học (onSnapshot) — bản ghi tới theo đúng thứ tự, trễ theo mạng của máy */
  watch(sessionId: string) {
    this.unsub = onSnapshot(
      doc(this.db, COL.sessions, sessionId),
      (snap) => {
        const d = snap.data() as SessionDoc | undefined;
        if (!d) return;
        // Firestore giao bản ghi đúng thứ tự; giả lập trễ phải giữ thứ tự đó (hai hẹn giờ trùng thời điểm có thể chạy đảo)
        this.applyAt = Math.max(this.applyAt + 1, Date.now() + this.lag());
        setTimeout(() => {
          if (this.state && d.state.writtenAt < this.state.writtenAt) return;
          this.state = d.state;
          this.status = d.status;
          if (!this.arrivals.has(d.state.writtenAt)) this.arrivals.set(d.state.writtenAt, Date.now());
        }, this.applyAt - Date.now());
      },
      (e) => (this.watchError = e.message)
    );
  }

  /** Các khoảng mất mạng [bắt đầu, kết thúc] — loại khỏi phép đo độ trễ */
  offlineWindows: [number, number][] = [];
  /** Thời gian bắt kịp trạng thái mới nhất sau khi có mạng lại (ms) */
  catchUpMs: number[] = [];

  async offline() {
    this.offlineWindows.push([Date.now(), Infinity]);
    await disableNetwork(this.db);
  }
  async online(latestWrittenAt: number) {
    const t = Date.now();
    await enableNetwork(this.db);
    this.offlineWindows.at(-1)![1] = t;
    await waitFor(() => this.state?.writtenAt === latestWrittenAt, 10_000, `${this.name} bắt kịp sau khi có mạng lại`);
    this.catchUpMs.push(Date.now() - t);
  }
  wasOffline(at: number) {
    return this.offlineWindows.some(([a, b]) => at >= a && at <= b);
  }

  async close() {
    this.unsub?.();
    await deleteApp(this.app).catch(() => {});
  }
}

/** Đợi điều kiện đúng (mạng chậm cần chờ) */
async function waitFor(cond: () => boolean, ms = 10_000, what = "điều kiện") {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error(`Hết giờ chờ: ${what}`);
    await sleep(25);
  }
}

/** Thao tác bị rules từ chối? */
async function denied(p: Promise<unknown>) {
  try {
    await p;
    return false;
  } catch (e) {
    // Lỗi đọc có thể để trống message, mã lỗi nằm ở "code" (permission-denied)
    const err = e as { code?: string; message?: string };
    const text = `${err.code ?? ""} ${err.message ?? ""}`;
    if (!/permission|insufficient/i.test(text)) console.log("[lỗi khác, không phải bị chặn]", text);
    return /permission|insufficient/i.test(text);
  }
}

const student = (uid: string, cls = "c1") => ({ [CLAIM.role]: "student", [CLAIM.school]: "s1", [CLAIM.classes]: [cls] });
const teacherClaims = { [CLAIM.role]: "teacher", [CLAIM.school]: "s1", [CLAIM.classes]: [] };

describe.skipIf(!on)("tiết dạy trực tiếp: GV trình chiếu + HS điện thoại ở các mạng khác nhau", { timeout: 90_000 }, () => {
  const laptop = new Device("laptop-GV", NET.school, "tA", teacherClaims);
  const tv = new Device("tivi-GV", NET.school, "tA", teacherClaims);
  const an = new Device("dt-An", NET.m4g, "st_an", student("st_an"));
  const binh = new Device("dt-Binh", NET.m3g, "st_binh", student("st_binh"));
  const chi = new Device("dt-Chi", NET.flaky, "st_chi", student("st_chi"));
  const dung = new Device("dt-Dung", NET.home, "st_dung", student("st_dung"));
  const em = new Device("dt-Em", NET.home, "st_em", student("st_em"));
  const outsider = new Device("dt-lop-khac", NET.m4g, "st_x", student("st_x", "c2"));
  const otherTeacher = new Device("laptop-GV-khac", NET.home, "tB", teacherClaims);
  const phones = [an, binh, chi, dung];
  const screens = [laptop, tv, ...phones];
  const all = [...screens, em, outsider, otherTeacher];
  let sid = "";

  /** GV bấm trên laptop: tính trạng thái mới từ bản đang thấy, ghi qua mạng Wi-Fi trường, chờ chính laptop thấy */
  async function teacher(fn: (s: LiveState) => LiveState) {
    const base = laptop.state!;
    // Giống use-controls: ghi mốc chặng (Đợt B), cộng thời gian theo ngôn ngữ (Đợt D) rồi đóng dấu thời gian
    const now = Date.now();
    const stamped = C.stamp(tickLang(base, markPhase(fn(base), SLIDES, now), now), base, now);
    await sleep(laptop.lag());
    await updateDoc(doc(laptop.db, COL.sessions, sid), { state: stamped, updatedAt: serverTimestamp() });
    await waitFor(() => laptop.state?.writtenAt === stamped.writtenAt, 10_000, "laptop thấy thao tác của mình");
    return stamped;
  }
  /** Mọi máy đang online đều thấy cùng trạng thái */
  async function synced(devs: Device[], s: LiveState) {
    await Promise.all(
      devs.map((d) =>
        waitFor(() => d.state?.writtenAt === s.writtenAt, 10_000, `${d.name} (${d.net.label}) đồng bộ`).catch((e) => {
          const seen = [...d.arrivals.keys()];
          throw new Error(
            `${(e as Error).message} — cần writtenAt ${s.writtenAt} (trang ${s.slideIndex}, ${s.phase}); máy đang ở ${d.state?.writtenAt} (trang ${d.state?.slideIndex}, ${d.state?.phase}); ` +
              `đã nhận ${seen.length} bản, bản cuối ${seen.at(-1)}; lỗi nghe: ${d.watchError ?? "không"}; laptop đã ghi ${laptop.arrivals.size} bản`
          );
        })
      )
    );
  }
  /** Sang trang câu hỏi rồi bấm Tiếp đến khi câu hỏi mở */
  async function openQuestion(slideId: string) {
    let s = await teacher((x) => C.goSlide(x, idx(slideId), ctx));
    for (let i = 0; s.phase !== "open" && i < 10; i++) s = await teacher((x) => C.next(x, ctx));
    expect(s.phase).toBe("open");
    return s;
  }
  const answer = (d: Device, slideId: string, value: unknown, extra: object = {}) => d.api(answerApi as Handler, { sessionId: sid, slideId, value, ...extra });
  const resp = async (uid: string, slideId: string) => (await adminDb().doc(`${COL.sessions}/${sid}/${COL.responses}/${responseId(uid, slideId)}`).get()).data() as ResponseDoc | undefined;
  const partPoints = async (uid: string) => ((await adminDb().doc(`${COL.sessions}/${sid}/${COL.participants}/${uid}`).get()).get("points") as number | undefined) ?? 0;

  beforeAll(async () => {
    const db = adminDb();
    const b = db.batch();
    b.set(db.doc(`${COL.classes}/c1`), { name: "6A", grade: 6, schoolId: "s1", teacherIds: ["tA"], joinCode: "KHTN06", settings: {} });
    b.set(db.doc(`${COL.classes}/c2`), { name: "6B", grade: 6, schoolId: "s1", teacherIds: ["tB"], joinCode: "KHTN6B", settings: {} });
    ["st_an", "st_binh", "st_chi", "st_dung", "st_em"].forEach((u, i) => b.set(db.doc(`${COL.classes}/c1/students/${u}`), { fullName: `Học sinh ${u}`, number: i + 1, team: 1 }));
    b.set(db.doc(`${COL.lessons}/${LESSON_ID}`), { ...LESSON, slideIds: SLIDES.map((s) => s.id), terms: TERMS, ownerId: null });
    SLIDES.forEach((s) => b.set(db.doc(`${COL.lessons}/${LESSON_ID}/${COL.slides}/${s.id}`), JSON.parse(JSON.stringify(s))));
    Object.entries(KEYS).forEach(([id, k]) => b.set(db.doc(`${COL.lessons}/${LESSON_ID}/${COL.teacherKeys}/${id}`), JSON.parse(JSON.stringify(k))));
    await b.commit();
    await Promise.all(all.map((d) => d.connect()));
  });

  afterAll(async () => {
    await Promise.all(all.map((d) => d.close()));
    if (findings.length) console.log("\n⚠ PHÁT HIỆN KHI TEST:\n" + findings.map((f) => "  - " + f).join("\n"));
  });

  it("1. GV mở tiết; laptop, tivi và 4 điện thoại ở 4 mạng khác nhau đều thấy tiết đang dạy", async () => {
    const r = await laptop.api(createSession as Handler, { classId: "c1", lessonId: LESSON_ID });
    expect(r.status).toBe(201);
    sid = r.json.id as string;
    screens.forEach((d) => d.watch(sid));
    await Promise.all(screens.map((d) => waitFor(() => d.status === "live", 10_000, `${d.name} thấy tiết`)));
    screens.forEach((d) => expect(d.state?.slideIndex).toBe(0));
  });

  it("2. HS vào lớp (hồ sơ có mặt) theo rules thật; HS lớp khác và GV lớp khác bị chặn", async () => {
    for (const p of phones) {
      await sleep(p.lag());
      await setDoc(doc(p.db, COL.sessions, sid, COL.participants, p.uid), { joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp(), visible: true, leftCount: 0, raisedHandAt: null });
    }
    const parts = await adminDb().collection(`${COL.sessions}/${sid}/${COL.participants}`).get();
    expect(parts.size).toBe(4);
    // HS lớp khác: không xem được tiết, không vào được, không trả lời được
    expect(await denied(getDoc(doc(outsider.db, COL.sessions, sid)))).toBe(true);
    expect(await denied(setDoc(doc(outsider.db, COL.sessions, sid, COL.participants, outsider.uid), { joinedAt: serverTimestamp() }))).toBe(true);
    // GV lớp khác: không điều khiển được
    expect(await denied(updateDoc(doc(otherTeacher.db, COL.sessions, sid), { state: { ...laptop.state!, slideIndex: 5 } }))).toBe(true);
  });

  it("3. GV bấm Tiếp, đổi ngôn ngữ Anh/Việt → mọi máy đồng bộ; điện thoại đọc được nội dung song ngữ nhưng KHÔNG đọc được đáp án", async () => {
    let s = await teacher((x) => C.next(x, ctx)); // hiện mục tiêu
    s = await teacher((x) => C.next(x, ctx)); // sang trang Khởi động
    await synced(screens, s);
    screens.forEach((d) => expect(d.state!.slideIndex).toBe(idx("s1")));
    for (const lang of ["en", "vi", "bi"] as const) {
      s = await teacher((x) => ({ ...x, lang }));
      await synced(screens, s);
      screens.forEach((d) => expect(d.state!.lang).toBe(lang));
    }
    // Nội dung câu hỏi trên điện thoại: có cả tiếng Anh và tiếng Việt
    for (const p of phones) {
      const slide = (await getDoc(doc(p.db, COL.lessons, LESSON_ID, COL.slides, "s1"))).data()!;
      expect(slide.question.prompt.en).toBeTruthy();
      expect(slide.question.prompt.vi).toBeTruthy();
      expect(slide.question.options.every((o: { en: string; vi: string }) => o.en && o.vi)).toBe(true);
      expect(await denied(getDoc(doc(p.db, COL.lessons, LESSON_ID, COL.teacherKeys, "s1")))).toBe(true);
    }
  });

  it("3b. Đợt A — Đèn hiểu bài: mỗi em bấm từ mạng của mình, GV thấy tỉ lệ + ai đỏ; HS không đọc được đèn của bạn", async () => {
    // Đang ở trang Khởi động (câu hỏi chưa mở) → về trang nội dung s2, hiện bước 3
    let s = await teacher((x) => C.goSlide(x, idx("s2"), ctx));
    for (let i = 0; i < 3; i++) s = await teacher((x) => C.next(x, ctx));
    await synced(phones, s);
    const pulse = (d: Device, body: object) => d.api(pulseApi as Handler, { sessionId: sid, ...body });
    const rs = await Promise.all([pulse(an, { kind: "light", v: "g" }), pulse(binh, { kind: "light", v: "r" }), pulse(chi, { kind: "light", v: "r" }), pulse(dung, { kind: "light", v: "y" })]);
    expect(rs.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    expect(rs[0].json.key).toBe(lightKey("s2", s.step)); // vị trí đèn do máy chủ lấy từ trạng thái tiết
    // Bình đổi ý: đỏ → vàng
    expect((await pulse(binh, { kind: "light", v: "y" })).status).toBe(200);
    // Laptop GV đọc hồ sơ có mặt → tính tỉ lệ
    const parts = (await getDocs(collection(laptop.db, COL.sessions, sid, COL.participants))).docs.map((d) => ({ uid: d.id, ...(d.data() as object) }));
    const t = tallyLights(parts as never, lightKey("s2", s.step));
    expect(t).toMatchObject({ g: 1, y: 2, r: 1, total: 4, red: ["st_chi"] });
    // Bảo mật: đèn sai giá trị, HS lớp khác, HS chưa vào lớp, đọc hồ sơ của bạn
    expect((await pulse(an, { kind: "light", v: "blue" })).status).toBe(400);
    expect((await pulse(outsider, { kind: "light", v: "g" })).status).toBe(403);
    expect((await pulse(em, { kind: "light", v: "g" })).status).toBe(409);
    expect(await denied(getDoc(doc(an.db, COL.sessions, sid, COL.participants, "st_chi")))).toBe(true);
    // Phiếu ra về chỉ mở ở trang Tổng kết
    expect((await pulse(an, { kind: "exit", words: ["cell"] })).status).toBe(409);
    // GV bật hiện tổng đèn lên tivi → tivi + điện thoại nhận cờ
    s = await teacher((x) => ({ ...x, showLights: true }));
    await synced(screens, s);
    expect(tv.state!.showLights).toBe(true);
  });

  it("4. Câu trắc nghiệm: chưa mở thì chưa nhận; Chi rớt mạng lúc mở rồi vào lại vẫn kịp; bấm 2 lần chỉ tính 1; thưởng tốc độ", async () => {
    const s0 = await teacher((x) => C.goSlide(x, idx("s1"), ctx));
    await synced(screens, s0);
    expect((await answer(an, "s1", 1)).status).toBe(409); // chưa mở câu hỏi

    await chi.offline();
    const before = chi.state!.writtenAt;
    let s = await teacher((x) => C.next(x, ctx)); // hiện câu dẫn (bước 1)
    s = await teacher((x) => C.next(x, ctx)); // mở câu hỏi
    expect(s.phase).toBe("open");
    await synced([laptop, tv, an, binh, dung], s);
    await sleep(800);
    expect(chi.state!.writtenAt).toBe(before); // đang mất mạng → không nhận được

    // 3 em mạng khác nhau trả lời đúng cùng lúc; Dũng bấm 2 lần (mạng nhà, vội)
    // Bình bấm "Xem đề tiếng Việt" trước khi trả lời (vi: true) → ghi lại để chẩn đoán
    const [rd1, rd2, ra, rb] = await Promise.all([answer(dung, "s1", 1), answer(dung, "s1", 1), answer(an, "s1", 1), answer(binh, "s1", 1, { vi: true })]);
    expect([rd1.status, rd2.status].sort()).toEqual([200, 409]);
    expect(ra.status).toBe(200);
    expect(rb.status).toBe(200);
    // Máy chủ không trả đúng/sai ngay (HS chỉ biết khi GV công bố)
    expect(ra.json).toEqual({ received: true });

    // Chi có mạng lại → nhận ngay trạng thái mới nhất và vẫn trả lời được
    await chi.online(s.writtenAt);
    expect(chi.state!.phase).toBe("open");
    expect((await answer(chi, "s1", 0)).status).toBe(200);

    // Điểm: đúng 100 + thưởng tốc độ; Chi sai 0; bấm 2 lần không cộng đôi
    const [pd, pa, pb, pc] = await Promise.all(["st_dung", "st_an", "st_binh", "st_chi"].map((u) => resp(u, "s1")));
    [pd, pa, pb].forEach((r) => {
      expect(r!.correct).toBe(true);
      expect(r!.points).toBeGreaterThanOrEqual(142);
      expect(r!.points).toBeLessThanOrEqual(150);
    });
    expect(pc!.correct).toBe(false);
    expect(pc!.points).toBe(0);
    expect(await partPoints("st_dung")).toBe(pd!.points);
    expect(pb!.vi).toBe(true);
    expect(pa!.vi).toBe(false);
    // Gửi đồng thời vẫn KHÔNG trùng hạng: 3 em đúng nhận đúng 150, 146, 142
    expect([pd!, pa!, pb!].map((r) => r.points).sort((x, y) => y - x)).toEqual([150, 146, 142]);

    // Trước khi công bố: HS KHÔNG đọc được câu trả lời gốc (có đúng/sai), kể cả của mình;
    // phiếu của em chỉ có câu đã gửi, chưa có kết quả
    expect(await denied(getDoc(doc(an.db, COL.sessions, sid, COL.responses, responseId("st_an", "s1"))))).toBe(true);
    expect(await denied(getDoc(doc(an.db, COL.sessions, sid, COL.responses, responseId("st_binh", "s1"))))).toBe(true);
    expect(await denied(getDocs(collection(an.db, COL.sessions, sid, COL.responses)))).toBe(true);
    const mineBefore = (await getDoc(doc(an.db, COL.sessions, sid, COL.mine, "st_an"))).data()!;
    expect(mineBefore.answers.s1.value).toBe(1);
    expect(mineBefore.results?.s1).toBeUndefined();
    expect(await denied(getDoc(doc(an.db, COL.sessions, sid, COL.mine, "st_binh")))).toBe(true);
    expect(await denied(setDoc(doc(an.db, COL.sessions, sid, COL.mine, "st_an"), { results: { s1: { correct: true, points: 150 } } }))).toBe(true);

    // Khoá câu hỏi → Em (chưa trả lời) gửi muộn bị từ chối
    s = await teacher((x) => C.lockQ(x));
    await synced(screens, s);
    const late = await answer(em, "s1", 1);
    expect(late.status).toBe(409);
    expect(late.json.error).toMatch(/đóng/);

    // Chưa công bố thì máy chủ không chép kết quả (không lộ câu đang khoá)
    expect((await laptop.api(revealApi as Handler, {}, { params: Promise.resolve({ sessionId: sid }) })).status).toBe(409);

    // Công bố → đáp án xuống mọi điện thoại; laptop gọi máy chủ chép kết quả vào phiếu từng em (như use-controls)
    s = await teacher((x) => C.revealQ(x, ctx));
    expect((await laptop.api(revealApi as Handler, {}, { params: Promise.resolve({ sessionId: sid }) })).status).toBe(200);
    await synced(screens, s);
    phones.forEach((p) => expect(p.state!.reveal).toMatchObject({ slideId: "s1", answer: 1 }));
    const mineA = (await getDoc(doc(an.db, COL.sessions, sid, COL.mine, "st_an"))).data()!;
    expect(mineA.results.s1).toEqual({ correct: true, points: pa!.points });
    const mineC = (await getDoc(doc(chi.db, COL.sessions, sid, COL.mine, "st_chi"))).data()!;
    expect(mineC.results.s1).toEqual({ correct: false, points: 0 });
    // HS không gọi được bước công bố
    expect((await an.api(revealApi as Handler, {}, { params: Promise.resolve({ sessionId: sid }) })).status).toBe(403);
  });

  it("5. Luyện nói: giữ điểm phát âm cao nhất, chỉ nhận từ sai có trong câu mẫu", async () => {
    let s = await openQuestion("s3");
    await synced(screens, s);
    for (const score of [60, 85, 70]) {
      const r = await answer(an, "s3", undefined, { score, transcript: "the cell is the basic unit of life", wrongWords: ["cell", "hacker<script>"] });
      expect(r.status).toBe(200);
    }
    const r = await resp("st_an", "s3");
    expect(r).toMatchObject({ score: 85, points: 85, attempts: 3, skill: "Ngôn ngữ" });
    expect(r!.wrongWords).toEqual(["cell"]);
    s = await teacher((x) => C.lockQ(x));
    await synced(screens, s);
  });

  it("6. Nhập số có dấu phẩy và gõ chữ sai chính tả nhẹ (song ngữ) chấm đúng", async () => {
    let s = await openQuestion("s8");
    await synced(phones, s);
    await Promise.all([answer(an, "s8", "400,0"), answer(binh, "s8", "50")]);
    expect((await resp("st_an", "s8"))!.correct).toBe(true);
    expect((await resp("st_binh", "s8"))!.correct).toBe(false);
    await teacher((x) => C.lockQ(x));

    s = await openQuestion("s9");
    await synced(phones, s);
    await Promise.all([answer(an, "s9", "a cel wall"), answer(dung, "s9", "nucleus")]);
    expect((await resp("st_an", "s9"))!.correct).toBe(true);
    expect((await resp("st_dung", "s9"))!.correct).toBe(false);
    s = await teacher((x) => C.lockQ(x));
    await synced(screens, s);
  });

  it("7. Giơ tay, rời trang; HS không sửa được điểm, trạng thái tiết hay câu trả lời", async () => {
    // Bình (3G) giơ tay → GV thấy → GV hạ tay
    await sleep(binh.lag());
    await updateDoc(doc(binh.db, COL.sessions, sid, COL.participants, "st_binh"), { raisedHandAt: Date.now() });
    const hand = await getDoc(doc(laptop.db, COL.sessions, sid, COL.participants, "st_binh"));
    expect(hand.get("raisedHandAt")).toBeTruthy();
    await updateDoc(doc(laptop.db, COL.sessions, sid, COL.participants, "st_binh"), { raisedHandAt: null });
    expect((await getDoc(doc(binh.db, COL.sessions, sid, COL.participants, "st_binh"))).get("raisedHandAt")).toBeNull();

    // Chi rời trang (chuyển ứng dụng) → GV thấy số lần rời trang
    await updateDoc(doc(chi.db, COL.sessions, sid, COL.participants, "st_chi"), { visible: false, leftCount: increment(1), lastSeenAt: serverTimestamp() });
    expect((await getDoc(doc(laptop.db, COL.sessions, sid, COL.participants, "st_chi"))).get("leftCount")).toBe(1);

    // Chống gian lận
    expect(await denied(updateDoc(doc(an.db, COL.sessions, sid, COL.participants, "st_an"), { points: 99999 }))).toBe(true);
    expect(await denied(updateDoc(doc(an.db, COL.sessions, sid), { state: { ...an.state!, phase: "open" } }))).toBe(true);
    expect(await denied(setDoc(doc(an.db, COL.sessions, sid, COL.responses, responseId("st_an", "s10")), { uid: "st_an", correct: true, points: 150 }))).toBe(true);
    expect(await denied(updateDoc(doc(an.db, COL.sessions, sid, COL.participants, "st_binh"), { raisedHandAt: Date.now() }))).toBe(true);
    // GV không sửa được điểm của HS
    expect(await denied(updateDoc(doc(laptop.db, COL.sessions, sid, COL.participants, "st_an"), { points: 0 }))).toBe(true);
    // Số lần rời trang chỉ được TĂNG: không tự xoá về 0, không vào lớp với số khác 0
    expect(await denied(updateDoc(doc(chi.db, COL.sessions, sid, COL.participants, "st_chi"), { leftCount: 0 }))).toBe(true);
    expect((await getDoc(doc(laptop.db, COL.sessions, sid, COL.participants, "st_chi"))).get("leftCount")).toBe(1);
    expect(await denied(setDoc(doc(em.db, COL.sessions, sid, COL.participants, em.uid), { joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp(), visible: true, leftCount: -5, raisedHandAt: null }))).toBe(true);
    // Quay lại trang (hiện lại) vẫn ghi được bình thường
    await updateDoc(doc(chi.db, COL.sessions, sid, COL.participants, "st_chi"), { visible: true, lastSeenAt: serverTimestamp() });
  });

  it("7b. Tiết của trang Toán cũ (không có cờ hideUntilReveal) vẫn chạy như trước: HS đọc được câu trả lời của mình", async () => {
    const db = adminDb();
    await db.doc(`${COL.sessions}/old-math`).set({ classId: "c1", lessonId: "toan7-tam-giac-can", status: "live", slideIds: ["s1"], state: { slideIndex: 0 } });
    await db.doc(`${COL.sessions}/old-math/${COL.responses}/${responseId("st_an", "s1")}`).set({ uid: "st_an", slideId: "s1", correct: true, points: 150 });
    const r = await getDoc(doc(an.db, COL.sessions, "old-math", COL.responses, responseId("st_an", "s1")));
    expect(r.get("correct")).toBe(true);
  });

  it("8. Tivi (máy thứ hai của GV) luôn khớp laptop; đo độ trễ đồng bộ theo từng mạng", async () => {
    expect(tv.state).toEqual(laptop.state);
    const rows: string[] = [];
    let worst = 0;
    for (const d of [tv, ...phones]) {
      // Bỏ các bản GV ghi lúc máy này đang mất mạng (đo riêng thời gian bắt kịp)
      const lags = [...laptop.arrivals.entries()].filter(([w, t]) => d.arrivals.has(w) && !d.wasOffline(t)).map(([w, t]) => Math.max(0, d.arrivals.get(w)! - t));
      const avg = Math.round(lags.reduce((a, b) => a + b, 0) / Math.max(1, lags.length));
      const max = Math.max(0, ...lags);
      const catchUp = d.catchUpMs.length ? ` · có mạng lại → bắt kịp sau ${d.catchUpMs.join(", ")} ms` : "";
      rows.push(`${d.name.padEnd(10)} ${d.net.label.padEnd(26)} TB ${String(avg).padStart(5)} ms · chậm nhất ${String(max).padStart(5)} ms · đo ${lags.length} lần${catchUp}`);
      worst = Math.max(worst, max);
      d.catchUpMs.forEach((c) => expect(c).toBeLessThan(5000));
    }
    console.log("\nĐộ trễ từ lúc laptop GV thấy thao tác → máy khác thấy:\n" + rows.map((r) => "  " + r).join("\n"));
    expect(worst).toBeLessThan(5000); // kể cả 3G yếu, chậm nhất dưới 5 giây
  });

  it("8b. Đợt A — Phiếu ra về 3-2-1 ở trang Tổng kết; chẩn đoán từng em và từng câu", async () => {
    const s = await teacher((x) => C.goSlide(x, idx("s11"), ctx));
    await synced(phones, s);
    const pulse = (d: Device, body: object) => d.api(pulseApi as Handler, { sessionId: sid, kind: "exit", ...body });
    const [ra, rb, rc] = await Promise.all([
      pulse(an, { words: ["cell", "Nucleus", "hacker", "chloroplast", "cell wall"], ideas: ["The cell is the basic unit of life.", "Tế bào có nhiều hình dạng."], question: "Why do plant cells have a cell wall?" }),
      pulse(binh, { words: ["cell"], ideas: [], question: "" }),
      pulse(chi, {}),
    ]);
    expect(ra.status).toBe(200);
    expect(ra.json.exit).toMatchObject({ words: ["cell", "nucleus", "chloroplast"], question: "Why do plant cells have a cell wall?" });
    expect(rb.status).toBe(200);
    expect(rc.status).toBe(400); // phiếu trống
    const parts = (await getDocs(collection(laptop.db, COL.sessions, sid, COL.participants))).docs.map((d) => ({ uid: d.id, ...(d.data() as object) }));
    const ex = summarizeExits(parts as never);
    expect(ex.count).toBe(2);
    expect(ex.words[0]).toEqual({ word: "cell", n: 2 });
    expect(ex.questions).toEqual([{ uid: "st_an", text: "Why do plant cells have a cell wall?" }]);
    // HS không đọc được phiếu của bạn
    expect(await denied(getDoc(doc(binh.db, COL.sessions, sid, COL.participants, "st_an")))).toBe(true);

    // Chẩn đoán: An đúng hết → ổn; câu s1 có 4 em, 1 sai → lớp nắm được
    const all = (await adminDb().collection(`${COL.sessions}/${sid}/${COL.responses}`).get()).docs.map((d) => d.data() as ResponseDoc);
    expect(diagnoseStudent(all.filter((x) => x.uid === "st_an")).barrier).toBe("ok");
    expect(diagnoseQuestion(all.filter((x) => x.slideId === "s1")).verdict).toBe("ok");
  });

  it("8c. Đợt B — thanh thời gian, ghép cặp, trợ lý gợi ý đồng bộ tới mọi máy", async () => {
    // Mốc các chặng đã ghi theo thứ tự GV dạy: Mở đầu → Hình thành KT → Luyện tập → Tổng kết
    const a = laptop.state!.actStarts!;
    expect(a[1]).toBeLessThan(a[2]!);
    expect(a[2]).toBeLessThan(a[3]!);
    expect(a[3]).toBeLessThanOrEqual(a[5]!);
    expect(tv.state!.actStarts).toEqual(a);
    const tl = timelineView(planMinutes(45), a, 5, Date.now());
    expect(tl.find((x) => x.id === 5)!.status).toBe("current");
    expect(tl.filter((x) => x.status === "done").map((x) => x.id)).toEqual([1, 2, 3]);

    // Ghép cặp từ dữ liệu thật của tiết (Ngôn ngữ / Toán), kèm tên ngắn cho điện thoại
    const all = (await adminDb().collection(`${COL.sessions}/${sid}/${COL.responses}`).get()).docs.map((d) => d.data() as ResponseDoc);
    const inputs = phones.map((p) => {
      const mine = all.filter((r) => r.uid === p.uid && r.qtype !== "speak");
      const rate = (lang: boolean) => {
        const xs = mine.filter((r) => (r.skill === "Ngôn ngữ") === lang);
        return xs.length >= 2 ? xs.filter((r) => r.correct).length / xs.length : null;
      };
      return { uid: p.uid, lang: rate(true), sci: rate(false) };
    });
    const pairs = makePairs(inputs, () => 0.3);
    const pairNames = Object.fromEntries(phones.map((p) => [p.uid, p.name.replace("dt-", "")]));
    let s = await teacher((x) => ({ ...x, pairs, pairNames, showPairs: true }));
    await synced(screens, s);
    for (const p of phones) {
      const mates = partnersOf(p.state!.pairs, p.uid);
      expect(mates.length).toBeGreaterThan(0);
      expect(mates.every((u) => p.state!.pairNames?.[u])).toBe(true);
    }
    // Điện thoại chỉ thấy tên bạn cùng cặp, KHÔNG đọc được điểm / thống kê của bạn
    expect(JSON.stringify(an.state!.pairs)).not.toMatch(/lang|sci|points/);
    expect(await denied(getDoc(doc(an.db, COL.stats, `c1_st_binh`)))).toBe(true);
    // GV đổi chỗ hai em → mọi máy nhận cặp mới
    s = await teacher((x) => ({ ...x, pairs: swapInPairs(x.pairs!, pairs[0].a, pairs[1].a) }));
    await synced(phones, s);
    expect(partnersOf(binh.state!.pairs, "st_binh")).toEqual(partnersOf(s.pairs, "st_binh"));

    // Trợ lý gợi ý chạy trên đúng dữ liệu laptop đang thấy (đang ở trang Tổng kết, không có cảnh báo câu hỏi)
    const parts = (await getDocs(collection(laptop.db, COL.sessions, sid, COL.participants))).docs.map((d) => ({ uid: d.id, ...(d.data() as object) }));
    const tips = suggest({ state: laptop.state!, slides: SLIDES, responses: all, participants: parts as never, name: (u) => u, left: null, now: Date.now(), timeline: tl });
    expect(tips.length).toBeLessThanOrEqual(5);
    expect(tips.some((t) => t.id.startsWith("lock:") || t.id.startsWith("time:"))).toBe(false);
  });

  it("8d. Đợt C — GV đặt mức E1/E2/E3; HS thấy mức của mình; E2/E3 đúng mà không xem tiếng Việt được +10", async () => {
    const lv = (d: Device, levels: object) => d.api(levelsApi as Handler, { levels }, { params: Promise.resolve({ classId: "c1" }) });
    expect((await lv(an, { st_an: "e3" })).status).toBe(403); // HS không tự đặt mức
    expect((await lv(laptop, { st_dung: "x9" })).status).toBe(400);
    const r = await lv(laptop, { st_dung: "e3", st_binh: "e1", st_khong_co: "e2" });
    expect(r.json).toMatchObject({ updated: 2 });
    // Điện thoại đọc được mức của chính em (để hiển thị theo mức)
    expect((await getDoc(doc(dung.db, COL.classes, "c1", COL.students, "st_dung"))).get("eLevel")).toBe("e3");

    // Câu s10 (An không làm để giữ số liệu test 9): Dũng E3 đúng, không xem tiếng Việt → 150 + 10; Bình E1 đúng nhưng xem tiếng Việt → không thưởng
    let s = await openQuestion("s10");
    await synced(phones, s);
    const ans = (KEYS.s10 as { answer: number }).answer;
    expect((await answer(dung, "s10", ans)).status).toBe(200);
    expect((await answer(binh, "s10", ans, { vi: true })).status).toBe(200);
    expect((await resp("st_dung", "s10"))!.points).toBe(160);
    expect((await resp("st_binh", "s10"))!.points).toBe(146);
    s = await teacher((x) => C.lockQ(x));
    await synced(screens, s);
  });

  it("9. Kết thúc tiết: tóm tắt điểm, tách Toán / Ngôn ngữ; sau đó không trả lời, không vào lớp được nữa", async () => {
    const r = await laptop.api(endApi as Handler, {}, { params: Promise.resolve({ sessionId: sid }) });
    expect(r.status).toBe(200);
    await Promise.all(phones.map((p) => waitFor(() => p.status === "ended", 10_000, `${p.name} thấy tiết kết thúc`)));

    const sess = (await adminDb().doc(`${COL.sessions}/${sid}`).get()).data() as SessionDoc;
    const all = (await adminDb().collection(`${COL.sessions}/${sid}/${COL.responses}`).get()).docs.map((d) => d.data() as ResponseDoc);
    for (const p of phones) {
      const mine = all.filter((x) => x.uid === p.uid);
      expect(sess.results?.[p.uid]?.points).toBe(mine.reduce((a, x) => a + (x.points ?? 0), 0));
    }
    // An: s8 (Toán) đúng; s1, s9 (Ngôn ngữ) đúng; s3 luyện nói 85
    expect(sess.results!.st_an).toMatchObject({ mathA: 1, mathC: 1, langA: 2, langC: 2, pronN: 1, pronSum: 85 });
    expect(sess.results!.st_chi.leftCount).toBeGreaterThanOrEqual(0);

    const late = await answer(an, "s10", 1);
    expect(late.status).toBe(409);
    expect(late.json.error).toMatch(/kết thúc/);
    // Hết tiết: HS xem lại được câu trả lời của mình (trang Xem lại), và phiếu có kết quả mọi câu (kể cả câu GV chưa bấm công bố)
    expect((await getDoc(doc(an.db, COL.sessions, sid, COL.responses, responseId("st_an", "s8")))).get("correct")).toBe(true);
    const mineEnd = (await getDoc(doc(an.db, COL.sessions, sid, COL.mine, "st_an"))).data()!;
    expect(Object.keys(mineEnd.results).sort()).toEqual(["s1", "s8", "s9"]);
    expect(mineEnd.speak.s3).toMatchObject({ score: 85, attempts: 3 });
    expect(await denied(setDoc(doc(em.db, COL.sessions, sid, COL.participants, em.uid), { joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp(), visible: true, leftCount: 0, raisedHandAt: null }))).toBe(true);
    expect(await denied(updateDoc(doc(laptop.db, COL.sessions, sid), { state: { ...laptop.state!, slideIndex: 0 } }))).toBe(true);

    // Đợt D — tỉ lệ tiếng Anh thực tế: tivi đã chạy cả Anh lẫn Song ngữ (test 3 đổi ngôn ngữ); có câu xem tiếng Việt
    const en = sess.english!;
    expect(en.totalMs).toBeGreaterThan(0);
    expect(en.ms.en + en.ms.bi + en.ms.vi).toBe(en.totalMs);
    expect(en.enPct).toBeGreaterThanOrEqual(0);
    expect(en.enPct).toBeLessThanOrEqual(100);
    expect(en.noViPct).not.toBeNull();
    expect(en.noViPct!).toBeLessThan(100); // Bình xem tiếng Việt ở s1, s10
    findings.push(`Tỉ lệ tiếng Anh đo được: ${en.enPct}% (Anh ${en.ms.en} ms · Song ngữ ${en.ms.bi} ms · Việt ${en.ms.vi} ms), ${en.noViPct}% câu không xem tiếng Việt`);
  });

  it("10. Đợt D — giao bài về nhà từ câu sai: máy chủ tự tính từng em, không lộ đáp án, mỗi tiết một lần", async () => {
    const ctxR = { params: Promise.resolve({ sessionId: sid }) };
    const dueAt = Date.now() + 2 * 86_400_000;
    expect((await an.api(remedialApi as Handler, { mode: "each", dueAt }, ctxR)).status).toBe(403); // HS không gọi được
    expect((await otherTeacher.api(remedialApi as Handler, { mode: "each", dueAt }, ctxR)).status).toBe(403); // GV lớp khác
    expect((await laptop.api(remedialApi as Handler, { mode: "x", dueAt }, ctxR)).status).toBe(400);
    expect((await laptop.api(remedialApi as Handler, { mode: "each", dueAt: Date.now() }, ctxR)).status).toBe(400); // hạn quá sớm

    // Kỳ vọng tính từ câu trả lời thật trong emulator
    const all = (await adminDb().collection(`${COL.sessions}/${sid}/${COL.responses}`).get()).docs.map((d) => d.data() as ResponseDoc);
    const joined = (await adminDb().collection(`${COL.sessions}/${sid}/${COL.participants}`).get()).docs.map((d) => d.id);
    const qIds = SLIDES.filter((s) => s.question && isHomeworkSlide(s)).map((s) => s.id);
    const groups = eachRemedial(all, joined, qIds);
    expect(groups.length).toBeGreaterThan(0);
    // An đúng s1, s8, s9 nhưng không làm s10 (test 8d) → bài của An chỉ có s10
    expect(groups.find((g) => g.uids.includes("st_an"))?.slideIds).toEqual(["s10"]);

    const r = await laptop.api(remedialApi as Handler, { mode: "each", dueAt }, ctxR);
    expect(r.status).toBe(201);
    expect(r.json.assignments).toBe(groups.length);
    const ids = r.json.ids as string[];
    const docs = await Promise.all(ids.map(async (id) => (await adminDb().doc(`${COL.assignments}/${id}`).get()).data() as AssignmentDoc & { fromSessionId: string }));
    for (const g of groups) {
      const a = docs.find((d) => d.toUids.join() === g.uids.join())!;
      expect(a).toBeTruthy();
      expect(a.items.map((i) => i.slideId)).toEqual(g.slideIds);
      expect(a.fromSessionId).toBe(sid);
      // Bài về nhà không chứa đáp án (đáp án nằm ở teacherKeys, máy chủ chấm)
      for (const item of a.items) expect(JSON.stringify(item)).not.toContain(JSON.stringify(KEYS[item.slideId]));
    }
    // Em nhận được bài đọc được bài của mình (rules), và có thông báo trong hộp tin
    const mineA = docs.find((d) => d.toUids.includes("st_binh"));
    if (mineA) {
      const id = ids[docs.indexOf(mineA)];
      expect((await getDoc(doc(binh.db, COL.assignments, id))).exists()).toBe(true);
    }
    expect(((await adminDb().doc(`${COL.sessions}/${sid}`).get()).get("remedialIds") as string[]).sort()).toEqual([...ids].sort());
    // Bấm lần hai → chặn (không giao trùng)
    expect((await laptop.api(remedialApi as Handler, { mode: "class", dueAt }, ctxR)).status).toBe(409);
  });
});
