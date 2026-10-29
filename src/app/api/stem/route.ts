// Dự án STEM — GV tạo dự án cho một lớp (mỗi tổ một nhóm làm), báo cho cả lớp qua hộp tin.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { teacherNameOf } from "@/lib/server/assignments";
import { createMessage, resolveRecipients } from "@/lib/server/messages";
import { sanitizeProject } from "@/lib/stem/projects";
import { fmtDue } from "@/lib/format";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  const body = await readJson<Record<string, unknown> & { classId?: string }>(req);
  if (typeof body.classId !== "string") throw new HttpError(400, "Thiếu lớp.");
  const { cls } = await getClassForStaff(body.classId, user);
  const p = sanitizeProject(body);
  if (typeof p === "string") throw new HttpError(400, p);
  const teacherName = await teacherNameOf(user);
  const ref = adminDb().collection(COL.projects).doc();
  await ref.set({
    ...p,
    classId: cls.id,
    schoolId: cls.schoolId,
    teacherId: user.uid,
    teacherName,
    teams: cls.settings?.teams ?? 4,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });

  const { uids, toLabel } = await resolveRecipients(cls, { all: true });
  if (uids.length) {
    await createMessage({
      cls,
      uids,
      toLabel,
      kind: "notice",
      text: { vi: `Dự án STEM mới: ${p.title.vi} · làm theo tổ · hạn ${fmtDue(p.dueAt)}`, en: `New STEM project: ${p.title.en || p.title.vi} · due ${fmtDue(p.dueAt, "en")}` },
      fromUid: user.uid,
      fromName: teacherName,
    }).catch((e) => console.error("stem notice:", (e as Error).message));
  }
  return ok({ id: ref.id }, 201);
});
