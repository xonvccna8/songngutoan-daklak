// Security rules của 3 bộ sưu tập mới (ngân hàng câu hỏi, dự án STEM, cộng đồng) — chạy trên Emulator:
//   npx firebase-tools emulators:exec --only firestore --project demo-lsn "npx vitest run tests/features.rules.test.ts"
// Kiểm đúng các truy vấn mà trang web dùng (src/lib/bank|stem|community/hooks.ts).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

const on = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!on)("rules — chức năng mới", () => {
  let env: RulesTestEnvironment;
  const tA = { lsnRole: "teacher", lsnSchool: "s1", lsnClasses: [] };
  const tB = { lsnRole: "teacher", lsnSchool: "s1", lsnClasses: [] };
  const st1 = { lsnRole: "student", lsnSchool: "s1", lsnClasses: ["c1"] }; // tổ 1
  const st2 = { lsnRole: "student", lsnSchool: "s1", lsnClasses: ["c1"] }; // tổ 2
  const st9 = { lsnRole: "student", lsnSchool: "s1", lsnClasses: ["c2"] }; // lớp khác
  const as = (uid: string, claims: Record<string, unknown>) => env.authenticatedContext(uid, claims).firestore();

  beforeAll(async () => {
    env = await initializeTestEnvironment({ projectId: "demo-lsn", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
  });
  afterAll(async () => {
    await env?.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "lsn_classes/c1"), { name: "7A", schoolId: "s1", teacherIds: ["tA"] });
      await setDoc(doc(db, "lsn_classes/c2"), { name: "7B", schoolId: "s1", teacherIds: ["tB"] });
      await setDoc(doc(db, "lsn_classes/c1/students/st_1"), { fullName: "Nguyễn Văn An", number: 1, team: 1 });
      await setDoc(doc(db, "lsn_classes/c1/students/st_2"), { fullName: "Trần Thị Bình", number: 2, team: 2 });
      await setDoc(doc(db, "lsn_questions/Q1"), { status: "approved", key: { answer: 0 } });
      await setDoc(doc(db, "lsn_projects/P1"), { classId: "c1", title: { vi: "Mô hình tế bào" }, status: "open" });
      await setDoc(doc(db, "lsn_projects/P1/teams/1"), { team: 1, stages: {} });
      await setDoc(doc(db, "lsn_projects/P1/teams/2"), { team: 2, stages: {} });
      await setDoc(doc(db, "lsn_posts/A"), { classId: "c1", authorUid: "st_2", status: "approved", text: "ok" });
      await setDoc(doc(db, "lsn_posts/B"), { classId: "c1", authorUid: "st_2", status: "pending", text: "chờ" });
      await setDoc(doc(db, "lsn_posts/C"), { classId: "c1", authorUid: "st_1", status: "pending", text: "của em" });
      await setDoc(doc(db, "lsn_posts/A/replies/r1"), { authorUid: "st_2", status: "approved", text: "x" });
      await setDoc(doc(db, "lsn_posts/A/replies/r2"), { authorUid: "st_2", status: "pending", text: "y" });
      await setDoc(doc(db, "lsn_posts/A/replies/r3"), { authorUid: "st_1", status: "pending", text: "z" });
    });
  });

  describe("ngân hàng câu hỏi (có đáp án)", () => {
    it("GV đọc cả bộ", () => assertSucceeds(getDocs(collection(as("tA", tA), "lsn_questions"))));
    it("HS không đọc được", async () => {
      await assertFails(getDoc(doc(as("st_1", st1), "lsn_questions/Q1")));
      await assertFails(getDocs(collection(as("st_1", st1), "lsn_questions")));
    });
    it("chưa đăng nhập không đọc được", () => assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "lsn_questions/Q1"))));
    it("không ai ghi trực tiếp", () => assertFails(setDoc(doc(as("tA", tA), "lsn_questions/Q2"), { status: "approved" })));
  });

  describe("dự án STEM", () => {
    it("GV lớp: truy vấn dự án theo lớp + đọc mọi tổ", async () => {
      const db = as("tA", tA);
      await assertSucceeds(getDocs(query(collection(db, "lsn_projects"), where("classId", "==", "c1"))));
      await assertSucceeds(getDocs(collection(db, "lsn_projects/P1/teams")));
    });
    it("GV lớp khác không đọc được", async () => {
      await assertFails(getDocs(query(collection(as("tB", tB), "lsn_projects"), where("classId", "==", "c1"))));
      await assertFails(getDoc(doc(as("tB", tB), "lsn_projects/P1/teams/1")));
    });
    it("HS của lớp đọc dự án", () => assertSucceeds(getDocs(query(collection(as("st_1", st1), "lsn_projects"), where("classId", "==", "c1")))));
    it("HS lớp khác không đọc được", () => assertFails(getDoc(doc(as("st_9", st9), "lsn_projects/P1"))));
    it("HS chỉ đọc nhật kí tổ của mình", async () => {
      await assertSucceeds(getDoc(doc(as("st_1", st1), "lsn_projects/P1/teams/1")));
      await assertFails(getDoc(doc(as("st_1", st1), "lsn_projects/P1/teams/2")));
      await assertSucceeds(getDoc(doc(as("st_2", st2), "lsn_projects/P1/teams/2")));
      await assertFails(getDocs(collection(as("st_1", st1), "lsn_projects/P1/teams")));
    });
    it("HS đọc được tổ mình kể cả khi tổ chưa bắt đầu (chưa có tài liệu)", async () => {
      await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc("lsn_projects/P1/teams/1").delete());
      await assertSucceeds(getDoc(doc(as("st_1", st1), "lsn_projects/P1/teams/1")));
    });
    it("HS không tự ghi nhật kí (phải qua máy chủ)", () => assertFails(setDoc(doc(as("st_1", st1), "lsn_projects/P1/teams/1"), { team: 1, scores: { science: 4 } })));
  });

  describe("cộng đồng học tập", () => {
    it("GV lớp đọc mọi bài (cả chờ duyệt)", () => assertSucceeds(getDocs(query(collection(as("tA", tA), "lsn_posts"), where("classId", "==", "c1")))));
    it("HS: truy vấn bài đã duyệt + bài của mình", async () => {
      const db = as("st_1", st1);
      await assertSucceeds(getDocs(query(collection(db, "lsn_posts"), where("classId", "==", "c1"), where("status", "==", "approved"))));
      await assertSucceeds(getDocs(query(collection(db, "lsn_posts"), where("classId", "==", "c1"), where("authorUid", "==", "st_1"))));
    });
    it("HS không xem được bài chờ duyệt của bạn khác", async () => {
      await assertFails(getDoc(doc(as("st_1", st1), "lsn_posts/B")));
      await assertFails(getDocs(query(collection(as("st_1", st1), "lsn_posts"), where("classId", "==", "c1"))));
    });
    it("HS lớp khác không đọc được", () => assertFails(getDocs(query(collection(as("st_9", st9), "lsn_posts"), where("classId", "==", "c1"), where("status", "==", "approved")))));
    it("trả lời: HS đọc đã duyệt + của mình, không đọc chờ duyệt của bạn", async () => {
      const db = as("st_1", st1);
      await assertSucceeds(getDocs(query(collection(db, "lsn_posts/A/replies"), where("status", "==", "approved"))));
      await assertSucceeds(getDocs(query(collection(db, "lsn_posts/A/replies"), where("authorUid", "==", "st_1"))));
      await assertFails(getDoc(doc(db, "lsn_posts/A/replies/r2")));
      await assertSucceeds(getDocs(collection(as("tA", tA), "lsn_posts/A/replies")));
    });
    it("không ai ghi trực tiếp (kiểm duyệt qua máy chủ)", async () => {
      await assertFails(setDoc(doc(as("st_1", st1), "lsn_posts/D"), { classId: "c1", authorUid: "st_1", status: "approved", text: "lách duyệt" }));
      await assertFails(setDoc(doc(as("tA", tA), "lsn_posts/A"), { status: "hidden" }, { merge: true }));
    });
  });
});
