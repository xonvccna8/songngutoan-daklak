import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, Lexend } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/pwa/sw-register";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AiUnlockDialog } from "@/components/ai-unlock-dialog";
import { APP_DESCRIPTION } from "@/lib/subject";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Lớp Song Ngữ", template: "%s · Lớp Song Ngữ" },
  description: APP_DESCRIPTION,
  applicationName: "Lớp Song Ngữ",
  // iPhone: "Thêm vào màn hình chính" → mở như ứng dụng, nhận được thông báo đẩy
  appleWebApp: { capable: true, title: "Lớp Song Ngữ", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple", icon: [{ url: "/icons/192", sizes: "192x192", type: "image/png" }] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#14213D",
  width: "device-width",
  initialScale: 1,
};

const INSTALL_CAPTURE = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__lsnBip=e;});window.addEventListener("appinstalled",function(){window.__lsnBip=null;});`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${bricolage.variable} ${beVietnam.variable} ${lexend.variable} h-full antialiased`}
    >
      <head>
        {/* Bắt sớm sự kiện "có thể cài ứng dụng" của Chrome Android (thường đến ngay ở trang đăng nhập, trước khi thẻ Cài ứng dụng hiện) */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          {children}
          <AiUnlockDialog />
        </AuthProvider>
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
