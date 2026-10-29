// GĐ 5 — GV điều khiển trận: bắt đầu · công bố · câu tiếp · tạm dừng / tiếp tục · cứu trợ · kết thúc · về bài học
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { controlGame, type GameAction } from "@/lib/server/games";

const ACTIONS: GameAction[] = ["start", "reveal", "next", "pause", "resume", "rescue", "end", "close"];

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/game/[id]/control">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { action } = await readJson<{ action?: GameAction }>(req);
  if (!action || !ACTIONS.includes(action)) throw new HttpError(400, "Thao tác không hợp lệ.");
  return ok(await controlGame(user, id, action));
});
