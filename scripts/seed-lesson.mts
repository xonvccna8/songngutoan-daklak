// Nạp (hoặc cập nhật) tiết mẫu "Định lí Pythagore" (Toán 8 · Bài 35) vào Firestore: npm run seed:lesson
// Firebase dùng chung với trang KHTN: thuật ngữ trùng tên đang thuộc bài KHTN thì bỏ qua, không ghi đè.
// Đáp án & ghi chú GV nằm riêng ở lsn_lessons/{id}/teacher/* (học sinh không đọc được).
import { existsSync } from "node:fs";
import { FieldValue } from "firebase-admin/firestore";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { adminDb } = await import("../src/lib/firebase/admin");
const { COL } = await import("../src/lib/namespace");
const { LESSON, LESSON_ID, SLIDES, KEYS, TERMS, TERM_EXAMPLES, termId } = await import("../src/lib/lessons/pythagore");

// Firestore không nhận giá trị undefined → bỏ đi
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

try {
  const db = adminDb();
  const ref = db.collection(COL.lessons).doc(LESSON_ID);
  const batch = db.batch();
  batch.set(ref, {
    ...LESSON,
    slideIds: SLIDES.map((s) => s.id),
    terms: TERMS,
    ownerId: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  for (const s of SLIDES) {
    batch.set(ref.collection(COL.slides).doc(s.id), clean(s));
    batch.set(ref.collection(COL.teacherKeys).doc(s.id), clean(KEYS[s.id]));
  }
  // Ngân hàng thuật ngữ (dùng cho thẻ từ vựng tự học)
  const termSnaps = await db.getAll(...TERMS.map((t) => db.collection(COL.terms).doc(termId(t.en))));
  for (const [i, t] of TERMS.entries()) {
    const cur = (termSnaps[i].get("curLessonIds") as string[] | undefined) ?? [];
    if (cur.some((id) => /^n\d/.test(id))) continue;
    batch.set(
      db.collection(COL.terms).doc(termId(t.en)),
      { en: t.en, ipa: t.ipa, vi: t.vi, example: TERM_EXAMPLES[t.en] ?? null, grade: LESSON.grade, status: "approved", lessonIds: FieldValue.arrayUnion(LESSON_ID), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
  console.log(`✔ Đã nạp tiết "${LESSON.title.vi}" (${SLIDES.length} trang, ${TERMS.length} thuật ngữ) → ${COL.lessons}/${LESSON_ID} + ${COL.terms}`);
  process.exit(0);
} catch (e) {
  console.error("✘ " + (e instanceof Error ? e.message : e));
  process.exit(1);
}
