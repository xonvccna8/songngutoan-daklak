// GĐ 5 — HS trả lời một câu: máy chủ chấm, tính giờ, điểm, chuỗi, power-up, hạng ▲▼ và trả kết quả ngay
import { handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { answerGame } from "@/lib/server/games";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/game/[id]/answer">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["student"]);
  return ok(await answerGame(user, id, await readJson(req)));
});
