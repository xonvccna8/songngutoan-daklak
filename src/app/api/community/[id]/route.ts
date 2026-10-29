// Cộng đồng học tập — GV kiểm duyệt: duyệt / ẩn bài hoặc trả lời, chọn "trả lời hay nhất" (+XP cho HS), xoá trả lời.
// DELETE: GV xoá bài (kèm các trả lời); HS chỉ xoá được bài của mình khi còn chờ duyệt.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadPost } from "@/lib/server/community";
import { awardXpSafe } from "@/lib/server/xp";
import { XP } from "@/lib/progress/xp";
import type { ReplyDoc } from "@/lib/community/posts";

type Action = "approve" | "hide" | "best" | "delete";

export const PUT = handle(async (req: Request, ctx: RouteContext<"/api/community/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, post } = await loadPost(id);
  await getClassForStaff(post.classId, user);
  const b = await readJson<{ action?: Action; replyId?: string }>(req);

  // Thao tác trên bài
  if (!b.replyId) {
    if (b.action !== "approve" && b.action !== "hide") throw new HttpError(400, "Thao tác không hợp lệ.");
    await ref.update({ status: b.action === "approve" ? "approved" : "hidden" });
    return ok({ ok: true });
  }

  // Thao tác trên một trả lời (đếm lại replyCount = số trả lời đang hiện)
  const rRef = ref.collection(COL.replies).doc(String(b.replyId));
  const result = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(rRef);
    if (!snap.exists) throw new HttpError(404, "Không tìm thấy câu trả lời.");
    const r = { id: snap.id, ...snap.data() } as ReplyDoc;
    const wasShown = r.status === "approved";
    if (b.action === "approve" || b.action === "hide") {
      const show = b.action === "approve";
      tx.update(rRef, { status: show ? "approved" : "hidden" });
      if (show !== wasShown) tx.update(ref, { replyCount: FieldValue.increment(show ? 1 : -1), ...(!show && post.bestReplyId === r.id ? { bestReplyId: null } : {}) });
      return { r, best: false };
    }
    if (b.action === "best") {
      if (!wasShown) throw new HttpError(409, "Hãy duyệt câu trả lời trước.");
      tx.update(ref, { bestReplyId: post.bestReplyId === r.id ? null : r.id });
      return { r, best: post.bestReplyId !== r.id };
    }
    if (b.action === "delete") {
      tx.delete(rRef);
      if (wasShown) tx.update(ref, { replyCount: FieldValue.increment(-1), ...(post.bestReplyId === r.id ? { bestReplyId: null } : {}) });
      return { r, best: false };
    }
    throw new HttpError(400, "Thao tác không hợp lệ.");
  });

  // Trả lời hay nhất của HS → +XP (mỗi câu trả lời chỉ 1 lần)
  if (result.best && result.r.authorRole === "student") {
    await awardXpSafe([{ uid: result.r.authorUid, classId: post.classId, kind: "community", scope: "home", xp: XP.communityBest, key: `community_${post.id}_${result.r.id}`, note: post.text.slice(0, 60) }]);
  }
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/community/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  const { ref, post } = await loadPost(id);
  if (user.role === "student") {
    if (post.authorUid !== user.uid || post.status !== "pending") throw new HttpError(403, "Em chỉ xoá được bài của mình khi còn chờ duyệt.");
  } else await getClassForStaff(post.classId, user);
  await adminDb().recursiveDelete(ref);
  return ok({ ok: true });
});
