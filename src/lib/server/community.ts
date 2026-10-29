// Cộng đồng học tập phía máy chủ: người viết (HS / GV), giới hạn lượt đăng của HS mỗi ngày
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, type AuthedUser } from "@/lib/server/api";
import { displayNameOf } from "@/lib/server/lesson-store";
import { vnDayKey } from "@/lib/live/summary";
import { COMMUNITY_LIMITS, displayName, type AuthorRole, type PostDoc, type ReplyDoc } from "@/lib/community/posts";
import type { ClassDoc, StudentDoc } from "@/lib/types";

export interface Author {
  uid: string;
  name: string;
  role: AuthorRole;
  team: number | null;
  cls: ClassDoc;
}

/** Ai đang viết vào lớp classId: HS của lớp (tên gọi + tổ) hoặc GV / quản trị của lớp */
export async function authorFor(classId: string, user: AuthedUser): Promise<Author> {
  if (user.role === "student") {
    if (!user.classIds?.includes(classId)) throw new HttpError(403, "Em không thuộc lớp này.");
    const db = adminDb();
    const [clsSnap, st] = await Promise.all([db.collection(COL.classes).doc(classId).get(), db.collection(COL.classes).doc(classId).collection(COL.students).doc(user.uid).get()]);
    if (!clsSnap.exists || !st.exists) throw new HttpError(403, "Không tìm thấy em trong danh sách lớp.");
    const me = st.data() as StudentDoc;
    return { uid: user.uid, name: displayName(me.fullName), role: "student", team: me.team ?? null, cls: { id: clsSnap.id, ...clsSnap.data() } as ClassDoc };
  }
  const { cls } = await getClassForStaff(classId, user);
  return { uid: user.uid, name: await displayNameOf(user), role: "teacher", team: null, cls };
}

/** Giữ 1 lượt đăng của HS hôm nay (lưu ở lsn_private — client không đọc được) */
export async function reserveStudentPost(uid: string, now = Date.now()) {
  const ref = adminDb().collection(COL.private).doc("communityRate").collection("items").doc(`${uid}_${vnDayKey(now)}`);
  await adminDb().runTransaction(async (tx) => {
    const n = ((await tx.get(ref)).get("count") as number | undefined) ?? 0;
    if (n >= COMMUNITY_LIMITS.perStudentPerDay) throw new HttpError(429, `Hôm nay em đã đăng ${COMMUNITY_LIMITS.perStudentPerDay} lần rồi, mai tiếp tục nhé.`);
    tx.set(ref, { uid, count: FieldValue.increment(1), at: now }, { merge: true });
  });
}

// ---- Đọc qua máy chủ (dự phòng khi trình duyệt bị rules Firestore chặn) — cùng quyền như firestore.rules ----

type Wire<T> = Omit<T, "createdAt"> & { createdAt: number | null };
const toWire = <T>(d: FirebaseFirestore.QueryDocumentSnapshot): Wire<T> => {
  const x = d.data();
  return { ...(x as T), id: d.id, createdAt: (x.createdAt as FirebaseFirestore.Timestamp | undefined)?.toMillis?.() ?? null } as Wire<T>;
};

/** Ai được đọc lớp: GV của lớp / quản trị cùng trường → mọi bài; HS của lớp → bài đã duyệt + bài của mình */
async function readerOf(classId: string, user: AuthedUser): Promise<"staff" | "student"> {
  if (user.role === "student") {
    if (!user.classIds?.includes(classId)) throw new HttpError(403, "Em không thuộc lớp này.");
    return "student";
  }
  await getClassForStaff(classId, user);
  return "staff";
}

const visible = (who: "staff" | "student", uid: string) => (x: { status?: string; authorUid?: string }) => who === "staff" || x.status === "approved" || x.authorUid === uid;

export async function listPosts(classId: string, user: AuthedUser) {
  const who = await readerOf(classId, user);
  const snap = await adminDb().collection(COL.posts).where("classId", "==", classId).get();
  return snap.docs.map((d) => toWire<PostDoc>(d)).filter(visible(who, user.uid));
}

export async function listReplies(postId: string, user: AuthedUser) {
  const { ref, post } = await loadPost(postId);
  const who = await readerOf(post.classId, user);
  const snap = await ref.collection(COL.replies).get();
  return snap.docs.map((d) => toWire<ReplyDoc>(d)).filter(visible(who, user.uid));
}

export async function loadPost(id: string) {
  if (!id || id.length > 64) throw new HttpError(400, "Thiếu bài viết.");
  const ref = adminDb().collection(COL.posts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy bài viết (có thể đã bị xoá).");
  return { ref, post: { id: snap.id, ...snap.data() } as PostDoc };
}
