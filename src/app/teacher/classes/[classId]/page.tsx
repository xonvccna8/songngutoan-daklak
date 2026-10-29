"use client";

// Trang lớp: Tổng quan · Xếp hạng · Bài tập · Bảng điểm · Hoạt động · Phân tích · Tin nhắn · Quản lý lớp (Học sinh / Chia tổ / Cài đặt)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Activity as ActivityIcon, ArrowLeft, BarChart3, ClipboardList, Copy, KeyRound, LayoutGrid, Play, Printer, Settings, Star, Table2, Trophy, UserPlus, Users, UsersRound, Wrench } from "lucide-react";
import { ClassOverview } from "@/components/class/overview";
import { Gradebook } from "@/components/class/gradebook";
import { Homework } from "@/components/class/homework";
import { Activity } from "@/components/class/activity";
import { ClassAnalytics } from "@/components/class/analytics";
import { ClassRankings } from "@/components/class/rankings";
import { ClassMastery } from "@/components/class/mastery";
import { useClassSessions, useClassStats, useNow } from "@/lib/hooks/use-class-history";
import { useLiveSessionForClass, useParticipants } from "@/lib/live/hooks";
import { Languages, MessageCircle } from "lucide-react";
import { ComposeDialog, KIND_ICON, sendQuick } from "@/components/messages/compose-dialog";
import { MessageFeed } from "@/components/messages/message-feed";
import { useClassMessages } from "@/lib/messages/hooks";
import { KIND_META, type MessageKind } from "@/lib/messages/types";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState, FullScreenLoader } from "@/components/common";
import { useConfirm } from "@/components/confirm-dialog";
import { AddStudentsDialog } from "@/components/teacher/add-students-dialog";
import { ClassSettingsForm } from "@/components/teacher/class-settings";
import { StartLessonDialog } from "@/components/teacher/start-lesson-dialog";
import { StudentList } from "@/components/teacher/student-list";
import { TeamsBoard } from "@/components/teacher/teams-board";
import { LevelsBoard } from "@/components/class/levels-board";
import { api, errorMessage } from "@/lib/api-client";
import { useClass, useStudents } from "@/lib/hooks/use-firestore";
import { saveSlips } from "@/lib/slips";
import type { PinSlip } from "@/lib/types";

const TABS = [
  { key: "overview", label: "Tổng quan", icon: LayoutGrid },
  { key: "rankings", label: "Xếp hạng", icon: Trophy },
  { key: "mastery", label: "Thành thạo", icon: Star },
  { key: "homework", label: "Bài tập", icon: ClipboardList },
  { key: "grades", label: "Bảng điểm", icon: Table2 },
  { key: "activity", label: "Hoạt động", icon: ActivityIcon },
  { key: "analytics", label: "Phân tích", icon: BarChart3 },
  { key: "messages", label: "Tin nhắn", icon: MessageCircle },
  { key: "manage", label: "Quản lý lớp", icon: Wrench },
] as const;

const SUBTABS = [
  { key: "students", label: "Học sinh", icon: Users },
  { key: "teams", label: "Chia tổ", icon: UsersRound },
  { key: "levels", label: "Mức tiếng Anh", icon: Languages },
  { key: "settings", label: "Cài đặt", icon: Settings },
] as const;

export default function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const { data: cls, loading } = useClass(classId);
  const { data: students } = useStudents(classId);
  const { data: sessions } = useClassSessions(classId);
  const stats = useClassStats(classId);
  const { data: live } = useLiveSessionForClass(classId);
  const participants = useParticipants(live?.id);
  const now = useNow();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("overview");
  const [sub, setSub] = useState<(typeof SUBTABS)[number]["key"]>("students");
  const msgs = useClassMessages(classId, 20);
  const [compose, setCompose] = useState<{ kind: MessageKind; uids?: string[] } | null>(null);
  const roster = new Map(students.map((s) => [s.uid, { name: s.fullName, team: s.team }]));
  async function bell(uid: string) {
    try {
      const r = await sendQuick(classId, [uid], "attention", live?.id ?? null);
      toast.success(`Đã nhắc chú ý ${roster.get(uid)?.name ?? ""}${r.silent ? " (giờ yên lặng: không đổ chuông)" : ""}.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  const [adding, setAdding] = useState(false);
  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmEl, confirm] = useConfirm();

  // Vừa tạo lớp xong (?add=1) → mở luôn hộp thêm học sinh
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("add") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdding(true);
      setTab("manage");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (loading) return <FullScreenLoader />;
  if (!cls) {
    return (
      <div className="p-8">
        <EmptyState title="Không tìm thấy lớp" mood="alert" action={<Link href="/teacher" className="font-bold text-blue">← Về trang chủ</Link>}>
          Lớp có thể đã bị xoá hoặc bạn không có quyền xem.
        </EmptyState>
      </div>
    );
  }

  async function printAll() {
    const ok = await confirm({
      title: "In phiếu cho cả lớp?",
      description:
        "Vì lý do bảo mật, PIN không được lưu dạng đọc được. Để in phiếu, hệ thống sẽ tạo PIN MỚI cho tất cả học sinh — PIN cũ sẽ hết hiệu lực.",
      confirmText: "Tạo PIN mới & in",
    });
    if (!ok || !cls) return;
    setBusy(true);
    try {
      const { slips } = await api<{ slips: PinSlip[] }>(`/api/classes/${cls.id}/pins`, { body: {} });
      saveSlips(cls.id, slips);
      router.push(`/teacher/classes/${cls.id}/print`);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(false);
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cls.joinCode);
      toast.success("Đã chép mã lớp");
    } catch {}
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <Link href="/teacher" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Tất cả lớp
      </Link>

      {/* Đầu trang lớp */}
      <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-ink font-display text-2xl font-extrabold text-white shadow-[0_4px_0_#000]">
            {cls.name}
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">Lớp {cls.name}</h1>
            <p className="text-sm font-semibold text-ink-2">
              Khối {cls.grade} · {cls.studentCount ?? 0} học sinh · {cls.settings?.teams ?? 4} tổ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copy} className="group flex h-11 items-center gap-2 rounded-[14px] border-2 border-dashed border-line-2 bg-white px-3.5" title="Chép mã lớp">
            <span className="text-xs font-semibold text-ink-2">Mã lớp</span>
            <span className="font-mono text-lg font-extrabold tracking-[0.25em]">{cls.joinCode}</span>
            <Copy className="size-4 text-ink-2 group-hover:text-blue" />
          </button>
          <Button variant="outline" onClick={printAll} disabled={busy || !cls.studentCount}>
            <Printer /> In phiếu
          </Button>
          <Button variant="sun" onClick={() => setAdding(true)}>
            <UserPlus /> Thêm học sinh
          </Button>
          <Button onClick={() => setStarting(true)}>
            <Play className="fill-current" /> Bắt đầu tiết
          </Button>
        </div>
      </div>

      {/* Tab */}
      <div className="mt-7 flex gap-1 overflow-x-auto border-b-2 border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative flex h-12 items-center gap-2 px-4 text-sm font-bold whitespace-nowrap transition-colors",
              tab === t.key ? "text-ink" : "text-ink-2 hover:text-ink"
            )}
          >
            <t.icon className="size-4" /> {t.label}
            {tab === t.key && <span className="absolute inset-x-2 -bottom-0.5 h-1 rounded-full bg-blue" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <ClassOverview cls={cls} students={students} sessions={sessions} stats={stats} live={live} participants={participants} now={now} onBell={bell} />}
        {tab === "messages" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">Tin gửi học sinh lớp {cls.name} và trạng thái đã nhận / đã xem / đã xác nhận — cập nhật tức thì.</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(KIND_META) as MessageKind[]).map((k) => {
                  const I = KIND_ICON[k];
                  return (
                    <Button key={k} size="sm" variant={k === "attention" ? "sun" : k === "praise" ? "teal" : k === "notice" ? "ink" : "default"} onClick={() => setCompose({ kind: k })}>
                      <I /> {KIND_META[k].label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <MessageFeed messages={msgs.data} receipts={msgs.receipts} roster={roster} now={now} />
          </div>
        )}
        {tab === "rankings" && <ClassRankings cls={cls} students={students} stats={stats} now={now} />}
        {tab === "mastery" && <ClassMastery cls={cls} students={students} stats={stats} />}
        {tab === "homework" && <Homework cls={cls} students={students} now={now} />}
        {tab === "grades" && <Gradebook cls={cls} students={students} sessions={sessions} />}
        {tab === "activity" && <Activity cls={cls} students={students} sessions={sessions} />}
        {tab === "analytics" && <ClassAnalytics sessions={sessions} />}
        {tab === "manage" && (
          <>
            <div className="mb-5 inline-flex rounded-2xl bg-white p-1 ring-2 ring-line" role="tablist">
              {SUBTABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={sub === t.key}
                  onClick={() => setSub(t.key)}
                  className={cn("flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors", sub === t.key ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}
                >
                  <t.icon className="size-4" /> {t.label}
                </button>
              ))}
            </div>
            {sub === "students" && <StudentList cls={cls} students={students} onAdd={() => setAdding(true)} />}
            {sub === "teams" && <TeamsBoard cls={cls} students={students} />}
            {sub === "levels" && <LevelsBoard cls={cls} students={students} sessions={sessions} />}
            {sub === "settings" && <ClassSettingsForm key={cls.id} cls={cls} />}
          </>
        )}
      </div>

      {tab === "manage" && sub === "students" && students.length > 0 && (
        <p className="mt-4 flex items-center gap-2 text-xs text-ink-2">
          <KeyRound className="size-3.5" /> PIN được mã hoá một chiều; muốn in lại phiếu cần tạo PIN mới.
        </p>
      )}

      <AddStudentsDialog cls={cls} open={adding} onOpenChange={setAdding} />
      <StartLessonDialog cls={cls} open={starting} onOpenChange={setStarting} />
      {compose && (
        <ComposeDialog
          key={`${compose.kind}-${compose.uids?.join(",") ?? "all"}`}
          cls={cls}
          students={students}
          open
          onOpenChange={(v) => !v && setCompose(null)}
          preset={compose}
          sessionId={live?.id ?? null}
        />
      )}
      {confirmEl}
    </div>
  );
}
