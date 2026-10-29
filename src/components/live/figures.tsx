// Hình vẽ Toán dựng sẵn cho bảng trình chiếu — các phần hiện dần theo bước (step)
import type { FigureId, Lang } from "@/lib/live/types";

interface Props {
  step: number;
  lang: Lang;
  labels?: { top?: string; left?: string };
  className?: string;
}

// Màu nét (cố định, nổi trên nền bảng xanh đậm)
const LEG = "#7FB2FF";
const HYP = "#FFB547";
const SQ1 = "#6D93F7";
const SQ2 = "#4CC9DB";
const SQ3 = "#FF7FA3";

/** Nhóm hiện khi bước hiện tại ≥ s */
function G({ s, step, children }: { s: number; step: number; children: React.ReactNode }) {
  return (
    <g className="transition-opacity duration-500" style={{ opacity: step >= s ? 1 : 0 }}>
      {children}
    </g>
  );
}

/** Nhãn song ngữ trong hình: chữ Anh thẳng, chữ Việt nghiêng mờ */
function Lbl({ x, y, en, vi, lang, anchor }: { x: number; y: number; en: string; vi: string; lang: Lang; anchor?: "start" | "middle" | "end" }) {
  return (
    <>
      {lang !== "vi" && (
        <text x={x} y={y} textAnchor={anchor} fontSize="24" fill="var(--chalk)">
          {en}
        </text>
      )}
      {lang !== "en" && (
        <text x={x} y={lang === "vi" ? y : y + 22} textAnchor={anchor} fontSize={lang === "vi" ? 24 : 18} fill={lang === "vi" ? "var(--chalk)" : "var(--chalk-dim)"} fontStyle={lang === "vi" ? "normal" : "italic"}>
          {vi}
        </text>
      )}
    </>
  );
}

/** Tên đỉnh / chữ toán (in nghiêng như trong SGK) */
const V = ({ x, y, t, anchor = "middle", size = 30 }: { x: number; y: number; t: string; anchor?: "start" | "middle" | "end"; size?: number }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fontStyle="italic" fontWeight="700" fill="var(--chalk)">
    {t}
  </text>
);

/** Kí hiệu góc vuông tại (x, y), hai cạnh theo hướng (dx1, dy1) và (dx2, dy2) */
const RightMark = ({ x, y, dx1, dy1, dx2, dy2, s = 22 }: { x: number; y: number; dx1: number; dy1: number; dx2: number; dy2: number; s?: number }) => (
  <path d={`M${x + dx1 * s} ${y + dy1 * s} L${x + (dx1 + dx2) * s} ${y + (dy1 + dy2) * s} L${x + dx2 * s} ${y + dy2 * s}`} fill="none" stroke="var(--hi)" strokeWidth="3" />
);

/** Tam giác vuông ABC (vuông tại A): 0 tam giác · 1 hai cạnh góc vuông · 2 cạnh huyền · 3 công thức Pythagore */
function RightTriangle({ step, lang, labels, className }: Props) {
  return (
    <svg viewBox="0 0 720 390" className={className} role="img" aria-label="Right triangle ABC with the right angle at A. AB and AC are the legs, BC is the hypotenuse.">
      <G s={0} step={step}>
        <path d="M170 320 L170 90 L530 320 Z" fill="var(--chalk)" fillOpacity=".06" stroke="var(--chalk)" strokeWidth="3" strokeLinejoin="round" />
        <RightMark x={170} y={320} dx1={0} dy1={-1} dx2={1} dy2={0} />
        <V x={148} y={350} t="A" />
        <V x={148} y={90} t="B" />
        <V x={556} y={350} t="C" />
      </G>
      <G s={1} step={step}>
        <line x1="170" y1="320" x2="170" y2="90" stroke={LEG} strokeWidth="8" strokeLinecap="round" />
        <line x1="170" y1="320" x2="530" y2="320" stroke={LEG} strokeWidth="8" strokeLinecap="round" />
        <Lbl x={120} y={210} en="leg" vi="cạnh góc vuông" lang={lang} anchor="end" />
        <Lbl x={350} y={358} en="leg" vi="cạnh góc vuông" lang={lang} anchor="middle" />
      </G>
      <G s={2} step={step}>
        <line x1="170" y1="90" x2="530" y2="320" stroke={HYP} strokeWidth="8" strokeLinecap="round" />
        <Lbl x={380} y={180} en="hypotenuse" vi="cạnh huyền" lang={lang} anchor="start" />
      </G>
      <G s={3} step={step}>
        <text x="560" y="110" textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--hi)">
          BC² = AB² + AC²
        </text>
      </G>
      {labels?.top && (
        <text x="360" y="30" textAnchor="middle" fontSize="24" fill="var(--hi)">
          {labels.top}
        </text>
      )}
    </svg>
  );
}

/** Ba hình vuông dựng trên ba cạnh tam giác vuông 3 – 4 – 5: 0 tam giác · 1 hai hình vuông nhỏ · 2 hình vuông lớn · 3 9 + 16 = 25 */
function PythagorasSquares({ step, lang, className }: Props) {
  return (
    <svg viewBox="0 0 720 480" className={className} role="img" aria-label="Squares on the sides of a 3-4-5 right triangle: 9 plus 16 equals 25.">
      <G s={1} step={step}>
        <rect x="80" y="180" width="120" height="120" fill={SQ1} fillOpacity=".25" stroke={SQ1} strokeWidth="3" />
        <text x="140" y="252" textAnchor="middle" fontSize="40" fontWeight="800" fill="var(--chalk)">
          9
        </text>
        <rect x="200" y="300" width="160" height="160" fill={SQ2} fillOpacity=".25" stroke={SQ2} strokeWidth="3" />
        <text x="280" y="394" textAnchor="middle" fontSize="40" fontWeight="800" fill="var(--chalk)">
          16
        </text>
      </G>
      <G s={2} step={step}>
        <path d="M200 180 L360 300 L480 140 L320 20 Z" fill={SQ3} fillOpacity=".22" stroke={SQ3} strokeWidth="3" />
        <text x="340" y="174" textAnchor="middle" fontSize="40" fontWeight="800" fill="var(--chalk)">
          25
        </text>
      </G>
      <G s={0} step={step}>
        <path d="M200 300 L200 180 L360 300 Z" fill="var(--chalk)" fillOpacity=".08" stroke="var(--chalk)" strokeWidth="3" strokeLinejoin="round" />
        <RightMark x={200} y={300} dx1={0} dy1={-1} dx2={1} dy2={0} s={18} />
        <text x="214" y="246" fontSize="24" fill="var(--chalk)">
          3
        </text>
        <text x="280" y="290" textAnchor="middle" fontSize="24" fill="var(--chalk)">
          4
        </text>
        <text x="292" y="230" fontSize="24" fill="var(--chalk)">
          5
        </text>
      </G>
      <G s={3} step={step}>
        <text x="590" y="380" textAnchor="middle" fontSize="40" fontWeight="800" fill="var(--hi)">
          9 + 16 = 25
        </text>
        <Lbl x={590} y={420} en="3² + 4² = 5²" vi="tổng hai hình vuông nhỏ = hình vuông lớn" lang={lang} anchor="middle" />
      </G>
    </svg>
  );
}

/** Mặt phẳng toạ độ Oxy (gốc O tại (300; 300), 1 đơn vị = 40): 0 hai trục · 1 hai điểm A, B · 2 đường thẳng y = x + 1 */
function CoordinatePlane({ step, lang, className }: Props) {
  const X = (x: number) => 300 + 40 * x;
  const Y = (y: number) => 300 - 40 * y;
  const xs = Array.from({ length: 15 }, (_, i) => i - 6);
  const ys = Array.from({ length: 9 }, (_, i) => i - 2);
  return (
    <svg viewBox="0 0 720 420" className={className} role="img" aria-label="Coordinate plane with points A(0; 1), B(2; 3) and the line y = x + 1.">
      <G s={0} step={step}>
        {xs.map((x) => (
          <line key={`x${x}`} x1={X(x)} y1={Y(6.5)} x2={X(x)} y2={Y(-2.5)} stroke="var(--chalk)" strokeOpacity=".12" />
        ))}
        {ys.map((y) => (
          <line key={`y${y}`} x1={X(-6.5)} y1={Y(y)} x2={X(8.5)} y2={Y(y)} stroke="var(--chalk)" strokeOpacity=".12" />
        ))}
        <path d={`M${X(-6.5)} ${Y(0)} H${X(8.6)} m-14 -9 l14 9 l-14 9`} fill="none" stroke="var(--chalk)" strokeWidth="3" />
        <path d={`M${X(0)} ${Y(-2.5)} V${Y(6.7)} m-9 14 l9 -14 l9 14`} fill="none" stroke="var(--chalk)" strokeWidth="3" />
        <V x={X(0) - 16} y={Y(0) + 28} t="O" size={24} />
        <V x={X(8.6)} y={Y(0) + 32} t="x" anchor="end" size={26} />
        <V x={X(0) + 16} y={Y(6.5) + 8} t="y" anchor="start" size={26} />
        <Lbl x={X(8.4)} y={Y(0) - 14} en="x-axis" vi="trục hoành" lang={lang} anchor="end" />
        <Lbl x={X(0) - 14} y={Y(6) + 6} en="y-axis" vi="trục tung" lang={lang} anchor="end" />
      </G>
      <G s={1} step={step}>
        <circle cx={X(0)} cy={Y(1)} r="8" fill="var(--hi)" />
        <circle cx={X(2)} cy={Y(3)} r="8" fill="var(--hi)" />
        <V x={X(0) + 14} y={Y(1) + 8} t="A(0; 1)" anchor="start" size={24} />
        <V x={X(2) + 14} y={Y(3) + 8} t="B(2; 3)" anchor="start" size={24} />
      </G>
      <G s={2} step={step}>
        <line x1={X(-3.5)} y1={Y(-2.5)} x2={X(5.5)} y2={Y(6.5)} stroke={HYP} strokeWidth="5" strokeLinecap="round" />
        <text x={X(5.6)} y={Y(5.2)} fontSize="30" fontWeight="700" fill={HYP}>
          y = x + 1
        </text>
      </G>
    </svg>
  );
}

/** Hai tam giác đồng dạng ABC và A′B′C′ (tỉ số 2): 0 hai tam giác · 1 các góc bằng nhau · 2 tỉ số các cạnh */
function SimilarTriangles({ step, lang, labels, className }: Props) {
  return (
    <svg viewBox="0 0 740 430" className={className} role="img" aria-label="Triangle ABC and triangle A'B'C' are similar with scale factor 2.">
      <G s={0} step={step}>
        <path d="M80 300 L140 180 L240 300 Z" fill={LEG} fillOpacity=".15" stroke="var(--chalk)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M360 360 L480 120 L680 360 Z" fill={LEG} fillOpacity=".15" stroke="var(--chalk)" strokeWidth="3" strokeLinejoin="round" />
        <V x={64} y={322} t="A" size={26} />
        <V x={140} y={168} t="B" size={26} />
        <V x={258} y={322} t="C" size={26} />
        <V x={342} y={384} t="A′" size={26} />
        <V x={480} y={108} t="B′" size={26} />
        <V x={702} y={384} t="C′" size={26} />
      </G>
      <G s={1} step={step}>
        <path d="M104 300 A24 24 0 0 0 91 278" fill="none" stroke={HYP} strokeWidth="4" />
        <path d="M400 360 A40 40 0 0 0 378 324" fill="none" stroke={HYP} strokeWidth="4" />
        <path d="M216 300 A24 24 0 0 1 222 284" fill="none" stroke={SQ1} strokeWidth="4" />
        <path d="M640 360 A40 40 0 0 1 650 334" fill="none" stroke={SQ1} strokeWidth="4" />
        <Lbl x={520} y={60} en="equal angles" vi="các góc tương ứng bằng nhau" lang={lang} anchor="middle" />
      </G>
      <G s={2} step={step}>
        <text x="370" y="418" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--hi)">
          A′B′ / AB = B′C′ / BC = A′C′ / AC = 2
        </text>
      </G>
      {labels?.top && (
        <text x="160" y="60" textAnchor="middle" fontSize="24" fill="var(--hi)">
          {labels.top}
        </text>
      )}
    </svg>
  );
}

export function Figure({ id, ...p }: Props & { id: FigureId }) {
  switch (id) {
    case "triangle-abc":
      // Tam giác ABC vuông tại A, tĩnh (chỉ khung + kí hiệu góc vuông)
      return <RightTriangle {...p} step={0} />;
    case "right-triangle":
      return <RightTriangle {...p} />;
    case "pythagoras-squares":
      return <PythagorasSquares {...p} />;
    case "coordinate-plane":
      return <CoordinatePlane {...p} />;
    case "similar-triangles":
      return <SimilarTriangles {...p} />;
    default:
      // Hình của trang KHTN (tế bào…) không dùng ở trang Toán → không vẽ gì
      return null;
  }
}
