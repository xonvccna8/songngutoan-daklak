// Tạo dữ liệu mẫu: trường "THCS Mẫu", 2 GV, lớp 7A 30 HS (4 tổ), xuất file PIN.
//   npm run seed                         → tạo dữ liệu mẫu
//   npm run seed -- --teacher=ban@gmail.com → gắn thêm tài khoản GV của bạn vào lớp 7A
//   npm run seed:clear                   → xoá toàn bộ dữ liệu mẫu (đánh dấu isSample)
// Tiết mẫu "Tế bào" và điểm giả lập: npm run seed:lesson, scripts/seed-history.mts.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { adminAuth, adminDb } = await import("../src/lib/firebase/admin");
const { createStudents, deleteStudents, generateUniqueJoinCode } = await import("../src/lib/server/students");
const { DEFAULT_CLASS_SETTINGS } = await import("../src/lib/types");
const { COL, readClaims } = await import("../src/lib/namespace");
const { setLsnClaims } = await import("../src/lib/server/claims");

const SCHOOL_ID = process.env.DEFAULT_SCHOOL_ID || "thcs-mau";
const OUT_DIR = "seed-output";

const TEACHERS = [
  { email: "gv.lan@thcsmau.test", displayName: "Nguyễn Thị Lan" },
  { email: "gv.minh@thcsmau.test", displayName: "Trần Quốc Minh" },
];

const STUDENTS = [
  "Nguyễn Văn An", "Trần Thị Bình", "Lê Minh Châu", "Phạm Gia Huy", "Hoàng Ngọc Diệp",
  "Vũ Đức Duy", "Đặng Thu Hà", "Bùi Quang Hải", "Đỗ Khánh Linh", "Hồ Tuấn Kiệt",
  "Ngô Bảo Ngọc", "Dương Minh Khang", "Lý Thanh Mai", "Phan Hoàng Nam", "Võ Thảo Nguyên",
  "Trịnh Gia Phúc", "Đinh Mai Phương", "Lâm Nhật Quang", "Mai Anh Thư", "Tạ Đức Thắng",
  "Cao Thị Thuỳ", "Hà Minh Trí", "Kiều Bảo Trâm", "La Văn Tùng", "Lưu Hải Yến",
  "Quách Minh Tuấn", "Tôn Nữ Vy", "Văn Đình Vũ", "Châu Ngọc Xuân", "Thái Gia Bảo",
];

async function seed() {
  const db = adminDb();
  const auth = adminAuth();
  mkdirSync(OUT_DIR, { recursive: true });

  await db.collection(COL.schools).doc(SCHOOL_ID).set({ name: "THCS Mẫu", isSample: true }, { merge: true });

  // Giáo viên mẫu
  const teacherLines: string[] = [];
  const teacherUids: string[] = [];
  for (const t of TEACHERS) {
    const password = randomBytes(6).toString("base64url");
    let uid: string;
    try {
      uid = (await auth.getUserByEmail(t.email)).uid;
      await auth.updateUser(uid, { password, displayName: t.displayName });
    } catch {
      uid = (await auth.createUser({ email: t.email, password, displayName: t.displayName, emailVerified: true })).uid;
    }
    await setLsnClaims(uid, { role: "teacher", schoolId: SCHOOL_ID, classIds: [] });
    await db.collection(COL.users).doc(uid).set({
      role: "teacher",
      displayName: t.displayName,
      email: t.email,
      schoolId: SCHOOL_ID,
      classIds: [],
      isSample: true,
    });
    teacherUids.push(uid);
    teacherLines.push(`${t.displayName}\t${t.email}\t${password}`);
  }

  // Gắn thêm GV thật (tuỳ chọn)
  const extra = process.argv.find((a) => a.startsWith("--teacher="))?.split("=")[1];
  if (extra) {
    const u = await auth.getUserByEmail(extra);
    const current = readClaims(u.customClaims).role;
    const role = current || "teacher";
    if (!current) await setLsnClaims(u.uid, { role, schoolId: SCHOOL_ID, classIds: [] });
    await db
      .collection(COL.users)
      .doc(u.uid)
      .set({ role, displayName: u.displayName || extra, email: extra, schoolId: SCHOOL_ID }, { merge: true });
    teacherUids.unshift(u.uid);
    console.log(`✔ Đã gắn ${extra} vào lớp 7A`);
  }

  // Lớp 7A
  const classRef = db.collection(COL.classes).doc();
  const joinCode = await generateUniqueJoinCode();
  await classRef.set({
    name: "7A",
    grade: 7,
    schoolId: SCHOOL_ID,
    teacherIds: extra ? [teacherUids[0], teacherUids[1]] : [teacherUids[0]],
    joinCode,
    settings: { ...DEFAULT_CLASS_SETTINGS, teams: 4 },
    studentCount: 0,
    isSample: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  for (const uid of extra ? teacherUids.slice(0, 2) : teacherUids.slice(0, 1)) {
    await db.collection(COL.users).doc(uid).set({ classIds: FieldValue.arrayUnion(classRef.id) }, { merge: true });
  }

  const slips = await createStudents(
    classRef.id,
    STUDENTS.map((fullName, i) => ({ fullName, team: (i % 4) + 1 })),
    { isSample: true }
  );

  // File in ra (đã nằm trong .gitignore)
  const csv = ["STT,Họ tên,Tổ,Mã lớp,PIN", ...slips.map((s) => `${s.number},${s.fullName},${s.team},${joinCode},${s.pin}`)].join("\n");
  writeFileSync(`${OUT_DIR}/7A-PIN.csv`, "﻿" + csv, "utf8");
  writeFileSync(`${OUT_DIR}/giao-vien-mau.txt`, "Họ tên\tEmail\tMật khẩu\n" + teacherLines.join("\n") + "\n", "utf8");

  console.log(`✔ Trường ${SCHOOL_ID}, ${TEACHERS.length} GV mẫu, lớp 7A (${slips.length} HS), mã lớp ${joinCode}`);
  console.log(`✔ PIN học sinh: ${OUT_DIR}/7A-PIN.csv · Tài khoản GV mẫu: ${OUT_DIR}/giao-vien-mau.txt`);
}

async function clear() {
  const db = adminDb();
  const classes = await db.collection(COL.classes).where("isSample", "==", true).get();
  for (const c of classes.docs) {
    const students = await c.ref.collection(COL.students).select().get();
    await deleteStudents(c.id, students.docs.map((d) => d.id));
    // Xoá luôn các tiết đã dạy + thống kê của lớp mẫu
    const sessions = await db.collection(COL.sessions).where("classId", "==", c.id).get();
    await Promise.all(sessions.docs.map((d) => db.recursiveDelete(d.ref)));
    const stats = await db.collection(COL.stats).where("classId", "==", c.id).get();
    await Promise.all(stats.docs.map((d) => d.ref.delete()));
    await c.ref.delete();
  }
  const users = await db.collection(COL.users).where("isSample", "==", true).get();
  for (const u of users.docs) {
    await adminAuth().deleteUser(u.id).catch(() => undefined);
    await u.ref.delete();
  }
  console.log(`✔ Đã xoá ${classes.size} lớp mẫu và ${users.size} GV mẫu.`);
}

try {
  if (process.argv.includes("--clear")) await clear();
  else await seed();
  process.exit(0);
} catch (e) {
  console.error("✘ Lỗi:", e instanceof Error ? e.message : e);
  process.exit(1);
}
