"use client";

// Bảng hỏi – đáp của lớp: soạn bài (có khung câu tiếng Anh), danh sách bài, trả lời, kiểm duyệt (GV)
import { useState } from "react";
import { Award, Check, EyeOff, Languages, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState, teamColor } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { fmtAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-class-history";
import { refreshCommunity, usePosts, useReplies } from "@/lib/community/hooks";
import { ANSWER_FRAMES, ASK_FRAMES, COMMUNITY_LIMITS, POST_KINDS, type PostDoc, type PostKind, type PostStatus, type ReplyDoc } from "@/lib/community/posts";
import { XP } from "@/lib/progress/xp";

type Filter = "all" | "pending" | "question" | "share";

export function CommunityFeed({ classId, uid, staff, compact = false }: { classId: string; uid: string; staff: boolean; compact?: boolean }) {
  const { data, loading } = usePosts(classId, staff, uid);
  const [filter, setFilter] = useState<Filter>("all");
  const pending = data.filter((p) => p.status === "pending").length;
  const list = data.filter((p) => (filter === "all" ? staff || p.status !== "hidden" : filter === "pending" ? p.status === "pending" : p.kind === filter && p.status !== "hidden"));

  return (
    <div className="flex flex-col gap-4">
      <Composer classId={classId} staff={staff} />
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["all", "Tất cả"],
            ["question", "Câu hỏi"],
            ["share", "Chia sẻ"],
            ...(staff ? [["pending", `Chờ duyệt${pending ? ` (${pending})` : ""}`]] : []),
          ] as [Filter, string][]
        ).map(([k, t]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("h-8 rounded-full border-2 px-3 text-xs font-bold", filter === k ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2", k === "pending" && pending > 0 && filter !== k && "border-coral text-coral-dk")}>
            {t}
          </button>
        ))}
      </div>
      {loading ? null : list.length === 0 ? (
        <EmptyState title={filter === "pending" ? "Không có bài chờ duyệt" : "Chưa có bài nào"}>{staff ? "Học sinh đặt câu hỏi, chia sẻ điều thú vị; thầy cô duyệt rồi cả lớp cùng trả lời." : "Hãy là người đầu tiên đặt câu hỏi — bằng tiếng Anh càng tốt!"}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((p) => (
            <li key={p.id}>
              <PostCard p={p} uid={uid} staff={staff} compact={compact} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FrameChips({ frames, onPick }: { frames: { en: string; vi: string }[]; onPick: (en: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {frames.map((f) => (
        <button key={f.en} type="button" title={f.vi} onClick={() => onPick(f.en)} className="rounded-full bg-blue-soft px-2.5 py-1 text-xs font-semibold text-blue-dk hover:bg-blue/20">
          {f.en}
        </button>
      ))}
    </div>
  );
}

function Composer({ classId, staff }: { classId: string; staff: boolean }) {
  const [kind, setKind] = useState<PostKind>("question");
  const [text, setText] = useState("");
  const [english, setEnglish] = useState(true);
  const [busy, setBusy] = useState(false);

  async function post() {
    setBusy(true);
    try {
      const r = await api<{ pending: boolean }>("/api/community", { body: { classId, kind, text, english } });
      toast.success(r.pending ? "Đã gửi! Bài sẽ hiện sau khi thầy cô duyệt." : "Đã đăng.");
      setText("");
      refreshCommunity();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-lsn space-y-2 p-4">
      <div className="flex gap-1.5">
        {(Object.keys(POST_KINDS) as PostKind[]).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={cn("h-8 rounded-full border-2 px-3 text-xs font-bold", kind === k ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2")}>
            {POST_KINDS[k].vi} · {POST_KINDS[k].en}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={COMMUNITY_LIMITS.maxChars}
        placeholder={kind === "question" ? "Em thắc mắc điều gì về bài học? Ask in English if you can!" : "Chia sẻ một điều thú vị em mới biết…"}
        className="w-full rounded-xl border-2 border-line-2 bg-white px-3 py-2 text-sm outline-none focus:border-blue"
      />
      <FrameChips frames={ASK_FRAMES} onPick={(en) => setText((t) => (t ? `${t} ${en}` : en))} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
          <input type="checkbox" checked={english} onChange={(e) => setEnglish(e.target.checked)} /> <Languages className="size-3.5" /> Viết bằng tiếng Anh
        </label>
        <span className="text-xs text-ink-2">
          {text.length}/{COMMUNITY_LIMITS.maxChars}
        </span>
        <Button size="sm" className="ml-auto" disabled={busy || text.trim().length < COMMUNITY_LIMITS.minChars} onClick={post}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />} {staff ? "Đăng" : "Gửi"}
        </Button>
      </div>
      {!staff && <p className="text-[11px] text-ink-2">Lịch sự, đúng chủ đề học tập. Không đăng link, số điện thoại, thông tin cá nhân. Thầy cô duyệt trước khi cả lớp thấy.</p>}
    </section>
  );
}

function StatusChip({ status }: { status: PostStatus }) {
  if (status === "approved") return null;
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", status === "pending" ? "bg-sun-soft text-[#8A5A00]" : "bg-paper text-ink-2")}>{status === "pending" ? "Chờ duyệt" : "Đã ẩn"}</span>;
}

function Who({ name, team, role }: { name: string; team: number | null; role: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold">
      {team ? <span className="size-2.5 rounded-full" style={{ background: teamColor(team) }} /> : null}
      {role === "teacher" ? `Thầy cô ${name}` : name}
      {team ? <span className="font-normal text-ink-2">· Tổ {team}</span> : null}
    </span>
  );
}

function PostCard({ p, uid, staff, compact }: { p: PostDoc; uid: string; staff: boolean; compact: boolean }) {
  const now = useNow(60_000);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmEl, confirm] = useConfirm();

  async function act(body: Record<string, unknown>, msg: string) {
    setBusy(true);
    try {
      await api(`/api/community/${p.id}`, { method: "PUT", body });
      toast.success(msg);
      refreshCommunity();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!(await confirm({ title: "Xoá bài này?", description: "Các câu trả lời cũng bị xoá.", confirmText: "Xoá", danger: true }))) return;
    try {
      await api(`/api/community/${p.id}`, { method: "DELETE" });
      toast.success("Đã xoá.");
      refreshCommunity();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <article className={cn("card-lsn p-4", p.status === "pending" && "border-sun/60", p.status === "hidden" && "opacity-60", busy && "opacity-60")}>
      <header className="flex flex-wrap items-center gap-2">
        <Who name={p.authorName} team={p.team} role={p.authorRole} />
        <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-2">{POST_KINDS[p.kind].vi}</span>
        {p.english && <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[11px] font-bold text-blue-dk">English</span>}
        <StatusChip status={p.status} />
        <span className="ml-auto text-xs text-ink-2">{fmtAgo(p.createdAt?.toMillis() ?? null, now)}</span>
      </header>
      <p className={cn("mt-2 whitespace-pre-line", p.english && "text-en font-semibold")}>{p.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {p.status === "approved" && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
            <MessageCircle /> {p.replyCount ? `${p.replyCount} trả lời` : "Trả lời"}
          </Button>
        )}
        {staff && p.status !== "approved" && (
          <Button size="sm" variant="teal" disabled={busy} onClick={() => act({ action: "approve" }, "Đã duyệt — cả lớp thấy bài này.")}>
            <Check /> Duyệt
          </Button>
        )}
        {staff && p.status !== "hidden" && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => act({ action: "hide" }, "Đã ẩn bài.")}>
            <EyeOff /> Ẩn
          </Button>
        )}
        {(staff || (p.authorUid === uid && p.status === "pending")) && (
          <Button size="icon-sm" variant="ghost" aria-label="Xoá bài" onClick={remove}>
            <Trash2 className="text-coral-dk" />
          </Button>
        )}
      </div>
      {open && p.status === "approved" && <Replies p={p} uid={uid} staff={staff} compact={compact} />}
      {confirmEl}
    </article>
  );
}

function Replies({ p, uid, staff }: { p: PostDoc; uid: string; staff: boolean; compact: boolean }) {
  const { data } = useReplies(p.id, staff, uid);
  const now = useNow(60_000);
  const [text, setText] = useState("");
  const [english, setEnglish] = useState(true);
  const [busy, setBusy] = useState(false);
  const list = data.filter((r) => staff || r.status !== "hidden");

  async function send() {
    setBusy(true);
    try {
      const r = await api<{ pending: boolean }>(`/api/community/${p.id}/reply`, { body: { text, english } });
      toast.success(r.pending ? "Đã gửi! Câu trả lời hiện sau khi thầy cô duyệt." : "Đã trả lời.");
      setText("");
      refreshCommunity();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function act(r: ReplyDoc, action: string, msg: string) {
    try {
      await api(`/api/community/${p.id}`, { method: "PUT", body: { action, replyId: r.id } });
      toast.success(msg);
      refreshCommunity();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t-2 border-line pt-3">
      {list.map((r) => {
        const best = p.bestReplyId === r.id;
        return (
          <div key={r.id} className={cn("rounded-2xl p-3", best ? "bg-sun-soft ring-2 ring-sun/50" : "bg-paper", r.status === "hidden" && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-2">
              <Who name={r.authorName} team={r.team} role={r.authorRole} />
              {best && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2 py-0.5 text-[11px] font-bold text-ink">
                  <Award className="size-3" /> Hay nhất
                </span>
              )}
              <StatusChip status={r.status} />
              <span className="ml-auto text-xs text-ink-2">{fmtAgo(r.createdAt?.toMillis() ?? null, now)}</span>
            </div>
            <p className={cn("mt-1 text-sm whitespace-pre-line", r.english && "text-en font-semibold")}>{r.text}</p>
            {staff && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.status !== "approved" && (
                  <Button size="xs" variant="teal" onClick={() => act(r, "approve", "Đã duyệt câu trả lời.")}>
                    <Check /> Duyệt
                  </Button>
                )}
                {r.status === "approved" && (
                  <Button size="xs" variant="outline" onClick={() => act(r, "best", best ? "Đã bỏ chọn." : `Đã chọn trả lời hay nhất${r.authorRole === "student" ? ` (+${XP.communityBest} XP)` : ""}.`)}>
                    <Award /> {best ? "Bỏ chọn" : "Hay nhất"}
                  </Button>
                )}
                {r.status !== "hidden" && (
                  <Button size="xs" variant="ghost" onClick={() => act(r, "hide", "Đã ẩn.")}>
                    <EyeOff /> Ẩn
                  </Button>
                )}
                <Button size="xs" variant="ghost" onClick={() => act(r, "delete", "Đã xoá.")}>
                  <Trash2 className="text-coral-dk" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={COMMUNITY_LIMITS.maxChars} placeholder="Viết câu trả lời…" className="w-full rounded-xl border-2 border-line-2 bg-white px-3 py-2 text-sm outline-none focus:border-blue" />
      <FrameChips frames={ANSWER_FRAMES} onPick={(en) => setText((t) => (t ? `${t} ${en}` : en))} />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
          <input type="checkbox" checked={english} onChange={(e) => setEnglish(e.target.checked)} /> Tiếng Anh
        </label>
        <Button size="sm" className="ml-auto" disabled={busy || text.trim().length < COMMUNITY_LIMITS.minChars} onClick={send}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />} Trả lời
        </Button>
      </div>
    </div>
  );
}
