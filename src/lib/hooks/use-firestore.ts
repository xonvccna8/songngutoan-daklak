"use client";

// Hook đọc Firestore thời gian thực (onSnapshot) cho lớp & học sinh
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, where, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { COL } from "@/lib/namespace";
import type { ClassDoc, StudentDoc } from "@/lib/types";

interface Live<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

function useLiveQuery<T>(make: () => Query | null, map: (id: string, d: Record<string, unknown>) => T, deps: unknown[]) {
  const [state, setState] = useState<Live<T[]>>({ data: [], loading: true, error: null });
  useEffect(() => {
    const q = make();
    if (!q) return;
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => map(d.id, d.data())), loading: false, error: null }),
      (err) => setState({ data: [], loading: false, error: err.message })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

/** Lớp của GV (theo teacherIds) — quản trị thấy mọi lớp trong trường */
export function useMyClasses() {
  const { user, claims } = useAuth();
  const uid = user?.uid;
  const live = useLiveQuery<ClassDoc>(
    () => {
      if (!uid) return null;
      const col = collection(db(), COL.classes);
      return claims.role === "admin" && claims.schoolId
        ? query(col, where("schoolId", "==", claims.schoolId))
        : query(col, where("teacherIds", "array-contains", uid));
    },
    (id, d) => ({ id, ...d }) as ClassDoc,
    [uid, claims.role, claims.schoolId]
  );
  const sorted = [...live.data].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "vi"));
  return { ...live, data: sorted };
}

export function useClass(classId: string | undefined) {
  const [state, setState] = useState<Live<ClassDoc | null>>({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!classId) return;
    return onSnapshot(
      doc(db(), COL.classes, classId),
      (s) => setState({ data: s.exists() ? ({ id: s.id, ...s.data() } as ClassDoc) : null, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: err.message })
    );
  }, [classId]);
  return state;
}

export function useStudents(classId: string | undefined) {
  return useLiveQuery<StudentDoc>(
    () => (classId ? query(collection(db(), COL.classes, classId, COL.students), orderBy("number")) : null),
    (uid, d) => ({ uid, ...d }) as StudentDoc,
    [classId]
  );
}

/** Học sinh đọc hồ sơ của chính mình */
export function useMyStudentProfile(classId: string | undefined, uid: string | undefined) {
  const [state, setState] = useState<Live<StudentDoc | null>>({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!classId || !uid) return;
    return onSnapshot(
      doc(db(), COL.classes, classId, COL.students, uid),
      (s) => setState({ data: s.exists() ? ({ uid: s.id, ...s.data() } as StudentDoc) : null, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: err.message })
    );
  }, [classId, uid]);
  return state;
}
