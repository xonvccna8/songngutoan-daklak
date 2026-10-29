// Chuyển lớp + tiết học + dự án STEM đang chạy từ GV cũ sang GV mới (theo email).
//   npx tsx scripts/chuyen-lop-gv.mts --from=cu@gmail.com --to=moi@gmail.com            → chỉ liệt kê
//   npx tsx scripts/chuyen-lop-gv.mts --from=cu@gmail.com --to=moi@gmail.com --apply    → sao lưu ra data-backup/ rồi mới ghi
// Không đổi lịch sử (phiên dạy, trò chơi, tin nhắn đã gửi) — giữ đúng người đã làm.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

if (existsSync(".env.local") && !process.env.FIRESTORE_EMULATOR_HOST) process.loadEnvFile(".env.local");
const { adminDb, adminAuth } = await import("../src/lib/firebase/admin");
const { COL } = await import("../src/lib/namespace");

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const APPLY = process.argv.includes("--apply");

try {
  const db = adminDb();
  const from = await adminAuth().getUserByEmail(arg("from")!);
  const to = await adminAuth().getUserByEmail(arg("to")!);
  const toName = (await db.collection(COL.users).doc(to.uid).get()).get("displayName") ?? to.displayName ?? to.email;
  console.log(`Từ: ${from.email} (${from.uid}) → Sang: ${to.email} (${to.uid}) · tên "${toName}"`);

  const classes = (await db.collection(COL.classes).where("teacherIds", "array-contains", from.uid).get()).docs;
  const classIds = new Set(classes.map((c) => c.id));
  const lessons = (await db.collection(COL.lessons).where("ownerId", "==", from.uid).get()).docs;
  const projects = (await db.collection(COL.projects).where("teacherId", "==", from.uid).get()).docs.filter((p) => classIds.has(p.get("classId")));

  console.log(`\nLớp (${classes.length}):`);
  classes.forEach((c) => console.log(`   - ${c.get("name")} · ${c.get("studentCount") ?? 0} HS`));
  console.log(`Tiết học (${lessons.length}):`);
  lessons.forEach((l) => console.log(`   - ${l.get("title")?.vi ?? l.get("title")} · ${l.get("status")}`));
  console.log(`Dự án STEM (${projects.length}):`);
  projects.forEach((p) => console.log(`   - ${p.get("title")?.vi ?? p.get("title")}`));

  if (!APPLY) {
    console.log("\n(Chỉ liệt kê. Chạy lại với --apply để sao lưu rồi ghi.)");
    process.exit(0);
  }

  const all = [...classes, ...lessons, ...projects];
  mkdirSync("data-backup", { recursive: true });
  const file = `data-backup/chuyen-gv-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(all.map((d) => ({ path: d.ref.path, data: d.data() })), null, 1));
  console.log(`\n✔ Đã sao lưu → ${file}`);

  const batch = db.batch();
  classes.forEach((c) => batch.update(c.ref, { teacherIds: (c.get("teacherIds") as string[]).map((t) => (t === from.uid ? to.uid : t)).filter((t, i, a) => a.indexOf(t) === i) }));
  lessons.forEach((l) => batch.update(l.ref, { ownerId: to.uid, ownerName: toName }));
  projects.forEach((p) => batch.update(p.ref, { teacherId: to.uid, teacherName: toName }));
  await batch.commit();
  console.log(`✔ Đã chuyển ${classes.length} lớp, ${lessons.length} tiết, ${projects.length} dự án sang ${to.email}.`);
  process.exit(0);
} catch (e) {
  console.error("✘ " + (e instanceof Error ? e.message : e));
  process.exit(1);
}
