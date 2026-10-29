"use client";

// GĐ 6 — Đọc thư viện tiết, ngân hàng thuật ngữ, và tải đủ một tiết (kèm đáp án) để soạn / xuất Word
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { isMathLesson, isScienceTerm } from "@/lib/subject";
import { useMathLessonIds } from "@/lib/hooks/use-math-lessons";
import type { EditorSlide } from "@/lib/lessons/editor";
import type { LessonDoc, Slide, TeacherKey } from "@/lib/live/types";
import type { TermDoc } from "@/lib/study/types";

/** Mọi tiết (GV/quản trị đọc được cả nháp) — trường nhỏ nên tải hết, sắp mới sửa lên trước */
export function useLessonList() {
  const [state, setState] = useState<{ data: LessonDoc[]; loading: boolean }>({ data: [], loading: true });
  useEffect(
    () =>
      onSnapshot(
        query(collection(db(), COL.lessons), limit(300)),
        (s) => {
          // Chỉ hiện tiết Toán — ẩn tiết của trang KHTN (Firebase dùng chung — không xoá)
          const list = s.docs.map((d) => ({ id: d.id, ...d.data() }) as LessonDoc).filter(isMathLesson);
          list.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
          setState({ data: list, loading: false });
        },
        () => setState({ data: [], loading: false })
      ),
    []
  );
  return state;
}

export function useTermBank() {
  const [state, setState] = useState<{ data: TermDoc[]; loading: boolean }>({ data: [], loading: true });
  const mathIds = useMathLessonIds();
  useEffect(
    () =>
      onSnapshot(
        query(collection(db(), COL.terms), limit(1000)),
        (s) => setState({ data: s.docs.map((d) => ({ id: d.id, ...d.data() }) as TermDoc).sort((a, b) => a.en.localeCompare(b.en)), loading: false }),
        () => setState({ data: [], loading: false })
      ),
    []
  );
  // Ẩn thuật ngữ của trang KHTN; chờ biết danh sách tiết Toán để không nháy
  return useMemo(
    () => (mathIds ? { data: state.data.filter((t) => !isScienceTerm(t, mathIds)), loading: state.loading } : { data: [], loading: true }),
    [state, mathIds]
  );
}

/** Tải tiết + các trang (theo thứ tự) + đáp án/ghi chú */
export async function fetchLessonFull(id: string): Promise<{ lesson: LessonDoc; slides: EditorSlide[] }> {
  const ref = doc(db(), COL.lessons, id);
  const [l, s, k] = await Promise.all([getDoc(ref), getDocs(collection(ref, COL.slides)), getDocs(collection(ref, COL.teacherKeys))]);
  if (!l.exists()) throw new Error("Không tìm thấy tiết học.");
  const lesson = { id: l.id, ...l.data() } as LessonDoc;
  const byId = new Map(s.docs.map((d) => [d.id, d.data() as Slide]));
  const keys = new Map(k.docs.map((d) => [d.id, d.data() as TeacherKey]));
  const slides = lesson.slideIds
    .map((sid) => byId.get(sid))
    .filter((x): x is Slide => !!x)
    .map((x) => ({ ...x, key: { notes: [], ...keys.get(x.id) } }));
  return { lesson, slides };
}
