/* Lớp Song Ngữ — service worker nhận thông báo đẩy (FCM) khi web đã đóng hoặc tắt màn hình.
   Máy chủ chỉ gửi "data"; ở đây tự hiện thông báo để điều khiển chuông/rung/giữ trên màn hình. */
const VIBRATE = {
  attention: [400, 150, 400, 150, 400, 600, 400, 150, 400],
  reminder: [250, 120, 250],
  praise: [120, 80, 120, 80, 300],
  notice: [],
};

// GĐ 7 — Trang "mất mạng": chỉ lưu sẵn 1 trang tĩnh + biểu tượng; KHÔNG lưu dữ liệu bài học / học sinh
const CACHE = "lsn-shell-v2"; // v2: giao diện Vật sống (đổi số để máy HS tải lại trang offline + biểu tượng)
const SHELL = ["/offline.html", "/icons/192"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("lsn-") && k !== CACHE).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })()
  )
);

// Chỉ xử lý khi mở trang (điều hướng): có mạng thì đi mạng như thường, mất mạng thì hiện trang offline
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      try {
        const pre = await event.preloadResponse;
        return pre || (await fetch(event.request));
      } catch (_) {
        return (await caches.match("/offline.html")) || new Response("Mất kết nối mạng", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })()
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {}
  const d = payload.data || payload;
  const kind = d.kind || "notice";
  const silent = d.silent === "1" || kind === "notice";

  event.waitUntil(
    (async () => {
      // Web đang mở và hiển thị → trang tự báo (âm thanh + khung tin), không hiện trùng
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (wins.some((w) => w.visibilityState === "visible")) return;
      await self.registration.showNotification(d.title || "Lớp Song Ngữ", {
        body: d.body || "",
        tag: d.mid || "lsn",
        renotify: true,
        requireInteraction: kind === "attention",
        silent,
        vibrate: silent ? undefined : VIBRATE[kind] || VIBRATE.reminder,
        data: { url: d.url || "/s", mid: d.mid },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/s";
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of wins) {
        if ("focus" in w) {
          await w.focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
