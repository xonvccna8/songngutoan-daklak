// GĐ 4 — Thêm học liệu (link). GV thêm → "Chờ duyệt"; quản trị thêm → "Đã duyệt" luôn.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { displayNameOf } from "@/lib/server/lesson-store";
import { sanitizeResource } from "@/lib/library/resources";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const r = sanitizeResource(await readJson(req));
  if (typeof r === "string") throw new HttpError(400, r);
  const ref = adminDb().collection(COL.resources).doc();
  await ref.set({
    ...r,
    status: user.role === "admin" ? "approved" : "pending",
    createdBy: user.uid,
    createdByName: await displayNameOf(user),
    schoolId: user.schoolId ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ok({ id: ref.id }, 201);
});
