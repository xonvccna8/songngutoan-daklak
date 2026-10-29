"use client";

// Dải tiêu đề màu phía sau đầu mỗi trang GV: màu + biểu tượng lớn theo từng mục, hình học trôi nhẹ trang trí.
// Chữ tiêu đề (h1) của trang tự chuyển trắng nhờ lớp .page-hero (globals.css).
// Chiều cao dải tự đo theo khối chứa h1 của trang → không che tab / nội dung phía dưới.
import { useEffect, useState } from "react";
import { BookA, BookOpen, Database, FileCheck2, Gamepad2, LayoutGrid, Library, Lightbulb, ShieldCheck, Sparkles, Users, type LucideIcon } from "lucide-react";
import { ShapeIcon } from "@/components/brand/shapes";

interface Band {
  /** Ba điểm màu của dải chuyển màu (trái → phải) */
  from: string;
  via: string;
  to: string;
  icon: LucideIcon;
}

const HOME: Band = { from: "#14532D", via: "#15803D", to: "#0E7490", icon: LayoutGrid };

const BANDS: [prefix: string, band: Band][] = [
  ["/teacher/lessons", { from: "#14532D", via: "#16A34A", to: "#65A30D", icon: BookOpen }],
  ["/teacher/questions", { from: "#0E7490", via: "#0891B2", to: "#2563EB", icon: Database }],
  ["/teacher/play", { from: "#5B21B6", via: "#9333EA", to: "#DB2777", icon: Gamepad2 }],
  ["/teacher/terms", { from: "#115E59", via: "#0D9488", to: "#16A34A", icon: BookA }],
  ["/teacher/notebook", { from: "#9A3412", via: "#D97706", to: "#EAB308", icon: BookOpen }],
  ["/teacher/library", { from: "#1E40AF", via: "#0891B2", to: "#0D9488", icon: Library }],
  ["/teacher/stem", { from: "#9A3412", via: "#EA580C", to: "#F59E0B", icon: Lightbulb }],
  ["/teacher/community", { from: "#9D174D", via: "#DB2777", to: "#9333EA", icon: Users }],
  ["/teacher/tutor", { from: "#3730A3", via: "#6D28D9", to: "#A21CAF", icon: Sparkles }],
  ["/teacher/evidence", { from: "#115E59", via: "#15803D", to: "#4D7C0F", icon: FileCheck2 }],
  ["/teacher/classes", { from: "#14532D", via: "#166534", to: "#0E7490", icon: Users }],
  ["/admin", { from: "#1E293B", via: "#334155", to: "#14532D", icon: ShieldCheck }],
];

export const bandOf = (pathname: string): Band => BANDS.find(([p]) => pathname === p || pathname.startsWith(p + "/"))?.[1] ?? HOME;

/** Trang không cần dải màu (trình soạn bài, trang in) */
export const noBand = (pathname: string) => /^\/teacher\/lessons\/[^/]+/.test(pathname) || pathname.endsWith("/print");

/** Đo đáy khối tiêu đề (khối con trực tiếp của trang có chứa h1) → chiều cao dải; null = chưa đo được */
function useBandHeight(pathname: string) {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".page-hero");
    if (!root) return;
    const measure = () => {
      const h1 = root.querySelector("h1");
      const row = h1?.closest<HTMLElement>(".page-hero > * > *");
      if (!row) return setH(null);
      const bottom = row.getBoundingClientRect().bottom - root.getBoundingClientRect().top;
      setH(Math.min(420, Math.max(150, Math.round(bottom + 22))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [pathname]);
  return h;
}

export function PageBand({ pathname }: { pathname: string }) {
  const b = bandOf(pathname);
  const Icon = b.icon;
  const height = useBandHeight(pathname);
  return (
    <div
      aria-hidden
      className="no-print pointer-events-none absolute inset-x-0 top-0 h-[170px] overflow-hidden rounded-b-[28px] transition-[height] duration-300 sm:rounded-b-[40px]"
      style={height ? { height } : undefined}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${b.from} 0%, ${b.via} 55%, ${b.to} 100%)` }} />
      {/* Lưới ô li trắng rất mờ */}
      <div
        className="absolute inset-0 opacity-[.12]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, black, transparent 95%)",
        }}
      />
      {/* Quầng sáng */}
      <div className="absolute -top-24 right-[18%] size-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-28 left-[8%] size-64 rounded-full bg-[#FDE68A]/20 blur-3xl" />
      {/* Biểu tượng lớn của trang + hình học trôi */}
      <Icon className="animate-float absolute top-6 right-6 size-28 text-white/15 sm:top-8 sm:right-12 sm:size-40" strokeWidth={1.4} />
      <ShapeIcon kind="triangle" color="rgba(255,255,255,.16)" className="animate-sway absolute top-10 right-[34%] hidden size-10 [--r:-10deg] sm:block" />
      <ShapeIcon kind="circle" color="rgba(255,255,255,.12)" className="animate-float absolute right-[22%] bottom-10 hidden size-8 [animation-delay:-3s] sm:block" />
      <ShapeIcon kind="diamond" color="rgba(255,255,255,.14)" className="animate-float absolute top-5 left-[55%] size-6 [animation-delay:-1.5s]" />
    </div>
  );
}
