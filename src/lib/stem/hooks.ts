"use client";

// Đọc dự án STEM theo thời gian thực: GV (các lớp mình dạy, mọi tổ) · HS (lớp mình, chỉ tổ mình)
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { ProjectDoc, TeamDoc } from "@/lib/stem/projects";
import { isScienceCurId } from "@/lib/subject";

const byDue = (a: ProjectDoc, b: ProjectDoc) => a.dueAt - b.dueAt;

/** Dự án của các lớp — mỗi lớp một truy vấn "==" (security rules kiểm quyền theo từng lớp) */
export function useProjects(classIds: string[]) {
  const key = classIds.join(",");
  // Kết quả gắn với bộ lớp đang xem → đổi lớp thì kết quả cũ tự bị bỏ qua
  const [state, setState] = useState<{
    key: string;
    parts: Record<string, ProjectDoc[]>;
  }>({ key: "", parts: {} });
  useEffect(() => {
    const ids = key ? key.split(",") : [];
    const unsubs = ids.map((cid) =>
      onSnapshot(
        query(collection(db(), COL.projects), where("classId", "==", cid)),
        (s) =>
          setState((p) => ({
            key,
            parts: {
              ...(p.key === key ? p.parts : {}), // Ẩn dự án gắn bài KHTN (Firebase dùng chung — không xoá)
              [cid]: s.docs.map((d) => ({ id: d.id, ...d.data() }) as ProjectDoc).filter((p) => !isScienceCurId(p.curLessonId)),
            },
          })),
        () =>
          setState((p) => ({
            key,
            parts: { ...(p.key === key ? p.parts : {}), [cid]: [] },
          }))
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [key]);
  const parts = state.key === key ? state.parts : {};
  const total = key ? key.split(",").length : 0;
  return {
    data: Object.values(parts).flat().sort(byDue),
    loading: Object.keys(parts).length < total,
  };
}

export function useProject(id: string | undefined) {
  const [state, setState] = useState<{
    data: ProjectDoc | null;
    loading: boolean;
  }>({ data: null, loading: true });
  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db(), COL.projects, id),
      (s) =>
        setState({
          data: s.exists() ? ({ id: s.id, ...s.data() } as ProjectDoc) : null,
          loading: false,
        }),
      () => setState({ data: null, loading: false })
    );
  }, [id]);
  return state;
}

/** GV: nhật kí mọi tổ của dự án */
export function useProjectTeams(id: string | undefined) {
  const [teams, setTeams] = useState<Record<number, TeamDoc>>({});
  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      collection(db(), COL.projects, id, COL.projectTeams),
      (s) => setTeams(Object.fromEntries(s.docs.map((d) => [Number(d.id), d.data() as TeamDoc]))),
      () => setTeams({})
    );
  }, [id]);
  return teams;
}

/** HS: nhật kí của tổ mình (chưa có tài liệu = tổ chưa bắt đầu) */
export function useMyTeam(id: string | undefined, team: number | undefined) {
  const [state, setState] = useState<{
    data: TeamDoc | null;
    loading: boolean;
  }>({ data: null, loading: true });
  useEffect(() => {
    if (!id || !team) return;
    return onSnapshot(
      doc(db(), COL.projects, id, COL.projectTeams, String(team)),
      (s) =>
        setState({
          data: s.exists() ? (s.data() as TeamDoc) : null,
          loading: false,
        }),
      () => setState({ data: null, loading: false })
    );
  }, [id, team]);
  return state;
}
