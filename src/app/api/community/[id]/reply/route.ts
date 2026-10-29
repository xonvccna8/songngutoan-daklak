// Cộng đồng học tập — trả lời một bài đã duyệt. Trả lời của HS chờ GV duyệt; của GV hiện ngay.
import { FieldValue } from "firebase-admin/firestore";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { authorFor, listReplies, loadPost, reserveStudentPost } from "@/lib/server/community";
import { cleanPostText } from "@/lib/community/posts";

// GET — các trả lời của bài (dự phòng khi trình duyệt không đọc trực tiếp Firestore được)
export const GET = handle(async (req: Request, ctx: RouteContext<"/api/community/[id]/reply">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  return ok({ replies: await listReplies(id, user) });
});

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/community/[id]/reply">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  const { ref, post } = await loadPost(id);
  const a = await authorFor(post.classId, user);
  if (post.status !== "approved") throw new HttpError(409, "Bài này chưa được duyệt nên chưa trả lời được.");
  const b = await readJson<{ text?: string; english?: boolean }>(req);
  const text = cleanPostText(b.text, a.role);
  if (typeof text !== "string") throw new HttpError(400, text.error);
  if (a.role === "student") await reserveStudentPost(a.uid);

  const approved = a.role === "teacher";
  const r = ref.collection(COL.replies).doc();
  await r.set({ authorUid: a.uid, authorName: a.name, authorRole: a.role, team: a.team, text, english: !!b.english, status: approved ? "approved" : "pending", createdAt: FieldValue.serverTimestamp() });
  if (approved) await ref.update({ replyCount: FieldValue.increment(1) });
  return ok({ id: r.id, pending: !approved }, 201);
});
