"use client";

// GV: một dự án STEM — tiến độ 6 bước của từng tổ (thời gian thực), nhật kí, link sản phẩm, chấm rubric + nhận xét
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, Loader2, Lock, PencilLine, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState, teamColor } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { SayButtons } from "@/components/library/say";
import { ProjectDialog } from "@/components/stem/project-dialog";
import { StageBar, TeamStatus } from "@/components/stem/common";
import { api, errorMessage } from "@/lib/api-client";
import { fmtDue } from "@/lib/format";
import { curLesson } from "@/lib/curriculum";
import { useClass, useMyClasses, useStudents } from "@/lib/hooks/use-firestore";
import { useProject, useProjectTeams } from "@/lib/stem/hooks";
import { RUBRIC, RUBRIC_LEVELS, STEM_STAGES, stemXp, type RubricKey, type TeamDoc } from "@/lib/stem/projects";

export default function StemProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: p, loading } = useProject(id);
  const teams = useProjectTeams(id);
  const { data: cls } = useClass(p?.classId);
  const { data: classes } = useMyClasses();
  const { data: students } = useStudents(p?.classId);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmEl, confirm] = useConfirm();

  if (loading) return null;
  if (!p) return <EmptyState className="m-8" title="Không tìm thấy dự án" />;

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <Link href="/teacher/stem" className="inline-flex items-center gap-1 text-sm font-bold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Dự án STEM
      </Link>
      <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold">{p.title.vi}</h1>
          <p className="text-en font-display text-lg font-semibold">{p.title.en}</p>
          <p className="mt-1 text-sm text-ink-2">
            Lớp {cls?.name ?? "…"}
            {curLesson(p.curLessonId) && ` · Bài ${curLesson(p.curLessonId)!.no}. ${curLesson(p.curLessonId)!.vi}`} · {p.teams} tổ · hạn {fmtDue(p.dueAt)} · {p.status === "open" ? "Đang mở" : "Đã đóng (học sinh không sửa được)"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <PencilLine /> Sửa
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => run(() => api(`/api/stem/${p.id}`, { method: "PUT", body: { status: p.status === "open" ? "closed" : "open" } }), p.status === "open" ? "Đã đóng dự án." : "Đã mở lại dự án.")}>
            {p.status === "open" ? <Lock /> : <Unlock />} {p.status === "open" ? "Đóng dự án" : "Mở lại"}
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              if (!(await confirm({ title: "Xoá dự án này?", description: "Nhật kí và điểm của các tổ cũng bị xoá. XP đã cộng vẫn giữ.", confirmText: "Xoá", danger: true }))) return;
              await run(() => api(`/api/stem/${p.id}`, { method: "DELETE" }), "Đã xoá dự án.");
              router.replace("/teacher/stem");
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <section className="card-lsn mt-5 grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2 text-sm">
          <p>
            <b>Mục tiêu:</b> {p.goal.vi} <span className="text-en">{p.goal.en}</span>
          </p>
          <p>
            <b>Yêu cầu:</b> {p.brief.vi} <span className="text-en">{p.brief.en}</span>
          </p>
          {p.materials && (
            <p>
              <b>Vật liệu:</b> {p.materials}
            </p>
          )}
        </div>
        {p.vocab.length > 0 && (
          <ul className="grid grid-cols-2 gap-2">
            {p.vocab.map((w) => (
              <li key={w.en} className="flex items-center gap-1 rounded-xl bg-paper px-2 py-1 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="text-en block truncate font-semibold">{w.en}</span>
                  <span className="text-vi block truncate text-xs">{w.vi}</span>
                </span>
                <SayButtons text={w.en} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: p.teams }, (_, i) => i + 1).map((t) => (
          <TeamCard key={t} pid={p.id} team={t} data={teams[t]} members={students.filter((s) => s.team === t).map((s) => s.fullName)} />
        ))}
      </div>
      {editing && <ProjectDialog open onOpenChange={setEditing} classes={classes} edit={p} />}
      {confirmEl}
    </div>
  );
}

function TeamCard({ pid, team, data, members }: { pid: string; team: number; data: TeamDoc | undefined; members: string[] }) {
  const [scores, setScores] = useState<Partial<Record<RubricKey, number>>>(() => data?.scores ?? {});
  const [feedback, setFeedback] = useState(data?.feedback ?? "");
  const [scoring, setScoring] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const r = await api<{ members: number; xp: number }>(`/api/stem/${pid}/score`, { body: { team, scores, feedback } });
      toast.success(`Đã chấm Tổ ${team}. ${r.xp ? `Mỗi em +${r.xp} XP (lần chấm đầu).` : ""}`);
      setScoring(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-lsn p-4">
      <header className="flex items-center gap-2">
        <span className="size-3 rounded-full" style={{ background: teamColor(team) }} />
        <h2 className="text-lg font-extrabold">Tổ {team}</h2>
        <span className="flex-1" />
        <TeamStatus team={data} />
      </header>
      <p className="mt-1 truncate text-xs text-ink-2">{members.length ? members.join(", ") : "Chưa có học sinh"}</p>
      <StageBar team={data} className="mt-3" />

      <ol className="mt-3 space-y-1.5 text-sm">
        {STEM_STAGES.map((s) => {
          const st = data?.stages?.[s.key];
          return (
            <li key={s.key} className="flex items-start gap-2">
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", st?.done ? "bg-teal text-white" : "bg-line")}>{st?.done && <Check className="size-3" />}</span>
              <span className="min-w-0 flex-1">
                <b>{s.vi}</b> <span className="text-en text-xs">· {s.en}</span>
                {st?.note && (
                  <span className="block text-ink-2">
                    {st.note} <span className="text-xs">— {st.by}</span>
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {!!data?.links?.length && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {data.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-blue-soft px-3 py-1 text-xs font-bold text-blue-dk hover:underline">
                <ExternalLink className="size-3" /> {l.label || "Sản phẩm"}
              </a>
            </li>
          ))}
        </ul>
      )}
      {(data?.reflection?.en || data?.reflection?.vi) && (
        <div className="mt-3 rounded-xl bg-paper p-3 text-sm">
          <p className="text-xs font-bold text-ink-2">Suy ngẫm của tổ</p>
          {data.reflection.en && <p className="text-en font-semibold">{data.reflection.en}</p>}
          {data.reflection.vi && <p className="text-vi">{data.reflection.vi}</p>}
        </div>
      )}
      {data?.feedback && !scoring && <p className="mt-3 text-sm"><b>Nhận xét:</b> {data.feedback}</p>}

      {scoring ? (
        <div className="mt-3 space-y-2 rounded-2xl border-2 border-line p-3">
          {RUBRIC.map((r) => (
            <div key={r.key} className="flex flex-wrap items-center gap-2">
              <span className="w-40 text-sm font-bold">
                {r.vi} <span className="text-en block text-xs font-semibold">{r.en}</span>
              </span>
              <div className="flex gap-1">
                {RUBRIC_LEVELS.map((lv, i) => (
                  <button
                    key={lv}
                    type="button"
                    title={lv}
                    onClick={() => setScores({ ...scores, [r.key]: i + 1 })}
                    className={cn("h-8 rounded-lg border-2 px-2 text-xs font-bold", scores[r.key] === i + 1 ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2")}
                  >
                    {i + 1} · {lv}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} maxLength={1000} placeholder="Nhận xét cho tổ (song ngữ càng tốt)…" className="w-full rounded-xl border-2 border-line-2 px-3 py-2 text-sm outline-none focus:border-blue" />
          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto text-xs text-ink-2">≈ +{stemXp(scores)} XP mỗi em</span>
            <Button variant="ghost" size="sm" onClick={() => setScoring(false)}>
              Huỷ
            </Button>
            <Button size="sm" onClick={save} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Check />} Lưu điểm
            </Button>
          </div>
        </div>
      ) : (
        <Button className="mt-3" size="sm" variant={data?.submittedAt && !data.scoredAt ? "default" : "outline"}
          onClick={() => {
            // Nhật kí tải sau khi thẻ hiện ra → lấy điểm, nhận xét mới nhất lúc mở form
            setScores(data?.scores ?? {});
            setFeedback(data?.feedback ?? "");
            setScoring(true);
          }}
        >
          <PencilLine /> {data?.scoredAt ? "Chấm lại" : "Chấm rubric"}
        </Button>
      )}
    </section>
  );
}
