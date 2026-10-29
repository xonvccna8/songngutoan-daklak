// Ngân hàng câu hỏi — thêm câu. GV thêm → "Chờ duyệt" (GV vẫn tự giao bài được); quản trị thêm → "Đã duyệt".
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { displayNameOf } from "@/lib/server/lesson-store";
import { sanitizeBankInput, toKey, toSlide } from "@/lib/bank/questions";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const b = sanitizeBankInput(await readJson(req));
  if (typeof b === "string") throw new HttpError(400, b);
  const ref = adminDb().collection(COL.questions).doc();
  await ref.set({
    ...b,
    slide: JSON.parse(JSON.stringify(toSlide(ref.id, b))),
    key: toKey(b),
    status: user.role === "admin" ? "approved" : "pending",
    aiDraft: false,
    createdBy: user.uid,
    createdByName: await displayNameOf(user),
    schoolId: user.schoolId ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ok({ id: ref.id }, 201);
});
