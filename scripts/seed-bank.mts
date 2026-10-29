// Nạp ngân hàng câu hỏi dựng sẵn Toán 6–9 (bài trọng tâm) vào Firestore: npm run seed:bank
//   --dry-run  chỉ kiểm tra, không ghi
//   --remove   gỡ toàn bộ câu do bộ này tạo (seed = kho-bank-toan-v1; không đụng câu của KHTN)
// Mã cố định khot-<bài>-<số>; câu ĐÃ CÓ thì giữ nguyên (GV có thể đã sửa) — chỉ thêm câu mới.
import { existsSync } from "node:fs";
import { FieldValue } from "firebase-admin/firestore";

if (existsSync(".env.local") && !process.env.FIRESTORE_EMULATOR_HOST) process.loadEnvFile(".env.local");
const { adminDb } = await import("../src/lib/firebase/admin");
const { COL } = await import("../src/lib/namespace");
const { sanitizeBankInput, toKey, toSlide } = await import("../src/lib/bank/questions");
const { BANK_SEED, KHO_BANK, bankDocId } = await import("../src/lib/bank/kho/index");

const DRY = process.argv.includes("--dry-run");
const REMOVE = process.argv.includes("--remove");

try {
  const db = adminDb();
  if (REMOVE) {
    const s = await db.collection(COL.questions).where("seed", "==", BANK_SEED).get();
    for (let i = 0; i < s.docs.length; i += 400) {
      const b = db.batch();
      s.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
      await b.commit();
    }
    console.log(`✔ Đã gỡ ${s.size} câu hỏi của bộ ngân hàng Toán.`);
    process.exit(0);
  }

  // Kiểm tra bằng đúng hàm kiểm tra của app
  const rows = KHO_BANK.map((q) => {
    const { key: _k, ...input } = q;
    void _k;
    const clean = sanitizeBankInput(input);
    if (typeof clean === "string") throw new Error(`${bankDocId(q)}: ${clean}`);
    return { id: bankDocId(q), b: clean };
  });
  const lessons = new Set(rows.map((r) => r.b.curLessonId)).size;
  console.log(`Ngân hàng Toán: ${rows.length} câu · ${lessons} bài`);
  if (DRY) {
    console.log("(--dry-run: không ghi gì)");
    process.exit(0);
  }

  const refs = rows.map((r) => db.collection(COL.questions).doc(r.id));
  const snaps = await db.getAll(...refs);
  let added = 0;
  for (let i = 0; i < rows.length; i += 400) {
    const batch = db.batch();
    rows.slice(i, i + 400).forEach((r, k) => {
      if (snaps[i + k].exists) return; // giữ nguyên câu đã có
      added++;
      batch.set(refs[i + k], {
        ...r.b,
        slide: JSON.parse(JSON.stringify(toSlide(r.id, r.b))),
        key: toKey(r.b),
        status: "approved",
        aiDraft: false,
        createdBy: "kho",
        createdByName: "Ngân hàng Toán",
        schoolId: null,
        seed: BANK_SEED,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
  console.log(`✔ Thêm mới ${added} câu (Đã duyệt), giữ nguyên ${rows.length - added} câu đã có → ${COL.questions}`);
  process.exit(0);
} catch (e) {
  console.error("✘ " + (e instanceof Error ? e.message : e));
  process.exit(1);
}
