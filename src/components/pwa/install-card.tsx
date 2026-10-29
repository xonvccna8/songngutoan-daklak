"use client";

// GĐ 7 — Thẻ "Cài ứng dụng" cho học sinh, hiện trên MỌI loại điện thoại:
// - Chrome/Edge Android: nút "Cài ứng dụng" (sự kiện beforeinstallprompt được bắt sớm ở layout gốc nên không bị lỡ).
// - Samsung Internet, Cốc Cốc, Firefox, Opera… (không có nút cài tự động): hướng dẫn mở menu → "Thêm vào màn hình chính".
// - iPhone: hướng dẫn Chia sẻ → "Thêm vào MH chính" (bắt buộc để nhận thông báo khi tắt màn hình).
// - Mở trong Zalo / Facebook / Messenger…: không cài được → nhắc mở bằng Chrome/Safari + nút chép đường link.
// Đã cài thì không hiện. Bấm ✕ chỉ ẩn 7 ngày; trang "Của em" luôn có mục cài (force).
import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, EllipsisVertical, Menu, Share, SquarePlus, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "cn";

export interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __lsnBip?: InstallEvent | null;
  }
}

type Env = "off" | "ios" | "ios-other" | "inapp" | "samsung" | "firefox" | "android" | "desktop";

const HIDE_KEY = "lsn:installHide";
const HIDE_DAYS = 7;
const noop = () => () => {};

const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Nhận diện trình duyệt để đưa đúng hướng dẫn */
export function detectEnv(ua: string): Exclude<Env, "off"> {
  if (/Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "inapp";
  if (/iPhone|iPad|iPod/i.test(ua)) return /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua) ? "ios-other" : "ios";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Android/i.test(ua)) return /; wv\)/.test(ua) ? "inapp" : "android";
  return "desktop";
}

const wasHidden = () => {
  try {
    const t = Number(localStorage.getItem(HIDE_KEY));
    return t > 1 && Date.now() - t < HIDE_DAYS * 86_400_000;
  } catch {
    return false;
  }
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5">
      <b className="w-4 shrink-0">{n}.</b>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

function I({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return <Icon className="inline size-4 align-[-3px] text-blue" />;
}

export function InstallCard({ force = false }: { force?: boolean }) {
  // Đọc môi trường trình duyệt (máy chủ luôn coi như "không hiện" để tránh lệch khi hiển thị)
  const env = useSyncExternalStore<Env>(noop, () => (isStandalone() ? "off" : !force && wasHidden() ? "off" : detectEnv(navigator.userAgent)), () => "off");
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Sự kiện có thể đã đến trước khi thẻ này hiện (ví dụ lúc em ở trang đăng nhập) → lấy lại từ window
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.__lsnBip) setEvt(window.__lsnBip);
    const h = (e: Event) => {
      e.preventDefault();
      window.__lsnBip = e as InstallEvent;
      setEvt(e as InstallEvent);
    };
    const done = () => setClosed(true);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", h);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  const hide = () => {
    try {
      localStorage.setItem(HIDE_KEY, String(Date.now()));
    } catch {}
    setClosed(true);
  };

  async function copyLink() {
    const url = `${location.origin}/s`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Chép đường link này rồi dán vào Chrome / Safari:", url);
    }
    setCopied(true);
  }

  if (closed || env === "off") return null;
  // Máy tính: chỉ hiện khi trình duyệt cho cài trực tiếp
  if (env === "desktop" && !evt) return null;

  return (
    <section className={cn(!force && "px-5 pt-5")}>
      <div className="card-lsn relative flex items-start gap-3 p-4">
        <LogoMark className="size-11 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <b className="block text-base">Cài “Lớp Song Ngữ” lên điện thoại</b>
          <p className="mt-0.5 text-ink-2">Mở nhanh như ứng dụng, nhận thông báo của thầy cô kể cả khi tắt màn hình.</p>

          {evt ? (
            <button
              onClick={async () => {
                await evt.prompt();
                const r = await evt.userChoice;
                if (r.outcome === "accepted") setClosed(true);
                window.__lsnBip = null;
                setEvt(null);
              }}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-blue px-4 font-bold text-white shadow-[0_4px_0_var(--color-blue-dk)] active:translate-y-[3px] active:shadow-none"
            >
              <Download className="size-4" /> Cài ứng dụng
            </button>
          ) : env === "inapp" ? (
            <>
              <p className="mt-2 rounded-xl bg-sun-soft px-3 py-2 text-[#8A5A00]">
                Em đang mở trong <b>Zalo / Facebook</b> nên không cài được. Bấm <I icon={EllipsisVertical} /> hoặc <b>⋯</b> ở góc trên → chọn <b>“Mở bằng trình duyệt”</b> (Chrome / Safari), rồi cài từ đó.
              </p>
              <button onClick={copyLink} className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl border-2 border-line-2 bg-white px-3 font-bold">
                {copied ? <Check className="size-4 text-teal" /> : <Copy className="size-4" />} {copied ? "Đã chép link — dán vào Chrome" : "Chép đường link"}
              </button>
            </>
          ) : (
            <ol className="mt-2 space-y-1 text-ink">
              {env === "ios" && (
                <>
                  <Step n={1}>
                    Bấm nút <I icon={Share} /> <b>Chia sẻ</b> ở thanh dưới của Safari
                  </Step>
                  <Step n={2}>
                    Kéo xuống, chọn <I icon={SquarePlus} /> <b>Thêm vào MH chính</b> → <b>Thêm</b>
                  </Step>
                </>
              )}
              {env === "ios-other" && (
                <>
                  <Step n={1}>
                    Bấm nút <I icon={Share} /> <b>Chia sẻ</b> cạnh thanh địa chỉ → <b>Thêm vào MH chính</b>
                  </Step>
                  <Step n={2}>Không thấy mục đó? Mở trang này bằng <b>Safari</b> rồi làm lại.</Step>
                </>
              )}
              {env === "samsung" && (
                <>
                  <Step n={1}>
                    Bấm nút <I icon={Menu} /> <b>Menu</b> (3 gạch, góc dưới phải)
                  </Step>
                  <Step n={2}>
                    Chọn <b>Thêm trang vào</b> → <b>Màn hình chờ</b> (hoặc <b>Màn hình chính</b>)
                  </Step>
                </>
              )}
              {env === "firefox" && (
                <>
                  <Step n={1}>
                    Bấm nút <I icon={EllipsisVertical} /> menu
                  </Step>
                  <Step n={2}>
                    Chọn <b>Cài đặt</b> hoặc <b>Thêm vào màn hình chính</b>
                  </Step>
                </>
              )}
              {(env === "android" || env === "desktop") && (
                <>
                  <Step n={1}>
                    Bấm nút <I icon={EllipsisVertical} /> (3 chấm, góc trên phải)
                  </Step>
                  <Step n={2}>
                    Chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>
                  </Step>
                  <Step n={3}>Không thấy mục nào? Mở trang này bằng <b>Google Chrome</b>.</Step>
                </>
              )}
              <Step n={env === "android" || env === "desktop" ? 4 : 3}>Mở “Lớp Song Ngữ” từ biểu tượng mới trên màn hình.</Step>
            </ol>
          )}
        </div>
        {!force && (
          <button onClick={hide} className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-paper" aria-label="Ẩn hướng dẫn cài đặt">
            <X className="size-4" />
          </button>
        )}
      </div>
    </section>
  );
}
