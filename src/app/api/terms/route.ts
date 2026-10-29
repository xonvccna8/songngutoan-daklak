// GĐ 6 — Thêm thuật ngữ vào ngân hàng. GV thêm → "Chờ duyệt"; quản trị thêm → "Đã duyệt" luôn.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { sanitizeTerm, termId } from "@/lib/lessons/terms";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { displayNameOf } from "@/lib/server/lesson-store";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const t = sanitizeTerm(await readJson(req));
  if (typeof t === "string") throw new HttpError(400, t);
  const id = termId(t.en);
  const ref = adminDb().collection(COL.terms).doc(id);
  // Firestore không nhận undefined → bỏ trường trống
  const data = JSON.parse(
    JSON.stringify({
      ...t,
      status: user.role === "admin" ? "approved" : "pending",
      lessonIds: [],
      createdBy: user.uid,
      createdByName: await displayNameOf(user),
      schoolId: user.schoolId ?? null,
    })
  );
  const created = await adminDb().runTransaction(async (tx) => {
    if ((await tx.get(ref)).exists) return false;
    tx.set(ref, { ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!created) throw new HttpError(409, `Ngân hàng đã có thuật ngữ “${t.en}”.`);
  return ok({ id }, 201);
});
