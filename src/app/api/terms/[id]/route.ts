// GĐ 6 — Sửa / duyệt / xoá thuật ngữ.
// GV chỉ sửa, xoá thuật ngữ mình thêm và chưa duyệt; sửa xong quay lại "Chờ duyệt". Quản trị làm được tất cả.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { sanitizeTerm, termId } from "@/lib/lessons/terms";
import { HttpError, handle, ok, readJson, requireAuth, type AuthedUser } from "@/lib/server/api";
import type { TermDoc } from "@/lib/study/types";

async function load(id: string, user: AuthedUser) {
  const ref = adminDb().collection(COL.terms).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy thuật ngữ.");
  const term = snap.data() as TermDoc;
  const admin = user.role === "admin";
  const mine = !!term.createdBy && term.createdBy === user.uid && term.status !== "approved";
  return { ref, term, admin, mine };
}

export const PUT = handle(async (req: Request, ctx: RouteContext<"/api/terms/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, admin, mine } = await load(id, user);
  const body = await readJson<Record<string, unknown> & { status?: string }>(req);

  // Chỉ đổi trạng thái (quản trị duyệt / trả lại)
  if (body.status && !body.en) {
    if (!admin) throw new HttpError(403, "Chỉ quản trị duyệt thuật ngữ.");
    if (body.status !== "approved" && body.status !== "draft") throw new HttpError(400, "Trạng thái không hợp lệ.");
    await ref.update({ status: body.status, updatedAt: FieldValue.serverTimestamp() });
    return ok({ ok: true });
  }

  if (!admin && !mine) throw new HttpError(403, "Bạn chỉ sửa được thuật ngữ mình thêm (khi chưa duyệt).");
  const t = sanitizeTerm(body);
  if (typeof t === "string") throw new HttpError(400, t);
  // Đổi chữ tiếng Anh sẽ đổi mã → không cho, hãy thêm thuật ngữ mới
  if (termId(t.en) !== id) throw new HttpError(400, "Không đổi được chữ tiếng Anh. Hãy xoá và thêm thuật ngữ mới.");
  await ref.update({
    ...JSON.parse(JSON.stringify(t)),
    readAs: t.readAs ?? FieldValue.delete(),
    example: t.example ?? FieldValue.delete(),
    status: admin ? "approved" : "pending",
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/terms/[id]">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, term, admin, mine } = await load(id, user);
  if (!admin && !mine) throw new HttpError(403, "Bạn chỉ xoá được thuật ngữ mình thêm (khi chưa duyệt).");
  if (term.lessonIds?.length) throw new HttpError(409, "Thuật ngữ đang dùng trong tiết học đã duyệt, không xoá được.");
  await ref.delete();
  return ok({ ok: true });
});
