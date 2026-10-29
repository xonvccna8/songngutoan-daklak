// Học sinh nhập mã lớp → trả danh sách tên để chọn (chỉ họ tên, số thứ tự, tổ)
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { isValidJoinCode, normalizeJoinCode } from "@/lib/class-utils";
import { HttpError, handle, ok } from "@/lib/server/api";

export const GET = handle(async (req: Request) => {
  const code = normalizeJoinCode(new URL(req.url).searchParams.get("code") ?? "");
  if (!isValidJoinCode(code)) throw new HttpError(400, "Mã lớp gồm 6 kí tự, em kiểm tra lại nhé.");

  const db = adminDb();
  const found = await db.collection(COL.classes).where("joinCode", "==", code).limit(1).get();
  if (found.empty) throw new HttpError(404, "Không tìm thấy lớp với mã này.");
  const cls = found.docs[0];

  const students = await cls.ref.collection(COL.students).orderBy("number").get();
  return ok({
    classId: cls.id,
    className: cls.get("name") as string,
    students: students.docs.map((d) => ({
      uid: d.id,
      fullName: d.get("fullName") as string,
      number: d.get("number") as number,
      team: d.get("team") as number,
    })),
  });
});
