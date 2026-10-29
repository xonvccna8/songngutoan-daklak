// Cộng đồng học tập — đăng bài (câu hỏi / chia sẻ) trong lớp. HS đăng → "Chờ duyệt"; GV đăng → hiện ngay.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { authorFor, listPosts, reserveStudentPost } from "@/lib/server/community";
import { cleanPostText, type PostKind } from "@/lib/community/posts";
import { isCurLessonId } from "@/lib/curriculum";

// GET ?classId= — danh sách bài (dự phòng khi trình duyệt không đọc trực tiếp Firestore được)
export const GET = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  const classId = new URL(req.url).searchParams.get("classId");
  if (!classId || classId.length > 64) throw new HttpError(400, "Thiếu lớp.");
  return ok({ posts: await listPosts(classId, user) });
});

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  const b = await readJson<{ classId?: string; kind?: PostKind; text?: string; curLessonId?: string; english?: boolean }>(req);
  if (typeof b.classId !== "string") throw new HttpError(400, "Thiếu lớp.");
  const a = await authorFor(b.classId, user);
  const text = cleanPostText(b.text, a.role);
  if (typeof text !== "string") throw new HttpError(400, text.error);
  if (a.role === "student") await reserveStudentPost(a.uid);

  const ref = adminDb().collection(COL.posts).doc();
  await ref.set({
    classId: a.cls.id,
    schoolId: a.cls.schoolId,
    authorUid: a.uid,
    authorName: a.name,
    authorRole: a.role,
    team: a.team,
    kind: b.kind === "share" ? "share" : "question",
    text,
    curLessonId: isCurLessonId(b.curLessonId) ? b.curLessonId : null,
    english: !!b.english,
    status: a.role === "student" ? "pending" : "approved",
    replyCount: 0,
    bestReplyId: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ok({ id: ref.id, pending: a.role === "student" }, 201);
});
