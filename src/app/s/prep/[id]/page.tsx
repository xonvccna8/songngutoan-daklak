"use client";

// GĐ 4 — Xem trước bài (lớp học đảo ngược): em sẽ học được gì (YCCĐ song ngữ + Sao của em),
// thuật ngữ có phát âm, hình động GeoGebra, video. Ở lại đủ PREP_SECONDS giây → +5 XP (mỗi bài một lần).
import { useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Target } from "lucide-react";
import { EmptyState } from "@/components/common";
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { SayButtons } from "@/components/library/say";
import { ResourceView } from "@/components/library/resource-view";
import { Stars } from "@/components/class/mastery";
import { api } from "@/lib/api-client";
import { chapterOf, curLesson, starsOf } from "@/lib/curriculum";
import { useApprovedLessonsFor, useLessonResources } from "@/lib/library/hooks";
import { useMyStats, useTerms } from "@/lib/study/hooks";
import { XP } from "@/lib/progress/xp";
import type { Term } from "@/lib/live/types";

const PREP_SECONDS = 30;

export default function PrepPage() {
  return (
    <StudentShell>
      <Prep />
    </StudentShell>
  );
}

function Prep() {
  const { id } = useParams<{ id: string }>();
  const { uid, classId, cls } = useStudent();
  const { data: stats, loading } = useMyStats(classId, uid);
  const lesson = curLesson(id);
  const chapter = chapterOf(id);
  const ok = !!lesson && (!cls || cls.grade === lesson.grade);
  const resources = useLessonResources(ok ? id : null);
  const lessons = useApprovedLessonsFor(ok ? id : null);
  const { data: bank } = useTerms(ok ? lesson?.grade : undefined);
  const done = !!stats?.prepped?.[id];

  // Thuật ngữ của các tiết đã duyệt gắn với bài này + thuật ngữ kho học liệu gắn với bài SGK (bỏ trùng)
  const terms = useMemo(() => {
    const m = new Map<string, Pick<Term, "en" | "ipa" | "vi">>();
    lessons.forEach((l) => (l.terms ?? []).forEach((t) => !m.has(t.en.toLowerCase()) && m.set(t.en.toLowerCase(), t)));
    bank.filter((t) => t.curLessonIds?.includes(id)).forEach((t) => !m.has(t.en.toLowerCase()) && m.set(t.en.toLowerCase(), t));
    return [...m.values()];
  }, [lessons, bank, id]);

  // Ở trang đủ lâu (và trang đang hiển thị) mới ghi nhận đã xem trước
  const sent = useRef(false);
  useEffect(() => {
    if (!ok || loading || done || sent.current) return;
    const t = setTimeout(() => {
      if (document.visibilityState !== "visible" || sent.current) return;
      sent.current = true;
      api("/api/s/prep", { body: { curLessonId: id } }).catch(() => (sent.current = false));
    }, PREP_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [ok, loading, done, id]);

  if (!lesson || !ok) {
    return (
      <>
        <StudentHeader en="Preview" vi="Xem trước bài" back="/s" />
        <div className="p-5">
          <EmptyState title="Không tìm thấy bài" mood="alert">
            Bài này không thuộc khối lớp của em.
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentHeader en={lesson.en} vi={`Bài ${lesson.no}. ${lesson.vi}`} back="/s" />
      <p className="px-5 pt-1 text-xs font-semibold text-ink-2">
        Chương {chapter?.no}. {chapter?.vi} · Preview
      </p>

      <section className="px-5 pt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-teal-soft p-3 text-sm font-semibold text-[#0E6377]">
          <CheckCircle2 className="size-5 shrink-0" />
          {done ? "Em đã xem trước bài này. Xem lại bao nhiêu lần cũng được!" : `Đọc và nghe hết trang này khoảng ${PREP_SECONDS} giây để nhận +${XP.prep} XP.`}
        </div>
      </section>

      {/* Em sẽ học được gì */}
      <section className="px-5 pt-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Target className="size-5 text-blue" /> Em sẽ học được gì?
        </h2>
        <p className="text-en text-sm font-semibold">What will you learn?</p>
        {lesson.outcomes.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {lesson.outcomes.map((o) => (
              <li key={o.id} className="card-lsn p-3">
                <div className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="text-en block font-semibold">{o.en}</span>
                    <span className="text-vi block text-sm">{o.vi}</span>
                  </span>
                  <SayButtons text={o.en} />
                </div>
                <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-2">
                  Sao của em: <Stars n={starsOf(stats?.mastery?.[o.id])} />
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Thầy cô sẽ giới thiệu mục tiêu của bài trên lớp.</p>
        )}
      </section>

      {/* Thuật ngữ */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">Thuật ngữ của bài</h2>
        <p className="text-en text-sm font-semibold">Key words</p>
        {terms.length ? (
          <ul className="card-lsn mt-3 divide-y divide-line">
            {terms.map((t) => (
              <li key={t.en} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <b className="text-en block">{t.en}</b>
                  <span className="block text-xs text-ink-2">{t.ipa}</span>
                  <span className="text-vi block text-sm">{t.vi}</span>
                </span>
                <SayButtons text={t.en} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Chưa có thuật ngữ cho bài này.</p>
        )}
      </section>

      {/* Học liệu */}
      <section className="px-5 pt-6">
        <h2 className="text-lg font-extrabold">Hình động & video</h2>
        <p className="text-en text-sm font-semibold">Applets and videos</p>
        {resources.length ? (
          <div className="mt-3 flex flex-col gap-3">
            {resources.map((r) => (
              <ResourceView key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <p className="card-lsn mt-3 p-4 text-sm text-ink-2">Thầy cô chưa thêm hình động hay video cho bài này.</p>
        )}
      </section>
    </>
  );
}
