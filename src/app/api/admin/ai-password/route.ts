// Quản trị: xem / đổi mật khẩu mở khoá AI (GV, HS hết lượt phải nhập mật khẩu này để dùng tiếp).
//   GET  → { password, limit }      (password = null nếu chưa đặt)
//   POST { password? } → đặt mật khẩu quản trị nhập; bỏ trống → tạo ngẫu nhiên
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { aiFreeLimit, cleanUnlockPassword, generateUnlockPassword, setUnlockSecret, unlockSecret } from "@/lib/server/ai-gate";

export const GET = handle(async (req: Request) => {
  await requireAuth(req, ["admin"]);
  return ok({ password: (await unlockSecret()) ?? null, limit: aiFreeLimit() });
});

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["admin"]);
  const b = await readJson<{ password?: unknown }>(req);
  const typed = typeof b.password === "string" && b.password.trim() !== "";
  const password = typed ? cleanUnlockPassword(b.password) : generateUnlockPassword();
  if (typeof password !== "string") throw new HttpError(400, password.error);
  await setUnlockSecret(password, user.uid);
  return ok({ password, limit: aiFreeLimit() });
});
