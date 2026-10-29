"use client";

// HS báo có mặt trong tiết: nhịp 25 giây/lần (chỉ ghi khi cần), ghi nhận rời trang (visibilitychange), giơ tay
import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";

const BEAT_MS = 25_000;

export function usePresence(sessionId: string | undefined, uid: string | undefined) {
  const [hand, setHand] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    if (!sessionId || !uid) return;
    const ref = doc(db(), COL.sessions, sessionId, COL.participants, uid);
    let alive = true;
    ready.current = false;

    (async () => {
      const snap = await getDoc(ref).catch(() => null);
      const base = { lastSeenAt: serverTimestamp(), visible: !document.hidden };
      if (!snap?.exists()) {
        // Vào lớp lần đầu (hoặc vào muộn) → tạo hồ sơ có mặt
        await setDoc(ref, { ...base, joinedAt: serverTimestamp(), leftCount: 0, raisedHandAt: null }).catch(() => updateDoc(ref, base).catch(() => {}));
      } else {
        await updateDoc(ref, base).catch(() => {});
        if (alive) setHand(!!snap.get("raisedHandAt"));
      }
      ready.current = true;
    })();

    const beat = setInterval(() => {
      if (ready.current && !document.hidden) updateDoc(ref, { lastSeenAt: serverTimestamp(), visible: true }).catch(() => {});
    }, BEAT_MS);

    const onVis = () => {
      if (!ready.current) return;
      updateDoc(
        ref,
        document.hidden ? { visible: false, leftCount: increment(1), lastSeenAt: serverTimestamp() } : { visible: true, lastSeenAt: serverTimestamp() }
      ).catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(beat);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [sessionId, uid]);

  const toggleHand = useCallback(async () => {
    if (!sessionId || !uid) return;
    const nextHand = !hand;
    setHand(nextHand);
    await updateDoc(doc(db(), COL.sessions, sessionId, COL.participants, uid), { raisedHandAt: nextHand ? Date.now() : null }).catch(() => setHand(!nextHand));
  }, [sessionId, uid, hand]);

  return { hand, setHand, toggleHand };
}
