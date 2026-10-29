"use client";

// Hook đọc XP / bảng tuần / sự kiện học tập theo thời gian thực (GV và HS thấy cùng số liệu)
import { useEffect, useState } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { weeklyId } from "@/lib/progress/week";
import type { WeeklyDoc } from "@/lib/progress/boards";
import type { XpEvent } from "@/lib/progress/xp";

/** Bảng điểm tuần của lớp (chỉ GV lớp đọc được) */
export function useWeekly(classId: string | undefined, week: string | undefined) {
  const [data, setData] = useState<WeeklyDoc | null>(null);
  useEffect(() => {
    if (!classId || !week) return;
    return onSnapshot(
      doc(db(), COL.weekly, weeklyId(classId, week)),
      (s) => setData(s.exists() ? (s.data() as WeeklyDoc) : null),
      () => setData(null)
    );
  }, [classId, week]);
  return data;
}

/**
 * Sự kiện học tập gần nhất của một em.
 * HS: chỉ truyền uid (của mình). GV: truyền cả classId để rules kiểm được quyền.
 */
export function useXpEvents(uid: string | undefined, classId?: string, n = 15) {
  const [list, setList] = useState<XpEvent[]>([]);
  useEffect(() => {
    if (!uid) return;
    const base = collection(db(), COL.events);
    const q = classId
      ? query(base, where("classId", "==", classId), where("uid", "==", uid), orderBy("at", "desc"), limit(n))
      : query(base, where("uid", "==", uid), orderBy("at", "desc"), limit(n));
    return onSnapshot(
      q,
      (snap) => setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as XpEvent)),
      () => setList([])
    );
  }, [uid, classId, n]);
  return list;
}
