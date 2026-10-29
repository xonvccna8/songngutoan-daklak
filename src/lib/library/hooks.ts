"use client";

// Hook đọc học liệu theo thời gian thực: GV (tất cả) · HS (đã duyệt, theo bài SGK) · tiết + thuật ngữ gắn với bài SGK
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { LessonDoc } from "@/lib/live/types";
import type { ResourceDoc } from "@/lib/library/resources";
import { isScienceCurId } from "@/lib/subject";

const byTime = (a: ResourceDoc, b: ResourceDoc) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0);

/** GV / quản trị: toàn bộ học liệu (ít, đọc một lần + theo dõi) */
export function useAllResources() {
  const [state, setState] = useState<{ data: ResourceDoc[]; loading: boolean }>({ data: [], loading: true });
  useEffect(
    () =>
      onSnapshot(
        collection(db(), COL.resources),
        // Ẩn học liệu gắn khung chương trình KHTN (Firebase dùng chung — không xoá)
        (s) => setState({ data: s.docs.map((d) => ({ id: d.id, ...d.data() }) as ResourceDoc).filter((r) => !isScienceCurId(r.curLessonId)).sort(byTime), loading: false }),
        () => setState({ data: [], loading: false })
      ),
    []
  );
  return state;
}

/** HS (và GV): học liệu ĐÃ DUYỆT của một bài SGK */
export function useLessonResources(curLessonId: string | null | undefined) {
  const [list, setList] = useState<ResourceDoc[]>([]);
  useEffect(() => {
    if (!curLessonId) return;
    return onSnapshot(
      query(collection(db(), COL.resources), where("status", "==", "approved"), where("curLessonId", "==", curLessonId)),
      (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as ResourceDoc).sort(byTime)),
      () => setList([])
    );
  }, [curLessonId]);
  return list;
}

/** HS (và GV): mô phỏng / mô hình 3D ĐÃ DUYỆT của một khối (Hình học động) */
export function useLabResources(grade: number | null | undefined) {
  const [list, setList] = useState<ResourceDoc[]>([]);
  useEffect(() => {
    if (!grade) return;
    return onSnapshot(
      query(collection(db(), COL.resources), where("status", "==", "approved"), where("grade", "==", grade)),
      (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as ResourceDoc).filter((r) => r.kind === "simulation" || r.kind === "model3d").sort(byTime)),
      () => setList([])
    );
  }, [grade]);
  return list;
}

/** Các tiết ĐÃ DUYỆT gắn với một bài SGK (lấy thuật ngữ cho phần xem trước) */
export function useApprovedLessonsFor(curLessonId: string | null | undefined) {
  const [list, setList] = useState<LessonDoc[]>([]);
  useEffect(() => {
    if (!curLessonId) return;
    return onSnapshot(
      query(collection(db(), COL.lessons), where("status", "==", "approved"), where("curLessonId", "==", curLessonId)),
      (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as LessonDoc)),
      () => setList([])
    );
  }, [curLessonId]);
  return list;
}
