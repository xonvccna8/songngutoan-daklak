// Thêm học sinh: gõ tay hoặc dán từ Excel → trả phiếu PIN để in ngay
import { assignTeams, parseStudentPaste } from "@/lib/class-utils";
import { COL } from "@/lib/namespace";
import { HttpError, getClassForStaff, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { createStudents } from "@/lib/server/students";

const MAX_STUDENTS = 60;

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/classes/[classId]/students">) => {
  const { classId } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, cls } = await getClassForStaff(classId, user);
  const body = await readJson<{ text?: string }>(req);

  const teams = cls.settings?.teams ?? 4;
  const parsed = parseStudentPaste(String(body.text ?? "").slice(0, 20_000), teams);
  if (parsed.length === 0) throw new HttpError(400, "Chưa đọc được tên học sinh nào. Mỗi dòng một em nhé.");
  if ((cls.studentCount ?? 0) + parsed.length > MAX_STUDENTS) {
    throw new HttpError(400, `Một lớp tối đa ${MAX_STUDENTS} học sinh.`);
  }

  // Đếm sĩ số từng tổ hiện có để chia đều các em chưa ghi tổ
  const existing = await ref.collection(COL.students).select("team").get();
  const counts = Array.from({ length: teams }, () => 0);
  existing.docs.forEach((d) => {
    const t = d.get("team") as number;
    if (t >= 1 && t <= teams) counts[t - 1]++;
  });

  const slips = await createStudents(classId, assignTeams(parsed, teams, counts));
  return ok({ slips }, 201);
});
