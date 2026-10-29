// Nạp kho học liệu Toán 6–9 vào Firestore: npm run seed:kho
//   --dry-run  chỉ kiểm tra + in số lượng, không ghi
//   --remove   gỡ toàn bộ học liệu + thuật ngữ do kho này tạo (thuật ngữ có sẵn của GV chỉ bị bỏ gắn bài)
// Học liệu: lsn_resources/kho-<bài>-NN (Đã duyệt). Thuật ngữ: lsn_terms/<mã tiếng Anh> — thuật ngữ đã có thì KHÔNG ghi đè,
// chỉ gắn thêm curLessonIds để hiện ở "Xem trước bài" và trình soạn bài.
// FIREBASE DÙNG CHUNG VỚI TRANG KHTN: thuật ngữ đã có mà thuộc bài KHTN (mã "n…") thì BỎ QUA hẳn, không sửa gì.
import { existsSync } from "node:fs";
import { FieldValue } from "firebase-admin/firestore";

if (existsSync(".env.local") && !process.env.FIRESTORE_EMULATOR_HOST) process.loadEnvFile(".env.local");
const { adminDb } = await import("../src/lib/firebase/admin");
const { COL } = await import("../src/lib/namespace");
const { sanitizeResource } = await import("../src/lib/library/resources");
const { termId } = await import("../src/lib/lessons/terms");
const { GRADES, curLesson } = await import("../src/lib/curriculum");
const { KHO_COMMON, KHO_TOAN, KHO_SEED, khoCommonId, khoResourceId } = await import("../src/lib/library/kho-toan");

const DRY = process.argv.includes("--dry-run");
const REMOVE = process.argv.includes("--remove");
const META = { createdBy: "kho", createdByName: "Kho học liệu Toán", schoolId: null, seed: KHO_SEED };

try {
  const db = adminDb();

  if (REMOVE) {
    const res = await db.collection(COL.resources).where("seed", "==", KHO_SEED).get();
    const terms = await db.collection(COL.terms).where("seed", "==", KHO_SEED).get();
    // Chỉ gỡ đúng dữ liệu do kho Toán này tạo (seed = KHO_SEED) — không đụng dữ liệu KHTN
    const ids = KHO_TOAN.map((l) => l.curLessonId);
    const linked = new Map<string, FirebaseFirestore.DocumentReference>();
    for (let i = 0; i < ids.length; i += 30) {
      const s = await db.collection(COL.terms).where("curLessonIds", "array-contains-any", ids.slice(i, i + 30)).get();
      s.docs.filter((d) => d.get("seed") !== KHO_SEED).forEach((d) => linked.set(d.id, d.ref));
    }
    const ops = [...res.docs.map((d) => (b: FirebaseFirestore.WriteBatch) => b.delete(d.ref)), ...terms.docs.map((d) => (b: FirebaseFirestore.WriteBatch) => b.delete(d.ref))];
    linked.forEach((ref) => ops.push((b) => b.update(ref, { curLessonIds: FieldValue.arrayRemove(...ids) })));
    for (let i = 0; i < ops.length; i += 400) {
      const batch = db.batch();
      ops.slice(i, i + 400).forEach((op) => op(batch));
      await batch.commit();
    }
    console.log(`✔ Đã gỡ ${res.size} học liệu, ${terms.size} thuật ngữ của kho; bỏ gắn bài Toán ở ${linked.size} thuật ngữ có sẵn.`);
    process.exit(0);
  }

  // ---- Kiểm tra dữ liệu trước khi ghi (cùng hàm kiểm tra như khi GV thêm tay) ----
  const resources: { id: string; data: Record<string, unknown> }[] = [];
  const add = (id: string, r: (typeof KHO_COMMON)[number], grade: number, curLessonId: string | null) => {
    const clean = sanitizeResource({ ...r, grade, curLessonId });
    if (typeof clean === "string") throw new Error(`Học liệu ${id} không hợp lệ: ${clean} (${r.url})`);
    resources.push({ id, data: { ...clean, status: "approved", ...META } });
  };
  for (const g of GRADES) KHO_COMMON.forEach((r, i) => add(khoCommonId(g, i), r, g, null));
  for (const l of KHO_TOAN) {
    const cur = curLesson(l.curLessonId);
    if (!cur) throw new Error(`Không có bài ${l.curLessonId} trong khung chương trình.`);
    l.resources.forEach((r, i) => add(khoResourceId(l.curLessonId, i), r, cur.grade, l.curLessonId));
  }
  // Thuật ngữ: gộp theo mã (một thuật ngữ có thể thuộc nhiều bài)
  const terms = new Map<string, { en: string; ipa: string; vi: string; lessons: string[] }>();
  for (const l of KHO_TOAN)
    for (const t of l.terms) {
      const id = termId(t.en);
      const cur = terms.get(id);
      if (cur) cur.lessons.push(l.curLessonId);
      else terms.set(id, { ...t, lessons: [l.curLessonId] });
    }

  console.log(`Kho Toán 6–9: ${KHO_TOAN.length} bài · ${resources.length} học liệu · ${terms.size} thuật ngữ`);
  if (DRY) {
    console.log("(--dry-run: không ghi gì)");
    process.exit(0);
  }

  // ---- Ghi học liệu (id cố định → chạy lại chỉ cập nhật) ----
  for (let i = 0; i < resources.length; i += 400) {
    const batch = db.batch();
    resources.slice(i, i + 400).forEach((r) => batch.set(db.collection(COL.resources).doc(r.id), { ...r.data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true }));
    await batch.commit();
  }

  // ---- Ghi thuật ngữ: chưa có → tạo (Đã duyệt, khối của bài đầu tiên); đã có → chỉ gắn thêm bài ----
  const refs = [...terms.keys()].map((id) => db.collection(COL.terms).doc(id));
  const snaps = await db.getAll(...refs);
  let created = 0;
  let linked = 0;
  const science: string[] = [];
  const ops: ((b: FirebaseFirestore.WriteBatch) => void)[] = [];
  snaps.forEach((s, i) => {
    const t = terms.get(refs[i].id)!;
    if (s.exists) {
      // Thuật ngữ của trang KHTN (gắn bài "n…") → để nguyên, không sửa
      const cur = (s.get("curLessonIds") as string[] | undefined) ?? [];
      if (cur.some((id) => /^n\d/.test(id))) {
        science.push(t.en);
        return;
      }
      // Đã có (của GV Toán, hoặc của kho từ lần nạp trước) → chỉ gắn thêm bài, không ghi đè nội dung
      linked++;
      ops.push((b) => b.update(s.ref, { curLessonIds: FieldValue.arrayUnion(...t.lessons), updatedAt: FieldValue.serverTimestamp() }));
    } else {
      created++;
      const grade = curLesson(t.lessons[0])!.grade;
      ops.push((b) =>
        b.set(s.ref, { en: t.en, ipa: t.ipa, vi: t.vi, grade, status: "approved", lessonIds: [], curLessonIds: t.lessons, imageUrl: null, ...META, updatedAt: FieldValue.serverTimestamp() })
      );
    }
  });
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }

  console.log(`✔ Đã nạp ${resources.length} học liệu (Đã duyệt) → ${COL.resources}`);
  console.log(`✔ Thuật ngữ: tạo mới ${created}, đã có sẵn (giữ nguyên nội dung, chỉ gắn bài) ${linked} → ${COL.terms}`);
  if (science.length) console.log(`  Bỏ qua ${science.length} thuật ngữ trùng tên đang thuộc trang KHTN (không sửa): ${science.join(", ")}`);
  process.exit(0);
} catch (e) {
  console.error("✘ " + (e instanceof Error ? e.message : e));
  process.exit(1);
}
