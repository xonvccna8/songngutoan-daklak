// GĐ 5 — HS vào trận (điện thoại tự gọi khi thấy trò chơi mở trong tiết)
import { handle, ok, requireAuth } from "@/lib/server/api";
import { joinGame } from "@/lib/server/games";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/game/[id]/join">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["student"]);
  return ok(await joinGame(user, id));
});
