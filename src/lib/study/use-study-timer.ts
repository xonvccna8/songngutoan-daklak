"use client";

// Đếm thời gian học thật trên trang tự học: mỗi giây +1 nếu trang đang hiển thị VÀ em có chạm/gõ/cuộn
// trong 60 s gần nhất. Gửi lên máy chủ mỗi 30 s và khi rời trang. Máy chủ tự giới hạn (xem lib/study/time.ts).
import { useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { isActiveNow } from "@/lib/study/time";
import type { StudyActivity } from "@/lib/study/types";

const FLUSH_MS = 30_000;

export async function sendStudy(body: { seconds?: number; activity: StudyActivity; ref?: string; event?: boolean }, keepalive = false) {
  const token = await auth().currentUser?.getIdToken();
  if (!token) return;
  await fetch("/api/study/ping", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    keepalive,
  });
}

export function useStudyTimer(activity: StudyActivity, ref?: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let acc = 0;
    let lastInteract = Date.now();
    const bump = () => (lastInteract = Date.now());
    const evs = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"] as const;
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const tick = setInterval(() => {
      if (isActiveNow(document.visibilityState === "visible", lastInteract, Date.now())) acc++;
    }, 1000);
    const flush = (keepalive = false) => {
      if (acc < 1) return;
      const s = acc;
      acc = 0;
      sendStudy({ seconds: s, activity, ref }, keepalive).catch(() => (acc += s));
    };
    const timer = setInterval(flush, FLUSH_MS);
    const onHide = () => document.visibilityState === "hidden" && flush(true);
    const onLeave = () => flush(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onLeave);

    // Báo mở trang ngay (bài tập: ghi giờ mở bài; đặt mốc chống gian lận thời gian)
    sendStudy({ seconds: 0, activity, ref }).catch(() => {});

    return () => {
      flush(true);
      clearInterval(tick);
      clearInterval(timer);
      evs.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [activity, ref, enabled]);
}
