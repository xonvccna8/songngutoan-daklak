// Chạy trọn các luồng API của 4 chức năng mới trên Firestore Emulator (máy chủ thật, dữ liệu giả):
//   npx firebase-tools emulators:exec --only firestore --project demo-lsn "npx vitest run tests/features.emulator.test.ts"
// Chỉ giả lập: đăng nhập (requireAuth đọc uid từ header) và lời gọi OpenAI (aiJson). Mọi thứ khác chạy thật.
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AuthedUser } from "@/lib/server/api";

const USERS = vi.hoisted(
  () =>
    ({
      tA: { uid: "tA", role: "teacher", schoolId: "s1", classIds: [], emailVerified: true, name: "Cô Hà" },
      tB: { uid: "tB", role: "teacher", schoolId: "s1", classIds: [], emailVerified: true, name: "Thầy Bình" },
      ad: { uid: "ad", role: "admin", schoolId: "s1", classIds: [], emailVerified: true, name: "Quản trị" },
      st_1: { uid: "st_1", role: "student", schoolId: "s1", classIds: ["fc1"], emailVerified: false },
      st_2: { uid: "st_2", role: "student", schoolId: "s1", classIds: ["fc1"], emailVerified: false },
      st_9: { uid: "st_9", role: "student", schoolId: "s1", classIds: ["fc2"], emailVerified: false },
    }) as Record<string, AuthedUser>
);

vi.mock("@/lib/server/api", async (orig) => {
  const a = await orig<typeof import("@/lib/server/api")>();
  return {
    ...a,
    requireAuth: async (req: Request, roles?: string[]) => {
      const u = USERS[(req.headers.get("authorization") ?? "").replace("Bearer ", "")];
      if (!u) throw new a.HttpError(401, "Bạn cần đăng nhập.");
      if (roles && !roles.includes(u.role!)) throw new a.HttpError(403, "Bạn không có quyền làm việc này.");
      return u;
    },
  };
});
vi.mock("@/lib/server/ai", async (orig) => ({ ...(await orig<typeof import("@/lib/server/ai")>()), aiJson: vi.fn() }));

import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { aiJson } from "@/lib/server/ai";
import { HttpError } from "@/lib/server/api";
import { vnDayKey } from "@/lib/live/summary";
import * as qRoute from "@/app/api/questions/route";
import * as qIdRoute from "@/app/api/questions/[id]/route";
import * as qAiRoute from "@/app/api/questions/ai/route";
import * as qAssignRoute from "@/app/api/questions/assign/route";
import * as hwAnswer from "@/app/api/hw/answer/route";
import * as hwSolution from "@/app/api/hw/solution/route";
import * as stemRoute from "@/app/api/stem/route";
import * as stemIdRoute from "@/app/api/stem/[id]/route";
import * as stemTeam from "@/app/api/stem/[id]/team/route";
import * as stemScore from "@/app/api/stem/[id]/score/route";
import * as postRoute from "@/app/api/community/route";
import * as postIdRoute from "@/app/api/community/[id]/route";
import * as replyRoute from "@/app/api/community/[id]/reply/route";
import * as resRoute from "@/app/api/resources/route";

const on = !!process.env.FIRESTORE_EMULATOR_HOST;
const db = () => adminDb();
const DAY = 86_400_000;

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;
/** Gọi một API route như trình duyệt gọi */
async function call(h: unknown, uid: string, body?: unknown, params: Record<string, string> = {}, method = "POST") {
  const req = new Request("http://localhost/api", { method, headers: { authorization: `Bearer ${uid}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const res = await (h as Handler)(req, { params: Promise.resolve(params) });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> & { error?: string } };
}
const get = async (path: string) => (await db().doc(path).get()).data() ?? null;
const xpOf = async (uid: string, classId = "fc1") => ((await get(`${COL.stats}/${classId}_${uid}`))?.xp as number | undefined) ?? 0;

const MCQ = {
  type: "mcq",
  level: "know",
  skill: "Toán",
  grade: 8,
  curLessonId: "n8-33",
  outcomeIds: ["n8-33-1"],
  prompt: { en: "What is the basic unit of life?", vi: "Đơn vị cơ bản của sự sống là gì?" },
  options: [
    { en: "cell", vi: "tế bào" },
    { en: "atom", vi: "nguyên tử" },
    { en: "organ", vi: "cơ quan" },
    { en: "tissue", vi: "mô" },
  ],
  answer: 0,
  explain: { en: "The cell is the basic unit of life.", vi: "Tế bào là đơn vị cơ bản của sự sống." },
};

describe.skipIf(!on)("4 chức năng mới trên Emulator", () => {
  beforeAll(async () => {
    for (const c of [COL.questions, COL.projects, COL.posts, COL.assignments, COL.messages, COL.events, COL.stats, COL.aiUsage, COL.resources, COL.weekly, COL.private]) await db().recursiveDelete(db().collection(c));
    const b = db().batch();
    b.set(db().doc(`${COL.classes}/fc1`), { name: "6A", grade: 8, schoolId: "s1", teacherIds: ["tA"], joinCode: "QWERTY", settings: { teams: 2 }, studentCount: 2 });
    b.set(db().doc(`${COL.classes}/fc2`), { name: "6B", grade: 8, schoolId: "s1", teacherIds: ["tB"], joinCode: "ASDFGH", settings: { teams: 2 }, studentCount: 1 });
    b.set(db().doc(`${COL.classes}/fc1/students/st_1`), { fullName: "Nguyễn Văn An", number: 1, team: 1 });
    b.set(db().doc(`${COL.classes}/fc1/students/st_2`), { fullName: "Trần Thị Bình", number: 2, team: 2 });
    b.set(db().doc(`${COL.classes}/fc2/students/st_9`), { fullName: "Lê Chín", number: 1, team: 1 });
    await b.commit();
  });

  // ======================= NGÂN HÀNG CÂU HỎI + BÀI TẬP AI =======================
  describe("ngân hàng câu hỏi + bài tập AI + giao bài + HS làm bài", () => {
    const ids: Record<string, string> = {};

    it("HS không thêm được câu; dữ liệu sai báo lỗi tiếng Việt", async () => {
      expect((await call(qRoute.POST, "st_1", MCQ)).status).toBe(403);
      const bad = await call(qRoute.POST, "tA", { ...MCQ, options: [] });
      expect(bad.status).toBe(400);
      expect(bad.json.error).toMatch(/phương án/);
    });

    it("GV thêm câu → Chờ duyệt; trang câu hỏi KHÔNG chứa đáp án", async () => {
      const r = await call(qRoute.POST, "tA", MCQ);
      expect(r.status).toBe(201);
      ids.mcq = r.json.id as string;
      const d = (await get(`${COL.questions}/${ids.mcq}`))!;
      expect(d).toMatchObject({ status: "pending", aiDraft: false, createdBy: "tA", createdByName: "Cô Hà", curLessonId: "n8-33", outcomeIds: ["n8-33-1"] });
      expect(d.key.answer).toBe(0);
      expect(JSON.stringify(d.slide)).not.toMatch(/"answer"|"accept"/);

      ids.num = (await call(qRoute.POST, "tA", { ...MCQ, type: "number", answer: 2.5, unit: "g", options: [] })).json.id as string;
      ids.text = (await call(qRoute.POST, "tA", { ...MCQ, type: "text", accept: ["chloroplast", "chloroplasts"], options: [] })).json.id as string;
      ids.tf = (await call(qRoute.POST, "tA", { ...MCQ, type: "tf", answer: 1, options: [] })).json.id as string;
      expect(Object.values(ids).every(Boolean)).toBe(true);
    });

    it("GV khác không sửa / xoá được; quản trị duyệt; đã duyệt thì GV không sửa nữa", async () => {
      expect((await call(qIdRoute.PUT, "tB", MCQ, { id: ids.mcq }, "PUT")).status).toBe(403);
      expect((await call(qIdRoute.DELETE, "tB", undefined, { id: ids.mcq }, "DELETE")).status).toBe(403);
      expect((await call(qIdRoute.PUT, "tA", { status: "approved" }, { id: ids.mcq }, "PUT")).status).toBe(403);
      expect((await call(qIdRoute.PUT, "ad", { status: "approved" }, { id: ids.mcq }, "PUT")).status).toBe(200);
      expect((await get(`${COL.questions}/${ids.mcq}`))!.status).toBe("approved");
      expect((await call(qIdRoute.PUT, "tA", MCQ, { id: ids.mcq }, "PUT")).status).toBe(403);
    });

    it("Bài tập AI: lưu câu hợp lệ ở dạng Nháp AI, bỏ câu lỗi, trừ 1 lượt AI", async () => {
      const q = { type: "mcq", level: "understand", skill: "Toán", outcome_index: 1, prompt: { en: "Which part controls the cell?", vi: "Bộ phận nào điều khiển tế bào?" }, options: MCQ.options, answer_index: 0, answer_number: null, unit: "", accept: [], speak_target: "", method: { en: "", vi: "" }, explain: { en: "", vi: "" } };
      vi.mocked(aiJson).mockResolvedValueOnce({ data: { questions: [q, { ...q, options: [] }, { ...q, type: "tf", options: [], answer_index: 1 }] }, usage: { input: 1000, output: 500 } });
      const r = await call(qAiRoute.POST, "tA", { curLessonId: "n8-33", count: 6 });
      expect(r.status).toBe(201);
      expect(r.json.created).toBe(2);
      const drafts = (await db().collection(COL.questions).where("aiDraft", "==", true).get()).docs;
      expect(drafts).toHaveLength(2);
      drafts.forEach((d) => expect(d.data()).toMatchObject({ status: "draft", createdBy: "tA", grade: 8, curLessonId: "n8-33" }));
      ids.ai = drafts[0].id;
      const usage = (await get(`${COL.aiUsage}/tA_${vnDayKey(Date.now())}`))!;
      expect(usage).toMatchObject({ count: 1, inputTokens: 1000, outputTokens: 500 });
      // Lời nhắc gửi AI có tên bài + YCCĐ, không có dữ liệu học sinh
      const prompt = vi.mocked(aiJson).mock.calls[0][0].user;
      expect(prompt).toMatch(/Máu và hệ tuần hoàn/);
      expect(prompt).not.toMatch(/Nguyễn|An|st_1/);
    });

    it("Bài tập AI: AI lỗi → báo lỗi và TRẢ LẠI lượt; chưa chọn bài → 400", async () => {
      vi.mocked(aiJson).mockRejectedValueOnce(new HttpError(502, "Dịch vụ AI báo lỗi, thử lại sau."));
      const r = await call(qAiRoute.POST, "tA", { curLessonId: "n8-33", count: 5 });
      expect(r.status).toBe(502);
      expect((await get(`${COL.aiUsage}/tA_${vnDayKey(Date.now())}`))!.count).toBe(1);
      expect((await call(qAiRoute.POST, "tA", { curLessonId: "xx" })).status).toBe(400);
    });

    it("Không giao được câu Nháp AI / câu chưa duyệt của GV khác / lớp không dạy", async () => {
      const due = Date.now() + 2 * DAY;
      const r1 = await call(qAssignRoute.POST, "tA", { classId: "fc1", questionIds: [ids.mcq, ids.ai], dueAt: due, to: { all: true } });
      expect(r1.status).toBe(400);
      expect(r1.json.error).toMatch(/Nháp AI/);
      const r2 = await call(qAssignRoute.POST, "tB", { classId: "fc2", questionIds: [ids.num], dueAt: due, to: { all: true } });
      expect(r2.status).toBe(400);
      expect((await call(qAssignRoute.POST, "tB", { classId: "fc1", questionIds: [ids.mcq], dueAt: due, to: { all: true } })).status).toBe(403);
      expect((await call(qAssignRoute.POST, "tA", { classId: "fc1", questionIds: [ids.mcq], dueAt: Date.now(), to: { all: true } })).status).toBe(400);
    });

    it("GV kiểm tra + Lưu câu Nháp AI → hết dấu Nháp AI", async () => {
      const d = (await get(`${COL.questions}/${ids.ai}`))!;
      const r = await call(qIdRoute.PUT, "tA", { ...d, prompt: { ...d.prompt, en: d.prompt.en + " (checked)" } }, { id: ids.ai }, "PUT");
      expect(r.status).toBe(200);
      expect((await get(`${COL.questions}/${ids.ai}`))!).toMatchObject({ aiDraft: false, status: "pending" });
    });

    let aid = "";
    it("Giao 5 câu từ ngân hàng cho cả lớp → bài về nhà + thông báo, không lộ đáp án", async () => {
      const r = await call(qAssignRoute.POST, "tA", { classId: "fc1", questionIds: [ids.mcq, ids.num, ids.text, ids.tf, ids.ai], title: { vi: "Ôn Bài 18", en: "Lesson 18 review" }, dueAt: Date.now() + 2 * DAY, to: { all: true } });
      expect(r.status).toBe(201);
      expect(r.json).toMatchObject({ recipients: 2, items: 5 });
      aid = r.json.id as string;
      const a = (await get(`${COL.assignments}/${aid}`))!;
      expect(a).toMatchObject({ lessonId: "bank", source: "bank", classId: "fc1", toUids: ["st_1", "st_2"], title: { vi: "Ôn Bài 18" } });
      expect(a.items).toHaveLength(5);
      expect(JSON.stringify(a.items)).not.toMatch(/"answer"|"accept"/);
      expect(a.items[0].method.vi).toBeTruthy(); // gợi ý tầng 2 mặc định
      const msgs = (await db().collection(COL.messages).where("assignmentId", "==", aid).get()).docs;
      expect(msgs).toHaveLength(1);
    });

    it("HS làm bài: máy chấm đúng/sai từng dạng, lời giải, XP, nộp xong", async () => {
      const ans = (slideId: string, value: unknown, uid = "st_1") => call(hwAnswer.POST, uid, { aid, slideId, value });
      // Xem lời giải trước câu nhập số → đúng chỉ còn 30 điểm
      const sol = await call(hwSolution.POST, "st_1", { aid, slideId: ids.num });
      expect(sol.status).toBe(200);
      expect(sol.json.show).toBe("2.5g");
      const n = await ans(ids.num, "2,5");
      expect(n.json.answer).toMatchObject({ correct: true, points: 30, usedSolution: true });

      const m = await ans(ids.mcq, 0);
      expect(m.status).toBe(200);
      expect(m.json.answer).toMatchObject({ correct: true, points: 100, answer: 0, explain: { vi: MCQ.explain.vi } });
      expect(m.json.xp).toBeGreaterThan(0);
      expect((await ans(ids.mcq, 1)).status).toBe(409); // chỉ nhận lần đầu

      expect((await ans(ids.text, "cloroplast")).json.answer).toMatchObject({ correct: true }); // sai chính tả nhẹ
      expect((await ans(ids.tf, 0)).json.answer).toMatchObject({ correct: false });
      // Câu AI (trắc nghiệm hoặc đúng/sai) — trả lời đúng theo đáp án đã lưu
      const last = await ans(ids.ai, (await get(`${COL.questions}/${ids.ai}`))!.key.answer);
      expect(last.json.answer).toMatchObject({ correct: true });
      expect(last.json).toMatchObject({ completed: true, late: false });

      const sub = (await get(`${COL.assignments}/${aid}/submissions/st_1`))!;
      expect(sub).toMatchObject({ answered: 5, total: 5, correct: 4 });
      expect(await xpOf("st_1")).toBeGreaterThan(0);
      const stat = (await get(`${COL.stats}/fc1_st_1`))!;
      expect(stat.hwDone).toBe(1);
      expect(stat.mastery?.["n8-33-1"]?.a).toBeGreaterThan(0); // Sao thành thạo theo YCCĐ
    });

    it("HS lớp khác không làm được; câu bị xoá → báo lỗi dễ hiểu", async () => {
      expect((await call(hwAnswer.POST, "st_9", { aid, slideId: ids.mcq, value: 0 })).status).toBe(403);
      expect((await call(qIdRoute.DELETE, "tA", undefined, { id: ids.text }, "DELETE")).status).toBe(200);
      const r = await call(hwAnswer.POST, "st_2", { aid, slideId: ids.text, value: "chloroplast" });
      expect(r.status).toBe(409);
      expect(r.json.error).toMatch(/sửa/);
    });
  });

  // ======================= THÍ NGHIỆM ẢO (học liệu loại mới) =======================
  describe("học liệu thí nghiệm ảo / mô hình 3D", () => {
    it("nhận link PhET và Sketchfab, từ chối link sai loại", async () => {
      const base = { title: { vi: "Chọn lọc tự nhiên", en: "Natural selection" }, grade: 8, curLessonId: null, note: "" };
      const ok1 = await call(resRoute.POST, "tA", { ...base, kind: "simulation", url: "https://phet.colorado.edu/en/simulations/natural-selection" });
      expect(ok1.status).toBe(201);
      expect((await get(`${COL.resources}/${ok1.json.id}`))!).toMatchObject({ kind: "simulation", status: "pending" });
      expect((await call(resRoute.POST, "tA", { ...base, kind: "model3d", url: `https://sketchfab.com/3d-models/animal-cell-${"0123456789abcdef".repeat(2)}` })).status).toBe(201);
      expect((await call(resRoute.POST, "tA", { ...base, kind: "model3d", url: "https://youtube.com/watch?v=abcdefgh" })).status).toBe(400);
      expect((await call(resRoute.POST, "tA", { ...base, kind: "simulation", url: "https://evil.example/sims/html/x/" })).status).toBe(400);
    });
  });

  // ======================= DỰ ÁN STEM =======================
  describe("dự án STEM", () => {
    let pid = "";
    const team = (body: object, uid = "st_1") => call(stemTeam.POST, uid, body, { id: pid });

    it("GV tạo dự án cho lớp mình → lớp nhận thông báo; GV khác không tạo được", async () => {
      const body = { classId: "fc1", title: { vi: "Mô hình tế bào 3D", en: "3D cell model" }, grade: 8, dueAt: Date.now() + 14 * DAY, vocab: [{ en: "nucleus", vi: "nhân" }] };
      expect((await call(stemRoute.POST, "tB", body)).status).toBe(403);
      expect((await call(stemRoute.POST, "tA", { ...body, dueAt: Date.now() })).status).toBe(400);
      const r = await call(stemRoute.POST, "tA", body);
      expect(r.status).toBe(201);
      pid = r.json.id as string;
      expect((await get(`${COL.projects}/${pid}`))!).toMatchObject({ classId: "fc1", teams: 2, status: "open", teacherName: "Cô Hà" });
      const msgs = (await db().collection(COL.messages).where("classId", "==", "fc1").get()).docs.filter((d) => String(d.get("text.vi")).startsWith("Dự án STEM"));
      expect(msgs).toHaveLength(1);
    });

    it("HS ghi vào ĐÚNG tổ của mình (máy chủ tự xác định tổ)", async () => {
      expect((await team({ stage: "ask", done: true, note: "Problem: show cell parts" })).status).toBe(200);
      expect((await team({ stage: "ask", done: true, note: "Tổ 2 làm" }, "st_2")).status).toBe(200);
      const t1 = (await get(`${COL.projects}/${pid}/teams/1`))!;
      const t2 = (await get(`${COL.projects}/${pid}/teams/2`))!;
      expect(t1.stages.ask).toMatchObject({ done: true, note: "Problem: show cell parts" });
      expect(t1.stages.ask.by).toBeTruthy();
      expect(t2.stages.ask.note).toBe("Tổ 2 làm");
      expect((await team({ stage: "abc", done: true })).status).toBe(400);
      expect((await team({ stage: "ask", done: true }, "st_9")).status).toBe(403);
    });

    it("link sản phẩm chỉ https; nộp cần có link; đã nộp thì khoá, rút lại thì sửa được", async () => {
      expect((await team({ links: [{ url: "http://a.com/x", label: "x" }] })).status).toBe(400);
      expect((await team({ submit: true })).status).toBe(400);
      const ok = await team({ submit: true, links: [{ url: "https://drive.google.com/file/abc", label: "Ảnh" }], reflection: { en: "We made a cell model.", vi: "" } });
      expect(ok.status).toBe(200);
      expect((await get(`${COL.projects}/${pid}/teams/1`))!.submittedAt).toBeGreaterThan(0);
      expect((await team({ stage: "plan", done: true })).status).toBe(409);
      expect((await team({ submit: false })).status).toBe(200);
      expect((await team({ stage: "plan", done: true, note: "drawing" })).status).toBe(200);
      expect((await team({ submit: true })).status).toBe(200);
    });

    it("GV chấm rubric → cả tổ +50 XP; chấm lại không cộng trùng; tổ bị khoá", async () => {
      const full = { science: 4, product: 4, teamwork: 4, english: 4 };
      expect((await call(stemScore.POST, "tB", { team: 1, scores: full }, { id: pid })).status).toBe(403);
      expect((await call(stemScore.POST, "tA", { team: 1, scores: { science: 4 } }, { id: pid })).status).toBe(400);
      expect((await call(stemScore.POST, "tA", { team: 3, scores: full }, { id: pid })).status).toBe(400);
      const before = await xpOf("st_1");
      const r = await call(stemScore.POST, "tA", { team: 1, scores: full, feedback: "Great model!" }, { id: pid });
      expect(r.json).toMatchObject({ members: 1, xp: 50 });
      expect(await xpOf("st_1")).toBe(before + 50);
      expect(await xpOf("st_2")).toBe(0); // tổ 2 chưa được chấm
      await call(stemScore.POST, "tA", { team: 1, scores: { science: 2, product: 2, teamwork: 2, english: 2 } }, { id: pid });
      expect(await xpOf("st_1")).toBe(before + 50);
      expect((await get(`${COL.projects}/${pid}/teams/1`))!.scores).toMatchObject({ science: 2 });
      expect((await team({ stage: "share", done: true })).status).toBe(409);
    });

    it("GV đóng dự án → HS không sửa được; mở lại được; xoá dự án xoá cả nhật kí", async () => {
      expect((await call(stemIdRoute.PUT, "tA", { status: "closed" }, { id: pid }, "PUT")).status).toBe(200);
      expect((await team({ stage: "plan", done: true }, "st_2")).status).toBe(409);
      expect((await call(stemIdRoute.PUT, "tA", { status: "open" }, { id: pid }, "PUT")).status).toBe(200);
      expect((await team({ stage: "plan", done: true }, "st_2")).status).toBe(200);
      expect((await call(stemIdRoute.DELETE, "tB", undefined, { id: pid }, "DELETE")).status).toBe(403);
      expect((await call(stemIdRoute.DELETE, "tA", undefined, { id: pid }, "DELETE")).status).toBe(200);
      expect(await get(`${COL.projects}/${pid}`)).toBeNull();
      expect(await get(`${COL.projects}/${pid}/teams/2`)).toBeNull();
    });
  });

  // ======================= CỘNG ĐỒNG HỌC TẬP =======================
  describe("cộng đồng học tập", () => {
    let p1 = "";
    let tPost = "";
    let rid = "";
    const put = (body: object, uid = "tA", id = p1) => call(postIdRoute.PUT, uid, body, { id }, "PUT");

    it("HS đăng → Chờ duyệt, hiện tên gọi + tổ; chặn link / SĐT / lớp khác", async () => {
      const r = await call(postRoute.POST, "st_1", { classId: "fc1", kind: "question", text: "Why are plant cells green?", english: true });
      expect(r.status).toBe(201);
      expect(r.json.pending).toBe(true);
      p1 = r.json.id as string;
      expect((await get(`${COL.posts}/${p1}`))!).toMatchObject({ status: "pending", authorName: "An", team: 1, authorRole: "student", english: true });
      expect((await call(postRoute.POST, "st_1", { classId: "fc1", text: "vào web abc.com nhé" })).status).toBe(400);
      expect((await call(postRoute.POST, "st_1", { classId: "fc1", text: "số mình 0912345678" })).status).toBe(400);
      expect((await call(postRoute.POST, "st_9", { classId: "fc1", text: "Hello class 6A" })).status).toBe(403);
    });

    it("GV đăng → hiện ngay; chưa duyệt thì chưa trả lời được", async () => {
      const r = await call(postRoute.POST, "tA", { classId: "fc1", kind: "share", text: "Xem mô phỏng https://phet.colorado.edu nhé" });
      expect(r.json.pending).toBe(false);
      tPost = r.json.id as string;
      expect((await call(replyRoute.POST, "st_2", { text: "Because of chloroplasts." }, { id: p1 })).status).toBe(409);
    });

    it("GV duyệt bài → HS trả lời (chờ duyệt) → GV duyệt trả lời → đếm trả lời", async () => {
      expect((await put({ action: "approve" }, "tB")).status).toBe(403); // GV lớp khác
      expect((await put({ action: "approve" })).status).toBe(200);
      const r = await call(replyRoute.POST, "st_2", { text: "Because they have chloroplasts.", english: true }, { id: p1 });
      expect(r.json.pending).toBe(true);
      rid = r.json.id as string;
      expect((await get(`${COL.posts}/${p1}`))!.replyCount).toBe(0);
      expect((await put({ action: "best", replyId: rid })).status).toBe(409); // chưa duyệt
      expect((await put({ action: "approve", replyId: rid })).status).toBe(200);
      expect((await get(`${COL.posts}/${p1}`))!.replyCount).toBe(1);
    });

    it("Đọc qua máy chủ (khi rules chặn trình duyệt): đúng quyền như rules", async () => {
      const read = async (h: unknown, uid: string, url: string, params: Record<string, string> = {}) => {
        const res = await (h as Handler)(new Request(url, { headers: { authorization: `Bearer ${uid}` } }), { params: Promise.resolve(params) });
        return { status: res.status, json: (await res.json()) as Record<string, { id: string; status: string; createdAt: number | null }[]> };
      };
      const pending = await call(postRoute.POST, "st_2", { classId: "fc1", text: "Is blood always red?" });
      const url = "http://localhost/api/community?classId=fc1";
      const t = await read(postRoute.GET, "tA", url);
      expect(t.status).toBe(200);
      expect(t.json.posts.map((p) => p.id).sort()).toEqual([p1, tPost, pending.json.id].sort()); // GV thấy cả bài chờ duyệt
      expect(typeof t.json.posts[0].createdAt).toBe("number");
      const s1 = await read(postRoute.GET, "st_1", url);
      expect(s1.json.posts.map((p) => p.id).sort()).toEqual([p1, tPost].sort()); // HS khác không thấy bài chờ duyệt của bạn
      const s2 = await read(postRoute.GET, "st_2", url);
      expect(s2.json.posts.map((p) => p.id)).toContain(pending.json.id); // thấy bài của mình
      expect((await read(postRoute.GET, "st_9", url)).status).toBe(403); // lớp khác
      expect((await read(postRoute.GET, "tB", url)).status).toBe(403); // GV lớp khác
      expect((await read(replyRoute.GET, "st_1", "http://localhost/api", { id: p1 })).json.replies.map((r) => r.id)).toEqual([rid]);
      await call(postIdRoute.DELETE, "tA", undefined, { id: pending.json.id as string }, "DELETE");
    });

    it("Trả lời hay nhất → HS +10 XP đúng 1 lần; ẩn trả lời thì bỏ chọn + giảm đếm", async () => {
      const before = await xpOf("st_2");
      expect((await put({ action: "best", replyId: rid })).status).toBe(200);
      expect((await get(`${COL.posts}/${p1}`))!.bestReplyId).toBe(rid);
      expect(await xpOf("st_2")).toBe(before + 10);
      await put({ action: "best", replyId: rid }); // bỏ chọn
      await put({ action: "best", replyId: rid }); // chọn lại
      expect(await xpOf("st_2")).toBe(before + 10);
      await put({ action: "hide", replyId: rid });
      expect((await get(`${COL.posts}/${p1}`))!).toMatchObject({ replyCount: 0, bestReplyId: null });
    });

    it("Xoá: HS chỉ xoá bài mình khi còn chờ duyệt; GV xoá được (kèm trả lời)", async () => {
      expect((await call(postIdRoute.DELETE, "st_1", undefined, { id: p1 }, "DELETE")).status).toBe(403); // đã duyệt
      expect((await call(postIdRoute.DELETE, "st_1", undefined, { id: tPost }, "DELETE")).status).toBe(403); // bài GV
      const mine = await call(postRoute.POST, "st_1", { classId: "fc1", text: "Câu hỏi nháp của em" });
      expect((await call(postIdRoute.DELETE, "st_1", undefined, { id: mine.json.id as string }, "DELETE")).status).toBe(200);
      expect((await call(postIdRoute.DELETE, "tA", undefined, { id: p1 }, "DELETE")).status).toBe(200);
      expect(await get(`${COL.posts}/${p1}/replies/${rid}`)).toBeNull();
    });

    it("Giới hạn 10 lượt đăng / em / ngày (tính cả trả lời)", async () => {
      // st_1 đã dùng 2 lượt (1 bài + 1 bài nháp đã xoá); bài bị chặn link/SĐT không tính
      let okCount = 2;
      let last = 0;
      for (let i = 0; i < 10; i++) {
        last = (await call(postRoute.POST, "st_1", { classId: "fc1", text: `Question number ${i + 1}?` })).status;
        if (last === 201) okCount++;
        else break;
      }
      expect(okCount).toBe(10);
      expect(last).toBe(429);
    });
  });
});
