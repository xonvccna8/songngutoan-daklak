// Dự án STEM — HS cập nhật nhật kí của TỔ MÌNH: đánh dấu bước + ghi chú, link sản phẩm, suy ngẫm song ngữ, nộp / rút nộp.
// Sau khi GV chấm hoặc dự án đã đóng thì không sửa được nữa.
import { adminDb } from "@/lib/firebase/admin";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadProjectForStudent } from "@/lib/server/stem";
import { shortName } from "@/lib/class-utils";
import { emptyTeam, isStageKey, sanitizeLinks, type TeamDoc } from "@/lib/stem/projects";

interface Body {
  stage?: string;
  done?: boolean;
  note?: string;
  links?: unknown;
  reflection?: { en?: string; vi?: string };
  submit?: boolean;
}

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/stem/[id]/team">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["student"]);
  const { p, me, teamRef } = await loadProjectForStudent(id, user);
  if (p.status !== "open") throw new HttpError(409, "Dự án đã đóng.");
  const b = await readJson<Body>(req);
  const now = Date.now();

  const team = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(teamRef);
    const t: TeamDoc = { ...emptyTeam(me.team), ...(snap.data() as Partial<TeamDoc> | undefined) };
    if (t.scoredAt) throw new HttpError(409, "Thầy cô đã chấm dự án của tổ em.");
    const patch: Record<string, unknown> = { team: me.team, updatedAt: now };

    if (b.stage !== undefined) {
      if (!isStageKey(b.stage)) throw new HttpError(400, "Bước không hợp lệ.");
      if (t.submittedAt) throw new HttpError(409, "Tổ em đã nộp — bấm “Rút lại” để sửa tiếp.");
      patch.stages = { ...t.stages, [b.stage]: { done: !!b.done, note: String(b.note ?? "").trim().slice(0, 800), at: now, by: shortName(me.fullName) } };
    }
    if (b.links !== undefined) {
      const links = sanitizeLinks(b.links);
      if (typeof links === "string") throw new HttpError(400, links);
      patch.links = links;
    }
    if (b.reflection !== undefined) {
      patch.reflection = { en: String(b.reflection.en ?? "").trim().slice(0, 1000), vi: String(b.reflection.vi ?? "").trim().slice(0, 1000) };
    }
    if (b.submit !== undefined) {
      if (b.submit && !(t.links.length || (Array.isArray(patch.links) && patch.links.length))) throw new HttpError(400, "Hãy thêm ít nhất 1 link sản phẩm (ảnh, video, slide) trước khi nộp.");
      patch.submittedAt = b.submit ? now : null;
    }
    tx.set(teamRef, patch, { merge: true });
    return { ...t, ...patch };
  });
  return ok({ team });
});
