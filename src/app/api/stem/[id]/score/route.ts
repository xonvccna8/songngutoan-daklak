// Dự án STEM — GV chấm một tổ theo rubric 4 tiêu chí (mức 1–4) + nhận xét.
// Mỗi em trong tổ nhận XP (tối đa 50) — chỉ lần chấm đầu (chấm lại không cộng trùng).
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { HttpError, handle, ok, readJson, requireAuth } from "@/lib/server/api";
import { loadProjectForStaff } from "@/lib/server/stem";
import { awardXpSafe } from "@/lib/server/xp";
import { sanitizeScores, stemXp } from "@/lib/stem/projects";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/stem/[id]/score">) => {
  const { id } = await ctx.params;
  const user = await requireAuth(req, ["teacher", "admin"]);
  const { ref, p } = await loadProjectForStaff(id, user);
  const b = await readJson<{ team?: number; scores?: unknown; feedback?: string }>(req);
  const team = Math.round(Number(b.team));
  if (!(team >= 1 && team <= p.teams)) throw new HttpError(400, "Tổ không hợp lệ.");
  const scores = sanitizeScores(b.scores);
  if (typeof scores === "string") throw new HttpError(400, scores);
  const now = Date.now();
  await ref.collection(COL.projectTeams).doc(String(team)).set({ team, scores, feedback: String(b.feedback ?? "").trim().slice(0, 1000), scoredAt: now, updatedAt: now }, { merge: true });

  const members = await adminDb().collection(COL.classes).doc(p.classId).collection(COL.students).where("team", "==", team).get();
  const xp = stemXp(scores);
  const res = await awardXpSafe(
    members.docs.map((d) => ({ uid: d.id, classId: p.classId, kind: "stem" as const, scope: "class" as const, xp, key: `stem_${p.id}_${d.id}`, note: p.title.vi }))
  );
  return ok({ members: members.size, xp: res.length ? xp : 0 });
});
