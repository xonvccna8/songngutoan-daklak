"use client";

// Đăng ký nhận thông báo đẩy trên điện thoại HS: xin quyền → service worker /lsn-sw.js → mã FCM → lưu Firestore
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseApp } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";

export type PushState = "unsupported" | "default" | "denied" | "granted";

export function pushPermission(): PushState {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  return Notification.permission as PushState;
}

/** iPhone chỉ nhận thông báo khi web được "Thêm vào màn hình chính" (iOS 16.4+) */
export const isIosBrowser = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.matchMedia?.("(display-mode: standalone)").matches);

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function enablePush(uid: string): Promise<{ ok: boolean; reason?: string }> {
  // GĐ 7 — chỉ tải Firebase Messaging khi HS bấm bật thông báo (trang nhẹ hơn)
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported().catch(() => false)) || pushPermission() === "unsupported") return { ok: false, reason: "Trình duyệt này chưa hỗ trợ thông báo đẩy." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "Em chưa cho phép thông báo. Vào cài đặt trình duyệt để bật lại." };
  const reg = await navigator.serviceWorker.register("/lsn-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;
  const token = await getToken(getMessaging(firebaseApp()), { serviceWorkerRegistration: reg, ...(vapidKey ? { vapidKey } : {}) });
  if (!token) return { ok: false, reason: "Không lấy được mã thiết bị." };
  await setDoc(doc(db(), COL.fcmTokens, uid, COL.tokens, await sha256(token)), {
    token,
    ua: navigator.userAgent.slice(0, 200),
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
}
