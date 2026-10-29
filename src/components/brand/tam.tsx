// Linh vật "Tâm": một tam giác xanh vui tính, bụng có số π, trên đỉnh có ngôi sao dấu cộng (chủ đề Toán).
// Tên component `Tam` dùng chung cho mọi trang.
import { cn } from "cn";

type Mood = "happy" | "cheer" | "alert" | "calm" | "sleepy";

const INK = "#14213D";

export function Tam({ mood = "happy", className, title = "Tâm" }: { mood?: Mood; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("size-24", className)} role="img" aria-label={title}>
      <defs>
        <linearGradient id="tam-body" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="55%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>

      {/* Bóng dưới chân */}
      <ellipse cx="60" cy="113" rx="40" ry="4.5" fill={INK} opacity="0.12" />

      {/* Ngôi sao dấu cộng trên đỉnh: đung đưa nhẹ */}
      <g className="animate-sway" style={{ transformOrigin: "60px 18px", transformBox: "view-box" }}>
        <path d="M60 18 V10" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M60 1.5 V10.5 M55.5 6 H64.5" stroke="#FFC93C" strokeWidth="4.5" strokeLinecap="round" />
      </g>

      {/* Thân tam giác bo tròn: "thở" nhẹ */}
      <g className="animate-breathe">
        <path d="M60 20 L16 102 H104 Z" fill="url(#tam-body)" stroke="#15803D" strokeWidth="9" strokeLinejoin="round" />
        {/* Kí hiệu góc vuông nhỏ ở góc trái: trang trí */}
        <path d="M24 92 h7 v7" stroke="#DCFCE7" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* Số π trên bụng */}
        <path d="M53 94 H67 M57 94 C57 97.5 56.4 99.6 55 101 M63 94 V99.4 C63 100.6 64 101 65.2 100.3" stroke="#FFC93C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {/* Ánh sáng */}
        <path d="M50 40 Q44 50 40 60" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.45" />
      </g>

      {mood === "cheer" && (
        <g stroke="#FFC93C" strokeWidth="4" strokeLinecap="round">
          <path d="M18 50 l-8 -6" />
          <path d="M12 68 l-9 0" />
          <path d="M102 50 l8 -6" />
          <path d="M108 68 l9 0" />
        </g>
      )}

      {/* Mắt */}
      {mood === "sleepy" ? (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M42 70 q6 5 12 0" />
          <path d="M66 70 q6 5 12 0" />
        </g>
      ) : (
        <g className="animate-blink">
          <circle cx="48" cy="68" r={mood === "alert" ? 10.5 : 9} fill="#fff" />
          <circle cx="72" cy="68" r={mood === "alert" ? 10.5 : 9} fill="#fff" />
          <circle cx={mood === "calm" ? 48 : 49.5} cy="69" r="4.8" fill={INK} />
          <circle cx={mood === "calm" ? 72 : 73.5} cy="69" r="4.8" fill={INK} />
          <circle cx="51" cy="66.5" r="1.5" fill="#fff" />
          <circle cx="75" cy="66.5" r="1.5" fill="#fff" />
        </g>
      )}

      {/* Má hồng */}
      {(mood === "happy" || mood === "cheer") && (
        <g fill="#FF7A5C" opacity="0.55">
          <ellipse cx="37" cy="81" rx="4.5" ry="2.8" />
          <ellipse cx="83" cy="81" rx="4.5" ry="2.8" />
        </g>
      )}

      {/* Miệng */}
      {mood === "happy" && <path d="M52 81 Q60 89 68 81" stroke={INK} strokeWidth="3.8" fill="none" strokeLinecap="round" />}
      {mood === "cheer" && <path d="M50 80 Q60 94 70 80 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />}
      {mood === "alert" && <ellipse cx="60" cy="84" rx="4.5" ry="5.5" fill={INK} />}
      {mood === "calm" && <path d="M54 83 h12" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />}
      {mood === "sleepy" && <path d="M55 83 Q60 87 65 83" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
