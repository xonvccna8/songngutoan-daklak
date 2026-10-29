// GĐ 6 — Lưu / nhân bản / xoá / duyệt tiết học (Admin SDK). Mọi thao tác ghi tiết đều đi qua đây.
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, type AuthedUser } from "@/lib/server/api";
import { metaOf, problemsOf, type EditorSlide, type LessonMeta } from "@/lib/lessons/editor";
import { termId } from "@/lib/lessons/terms";
import type { LessonDoc, LessonStatus, Slide, TeacherKey } from "@/lib/live/types";

// Firestore không nhận undefined → bỏ đi
const clean = <T>(o: T): T => JSON.parse(JSON.stringify(o));

export async function displayNameOf(user: AuthedUser) {
  return user.name || ((await adminDb().collection(COL.users).doc(user.uid).get()).get("displayName") as string | undefined) || "Giáo viên";
}

export async function getLesson(id: string) {
  const ref = adminDb().collection(COL.lessons).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy tiết học.");
  return { ref, lesson: { id: snap.id, ...snap.data() } as LessonDoc };
}

/** Người soạn, hoặc quản trị cùng trường. Tiết mẫu (không có người soạn) chỉ nhân bản được. */
export const isOwner = (l: LessonDoc, u: AuthedUser) => !!l.ownerId && l.ownerId === u.uid;
export const isSchoolAdmin = (l: LessonDoc, u: AuthedUser) => u.role === "admin" && !!l.ownerId && l.schoolId === u.schoolId;

export function assertCanEdit(l: LessonDoc, u: AuthedUser) {
  if (!isOwner(l, u) && !isSchoolAdmin(l, u)) throw new HttpError(403, "Bạn chỉ sửa được bài của mình.");
  if (l.status === "approved") throw new HttpError(409, "Bài đã duyệt không sửa trực tiếp được. Hãy nhân bản hoặc chuyển về nháp.");
  if (l.status === "pending" && !isSchoolAdmin(l, u)) throw new HttpError(409, "Bài đang chờ duyệt. Bấm “Rút lại” để sửa tiếp.");
}

async function readSlides(ref: DocumentReference) {
  const [s, k] = await Promise.all([ref.collection(COL.slides).get(), ref.collection(COL.teacherKeys).get()]);
  return { slides: s.docs.map((d) => d.data() as Slide), keys: new Map(k.docs.map((d) => [d.id, d.data() as TeacherKey])) };
}

/** Ghi toàn bộ nội dung tiết: thông tin + từng trang + đáp án; xoá trang đã bỏ */
export async function writeLesson(ref: DocumentReference, meta: LessonMeta, slides: EditorSlide[], extra: Record<string, unknown> = {}) {
  const db = adminDb();
  const old = await ref.collection(COL.slides).select().get();
  const keep = new Set(slides.map((s) => s.id));
  const batch = db.batch();
  // extra có thể chứa FieldValue (createdAt) → không đi qua clean()
  batch.set(ref, { ...clean({ ...meta, slideIds: slides.map((s) => s.id) }), ...extra, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  slides.forEach(({ key, ...s }, i) => {
    batch.set(ref.collection(COL.slides).doc(s.id), clean({ ...s, order: i }));
    batch.set(ref.collection(COL.teacherKeys).doc(s.id), clean(key));
  });
  old.docs.filter((d) => !keep.has(d.id)).forEach((d) => {
    batch.delete(d.ref);
    batch.delete(ref.collection(COL.teacherKeys).doc(d.id));
  });
  await batch.commit();
}

/** Tạo tiết mới (trống) hoặc nhân bản từ một tiết bất kì */
export async function createLesson(user: AuthedUser, meta: LessonMeta, slides: EditorSlide[], sourceId: string | null, more: Record<string, unknown> = {}) {
  const ref = adminDb().collection(COL.lessons).doc();
  await writeLesson(ref, meta, slides, {
    ...more,
    status: "draft",
    ownerId: user.uid,
    ownerName: await displayNameOf(user),
    schoolId: user.schoolId ?? null,
    sourceId,
    reviewNote: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function loadEditorSlides(ref: DocumentReference, slideIds: string[]): Promise<EditorSlide[]> {
  const { slides, keys } = await readSlides(ref);
  const byId = new Map(slides.map((s) => [s.id, s]));
  return slideIds.map((id) => byId.get(id)).filter((s): s is Slide => !!s).map((s) => ({ ...s, key: keys.get(s.id) ?? { notes: [] } }));
}

export async function deleteLesson(ref: DocumentReference) {
  const db = adminDb();
  const [s, k] = await Promise.all([ref.collection(COL.slides).select().get(), ref.collection(COL.teacherKeys).select().get()]);
  const batch = db.batch();
  [...s.docs, ...k.docs].forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();
}

/**
 * Chuyển trạng thái: Nháp → Chờ duyệt → Đã duyệt.
 * Người soạn: gửi duyệt / rút lại. Quản trị cùng trường: duyệt, trả lại, chuyển bài đã duyệt về nháp.
 */
export async function changeStatus(id: string, user: AuthedUser, to: LessonStatus, note: string | null) {
  const { ref, lesson } = await getLesson(id);
  const from = lesson.status;
  const owner = isOwner(lesson, user);
  const admin = isSchoolAdmin(lesson, user);
  if (!owner && !admin) throw new HttpError(403, "Bạn không có quyền với bài này.");

  const allowed =
    (from === "draft" && to === "pending" && owner) ||
    (from === "pending" && to === "draft" && (owner || admin)) ||
    ((from === "pending" || from === "draft") && to === "approved" && admin) ||
    (from === "approved" && to === "draft" && admin);
  if (!allowed) throw new HttpError(409, "Không chuyển được trạng thái này.");

  if (to === "pending" || to === "approved") {
    const problems = problemsOf(metaOf(lesson), await loadEditorSlides(ref, lesson.slideIds));
    if (problems.length) throw new HttpError(422, `Bài còn ${problems.length} chỗ cần sửa: ${problems[0].slide != null ? `trang ${problems[0].slide + 1} — ` : ""}${problems[0].msg}`);
  }
  if (from === "approved") {
    // Đang có lớp dạy bài này thì không gỡ (HS sẽ mất nội dung giữa tiết)
    const live = await adminDb().collection(COL.sessions).where("lessonId", "==", id).where("status", "==", "live").limit(1).get();
    if (!live.empty) throw new HttpError(409, "Bài đang được dạy trên lớp, hãy đợi kết thúc tiết.");
  }

  await ref.update({
    status: to,
    reviewNote: to === "draft" && from !== "draft" && admin && !owner ? note || "Quản trị đã trả lại bài để chỉnh sửa." : to === "approved" ? null : lesson.reviewNote ?? null,
    ...(to === "approved" ? { approvedBy: user.uid, approvedAt: FieldValue.serverTimestamp() } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Duyệt bài → gắn bài vào các thuật ngữ đã có trong ngân hàng (thẻ từ vựng tự học dùng)
  if (to === "approved" && lesson.terms?.length) {
    const db = adminDb();
    const refs = lesson.terms.map((t) => db.collection(COL.terms).doc(termId(t.en)));
    const snaps = await db.getAll(...refs);
    const batch = db.batch();
    snaps.filter((s) => s.exists).forEach((s) => batch.update(s.ref, { lessonIds: FieldValue.arrayUnion(id) }));
    await batch.commit();
  }
}
