"use client";

// Tự học: bài tập về nhà · ôn từ vựng · luyện phát âm · xem lại tiết đã học
import Link from "next/link";
import { ChevronRight, FlaskConical, Gamepad2, History, Layers, Lightbulb, Mic, NotebookPen, Sparkles, Users } from "lucide-react";
import { StudentShell, useStudent } from "@/components/student/student-shell";
import { HwCard } from "@/components/student/hw-card";
import { useClassSessions, useNow } from "@/lib/hooks/use-class-history";
import { useMyAssignments, useMyCards, useSubmissionsOf, useTerms } from "@/lib/study/hooks";
import { buildQueue } from "@/lib/study/srs";
import { ended } from "@/lib/analytics";

export default function LearnPage() {
  return (
    <StudentShell>
      <Learn />
    </StudentShell>
  );
}

function Learn() {
  const { uid, classId, cls } = useStudent();
  const now = useNow(30_000);
  const { data: hw, loading } = useMyAssignments(uid);
  const subs = useSubmissionsOf(
    hw.map((a) => a.id),
    uid
  );
  const { data: terms } = useTerms(cls?.grade);
  const { data: cards } = useMyCards(uid);
  const { data: sessions } = useClassSessions(classId, 20);
  const queue = now ? buildQueue(terms.map((t) => t.id), cards, now) : [];
  const dueCards = queue.filter((id) => cards[id]).length;
  const newCards = queue.length - dueCards;
  const past = uid ? ended(sessions).filter((s) => s.results?.[uid]).reverse() : [];

  const open = hw.filter((a) => !subs[a.id]?.completedAt);
  const done = hw.filter((a) => subs[a.id]?.completedAt).reverse();

  return (
    <>
      <header className="px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Tự học</h1>
        <p className="text-en font-semibold">Self-study</p>
      </header>

      <section className="grid grid-cols-2 gap-3 px-5 pt-5">
        <Link href="/s/notebook" className="card-lsn col-span-2 flex items-center gap-3 border-blue/30 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk">
            <NotebookPen className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-display text-lg leading-tight">Vở ghi bài học</b>
            <span className="text-xs text-ink-2">Lý thuyết, từ vựng và bài tập các bài trọng tâm</span>
          </span>
          <ChevronRight className="size-5 text-ink-2" />
        </Link>
        <Link href="/s/play" className="card-lsn hover-glow group col-span-2 flex items-center gap-3 border-sun/60 bg-sun-soft p-4">
          <span className="hover-wiggle grid size-11 shrink-0 place-items-center rounded-xl bg-sun text-ink">
            <Gamepad2 className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-display text-lg leading-tight">Trò chơi ôn tập</b>
            <span className="text-xs text-ink-2">Ghép từ, đố vui kiến thức, về đích 3 mạng — theo từng bài</span>
          </span>
          <ChevronRight className="size-5 text-ink-2" />
        </Link>
        <Link href="/s/cards" className="card-lsn flex flex-col gap-2 p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-teal-soft text-[#0A6F5F]">
            <Layers className="size-5" />
          </span>
          <b className="font-display text-lg leading-tight">Ôn từ vựng</b>
          <span className="text-xs text-ink-2">{queue.length ? `${dueCards} thẻ cần ôn · ${newCards} thẻ mới` : "Hôm nay đã ôn xong"} · chọn ôn theo bài</span>
        </Link>
        <Link href="/s/speak" className="card-lsn flex flex-col gap-2 p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-coral-soft text-[#A3301B]">
            <Mic className="size-5" />
          </span>
          <b className="font-display text-lg leading-tight">Luyện phát âm</b>
          <span className="text-xs text-ink-2">Nghe mẫu, đọc to, máy chấm từng từ</span>
        </Link>
        <Link href="/s/lab" className="card-lsn flex flex-col gap-2 p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-soft text-blue-dk">
            <FlaskConical className="size-5" />
          </span>
          <b className="font-display text-lg leading-tight">Hình học động</b>
          <span className="text-xs text-ink-2">Mô phỏng song ngữ, mô hình 3D</span>
        </Link>
        <Link href="/s/stem" className="card-lsn flex flex-col gap-2 p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-sun-soft text-[#8A5A00]">
            <Lightbulb className="size-5" />
          </span>
          <b className="font-display text-lg leading-tight">Dự án STEM</b>
          <span className="text-xs text-ink-2">Cùng tổ làm sản phẩm</span>
        </Link>
        <Link href="/s/tutor" className="card-lsn col-span-2 flex items-center gap-3 border-[#7A4CC2]/30 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F0E9FB] text-[#7A4CC2]">
            <Sparkles className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-display text-lg leading-tight">Trợ lý học tập AI</b>
            <span className="text-xs text-ink-2">Hỏi Tâm về bài học và tiếng Anh — gợi ý, không làm hộ</span>
          </span>
          <ChevronRight className="size-5 text-ink-2" />
        </Link>
        <Link href="/s/community" className="card-lsn col-span-2 flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-soft text-[#0A6F5F]">
            <Users className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-display text-lg leading-tight">Hỏi đáp lớp</b>
            <span className="text-xs text-ink-2">Hỏi bạn, hỏi thầy cô — bằng tiếng Anh càng tốt</span>
          </span>
          <ChevronRight className="size-5 text-ink-2" />
        </Link>
      </section>

      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">Bài tập về nhà</h2>
        {loading ? null : open.length === 0 ? (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Chưa có bài nào cần làm.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {open.map((a) => (
              <HwCard key={a.id} a={a} sub={subs[a.id]} now={now} />
            ))}
          </div>
        )}
        {done.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer py-2 text-sm font-bold text-ink-2">Đã nộp ({done.length})</summary>
            <div className="flex flex-col gap-2">
              {done.map((a) => (
                <HwCard key={a.id} a={a} sub={subs[a.id]} now={now} />
              ))}
            </div>
          </details>
        )}
      </section>

      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">Xem lại tiết đã học</h2>
        {past.length === 0 ? (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Sau mỗi tiết học, em xem lại bài giảng, câu trả lời và lời giải ở đây.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {past.slice(0, 10).map((s) => {
              const r = s.results![uid!];
              return (
                <li key={s.id}>
                  <Link href={`/s/review/${s.id}`} className="card-lsn flex items-center gap-3 p-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk">
                      <History className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate">{s.lessonTitle?.vi}</b>
                      <span className="text-xs text-ink-2">
                        {new Date(s.createdAt?.toMillis() ?? 0).toLocaleDateString("vi-VN")} · {r.points} điểm · đúng {r.correct}/{r.answered || 0}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-ink-2" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
