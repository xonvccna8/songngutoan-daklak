// GĐ 5 — GV mở trò chơi trong tiết đang dạy: nội dung tự lấy từ tiết (câu hỏi + thuật ngữ)
import { handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { createGame } from "@/lib/server/games";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req, ["teacher", "admin"]);
  return ok(await createGame(user, await readJson(req)), 201);
});
