// Lượt AI dùng thử: GET → còn bao nhiêu lượt, đã mở khoá chưa. POST { password } → mở khoá AI cho tài khoản đang đăng nhập.
import { handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { aiFreeStatus, unlockAi } from "@/lib/server/ai-gate";

export const GET = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  return ok(await aiFreeStatus(user.uid));
});

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["student", "teacher", "admin"]);
  const b = await readJson<{ password?: unknown }>(req);
  return ok(await unlockAi(user.uid, b.password));
});
