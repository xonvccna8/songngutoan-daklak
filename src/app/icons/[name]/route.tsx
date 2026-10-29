// GĐ 7 — Biểu tượng ứng dụng (PWA) vẽ từ logo: /icons/192 · /icons/512 · /icons/maskable (Android cắt viền) · /icons/apple (iPhone)
import { ImageResponse } from "next/og";
import { LOGO_BG, LOGO_MARK } from "@/components/brand/mark";

const ICONS: Record<string, { size: number; pad: number; round: boolean }> = {
  "192": { size: 192, pad: 0, round: true },
  "512": { size: 512, pad: 0, round: true },
  // Android có thể cắt icon thành hình tròn → để lề an toàn 20%, nền kín
  maskable: { size: 512, pad: 0.2, round: false },
  // iPhone tự bo góc → nền kín, không bo
  apple: { size: 180, pad: 0.08, round: false },
};

// Hình của logo (cùng hình với LogoMark), không có nền
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 32 32">${LOGO_MARK}</svg>`;
const SRC = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`;

export const dynamic = "force-static";
export const generateStaticParams = () => Object.keys(ICONS).map((name) => ({ name }));

export async function GET(_req: Request, ctx: RouteContext<"/icons/[name]">) {
  const { name } = await ctx.params;
  const ic = ICONS[name];
  if (!ic) return new Response("Not found", { status: 404 });
  const inner = Math.round(ic.size * (1 - 2 * ic.pad) * 0.78);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: LOGO_BG,
          borderRadius: ic.round ? ic.size * 0.3 : 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SRC} width={inner} height={inner} alt="" />
      </div>
    ),
    { width: ic.size, height: ic.size }
  );
}
