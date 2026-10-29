// GĐ 5 — HS dùng power-up (máy chủ kiểm tra em có power-up đó và áp dụng cho câu hiện tại)
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { applyPower } from "@/lib/server/games";
import { POWER_META } from "@/lib/games/scoring";
import type { PowerKind } from "@/lib/games/types";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/game/[id]/power">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["student"]);
  const { kind } = await readJson<{ kind?: PowerKind }>(req);
  if (!kind || !(kind in POWER_META)) throw new HttpError(400, "Power-up không hợp lệ.");
  return ok(await applyPower(user, id, kind));
});
