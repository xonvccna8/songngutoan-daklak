import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin chỉ chạy phía máy chủ, không đóng gói vào bundle
  serverExternalPackages: ["firebase-admin"],
  // GĐ 7 — header an toàn cơ bản; micro chỉ cho chính trang (luyện nói), không camera / vị trí
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
        ],
      },
      // Service worker luôn lấy bản mới nhất
      { source: "/lsn-sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
