"use client";

// Cộng đồng học tập: GV đọc mọi bài của lớp; HS đọc bài đã duyệt + bài của chính mình (đúng theo security rules).
// Đọc trực tiếp Firestore (cập nhật tức thì). Nếu rules trên Firebase chưa có phần Cộng đồng (bị chặn đọc)
// → tự chuyển sang đọc qua máy chủ (/api/community, cùng quyền), tải lại mỗi 15 giây và ngay sau khi đăng / duyệt.
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, type FirestoreError, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { api } from "@/lib/api-client";
import { sortPosts, type PostDoc, type ReplyDoc } from "@/lib/community/posts";

const REFRESH = "lsn:community-refresh";
const POLL_MS = 15_000;

/** Gọi sau khi đăng / trả lời / duyệt để danh sách đọc qua máy chủ cập nhật ngay */
export const refreshCommunity = () => window.dispatchEvent(new Event(REFRESH));

type Wire = { id: string; createdAt: number | null };
const fromWire = <T>(x: Wire): T => ({ ...x, createdAt: x.createdAt == null ? null : { toMillis: () => x.createdAt as number } }) as T;

/** Gộp kết quả nhiều truy vấn (theo id); bị rules chặn → đọc qua máy chủ */
function useMerged<T extends { id: string }>(make: () => Query[], deps: unknown[], fallback: { url: string; pick: (j: Record<string, Wire[]>) => Wire[] } | null) {
  const depKey = JSON.stringify(deps);
  // Kết quả gắn với bộ tham số đang xem → đổi lớp / bài thì kết quả cũ tự bị bỏ qua
  const [state, setState] = useState<{ key: string; total: number; parts: Record<number, T[]>; denied: boolean }>({ key: "", total: 0, parts: {}, denied: false });
  const [server, setServer] = useState<{ key: string; data: T[] | null }>({ key: "", data: null });

  useEffect(() => {
    const qs = make();
    const put = (i: number, list: T[], denied = false) =>
      setState((p) => {
        const same = p.key === depKey;
        return { key: depKey, total: qs.length, parts: { ...(same ? p.parts : {}), [i]: list }, denied: (same && p.denied) || denied };
      });
    const unsubs = qs.map((q, i) =>
      onSnapshot(
        q,
        (s) => put(i, s.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
        (e: FirestoreError) => {
          if (e.code !== "permission-denied") console.warn("community:", e.code);
          put(i, [], true);
        }
      )
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  const denied = state.key === depKey && state.denied;
  const url = fallback?.url;
  const load = useCallback(async () => {
    if (!url || !fallback) return;
    try {
      const j = await api<Record<string, Wire[]>>(url);
      setServer({ key: depKey, data: fallback.pick(j).map((x) => fromWire<T>(x)) });
    } catch {
      setServer((p) => (p.key === depKey ? p : { key: depKey, data: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, depKey]);

  useEffect(() => {
    if (!denied) return;
    // load() chỉ đặt state sau khi máy chủ trả lời (bất đồng bộ)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener(REFRESH, onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener(REFRESH, onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [denied, load]);

  const parts = useMemo(() => (state.key === depKey ? state.parts : {}), [state, depKey]);
  const live = useMemo(() => [...new Map(Object.values(parts).flat().map((x) => [x.id, x])).values()], [parts]);
  if (denied) {
    const ready = server.key === depKey && server.data != null;
    return { data: ready ? server.data! : [], loading: !ready, viaServer: true };
  }
  return { data: live, loading: state.key !== depKey || Object.keys(parts).length < state.total, viaServer: false };
}

export function usePosts(classId: string | undefined, staff: boolean, uid: string | undefined) {
  const r = useMerged<PostDoc>(
    () => {
      if (!classId || !uid) return [];
      const col = collection(db(), COL.posts);
      if (staff) return [query(col, where("classId", "==", classId))];
      return [query(col, where("classId", "==", classId), where("status", "==", "approved")), query(col, where("classId", "==", classId), where("authorUid", "==", uid))];
    },
    [classId, staff, uid],
    classId && uid ? { url: `/api/community?classId=${encodeURIComponent(classId)}`, pick: (j) => j.posts ?? [] } : null
  );
  return { ...r, data: sortPosts(r.data) };
}

export function useReplies(postId: string, staff: boolean, uid: string | undefined) {
  const r = useMerged<ReplyDoc>(
    () => {
      if (!uid) return [];
      const col = collection(db(), COL.posts, postId, COL.replies);
      if (staff) return [col as unknown as Query];
      return [query(col, where("status", "==", "approved")), query(col, where("authorUid", "==", uid))];
    },
    [postId, staff, uid],
    uid ? { url: `/api/community/${encodeURIComponent(postId)}/reply`, pick: (j) => j.replies ?? [] } : null
  );
  // Trả lời vừa gửi (chưa có giờ máy chủ) xếp cuối
  return { ...r, data: [...r.data].sort((a, b) => (a.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER) - (b.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER)) };
}
