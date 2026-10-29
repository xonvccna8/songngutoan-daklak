"use client";

// Gom mọi dữ liệu một phiên dạy cần cho laptop GV và tivi
import { useMemo } from "react";
import { useClass, useStudents } from "@/lib/hooks/use-firestore";
import { useLesson, useParticipants, useSession, useSessionResponses } from "@/lib/live/hooks";
import type { RosterEntry } from "@/components/live/tv-screen";

export function useSessionData(sessionId: string | undefined) {
  const { data: session, loading, receivedAt } = useSession(sessionId);
  const { data: lesson, error: lessonError } = useLesson(session?.lessonId, true);
  const participants = useParticipants(sessionId);
  const responses = useSessionResponses(sessionId);
  const { data: cls } = useClass(session?.classId);
  const { data: students } = useStudents(session?.classId);

  const roster = useMemo(() => new Map<string, RosterEntry>(students.map((s) => [s.uid, { name: s.fullName, team: s.team, eLevel: s.eLevel }])), [students]);
  const ctx = useMemo(() => (lesson ? { slides: lesson.slides, keys: lesson.keys } : null), [lesson]);
  // Danh sách để gọi tên ngẫu nhiên: các em đã vào lớp
  const joined = useMemo(
    () => participants.filter((p) => roster.has(p.uid)).map((p) => ({ uid: p.uid, name: roster.get(p.uid)!.name.split(" ").slice(-2).join(" ") })),
    [participants, roster]
  );
  const host = typeof window !== "undefined" ? window.location.host : "";

  return { session, loading, receivedAt, lesson, lessonError, participants, responses, cls, students, roster, ctx, joined, join: { code: cls?.joinCode ?? "", host } };
}
