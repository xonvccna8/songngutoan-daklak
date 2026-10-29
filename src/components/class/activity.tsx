"use client";

// Tab Hoạt động: dòng thời gian các tiết học — ai vào lúc nào, trả lời/đúng bao nhiêu, rời trang mấy lần
import Link from "next/link";
import { BookOpen, EyeOff, LogIn, UserX } from "lucide-react";
import { cn } from "cn";
import { Avatar, EmptyState } from "@/components/common";
import { ended } from "@/lib/analytics";
import type { SessionDoc } from "@/lib/live/types";
import type { ClassDoc, StudentDoc } from "@/lib/types";

const time = (ms: number | null) => (ms ? new Date(ms).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—");

export function Activity({ cls, students, sessions }: { cls: ClassDoc; students: StudentDoc[]; sessions: SessionDoc[] }) {
  const list = ended(sessions).reverse().slice(0, 15);
  const byUid = new Map(students.map((s) => [s.uid, s]));
  if (list.length === 0) return <EmptyState title="Chưa có hoạt động">Hoạt động của học sinh trong các tiết học sẽ hiện ở đây.</EmptyState>;

  return (
    <ol className="relative flex flex-col gap-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-line">
      {list.map((s) => {
        const at = s.createdAt?.toMillis() ?? 0;
        const res = Object.entries(s.results ?? {});
        const absent = students.filter((st) => !s.results?.[st.uid]);
        const qCount = Object.keys(s.questions ?? {}).length;
        return (
          <li key={s.id} className="relative pl-14">
            <span className="absolute top-0 left-0 grid size-10 place-items-center rounded-xl bg-ink text-white shadow-[0_3px_0_#000]">
              <BookOpen className="size-5" />
            </span>
            <div className="card-lsn p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-extrabold">{s.lessonTitle?.vi}</h3>
                <span className="text-xs font-semibold text-ink-2">
                  {new Date(at).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })} · {time(at)}–{time(s.endedAt?.toMillis() ?? null)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-2">
                {res.length}/{students.length} em tham gia · điểm TB {s.summary?.avgPoints ?? 0} · đúng {s.summary?.accuracy ?? 0}%
              </p>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {res
                  .sort((a, b) => (a[1].joinedAt ?? 0) - (b[1].joinedAt ?? 0))
                  .map(([uid, r]) => {
                    const st = byUid.get(uid);
                    if (!st) return null;
                    return (
                      <li key={uid} className="flex items-center gap-2 rounded-xl bg-paper px-2.5 py-1.5 text-[13px]">
                        <Avatar name={st.fullName} team={st.team} className="size-7 text-[10px]" />
                        <Link href={`/teacher/classes/${cls.id}/students/${uid}`} className="min-w-0 flex-1 truncate font-semibold hover:text-blue">
                          {st.fullName}
                        </Link>
                        <span className="inline-flex items-center gap-1 text-xs text-ink-2" title="Vào tiết lúc">
                          <LogIn className="size-3" /> {time(r.joinedAt)}
                        </span>
                        <span className="text-xs font-bold tabular-nums" title="Số câu đúng / đã trả lời">
                          {r.correct}/{qCount}
                        </span>
                        {r.leftCount > 0 && (
                          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 text-[11px] font-bold", r.leftCount > 2 ? "bg-coral-soft text-[#A3301B]" : "bg-sun-soft text-[#8A5A00]")} title="Số lần rời trang">
                            <EyeOff className="size-3" /> {r.leftCount}
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
              {absent.length > 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-2">
                  <UserX className="mt-0.5 size-3.5 shrink-0 text-coral" />
                  <span>
                    <b>Vắng ({absent.length}):</b> {absent.map((a) => a.fullName).join(", ")}
                  </span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
