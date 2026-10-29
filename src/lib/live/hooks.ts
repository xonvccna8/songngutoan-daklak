"use client";

// Đọc tiết học / phiên dạy theo thời gian thực (onSnapshot)
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { LessonDoc, MineDoc, MyAnswer, ParticipantDoc, ResponseDoc, SessionDoc, Slide, TeacherKey } from "@/lib/live/types";

export interface LessonData {
  lesson: LessonDoc;
  slides: Slide[];
  keys: Record<string, TeacherKey>;
}

/** Tải tiết học 1 lần (nội dung tĩnh). withKeys: GV tải thêm đáp án + ghi chú */
export function useLesson(lessonId: string | undefined, withKeys: boolean) {
  const [state, setState] = useState<{ data: LessonData | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    if (!lessonId) return;
    let alive = true;
    (async () => {
      const ref = doc(db(), COL.lessons, lessonId);
      const [l, s, k] = await Promise.all([
        getDoc(ref),
        getDocs(collection(ref, COL.slides)),
        withKeys ? getDocs(collection(ref, COL.teacherKeys)) : Promise.resolve(null),
      ]);
      if (!l.exists()) throw new Error("Không tìm thấy tiết học.");
      const lesson = { id: l.id, ...l.data() } as LessonDoc;
      const byId = new Map(s.docs.map((d) => [d.id, d.data() as Slide]));
      const slides = lesson.slideIds.map((id) => byId.get(id)).filter(Boolean) as Slide[];
      const keys: Record<string, TeacherKey> = {};
      k?.docs.forEach((d) => (keys[d.id] = d.data() as TeacherKey));
      if (alive) setState({ data: { lesson, slides, keys }, error: null });
    })().catch((e) => alive && setState({ data: null, error: e.message }));
    return () => {
      alive = false;
    };
  }, [lessonId, withKeys]);
  return state;
}

export function useSession(sessionId: string | undefined) {
  const [state, setState] = useState<{ data: SessionDoc | null; loading: boolean; receivedAt: number }>({ data: null, loading: true, receivedAt: 0 });
  useEffect(() => {
    if (!sessionId) return;
    return onSnapshot(
      doc(db(), COL.sessions, sessionId),
      (s) => setState({ data: s.exists() ? ({ id: s.id, ...s.data() } as SessionDoc) : null, loading: false, receivedAt: Date.now() }),
      () => setState({ data: null, loading: false, receivedAt: Date.now() })
    );
  }, [sessionId]);
  return state;
}

/** Tiết đang dạy của một lớp (HS dùng để vào lớp; GV dùng để "Tiếp tục tiết") */
export function useLiveSessionForClass(classId: string | undefined) {
  const [state, setState] = useState<{ data: SessionDoc | null; loading: boolean; receivedAt: number }>({ data: null, loading: true, receivedAt: 0 });
  useEffect(() => {
    if (!classId) return;
    return onSnapshot(
      query(collection(db(), COL.sessions), where("classId", "==", classId), where("status", "==", "live"), limit(1)),
      (snap) => {
        const d = snap.docs[0];
        setState({ data: d ? ({ id: d.id, ...d.data() } as SessionDoc) : null, loading: false, receivedAt: Date.now() });
      },
      () => setState({ data: null, loading: false, receivedAt: Date.now() })
    );
  }, [classId]);
  return state;
}

export function useParticipants(sessionId: string | undefined) {
  const [list, setList] = useState<ParticipantDoc[]>([]);
  useEffect(() => {
    if (!sessionId) return;
    return onSnapshot(collection(db(), COL.sessions, sessionId, COL.participants), (snap) =>
      setList(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as ParticipantDoc))
    );
  }, [sessionId]);
  return list;
}

/** GV/tivi: mọi câu trả lời của phiên */
export function useSessionResponses(sessionId: string | undefined) {
  const [list, setList] = useState<ResponseDoc[]>([]);
  useEffect(() => {
    if (!sessionId) return;
    return onSnapshot(collection(db(), COL.sessions, sessionId, COL.responses), (snap) =>
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResponseDoc))
    );
  }, [sessionId]);
  return list;
}

/** HS: chỉ câu trả lời của chính mình */
export function useMyResponses(sessionId: string | undefined, uid: string | undefined) {
  const [list, setList] = useState<ResponseDoc[]>([]);
  useEffect(() => {
    if (!sessionId || !uid) return;
    return onSnapshot(query(collection(db(), COL.sessions, sessionId, COL.responses), where("uid", "==", uid)), (snap) =>
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResponseDoc))
    );
  }, [sessionId, uid]);
  return list;
}

/** HS trong tiết: phiếu của em — câu đã gửi + kết quả câu đã công bố (không lộ đúng/sai trước khi GV công bố) */
export function useMyBoard(sessionId: string | undefined, uid: string | undefined) {
  const [mine, setMine] = useState<MineDoc>({});
  useEffect(() => {
    if (!sessionId || !uid) return;
    return onSnapshot(
      doc(db(), COL.sessions, sessionId, COL.mine, uid),
      (s) => setMine((s.data() as MineDoc | undefined) ?? {}),
      () => setMine({})
    );
  }, [sessionId, uid]);
  return useMemo(() => {
    const ids = new Set([...Object.keys(mine.answers ?? {}), ...Object.keys(mine.speak ?? {})]);
    const bySlide = new Map<string, MyAnswer>(
      [...ids].map((id) => [id, { slideId: id, value: mine.answers?.[id]?.value, ...mine.results?.[id], ...mine.speak?.[id] }])
    );
    const total =
      Object.values(mine.results ?? {}).reduce((a, r) => a + (r.points ?? 0), 0) + Object.values(mine.speak ?? {}).reduce((a, r) => a + (r.score ?? 0), 0);
    return { bySlide, total };
  }, [mine]);
}

/** Đồng hồ đếm ngược, không phụ thuộc giờ của từng máy: timerMs tính tại lúc nhận bản ghi */
export function useCountdown(timerMs: number | null, receivedAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (timerMs == null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [timerMs]);
  return useMemo(() => (timerMs == null ? null : Math.max(0, timerMs - (now - receivedAt))), [timerMs, now, receivedAt]);
}

export const fmtClock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
