// Test security rules bằng Firestore Emulator (cần Java). Chạy: npm run test:rules
// Mỗi quy tắc có ít nhất một trường hợp CHO PHÉP và một trường hợp TỪ CHỐI.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

let env: RulesTestEnvironment;

const teacherA = { lsnRole: "teacher", lsnSchool: "s1", lsnClasses: [] };
const teacherB = { lsnRole: "teacher", lsnSchool: "s1", lsnClasses: [] };
const admin1 = { lsnRole: "admin", lsnSchool: "s1", lsnClasses: [] };
const admin2 = { lsnRole: "admin", lsnSchool: "s2", lsnClasses: [] };
const student1 = { lsnRole: "student", lsnSchool: "s1", lsnClasses: ["c1"] };

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-lsn",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "lsn_schools/s1"), { name: "THCS Mẫu" });
    await setDoc(doc(db, "lsn_users/tA"), { role: "teacher", schoolId: "s1" });
    await setDoc(doc(db, "lsn_classes/c1"), { name: "7A", schoolId: "s1", teacherIds: ["tA"], joinCode: "ABCDEF" });
    await setDoc(doc(db, "lsn_classes/c1/students/st_1"), { fullName: "Nguyễn Văn An", number: 1, team: 1 });
    await setDoc(doc(db, "lsn_classes/c1/students/st_2"), { fullName: "Trần Thị Bình", number: 2, team: 2 });
    await setDoc(doc(db, "lsn_private/studentAuth/items/st_1"), { pinHash: "x", classId: "c1" });
    await setDoc(doc(db, "lsn_studentStats/c1_st_1"), { classId: "c1", uid: "st_1", totalPoints: 10 });
    // GĐ 2
    await setDoc(doc(db, "lsn_lessons/L1"), { title: { en: "x", vi: "x" }, status: "approved", slideIds: ["s0"] });
    await setDoc(doc(db, "lsn_lessons/L1/slides/s0"), { type: "mcq" });
    await setDoc(doc(db, "lsn_lessons/L1/teacher/s0"), { answer: 1, notes: [] });
    // GĐ 6: tiết nháp + thuật ngữ chờ duyệt
    await setDoc(doc(db, "lsn_lessons/D1"), { title: { en: "x", vi: "x" }, status: "draft", ownerId: "tA", slideIds: ["s0"] });
    await setDoc(doc(db, "lsn_lessons/D1/slides/s0"), { type: "content" });
    await setDoc(doc(db, "lsn_terms/apex"), { en: "apex", vi: "đỉnh", grade: 7, status: "pending" });
    await setDoc(doc(db, "lsn_sessions/S1"), { classId: "c1", status: "live", lessonId: "L1", state: { slideIndex: 0 } });
    await setDoc(doc(db, "lsn_sessions/S1/participants/st_2"), { visible: true, leftCount: 0, raisedHandAt: 123 });
    await setDoc(doc(db, "lsn_sessions/S1/responses/st_1~s0"), { uid: "st_1", slideId: "s0", correct: true, points: 150 });
    await setDoc(doc(db, "lsn_sessions/S1/responses/st_2~s0"), { uid: "st_2", slideId: "s0", correct: false, points: 0 });
    // GĐ 4
    await setDoc(doc(db, "lsn_messages/M1"), { classId: "c1", schoolId: "s1", toUids: ["st_1"], kind: "attention", text: { en: "x", vi: "x" } });
    await setDoc(doc(db, "lsn_messages/M1/receipts/st_1"), { uid: "st_1", status: "sent", deliveredAt: null, readAt: null, ackAt: null, reply: null });
    // GĐ 5
    await setDoc(doc(db, "lsn_terms/leg"), { en: "leg", vi: "cạnh bên", grade: 7, status: "approved" });
    await setDoc(doc(db, "lsn_assignments/A1"), { classId: "c1", schoolId: "s1", toUids: ["st_1"], items: [] });
    await setDoc(doc(db, "lsn_assignments/A1/submissions/st_1"), { uid: "st_1", classId: "c1", score: 100 });
    await setDoc(doc(db, "lsn_assignments/A1/submissions/st_2"), { uid: "st_2", classId: "c1", score: 0 });
    await setDoc(doc(db, "lsn_studyDaily/st_1_20261011"), { uid: "st_1", classId: "c1", activeSeconds: 600 });
    await setDoc(doc(db, "lsn_cards/st_1"), { uid: "st_1", classId: "c1", cards: {} });
    // GĐ 3 mới: XP & bảng tuần
    await setDoc(doc(db, "lsn_events/E1"), { uid: "st_1", classId: "c1", kind: "hw", scope: "home", xp: 7, at: 1 });
    await setDoc(doc(db, "lsn_events/E2"), { uid: "st_2", classId: "c1", kind: "live", scope: "class", xp: 20, at: 2 });
    await setDoc(doc(db, "lsn_weekly/c1_2026-W42"), { classId: "c1", week: "2026-W42", rows: { st_1: { c: 10, h: 7 } } });
    // GĐ 4: học liệu
    await setDoc(doc(db, "lsn_resources/R1"), { kind: "geogebra", status: "approved", curLessonId: "k8-15", grade: 8 });
    await setDoc(doc(db, "lsn_resources/R2"), { kind: "video", status: "pending", curLessonId: "k8-15", grade: 8 });
    // GĐ 5: trò chơi
    await setDoc(doc(db, "lsn_games/G1"), { classId: "c1", sessionId: "S1", status: "play", questions: [] });
    await setDoc(doc(db, "lsn_games/G1/live/board"), { rows: { st_1: { s: 100 } } });
    await setDoc(doc(db, "lsn_games/G1/players/st_1"), { uid: "st_1", s: 100 });
    await setDoc(doc(db, "lsn_games/G1/players/st_2"), { uid: "st_2", s: 0 });
    await setDoc(doc(db, "lsn_games/G1/private/key"), { keys: [{ answer: 1 }] });
  });
});

const as = (uid: string, claims: Record<string, unknown>) => env.authenticatedContext(uid, claims).firestore();

describe("classes", () => {
  it("GV của lớp được đọc", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_classes/c1"))));
  it("GV khác bị từ chối", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_classes/c1"))));
  it("GV truy vấn lớp của mình", () =>
    assertSucceeds(getDocs(query(collection(as("tA", teacherA), "lsn_classes"), where("teacherIds", "array-contains", "tA")))));
  it("Quản trị cùng trường được đọc", () => assertSucceeds(getDoc(doc(as("ad1", admin1), "lsn_classes/c1"))));
  it("Quản trị trường khác bị từ chối", () => assertFails(getDoc(doc(as("ad2", admin2), "lsn_classes/c1"))));
  it("HS trong lớp được đọc", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_classes/c1"))));
  it("Chưa đăng nhập bị từ chối", () => assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "lsn_classes/c1"))));
  it("Client không được ghi lớp (kể cả GV)", () =>
    assertFails(setDoc(doc(as("tA", teacherA), "lsn_classes/c1"), { name: "hack" }, { merge: true })));
});

describe("students", () => {
  it("GV của lớp đọc danh sách", () => assertSucceeds(getDocs(collection(as("tA", teacherA), "lsn_classes/c1/students"))));
  it("GV khác bị từ chối", () => assertFails(getDocs(collection(as("tB", teacherB), "lsn_classes/c1/students"))));
  it("HS đọc hồ sơ của mình", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_classes/c1/students/st_1"))));
  it("HS không đọc được hồ sơ bạn khác", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_classes/c1/students/st_2"))));
  it("HS không ghi được hồ sơ của mình", () =>
    assertFails(setDoc(doc(as("st_1", student1), "lsn_classes/c1/students/st_1"), { team: 3 }, { merge: true })));
});

describe("private", () => {
  it("GV không đọc được hash PIN", () => assertFails(getDoc(doc(as("tA", teacherA), "lsn_private/studentAuth/items/st_1"))));
  it("HS không đọc được hash PIN của mình", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_private/studentAuth/items/st_1"))));
  it("Quản trị cũng không đọc được", () => assertFails(getDoc(doc(as("ad1", admin1), "lsn_private/studentAuth/items/st_1"))));
});

describe("users & schools", () => {
  it("Đọc hồ sơ của mình", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_users/tA"))));
  it("Không đọc hồ sơ người khác", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_users/tA"))));
  it("Không tự cấp quyền", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_users/tA"), { role: "admin" }, { merge: true })));
  it("Đọc trường của mình", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_schools/s1"))));
  it("Không đọc trường khác", () => assertFails(getDoc(doc(as("ad2", admin2), "lsn_schools/s1"))));
});

describe("studentStats", () => {
  it("GV lớp đọc được", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_studentStats/c1_st_1"))));
  it("HS đọc của mình", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_studentStats/c1_st_1"))));
  it("GV khác bị từ chối", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_studentStats/c1_st_1"))));
  it("Không ai ghi từ client", () =>
    assertFails(setDoc(doc(as("tA", teacherA), "lsn_studentStats/c1_st_1"), { totalPoints: 999 }, { merge: true })));
});

describe("GĐ 2 · tiết học", () => {
  it("HS đọc nội dung trang", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_lessons/L1/slides/s0"))));
  it("HS KHÔNG đọc được đáp án", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_lessons/L1/teacher/s0"))));
  it("GV đọc đáp án", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_lessons/L1/teacher/s0"))));
  it("Người ngoài không đọc tiết", () => assertFails(getDoc(doc(as("x", { role: "teacher" }), "lsn_lessons/L1"))));
});

describe("GĐ 6 · soạn bài", () => {
  it("GV đọc tiết nháp", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_lessons/D1"))));
  it("HS KHÔNG đọc tiết nháp", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_lessons/D1"))));
  it("HS KHÔNG đọc trang của tiết nháp", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_lessons/D1/slides/s0"))));
  it("GV không ghi tiết trực tiếp", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_lessons/D1"), { status: "approved" }, { merge: true })));
  it("GV đọc thuật ngữ chờ duyệt", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_terms/apex"))));
  it("HS KHÔNG đọc thuật ngữ chờ duyệt", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_terms/apex"))));
});

describe("GĐ 2 · phiên dạy", () => {
  const sess = (u: string, c: Record<string, unknown>) => doc(as(u, c), "lsn_sessions/S1");
  it("HS trong lớp tìm được tiết đang dạy", () =>
    assertSucceeds(getDocs(query(collection(as("st_1", student1), "lsn_sessions"), where("classId", "==", "c1"), where("status", "==", "live")))));
  it("HS lớp khác không thấy", () => assertFails(getDoc(sess("st_9", { lsnRole: "student", lsnSchool: "s1", lsnClasses: ["c9"] }))));
  it("GV sửa state", () => assertSucceeds(setDoc(sess("tA", teacherA), { state: { slideIndex: 1 } }, { merge: true })));
  it("GV không sửa status trực tiếp", () => assertFails(setDoc(sess("tA", teacherA), { status: "ended" }, { merge: true })));
  it("GV lớp khác không điều khiển được", () => assertFails(setDoc(sess("tB", teacherB), { state: { slideIndex: 1 } }, { merge: true })));
  it("HS không điều khiển được", () => assertFails(setDoc(sess("st_1", student1), { state: { slideIndex: 5 } }, { merge: true })));

  const part = (u: string, c: Record<string, unknown>, id: string) => doc(as(u, c), `lsn_sessions/S1/participants/${id}`);
  it("HS tạo hồ sơ có mặt của mình", () =>
    assertSucceeds(setDoc(part("st_1", student1, "st_1"), { joinedAt: 1, lastSeenAt: 1, visible: true, leftCount: 0, raisedHandAt: null })));
  it("HS không tự cộng điểm khi tạo", () =>
    assertFails(setDoc(part("st_1", student1, "st_1"), { joinedAt: 1, lastSeenAt: 1, visible: true, leftCount: 0, raisedHandAt: null, points: 999 })));
  it("HS không tạo hộ bạn", () => assertFails(setDoc(part("st_1", student1, "st_3"), { visible: true })));
  it("GV hạ tay cho HS", () => assertSucceeds(setDoc(part("tA", teacherA, "st_2"), { raisedHandAt: null, visible: true, leftCount: 0 }, { merge: true })));
  it("GV không sửa nhịp của HS", () => assertFails(setDoc(part("tA", teacherA, "st_2"), { visible: false }, { merge: true })));

  it("HS đọc câu trả lời của mình", () =>
    assertSucceeds(getDocs(query(collection(as("st_1", student1), "lsn_sessions/S1/responses"), where("uid", "==", "st_1")))));
  it("HS không đọc câu trả lời bạn khác", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_sessions/S1/responses/st_2~s0"))));
  it("HS không tự ghi câu trả lời/điểm", () =>
    assertFails(setDoc(doc(as("st_1", student1), "lsn_sessions/S1/responses/st_1~s1"), { uid: "st_1", correct: true, points: 150 })));
  it("GV đọc mọi câu trả lời", () => assertSucceeds(getDocs(collection(as("tA", teacherA), "lsn_sessions/S1/responses"))));
});

describe("GĐ 4 · tin nhắn", () => {
  const msg = (u: string, c: Record<string, unknown>) => doc(as(u, c), "lsn_messages/M1");
  const rec = (u: string, c: Record<string, unknown>, id = "st_1") => doc(as(u, c), `lsn_messages/M1/receipts/${id}`);
  it("HS được nhận đọc tin", () => assertSucceeds(getDoc(msg("st_1", student1))));
  it("HS khác không đọc tin của bạn", () => assertFails(getDoc(msg("st_2", { ...student1 }))));
  it("HS truy vấn hộp tin của mình", () =>
    assertSucceeds(getDocs(query(collection(as("st_1", student1), "lsn_messages"), where("toUids", "array-contains", "st_1")))));
  it("GV lớp đọc tin", () => assertSucceeds(getDoc(msg("tA", teacherA))));
  it("GV lớp khác không đọc", () => assertFails(getDoc(msg("tB", teacherB))));
  it("Quản trị cùng trường đọc nhật ký", () => assertSucceeds(getDocs(query(collection(as("ad1", admin1), "lsn_messages"), where("schoolId", "==", "s1")))));
  it("Không ai tự tạo tin từ trình duyệt (kể cả GV)", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_messages/M2"), { classId: "c1", toUids: ["st_1"] })));
  it("HS xác nhận đã chú ý", () => assertSucceeds(setDoc(rec("st_1", student1), { status: "acked", ackAt: 1, readAt: 1 }, { merge: true })));
  it("HS trả lời nhanh “Em cần giúp”", () => assertSucceeds(setDoc(rec("st_1", student1), { status: "read", reply: "need_help" }, { merge: true })));
  it("HS không gõ trả lời tự do", () => assertFails(setDoc(rec("st_1", student1), { reply: "chat chit" }, { merge: true })));
  it("HS không sửa biên nhận của bạn", () => assertFails(setDoc(rec("st_2", { ...student1 }, "st_1"), { status: "acked" }, { merge: true })));
  it("GV đọc biên nhận", () => assertSucceeds(getDoc(rec("tA", teacherA))));
  it("HS lưu mã thiết bị của mình", () => assertSucceeds(setDoc(doc(as("st_1", student1), "lsn_fcmTokens/st_1/tokens/t1"), { token: "abc", ua: "x", updatedAt: 1 })));
  it("Không ghi mã thiết bị hộ người khác", () => assertFails(setDoc(doc(as("st_1", student1), "lsn_fcmTokens/st_2/tokens/t1"), { token: "abc" })));
});

describe("GĐ 5 · tự học", () => {
  const student2 = { ...student1 };
  it("HS đọc thuật ngữ", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_terms/leg"))));
  it("Người ngoài không đọc thuật ngữ", () => assertFails(getDoc(doc(as("x", { role: "student" }), "lsn_terms/leg"))));
  it("Không ai ghi thuật ngữ từ client", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_terms/leg"), { vi: "x" }, { merge: true })));

  it("HS được giao đọc bài", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_assignments/A1"))));
  it("HS truy vấn bài của mình", () =>
    assertSucceeds(getDocs(query(collection(as("st_1", student1), "lsn_assignments"), where("toUids", "array-contains", "st_1")))));
  it("HS không được giao thì không đọc", () => assertFails(getDoc(doc(as("st_2", student2), "lsn_assignments/A1"))));
  it("GV lớp đọc bài", () => assertSucceeds(getDocs(query(collection(as("tA", teacherA), "lsn_assignments"), where("classId", "==", "c1")))));
  it("GV lớp khác không đọc", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_assignments/A1"))));
  it("GV không tạo bài từ trình duyệt", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_assignments/A2"), { classId: "c1", toUids: [] })));

  it("HS đọc bài làm của mình", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_assignments/A1/submissions/st_1"))));
  it("HS không đọc bài làm của bạn", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_assignments/A1/submissions/st_2"))));
  it("HS không tự chấm điểm", () => assertFails(setDoc(doc(as("st_1", student1), "lsn_assignments/A1/submissions/st_1"), { score: 999 }, { merge: true })));
  it("GV lớp đọc bài làm cả lớp", () => assertSucceeds(getDocs(collection(as("tA", teacherA), "lsn_assignments/A1/submissions"))));
  it("GV lớp khác không đọc bài làm", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_assignments/A1/submissions/st_1"))));

  it("HS đọc thời gian học của mình", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_studyDaily/st_1_20261011"))));
  it("HS không đọc thời gian học của bạn", () => assertFails(getDoc(doc(as("st_2", student2), "lsn_studyDaily/st_1_20261011"))));
  it("HS không tự cộng thời gian học", () => assertFails(setDoc(doc(as("st_1", student1), "lsn_studyDaily/st_1_20261011"), { activeSeconds: 99999 }, { merge: true })));
  it("GV lớp đọc thời gian học", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_studyDaily/st_1_20261011"))));

  it("HS đọc thẻ từ của mình", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_cards/st_1"))));
  it("HS đọc được thẻ khi chưa có tài liệu", () => assertSucceeds(getDoc(doc(as("st_2", student2), "lsn_cards/st_2"))));
  it("HS không đọc thẻ của bạn", () => assertFails(getDoc(doc(as("st_2", student2), "lsn_cards/st_1"))));
  it("HS không tự sửa lịch ôn", () => assertFails(setDoc(doc(as("st_1", student1), "lsn_cards/st_1"), { cards: { leg: { due: 0 } } }, { merge: true })));
  it("GV lớp xem thẻ của HS", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_cards/st_1"))));
  it("GV lớp khác không xem thẻ", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_cards/st_1"))));
});

describe("GĐ 3 mới · XP & bảng tuần", () => {
  it("HS đọc sự kiện XP của mình", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_events/E1"))));
  it("HS truy vấn sự kiện của mình", () => assertSucceeds(getDocs(query(collection(as("st_1", student1), "lsn_events"), where("uid", "==", "st_1")))));
  it("HS KHÔNG đọc sự kiện của bạn", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_events/E2"))));
  it("GV lớp đọc sự kiện của HS", () => assertSucceeds(getDocs(query(collection(as("tA", teacherA), "lsn_events"), where("classId", "==", "c1"), where("uid", "==", "st_2")))));
  it("GV lớp khác bị từ chối", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_events/E1"))));
  it("HS KHÔNG tự cộng XP", () => assertFails(setDoc(doc(as("st_1", student1), "lsn_events/X"), { uid: "st_1", classId: "c1", xp: 999 })));
  it("GV lớp đọc bảng tuần", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_weekly/c1_2026-W42"))));
  it("HS KHÔNG đọc bảng tuần (xem qua API)", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_weekly/c1_2026-W42"))));
  it("GV KHÔNG sửa bảng tuần", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_weekly/c1_2026-W42"), { rows: {} }, { merge: true })));
});

describe("GĐ 4 · học liệu", () => {
  it("HS đọc học liệu đã duyệt", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_resources/R1"))));
  it("HS truy vấn học liệu đã duyệt của bài", () =>
    assertSucceeds(getDocs(query(collection(as("st_1", student1), "lsn_resources"), where("status", "==", "approved"), where("curLessonId", "==", "k8-15")))));
  it("HS KHÔNG đọc học liệu chờ duyệt", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_resources/R2"))));
  it("GV đọc học liệu chờ duyệt", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_resources/R2"))));
  it("GV KHÔNG ghi trực tiếp (phải qua API)", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_resources/R3"), { status: "approved" })));
  it("Chưa đăng nhập bị từ chối", () => assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "lsn_resources/R1"))));
});

describe("GĐ 5 · trò chơi", () => {
  const student9 = { lsnRole: "student", lsnSchool: "s1", lsnClasses: ["c9"] };
  it("HS của lớp đọc trạng thái trận", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_games/G1"))));
  it("HS lớp khác không đọc được", () => assertFails(getDoc(doc(as("st_9", student9), "lsn_games/G1"))));
  it("HS đọc trạng thái của chính mình", () => assertSucceeds(getDoc(doc(as("st_1", student1), "lsn_games/G1/players/st_1"))));
  it("HS KHÔNG đọc trạng thái của bạn", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_games/G1/players/st_2"))));
  it("HS KHÔNG đọc bảng điểm trực tiếp (nhận hạng qua API)", () => assertFails(getDoc(doc(as("st_1", student1), "lsn_games/G1/live/board"))));
  it("GV lớp đọc bảng điểm", () => assertSucceeds(getDoc(doc(as("tA", teacherA), "lsn_games/G1/live/board"))));
  it("GV lớp khác không đọc bảng điểm", () => assertFails(getDoc(doc(as("tB", teacherB), "lsn_games/G1/live/board"))));
  it("KHÔNG ai đọc được đáp án", () => {
    return Promise.all([assertFails(getDoc(doc(as("st_1", student1), "lsn_games/G1/private/key"))), assertFails(getDoc(doc(as("tA", teacherA), "lsn_games/G1/private/key")))]);
  });
  it("HS KHÔNG tự ghi điểm", () => assertFails(setDoc(doc(as("st_1", student1), "lsn_games/G1/players/st_1"), { s: 99999 }, { merge: true })));
  it("GV KHÔNG ghi trực tiếp (qua API)", () => assertFails(setDoc(doc(as("tA", teacherA), "lsn_games/G1"), { status: "ended" }, { merge: true })));
});

describe("mặc định từ chối", () => {
  it("Claims của app khác (role) không có tác dụng", () => assertFails(getDoc(doc(as("tA", { role: "teacher", schoolId: "s1" }), "lsn_classes/c1"))));
  it("Bộ sưu tập chưa khai báo", () => assertFails(getDoc(doc(as("tA", teacherA), "sessions/x"))));
});
