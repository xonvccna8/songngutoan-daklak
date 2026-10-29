"use client";

// GĐ 7 — Đăng ký service worker cho mọi trang (trang "mất mạng" + thông báo đẩy dùng chung /lsn-sw.js).
// Chỉ bật trên bản chạy thật để khi phát triển không bị bộ nhớ đệm làm rối.
import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/lsn-sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
