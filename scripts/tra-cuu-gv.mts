// CHỈ ĐỌC: tra cứu tài khoản GV, lớp và tiết học của GV đó (không ghi gì lên Firestore).
//   npx tsx scripts/tra-cuu-gv.mts ten@gmail.com "Tên gợi nhớ"
import { existsSync, readdirSync, readFileSync } from "node:fs";

if (existsSync(".env.local") && !process.env.FIRESTORE_EMULATOR_HOST) process.loadEnvFile(".env.local");
const { adminDb, adminAuth } = await import("../src/lib/firebase/admin");
const { COL } = await import("../src/lib/namespace");
const { isMathLesson } = await import("../src/lib/subject");

const email = process.argv[2];
const nameHint = (process.argv[3] ?? "").toLowerCase();
const db = adminDb();
const auth = adminAuth();

const users = (await auth.listUsers(1000)).users.filter(
  (u) => u.email?.toLowerCase() === email.toLowerCase() || (nameHint && u.displayName?.toLowerCase().includes(nameHint))
);
console.log(`\n== Tài khoản Auth khớp (${users.length}) ==`);
for (const u of users) {
  console.log(`- uid=${u.uid} · ${u.email} · ${u.displayName} · providers=${u.providerData.map((p) => p.providerId).join(",")} · tạo ${u.metadata.creationTime} · đăng nhập ${u.metadata.lastSignInTime} · claims=${JSON.stringify(u.customClaims ?? {})} · disabled=${u.disabled}`);
}
const uids = new Set(users.map((u) => u.uid));

const lsnUsers = (await db.collection(COL.users).get()).docs.filter(
  (d) => uids.has(d.id) || d.get("email")?.toLowerCase() === email.toLowerCase() || (nameHint && String(d.get("displayName") ?? d.get("name") ?? "").toLowerCase().includes(nameHint))
);
console.log(`\n== lsn_users (${lsnUsers.length}) ==`);
lsnUsers.forEach((d) => { uids.add(d.id); console.log(`- ${d.id} · ${JSON.stringify(d.data())}`); });

const classes = (await db.collection(COL.classes).get()).docs;
console.log(`\n== Tổng số lớp trên Firestore: ${classes.length} ==`);
for (const c of classes) {
  const mine = (c.get("teacherIds") ?? []).some((t: string) => uids.has(t));
  console.log(`${mine ? "★" : " "} ${c.id} · ${c.get("name")} · khối ${c.get("grade")} · trường ${c.get("schoolId")} · teacherIds=${JSON.stringify(c.get("teacherIds"))}`);
}

const lessons = (await db.collection(COL.lessons).get()).docs;
const mineL = lessons.filter((l) => uids.has(l.get("ownerId")));
console.log(`\n== Tiết học: tổng ${lessons.length}, của GV này ${mineL.length} ==`);
for (const l of mineL) {
  const x = l.data();
  console.log(`- ${l.id} · ${x.title?.vi ?? x.title} · khối ${x.grade} · môn ${x.subject ?? "-"} · bài ${x.curLessonId ?? "-"} · trạng thái ${x.status} · ${isMathLesson(x) ? "BỊ ẨN (Toán)" : "hiện"}`);
}
const owners = new Map<string, number>();
lessons.forEach((l) => owners.set(String(l.get("ownerId")), (owners.get(String(l.get("ownerId"))) ?? 0) + 1));
console.log(`Số tiết theo ownerId: ${JSON.stringify(Object.fromEntries(owners))}`);

for (const f of existsSync("data-backup") ? readdirSync("data-backup") : []) {
  const txt = readFileSync(`data-backup/${f}`, "utf8");
  const hits = [...uids].map((u) => `${u}:${txt.split(u).length - 1}`).join(" ");
  console.log(`\nSao lưu ${f}: số lần xuất hiện uid → ${hits}`);
}
process.exit(0);
