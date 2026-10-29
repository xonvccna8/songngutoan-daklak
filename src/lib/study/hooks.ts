"use client";

// Hook đọc dữ liệu tự học (onSnapshot) cho HS và GV
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { StatsDoc } from "@/lib/analytics";
import type { AssignmentDoc, CardsDoc, SubmissionDoc, TermDoc } from "@/lib/study/types";
import { isScienceCurId, isScienceTerm } from "@/lib/subject";
import { BANK_LESSON_ID } from "@/lib/bank/questions";
import { useMathLessonIds } from "@/lib/hooks/use-math-lessons";

const byDue = (a: AssignmentDoc, b: AssignmentDoc) => a.dueAt.toMillis() - b.dueAt.toMillis();

/** Ẩn dữ liệu của trang KHTN (Firebase dùng chung — không xoá); chờ biết danh sách tiết Toán để không nháy */
function useHideScience<T>(state: { data: T[]; loading: boolean }, isScience: (x: T, mathIds: ReadonlySet<string>) => boolean) {
  const mathIds = useMathLessonIds();
  return useMemo(() => (mathIds ? { data: state.data.filter((x) => !isScience(x, mathIds)), loading: state.loading } : { data: [] as T[], loading: true }), [state, mathIds, isScience]);
}
/** Bài giao từ ngân hàng: xét mã YCCĐ của câu hỏi · bài giao từ tiết: tiết phải là tiết Toán */
const scienceAssignment = (a: AssignmentDoc, ids: ReadonlySet<string>) =>
  a.lessonId === BANK_LESSON_ID ? (a.items ?? []).some((i) => (i.slide?.outcomeIds ?? []).some(isScienceCurId)) : !ids.has(a.lessonId);

/** Thống kê của chính em (chưa có tài liệu → null) */
export function useMyStats(classId: string | undefined, uid: string | undefined) {
  const [state, setState] = useState<{ data: StatsDoc | null; loading: boolean }>({ data: null, loading: true });
  useEffect(() => {
    if (!classId || !uid) return;
    return onSnapshot(
      doc(db(), COL.stats, `${classId}_${uid}`),
      (s) => setState({ data: s.exists() ? (s.data() as StatsDoc) : null, loading: false }),
      // Chưa có tài liệu thì rules từ chối (vì so resource.data.uid) → coi như chưa có số liệu
      () => setState({ data: null, loading: false })
    );
  }, [classId, uid]);
  return state;
}

/** Bài được giao cho em (hạn gần nhất trước) */
export function useMyAssignments(uid: string | undefined) {
  const [state, setState] = useState<{ data: AssignmentDoc[]; loading: boolean }>({ data: [], loading: true });
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(db(), COL.assignments), where("toUids", "array-contains", uid)),
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssignmentDoc).sort(byDue), loading: false }),
      () => setState({ data: [], loading: false })
    );
  }, [uid]);
  return useHideScience(state, scienceAssignment);
}

export function useAssignment(aid: string | undefined) {
  const [state, setState] = useState<{ data: AssignmentDoc | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!aid) return;
    return onSnapshot(
      doc(db(), COL.assignments, aid),
      (s) => setState({ data: s.exists() ? ({ id: s.id, ...s.data() } as AssignmentDoc) : null, loading: false, error: null }),
      (e) => setState({ data: null, loading: false, error: e.message })
    );
  }, [aid]);
  return state;
}

/** Bài làm của 1 em cho nhiều bài (aid → bài làm) */
export function useSubmissionsOf(aids: string[], uid: string | undefined) {
  const key = aids.join(",");
  const [map, setMap] = useState<Record<string, SubmissionDoc>>({});
  useEffect(() => {
    if (!uid || !key) return;
    const unsubs = key.split(",").map((aid) =>
      onSnapshot(
        doc(db(), COL.assignments, aid, COL.submissions, uid),
        (s) =>
          setMap((m) => {
            const next = { ...m };
            if (s.exists()) next[aid] = s.data() as SubmissionDoc;
            else delete next[aid];
            return next;
          }),
        () => {}
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [key, uid]);
  return map;
}

/** Tất cả bài làm của một bài (GV) */
export function useSubmissions(aid: string | undefined) {
  const [list, setList] = useState<SubmissionDoc[]>([]);
  useEffect(() => {
    if (!aid) return;
    return onSnapshot(
      collection(db(), COL.assignments, aid, COL.submissions),
      (snap) => setList(snap.docs.map((d) => ({ ...(d.data() as SubmissionDoc), uid: d.id }))),
      () => setList([])
    );
  }, [aid]);
  return useMemo(() => new Map(list.map((s) => [s.uid, s])), [list]);
}

/** Bài tập của lớp (GV) — mới giao trước */
export function useClassAssignments(classId: string | undefined) {
  const [state, setState] = useState<{ data: AssignmentDoc[]; loading: boolean }>({ data: [], loading: true });
  useEffect(() => {
    if (!classId) return;
    return onSnapshot(
      query(collection(db(), COL.assignments), where("classId", "==", classId)),
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssignmentDoc).sort((a, b) => -byDue(a, b)), loading: false }),
      () => setState({ data: [], loading: false })
    );
  }, [classId]);
  return useHideScience(state, scienceAssignment);
}

/** Thuật ngữ đã duyệt của khối lớp */
export function useTerms(grade: number | undefined) {
  const [state, setState] = useState<{ data: TermDoc[]; loading: boolean }>({ data: [], loading: true });
  useEffect(() => {
    if (!grade) return;
    return onSnapshot(
      query(collection(db(), COL.terms), where("grade", "==", grade), where("status", "==", "approved")),
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TermDoc), loading: false }),
      () => setState({ data: [], loading: false })
    );
  }, [grade]);
  return useHideScience(state, isScienceTerm);
}

export function useMyCards(uid: string | undefined) {
  const [state, setState] = useState<{ data: CardsDoc["cards"]; loading: boolean }>({ data: {}, loading: true });
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(db(), COL.cards, uid),
      (s) => setState({ data: (s.get("cards") as CardsDoc["cards"] | undefined) ?? {}, loading: false }),
      () => setState({ data: {}, loading: false })
    );
  }, [uid]);
  return state;
}
