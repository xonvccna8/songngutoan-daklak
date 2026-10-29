// Hình học điểm nhấn + biểu tượng 4 ô đáp án (không chỉ phân biệt bằng màu).
// Ô A/B/C/D: tam giác · hình thoi · hình tròn · hình vuông
import { Pi, Sigma } from "lucide-react";
import { cn } from "cn";

export type ShapeKind = "triangle" | "diamond" | "circle" | "square";

export const SHAPE_COLORS: Record<ShapeKind, { bg: string; dk: string; text: string; label: string }> = {
  triangle: { bg: "#16A34A", dk: "#15803D", text: "#fff", label: "A" },
  diamond: { bg: "#0891B2", dk: "#0E7490", text: "#fff", label: "B" },
  circle: { bg: "#FFC93C", dk: "#C99A1F", text: "#14213D", label: "C" },
  square: { bg: "#E8492E", dk: "#B4321B", text: "#fff", label: "D" },
};

/** Tên hình (đọc cho trình đọc màn hình / chú thích) */
export const SHAPE_NAME: Record<ShapeKind, string> = { triangle: "Tam giác", diamond: "Hình thoi", circle: "Hình tròn", square: "Hình vuông" };

export function ShapeIcon({ kind, className, color = "currentColor" }: { kind: ShapeKind; className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden>
      {kind === "triangle" && <path d="M12 3 L21.5 20 H2.5 Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />}
      {kind === "diamond" && <path d="M12 2.5 L20.5 12 L12 21.5 L3.5 12 Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />}
      {kind === "circle" && (
        <>
          <circle cx="12" cy="12" r="9" fill={color} />
          <path d="M12 12 L18.4 5.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        </>
      )}
      {kind === "square" && (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill={color} />
          <path d="M3.5 16 H8 V20.5" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

/** Tam giác, hình tròn, hình thoi, hình vuông, kí hiệu π và Σ trôi nổi làm nền trang trí */
export function FloatingShapes({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const o = tone === "dark" ? 0.22 : 0.9;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <ShapeIcon kind="triangle" color="#4ADE80" className="animate-sway absolute top-[3%] left-[2%] size-11 opacity-90 [--r:-12deg]" />
      <ShapeIcon kind="circle" color="#FFC93C" className="animate-float absolute top-[16%] right-[8%] size-12 [animation-delay:-2s]" />
      <ShapeIcon kind="diamond" color="#22D3EE" className="animate-float absolute bottom-[18%] left-[10%] size-8 [animation-delay:-4s]" />
      <ShapeIcon kind="square" color="#FF7A5C" className="animate-breathe absolute right-[14%] bottom-[10%] size-10 [animation-delay:-1s]" />
      <Pi className="animate-spin-slow absolute top-[48%] left-[44%] size-9 text-teal opacity-30" strokeWidth={2.4} />
      <Sigma className="animate-float absolute top-[8%] left-[38%] size-8 text-blue opacity-25 [animation-delay:-5s]" strokeWidth={2.4} />
      <ShapeIcon kind="triangle" color="#16A34A" className="animate-sway absolute right-[38%] bottom-[4%] size-7 opacity-60 [--r:30deg] [animation-delay:-3s]" />
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-sun/30 blur-3xl" style={{ opacity: o }} />
      <div className="absolute -bottom-32 -left-24 size-80 rounded-full bg-blue/20 blur-3xl" style={{ opacity: o }} />
    </div>
  );
}
