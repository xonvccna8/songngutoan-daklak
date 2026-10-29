"use client";

// Lịch sử học của một lớp: các tiết gần nhất (đã có bản tóm tắt) + thống kê cộng dồn từng em
import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { SessionDoc } from "@/lib/live/types";
import type { StatsDoc } from "@/lib/analytics";
import { useMathLessonIds } from "@/lib/hooks/use-math-lessons";

/** Cần chỉ mục ghép lsn_sessions(classId ASC, createdAt DESC) — tạo bằng npm run indexes */
export function useClassSessions(classId: string | undefined, max = 60) {
  const [state, setState] = useState<{ data: SessionDoc[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null });
  const mathIds = useMathLessonIds();
  useEffect(() => {
    if (!classId) return;
    return onSnapshot(
      query(collection(db(), COL.sessions), where("classId", "==", classId), orderBy("createdAt", "desc"), limit(max)),
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SessionDoc), loading: false, error: null }),
      (err) => setState({ data: [], loading: false, error: err.message })
    );
  }, [classId, max]);
  // Ẩn các tiết dạy bằng bài Toán cũ (Firebase dùng chung — không xoá)
  return useMemo(() => (mathIds ? { ...state, data: state.data.filter((s) => !mathIds.has(s.lessonId)) } : { ...state, data: [], loading: true }), [state, mathIds]);
}

export function useClassStats(classId: string | undefined) {
  const [list, setList] = useState<StatsDoc[]>([]);
  useEffect(() => {
    if (!classId) return;
    return onSnapshot(
      query(collection(db(), COL.stats), where("classId", "==", classId)),
      (snap) => setList(snap.docs.map((d) => d.data() as StatsDoc)),
      () => setList([])
    );
  }, [classId]);
  return useMemo(() => new Map(list.map((s) => [s.uid, s])), [list]);
}

/** "Bây giờ" cập nhật mỗi phút (để tính 7 ngày, chuỗi ngày) mà không gọi Date.now() khi render */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [intervalMs]);
  return now;
}
