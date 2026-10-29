// Sửa thông tin/cài đặt lớp, hoặc xoá lớp (kèm toàn bộ học sinh)
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { sanitizeSettings } from "@/lib/class-utils";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { deleteStudents } from "@/lib/server/students";
import { curLesson, isGrade } from "@/lib/curriculum";
import { DEFAULT_CLASS_SETTINGS, type ClassSettings } from "@/lib/types";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/classes/[classId]">) => {
  const { classId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, cls } = await getClassForStaff(classId, user);
  const body = await readJson<{ name?: string; grade?: number; settings?: Partial<ClassSettings>; curLessonId?: string | null }>(req);

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim().slice(0, 40);
    if (!name) throw new HttpError(400, "Tên lớp không được để trống.");
    update.name = name;
  }
  if (body.grade !== undefined) {
    const grade = Math.round(Number(body.grade));
    if (!isGrade(grade)) throw new HttpError(400, "Khối lớp phải từ 6 đến 9.");
    update.grade = grade;
  }
  // Bài SGK lớp đang học: phải thuộc đúng khối của lớp (null = bỏ chọn)
  if (body.curLessonId !== undefined) {
    if (body.curLessonId === null || body.curLessonId === "") update.curLessonId = null;
    else {
      const l = curLesson(body.curLessonId);
      if (!l) throw new HttpError(400, "Bài không có trong khung chương trình.");
      if (l.grade !== ((update.grade as number | undefined) ?? cls.grade)) throw new HttpError(400, `Bài này thuộc lớp ${l.grade}, không phải khối của lớp.`);
      update.curLessonId = l.id;
    }
  }
  if (body.settings) {
    const base = { ...DEFAULT_CLASS_SETTINGS, ...cls.settings };
    const settings = sanitizeSettings({ ...base, ...body.settings }, base);
    update.settings = settings;

    // Giảm số tổ → chuyển các em ở tổ bị bỏ sang tổ còn lại
    if (settings.teams < base.teams) {
      const moved = await ref.collection(COL.students).where("team", ">", settings.teams).get();
      const batch = adminDb().batch();
      moved.docs.forEach((d) => batch.update(d.ref, { team: (((d.get("team") as number) - 1) % settings.teams) + 1 }));
      if (!moved.empty) await batch.commit();
    }
  }
  if (Object.keys(update).length) await ref.update(update);
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request, ctx: RouteContext<"/api/classes/[classId]">) => {
  const { classId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, cls } = await getClassForStaff(classId, user);
  const live = await adminDb().collection(COL.sessions).where("classId", "==", classId).where("status", "==", "live").limit(1).get();
  if (!live.empty) throw new HttpError(409, "Lớp đang có tiết học diễn ra. Hãy kết thúc tiết học trước rồi mới xoá lớp.");
  const students = await ref.collection(COL.students).select().get();
  await deleteStudents(classId, students.docs.map((d) => d.id));
  await ref.delete();
  const db = adminDb();
  // Xoá luôn mọi dữ liệu gắn với lớp: tiết đã dạy (kèm câu trả lời), thống kê, tin nhắn, bài tập,
  // trò chơi, XP, bảng thi đua, dự án STEM, cộng đồng, nhật kí Trợ lý AI
  const cols = [COL.sessions, COL.stats, COL.messages, COL.assignments, COL.games, COL.events, COL.weekly, COL.projects, COL.posts, COL.tutor];
  const snaps = await Promise.all(cols.map((c) => db.collection(c).where("classId", "==", classId).get()));
  await Promise.all(snaps.flatMap((s) => s.docs.map((d) => db.recursiveDelete(d.ref))));
  await Promise.all(
    (cls.teacherIds ?? []).map((t) =>
      db.collection(COL.users).doc(t).set({ classIds: FieldValue.arrayRemove(classId) }, { merge: true })
    )
  );
  return ok({ ok: true });
});
