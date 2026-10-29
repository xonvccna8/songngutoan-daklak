"use client";

// HS: không gian làm việc của tổ — 6 bước (đánh dấu xong + ghi chú), link sản phẩm, suy ngẫm Anh/Việt, nộp bài
import { useState } from "react";
import { useParams } from "next/navigation";
import { Check, ExternalLink, Loader2, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { SayButtons } from "@/components/library/say";
import { StageBar, TeamStatus } from "@/components/stem/common";
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { api, errorMessage } from "@/lib/api-client";
import { fmtDue } from "@/lib/format";
import { useMyTeam, useProject } from "@/lib/stem/hooks";
import { RUBRIC, RUBRIC_LEVELS, STEM_STAGES, type StageKey } from "@/lib/stem/projects";

export default function StudentProjectPage() {
  return (
    <StudentShell>
      <Workspace />
    </StudentShell>
  );
}

const AREA = "w-full rounded-xl border-2 border-line-2 bg-white px-3 py-2 text-sm outline-none focus:border-blue";

function Workspace() {
  const { id } = useParams<{ id: string }>();
  const { me } = useStudent();
  const { data: p } = useProject(id);
  const { data: team } = useMyTeam(id, me?.team);
  const [openStage, setOpenStage] = useState<StageKey | null>(null);
  const [note, setNote] = useState("");
  const [links, setLinks] = useState<{ url: string; label: string }[] | null>(null);
  const [refl, setRefl] = useState<{ en: string; vi: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!p) return <StudentHeader vi="Dự án STEM" en="STEM project" back="/s/stem" />;
  const locked = p.status !== "open" || !!team?.scoredAt;
  const submitted = !!team?.submittedAt;
  const editLinks = links ?? team?.links ?? [];
  const editRefl = refl ?? team?.reflection ?? { en: "", vi: "" };

  async function send(body: Record<string, unknown>, msg: string) {
    setBusy(true);
    try {
      await api(`/api/stem/${id}/team`, { body });
      toast.success(msg);
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StudentHeader vi={p.title.vi} en={p.title.en} back="/s/stem" />
      <div className="space-y-4 px-5 pt-5">
        <section className="card-lsn space-y-2 p-4 text-sm">
          <div className="flex items-center gap-2">
            <b>Tổ {me?.team}</b>
            <TeamStatus team={team} />
            <span className="ml-auto text-xs text-ink-2">Hạn {fmtDue(p.dueAt)}</span>
          </div>
          <StageBar team={team} />
          <p className="pt-1">
            <span className="text-en block font-semibold">{p.goal.en}</span>
            <span className="text-vi block">{p.goal.vi}</span>
          </p>
          {(p.brief.en || p.brief.vi) && (
            <p>
              <span className="text-en block">{p.brief.en}</span>
              <span className="text-vi block">{p.brief.vi}</span>
            </p>
          )}
          {p.materials && <p className="text-ink-2">Vật liệu: {p.materials}</p>}
        </section>

        {team?.scoredAt && (
          <section className="card-lsn border-teal/40 p-4 text-sm">
            <h2 className="font-extrabold">Thầy cô đã chấm</h2>
            <ul className="mt-2 space-y-1">
              {RUBRIC.map((r) => (
                <li key={r.key} className="flex justify-between">
                  <span>{r.vi}</span>
                  <b>{RUBRIC_LEVELS[(team.scores?.[r.key] ?? 1) - 1]}</b>
                </li>
              ))}
            </ul>
            {team.feedback && <p className="mt-2 rounded-xl bg-paper p-2">{team.feedback}</p>}
          </section>
        )}

        {p.vocab.length > 0 && (
          <section className="card-lsn p-4">
            <h2 className="font-extrabold">
              Từ vựng dự án <span className="text-en text-sm font-semibold">· Key words</span>
            </h2>
            <ul className="mt-2 divide-y divide-line">
              {p.vocab.map((w) => (
                <li key={w.en} className="flex items-center gap-2 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="text-en block font-semibold">{w.en}</span>
                    <span className="text-vi block text-sm">{w.vi}</span>
                  </span>
                  <SayButtons text={w.en} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-lg font-extrabold">6 bước của tổ em</h2>
          <ol className="mt-2 flex flex-col gap-2">
            {STEM_STAGES.map((s, i) => {
              const st = team?.stages?.[s.key];
              const isOpen = openStage === s.key;
              return (
                <li key={s.key} className="card-lsn p-3">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => {
                      setOpenStage(isOpen ? null : s.key);
                      setNote(st?.note ?? "");
                    }}
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl font-display font-extrabold", st?.done ? "bg-teal text-white" : "bg-paper text-ink-2")}>{st?.done ? <Check className="size-4" /> : i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block">{s.vi}</b>
                      <span className="text-en text-sm">{s.en}</span>
                    </span>
                  </button>
                  {st?.note && !isOpen && (
                    <p className="mt-2 text-sm text-ink-2">
                      {st.note} <span className="text-xs">— {st.by}</span>
                    </p>
                  )}
                  {isOpen && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-ink-2">
                        {s.hint.vi} <span className="text-en">{s.hint.en}</span>
                      </p>
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={800} disabled={locked || submitted} placeholder="Tổ em đã làm gì? (viết tiếng Anh, tiếng Việt hoặc cả hai)" className={AREA} />
                      {!locked && !submitted && (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy} onClick={async () => (await send({ stage: s.key, done: true, note }, "Đã lưu — bước này xong!")) && setOpenStage(null)}>
                            <Check /> Lưu · đã xong
                          </Button>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => send({ stage: s.key, done: false, note }, "Đã lưu ghi chú.")}>
                            Lưu · chưa xong
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card-lsn space-y-2 p-4">
          <h2 className="font-extrabold">Sản phẩm của tổ (link)</h2>
          <p className="text-xs text-ink-2">Ảnh, video, slide trên Google Drive / YouTube / Canva… (đặt quyền “Bất kì ai có đường liên kết”). Không đăng ảnh rõ mặt bạn bè nếu chưa được đồng ý.</p>
          {editLinks.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={l.label} onChange={(e) => setLinks(editLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Tên" maxLength={80} disabled={locked} className={cn(AREA, "w-24 shrink-0")} />
              <input value={l.url} onChange={(e) => setLinks(editLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://…" disabled={locked} className={AREA} />
              {l.url.startsWith("https://") && (
                <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label="Mở link" className="text-ink-2">
                  <ExternalLink className="size-4" />
                </a>
              )}
              {!locked && (
                <button type="button" aria-label="Xoá link" onClick={() => setLinks(editLinks.filter((_, j) => j !== i))} className="text-coral-dk">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
          {!locked && (
            <div className="flex gap-2">
              {editLinks.length < 6 && (
                <Button size="sm" variant="outline" onClick={() => setLinks([...editLinks, { url: "", label: "" }])}>
                  <Plus /> Thêm link
                </Button>
              )}
              {links && (
                <Button size="sm" disabled={busy} onClick={async () => (await send({ links: editLinks }, "Đã lưu link sản phẩm.")) && setLinks(null)}>
                  Lưu link
                </Button>
              )}
            </div>
          )}
        </section>

        <section className="card-lsn space-y-2 p-4">
          <h2 className="font-extrabold">
            Suy ngẫm <span className="text-en text-sm font-semibold">· Reflection</span>
          </h2>
          <p className="text-xs text-ink-2">Gợi ý: “We made ___. It works because ___. Next time we will ___.”</p>
          <textarea value={editRefl.en} onChange={(e) => setRefl({ ...editRefl, en: e.target.value })} rows={3} maxLength={1000} disabled={locked} lang="en" placeholder="In English…" className={cn(AREA, "font-semibold text-blue-dk")} />
          <textarea value={editRefl.vi} onChange={(e) => setRefl({ ...editRefl, vi: e.target.value })} rows={2} maxLength={1000} disabled={locked} placeholder="Tiếng Việt (nếu cần)…" className={cn(AREA, "italic")} />
          {!locked && refl && (
            <Button size="sm" disabled={busy} onClick={async () => (await send({ reflection: editRefl }, "Đã lưu suy ngẫm.")) && setRefl(null)}>
              Lưu suy ngẫm
            </Button>
          )}
        </section>

        {!locked && (
          <div className="pb-4">
            {submitted ? (
              <Button variant="outline" size="lg" className="w-full" disabled={busy} onClick={() => send({ submit: false }, "Đã rút lại — tổ em sửa tiếp được.")}>
                {busy ? <Loader2 className="animate-spin" /> : <Undo2 />} Rút lại để sửa
              </Button>
            ) : (
              <Button variant="sun" size="lg" className="w-full" disabled={busy} onClick={() => send({ submit: true, ...(links ? { links: editLinks } : {}) }, "Tổ em đã nộp dự án! Thầy cô sẽ chấm.")}>
                {busy ? <Loader2 className="animate-spin" /> : <Send />} Nộp dự án của tổ
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
