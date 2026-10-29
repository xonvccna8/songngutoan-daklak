"use client";

// Hồ sơ học sinh: biểu đồ điểm, từng tiết (vào lúc nào, trả lời/đúng, rời trang), chi tiết từng câu, từ phát âm sai
import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Bell, ChevronDown, ChevronRight, Flame, KeyRound, MessageCircle, Mic, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, FullScreenLoader } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { EngagementChip, fmtAgo } from "@/components/class/overview";
import { SKILL_COLOR } from "@/components/class/analytics";
import { StudentStudy } from "@/components/class/student-study";
import { StudentJourney } from "@/components/class/student-journey";
import { LevelBadge } from "@/components/progress/level";
import { api, errorMessage } from "@/lib/api-client";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { BARRIER_LABEL, diagnoseStudent } from "@/lib/live/diagnose";
import { ended, meaningfulWord, studentRow } from "@/lib/analytics";
import { useClass, useStudents } from "@/lib/hooks/use-firestore";
import { useClassSessions, useClassStats, useNow } from "@/lib/hooks/use-class-history";
import { say } from "@/lib/live/speech";
import { saveSlips } from "@/lib/slips";
import { ComposeDialog, sendQuick } from "@/components/messages/compose-dialog";
import { KindChip, ReceiptChip } from "@/components/messages/message-feed";
import { useMessagesTo } from "@/lib/messages/hooks";
import { REPLY_LABEL, type MessageKind } from "@/lib/messages/types";
import type { ResponseDoc } from "@/lib/live/types";
import { DEFAULT_CLASS_SETTINGS, type PinSlip } from "@/lib/types";

const INK2 = "#51607A";
const GRID = "#E2EFE6";
const time = (ms: number | null | undefined) => (ms ? new Date(ms).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—");

export default function StudentProfilePage() {
  const { classId, uid } = useParams<{ classId: string; uid: string }>();
  const router = useRouter();
  const { data: cls, loading } = useClass(classId);
  const { data: students } = useStudents(classId);
  const { data: sessions } = useClassSessions(classId);
  const stats = useClassStats(classId);
  const now = useNow();
  const [confirmEl, confirm] = useConfirm();
  const [open, setOpen] = useState<string | null>(null);
  const [mine, setMine] = useState<Record<string, ResponseDoc[]>>({});
  const history = useMessagesTo(classId, uid);
  const [compose, setCompose] = useState<MessageKind | null>(null);

  const student = students.find((s) => s.uid === uid);
  const list = useMemo(() => ended(sessions), [sessions]);

  // Câu trả lời của em ở các tiết gần nhất (để xem chi tiết từng câu, từ phát âm sai)
  const recentIds = list
    .slice(-20)
    .map((s) => s.id)
    .join(",");
  useEffect(() => {
    if (!recentIds) return;
    let alive = true;
    Promise.all(
      recentIds.split(",").map(async (sid) => {
        const snap = await getDocs(query(collection(db(), COL.sessions, sid, COL.responses), where("uid", "==", uid)));
        return [sid, snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResponseDoc)] as const;
      })
    )
      .then((pairs) => alive && setMine(Object.fromEntries(pairs)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [recentIds, uid]);

  if (loading) return <FullScreenLoader />;
  if (!cls || !student) {
    return (
      <div className="p-8">
        <EmptyState title="Không tìm thấy học sinh" mood="alert" action={<Link href={`/teacher/classes/${classId}`} className="font-bold text-blue">← Về lớp</Link>} />
      </div>
    );
  }

  const t = { ...DEFAULT_CLASS_SETTINGS.thresholds, ...cls.settings?.thresholds };
  const row = studentRow(uid, stats.get(uid), now, t);
  const attended = list.filter((s) => s.results?.[uid]).length;
  const chart = list.map((s) => {
    const rs = Object.values(s.results ?? {});
    return {
      label: new Date(s.createdAt?.toMillis() ?? 0).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      title: s.lessonTitle?.vi ?? "",
      me: s.results?.[uid]?.points ?? null,
      cls: rs.length ? Math.round(rs.reduce((a, r) => a + r.points, 0) / rs.length) : null,
    };
  });
  const words = new Map<string, number>();
  Object.values(mine)
    .flat()
    .forEach((r) => (r.wrongWords ?? []).filter(meaningfulWord).forEach((w) => words.set(w, (words.get(w) ?? 0) + 1)));
  const wordList = [...words.entries()].sort((a, b) => b[1] - a[1]);
  // Đợt A — chẩn đoán qua các tiết gần nhất: vướng tiếng Anh hay vướng kiến thức
  const barrier = BARRIER_LABEL[diagnoseStudent(Object.values(mine).flat()).barrier];

  async function resetPin() {
    const ok = await confirm({
      title: `Đặt lại PIN cho ${student!.fullName}?`,
      description: "PIN cũ hết hiệu lực; phiếu mới sẽ mở ra để in.",
      confirmText: "Đặt lại & in phiếu",
    });
    if (!ok) return;
    try {
      const { slips } = await api<{ slips: PinSlip[] }>(`/api/classes/${classId}/pins`, { body: { uids: [uid] } });
      saveSlips(classId, slips);
      router.push(`/teacher/classes/${classId}/print`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <Link href={`/teacher/classes/${classId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Lớp {cls.name}
      </Link>

      {/* Đầu hồ sơ */}
      <div className="card-lsn mt-3 flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-4">
          <Avatar name={student.fullName} team={student.team} className="size-16 text-xl" />
          <div>
            <h1 className="text-2xl font-extrabold">{student.fullName}</h1>
            <p className="text-sm text-ink-2">
              STT {student.number} · Tổ {student.team} · hoạt động {fmtAgo(row.lastActive, now)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <LevelBadge level={row.level} />
              <EngagementChip s={row.status} />
              <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-bold text-ink" title={barrier.hint}>
                Chẩn đoán: {barrier.vi}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#E8590C]">
                <Flame className="size-3.5 fill-[#FF922B]" /> {row.streak} ngày liên tiếp · {row.days7}/7 ngày qua
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="sun"
            onClick={async () => {
              try {
                const r = await sendQuick(classId, [uid], "attention");
                toast.success(`Đã nhắc chú ý ${student.fullName}${r.silent ? " (giờ yên lặng: không đổ chuông)" : ""}.`);
              } catch (e) {
                toast.error(errorMessage(e));
              }
            }}
          >
            <Bell /> Nhắc chú ý
          </Button>
          <Button variant="outline" onClick={() => setCompose("reminder")}>
            <MessageCircle /> Nhắn tin
          </Button>
          <Button variant="teal" onClick={() => setCompose("praise")}>
            <Sparkles /> Khen
          </Button>
          <Button variant="outline" onClick={resetPin}>
            <KeyRound /> Đặt lại PIN
          </Button>
        </div>
      </div>

      {/* Chỉ số */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Tổng XP" value={row.points.toLocaleString("vi-VN")} />
        <Stat label="Tiết tham gia" value={`${attended}/${list.length}`} />
        <Stat label="Tỉ lệ đúng" value={row.correctPct == null ? "—" : `${row.correctPct}%`} />
        <Stat label="Toán" value={row.mathPct == null ? "—" : `${row.mathPct}%`} dot={SKILL_COLOR["Toán"]} />
        <Stat label="Ngôn ngữ" value={row.langPct == null ? "—" : `${row.langPct}%`} dot={SKILL_COLOR["Ngôn ngữ"]} />
        <Stat label="Phát âm TB" value={row.pron ?? "—"} />
      </div>

      {/* Cấp độ & XP (GĐ 3 mới) */}
      <StudentJourney classId={classId} uid={uid} stats={stats.get(uid)} now={now} />

      {/* Tự học & bài về nhà (GĐ 5) */}
      <StudentStudy classId={classId} uid={uid} stats={stats.get(uid)} now={now} />

      {list.length === 0 ? (
        <EmptyState className="mt-6" title="Em chưa có tiết học nào">Kết quả sẽ hiện sau tiết học đầu tiên.</EmptyState>
      ) : (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="card-lsn min-w-0 p-5">
              <h2 className="font-display text-lg font-extrabold">Điểm qua các tiết</h2>
              <div className="mt-2 flex gap-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-0.5 w-5 rounded-full bg-blue" /> {student.fullName.split(" ").slice(-1)[0]}
                </span>
                <span className="inline-flex items-center gap-1.5 text-ink-2">
                  <i className="h-0.5 w-5 rounded-full border-t-2 border-dashed border-ink-2" /> Trung bình lớp
                </span>
              </div>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: INK2, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
                    <YAxis tick={{ fill: INK2, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v, n) => [v == null ? "vắng" : `${v} điểm`, n === "me" ? "Em" : "TB lớp"]}
                      labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.title ?? ""}`}
                      contentStyle={{ borderRadius: 12, border: "2px solid #E2EFE6", fontSize: 12 }}
                    />
                    <Line dataKey="cls" name="cls" stroke={INK2} strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                    <Line dataKey="me" name="me" stroke="#16A34A" strokeWidth={2} dot={{ r: 4, fill: "#16A34A", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card-lsn p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
                <Mic className="size-5 text-coral" /> Từ phát âm sai
              </h2>
              {wordList.length === 0 ? (
                <p className="mt-3 text-sm text-ink-2">Chưa có từ nào — em phát âm tốt hoặc chưa luyện nói.</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {wordList.map(([w, n]) => (
                    <li key={w}>
                      <button onClick={() => say(w, 0.8)} className="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-blue">
                        <Volume2 className="size-3.5 text-blue" /> <span className="text-en">{w}</span>
                        <span className="text-xs text-ink-2">×{n}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Từng tiết */}
          <section className="card-lsn mt-5 overflow-x-auto">
            <h2 className="px-5 pt-5 font-display text-lg font-extrabold">Từng tiết học</h2>
            <table className="mt-3 w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-ink-2">
                  <th className="py-2 pl-5" />
                  <th className="py-2">Ngày</th>
                  <th className="py-2">Tiết</th>
                  <th className="py-2">Vào lúc</th>
                  <th className="py-2 text-right">Đúng</th>
                  <th className="py-2 text-right">Phát âm</th>
                  <th className="py-2 text-right">Rời trang</th>
                  <th className="py-2 pr-5 text-right">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {[...list].reverse().map((s) => {
                  const r = s.results?.[uid];
                  const qn = Object.keys(s.questions ?? {}).length;
                  const isOpen = open === s.id;
                  const detail = mine[s.id] ?? [];
                  return (
                    <Fragment key={s.id}>
                      <tr className={cn("border-t border-line", r ? "cursor-pointer hover:bg-paper/60" : "text-ink-2/60")} onClick={() => r && setOpen(isOpen ? null : s.id)}>
                        <td className="py-2.5 pl-5">{r && (isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />)}</td>
                        <td className="py-2.5">{new Date(s.createdAt?.toMillis() ?? 0).toLocaleDateString("vi-VN")}</td>
                        <td className="py-2.5 font-semibold">{s.lessonTitle?.vi}</td>
                        {r ? (
                          <>
                            <td className="py-2.5">{time(r.joinedAt)}</td>
                            <td className="py-2.5 text-right tabular-nums">
                              {r.correct}/{qn}
                            </td>
                            <td className="py-2.5 text-right tabular-nums">{r.pronN ? Math.round(r.pronSum / r.pronN) : "—"}</td>
                            <td className={cn("py-2.5 text-right tabular-nums", r.leftCount > 2 && "font-bold text-coral-dk")}>{r.leftCount}</td>
                            <td className="py-2.5 pr-5 text-right font-display font-extrabold tabular-nums">{r.points}</td>
                          </>
                        ) : (
                          <td colSpan={5} className="py-2.5 pr-5 text-right text-xs">
                            vắng
                          </td>
                        )}
                      </tr>
                      {isOpen && (
                        <tr className="bg-paper/60">
                          <td />
                          <td colSpan={7} className="py-3 pr-5">
                            {detail.length === 0 ? (
                              <p className="text-xs text-ink-2">Không có câu trả lời chi tiết (tiết cũ hơn 20 tiết gần nhất hoặc em không trả lời).</p>
                            ) : (
                              <ul className="grid gap-1.5 md:grid-cols-2">
                                {detail
                                  .sort((a, b) => a.answeredAt - b.answeredAt)
                                  .map((d) => (
                                    <li key={d.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px]">
                                      <span className="rounded-full bg-paper px-1.5 py-0.5 text-[10px] font-bold">{d.qtype === "speak" ? "Nói" : d.skill}</span>
                                      <span className="min-w-0 flex-1 truncate">
                                        {s.questions?.[d.slideId]?.title ?? (d.qtype === "speak" ? (d.transcript ? `Luyện nói · máy nghe: “${d.transcript}”` : "Luyện nói") : d.slideId)}
                                      </span>
                                      {d.qtype === "speak" ? (
                                        <b className="tabular-nums">{d.score} điểm</b>
                                      ) : (
                                        <>
                                          <span className="max-w-28 truncate text-ink-2">{d.qtype === "mcq" ? `Chọn ${"ABCD"[Number(d.value)] ?? d.value}` : d.qtype === "label" ? "Ghép nhãn" : String(d.value)}</span>
                                          <b className={d.correct ? "text-success-fg" : "text-coral-dk"}>{d.correct ? "Đúng" : "Sai"}</b>
                                        </>
                                      )}
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* Lịch sử tin nhắn */}
      <section className="card-lsn mt-5 p-5">
        <h2 className="font-display text-lg font-extrabold">Lịch sử tin nhắn</h2>
        {history.data.length === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Chưa gửi tin nào cho em.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {history.data.map((m) => {
              const r = history.mine[m.id];
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
                  <KindChip kind={m.kind} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{m.text.vi || m.text.en}</span>
                  {r?.reply && <span className={cn("text-xs font-bold", r.reply === "need_help" ? "text-coral-dk" : "text-[#0E6377]")}>{REPLY_LABEL[r.reply]}</span>}
                  <ReceiptChip s={r?.status ?? "sent"} />
                  <span className="text-xs text-ink-2">{fmtAgo(m.createdAt?.toMillis() ?? null, now)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {compose && (
        <ComposeDialog key={compose} cls={cls} students={students} open onOpenChange={(v) => !v && setCompose(null)} preset={{ kind: compose, uids: [uid] }} />
      )}
      {confirmEl}
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: React.ReactNode; dot?: string }) {
  return (
    <div className="card-lsn p-4">
      <b className="block font-display text-2xl leading-none font-extrabold tabular-nums">{value}</b>
      <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2">
        {dot && <i className="size-2 rounded-full" style={{ background: dot }} />}
        {label}
      </span>
    </div>
  );
}
