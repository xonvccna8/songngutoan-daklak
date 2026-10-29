"use client";

// Đọc trận đấu theo thời gian thực. Điện thoại chỉ nghe trạng thái trận + của chính em (ít lượt đọc);
// tivi và laptop GV nghe thêm bảng điểm.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { BoardDoc, GameDoc, PlayerDoc } from "@/lib/games/types";

function useDoc<T>(path: string[] | null, map: (id: string, d: Record<string, unknown>) => T) {
  const [state, setState] = useState<{ data: T | null; receivedAt: number }>({ data: null, receivedAt: 0 });
  const key = path?.join("/");
  useEffect(() => {
    if (!key) return;
    return onSnapshot(
      doc(db(), key),
      (s) => setState({ data: s.exists() ? map(s.id, s.data()) : null, receivedAt: Date.now() }),
      () => setState({ data: null, receivedAt: Date.now() })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map là hàm cố định
  }, [key]);
  return state;
}

export const useGame = (id: string | null | undefined) => useDoc<GameDoc>(id ? [COL.games, id] : null, (gid, d) => ({ id: gid, ...d }) as GameDoc);
export const useBoard = (id: string | null | undefined) => useDoc<BoardDoc>(id ? [COL.games, id, COL.gameLive, "board"] : null, (_, d) => d as unknown as BoardDoc).data;
export const usePlayer = (id: string | null | undefined, uid: string | undefined) =>
  useDoc<PlayerDoc>(id && uid ? [COL.games, id, COL.gamePlayers, uid] : null, (_, d) => d as unknown as PlayerDoc).data;

/** Đồng hồ cập nhật nhanh (cho thanh thời gian) */
export function useTicker(ms = 200, on = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms, on]);
  return now;
}
