// CÁCH ĐỌC KÍ HIỆU TOÁN HỌC (Toán 6–9) bằng tiếng Anh (có nút nghe).
// "say" = câu máy đọc mẫu; ghi chú "note" chỉ ra chỗ dễ nhầm hoặc khác nhau giữa cách viết Việt Nam và quốc tế.
export type SymbolTopic = "numbers" | "algebra" | "geometry" | "stats";

export const SYMBOL_TOPICS: Record<SymbolTopic, { vi: string; en: string }> = {
  numbers: { vi: "Số và phép tính", en: "Numbers and operations" },
  algebra: { vi: "Đại số", en: "Algebra" },
  geometry: { vi: "Hình học và đo lường", en: "Geometry and measurement" },
  stats: { vi: "Thống kê, xác suất, đơn vị", en: "Statistics, probability and units" },
};

export interface MathSymbol {
  id: string;
  topic: SymbolTopic;
  /** Cách viết */
  sym: string;
  /** Đọc bằng tiếng Anh (cũng là câu máy đọc) */
  en: string;
  /** Đọc bằng tiếng Việt */
  vi: string;
  /** Lớp học lần đầu */
  grade: number;
  note?: string;
}

type Row = [sym: string, en: string, vi: string, grade: number, note?: string];

const RAW: Record<SymbolTopic, Row[]> = {
  numbers: [
    ["3 + 5 = 8", "three plus five equals eight", "ba cộng năm bằng tám", 6],
    ["9 − 4 = 5", "nine minus four equals five", "chín trừ bốn bằng năm", 6],
    ["6 × 7", "six times seven; six multiplied by seven", "sáu nhân bảy", 6],
    ["12 : 3", "twelve divided by three", "mười hai chia ba", 6, "Quốc tế thường viết 12 ÷ 3 hoặc 12/3"],
    ["2³", "two cubed; two to the power of three", "hai mũ ba (hai lập phương)", 6],
    ["a ⋮ b", "a is divisible by b", "a chia hết cho b", 6],
    ["ƯCLN(12, 18)", "the greatest common factor of twelve and eighteen", "ước chung lớn nhất của 12 và 18", 6, "Quốc tế viết GCF(12, 18) hoặc HCF(12, 18)"],
    ["BCNN(4, 6)", "the least common multiple of four and six", "bội chung nhỏ nhất của 4 và 6", 6, "Quốc tế viết LCM(4, 6)"],
    ["−5", "negative five; minus five", "âm năm", 6],
    ["3/4", "three quarters; three over four", "ba phần tư", 6],
    ["2,5", "two point five", "hai phẩy năm", 6, "Việt Nam dùng dấu phẩy, quốc tế viết 2.5"],
    ["25%", "twenty-five percent", "hai mươi lăm phần trăm", 6],
    ["0,(3)", "zero point three recurring", "không phẩy ba tuần hoàn", 7, "Quốc tế viết 0.3 với dấu chấm trên chữ số 3"],
    ["√16 = 4", "the square root of sixteen is four", "căn bậc hai của mười sáu bằng bốn", 7],
    ["|−3| = 3", "the absolute value of negative three is three", "giá trị tuyệt đối của âm ba bằng ba", 7],
    ["∛27 = 3", "the cube root of twenty-seven is three", "căn bậc ba của hai mươi bảy bằng ba", 9],
  ],
  algebra: [
    ["x²", "x squared", "x bình phương", 7],
    ["x³", "x cubed", "x lập phương", 7],
    ["2x + 3", "two x plus three", "hai x cộng ba", 7],
    ["a/b = c/d", "a over b equals c over d", "a trên b bằng c trên d (tỉ lệ thức)", 7],
    ["(a + b)² = a² + 2ab + b²", "a plus b, all squared, equals a squared plus two a b plus b squared", "bình phương của tổng a và b bằng a bình phương cộng hai ab cộng b bình phương", 8],
    ["a² − b² = (a − b)(a + b)", "a squared minus b squared equals a minus b times a plus b", "a bình phương trừ b bình phương bằng a trừ b nhân a cộng b", 8],
    ["x ≠ 2", "x is not equal to two", "x khác hai", 8],
    ["y = ax + b", "y equals a x plus b", "y bằng a x cộng b", 8],
    ["f(x)", "f of x", "f của x", 8],
    ["A(2; 3)", "point A with coordinates two and three", "điểm A có toạ độ (2; 3)", 7, "Việt Nam dùng dấu chấm phẩy, quốc tế viết A(2, 3)"],
    ["x ≥ 5", "x is greater than or equal to five", "x lớn hơn hoặc bằng năm", 9],
    ["x < −1", "x is less than negative one", "x nhỏ hơn âm một", 9],
    ["Δ = b² − 4ac", "delta equals b squared minus four a c", "đen-ta bằng b bình phương trừ bốn ac", 9],
    ["x₁ + x₂ = −b/a", "x one plus x two equals negative b over a", "x một cộng x hai bằng trừ b trên a", 9, "Hệ thức Viète"],
  ],
  geometry: [
    ["AB", "line segment A B", "đoạn thẳng AB", 6],
    ["∠ABC = 90°", "angle A B C equals ninety degrees", "góc ABC bằng chín mươi độ", 6, "SGK Việt Nam thường viết góc có dấu mũ trên ba chữ cái"],
    ["a ∥ b", "line a is parallel to line b", "đường thẳng a song song với đường thẳng b", 7],
    ["a ⊥ b", "line a is perpendicular to line b", "đường thẳng a vuông góc với đường thẳng b", 7],
    ["ΔABC = ΔDEF", "triangle A B C is congruent to triangle D E F", "tam giác ABC bằng tam giác DEF", 7, "Quốc tế dùng kí hiệu ≅"],
    ["ΔABC ∽ ΔDEF", "triangle A B C is similar to triangle D E F", "tam giác ABC đồng dạng với tam giác DEF", 8],
    ["BC² = AB² + AC²", "B C squared equals A B squared plus A C squared", "BC bình phương bằng AB bình phương cộng AC bình phương", 8, "Định lí Pythagore (tam giác vuông tại A)"],
    ["sin α", "sine alpha", "sin an-pha", 9],
    ["(O; R)", "circle O with radius R", "đường tròn tâm O, bán kính R", 9],
    ["π ≈ 3,14", "pi is approximately three point one four", "pi xấp xỉ ba phẩy mười bốn", 6],
    ["S = πR²", "S equals pi R squared", "diện tích bằng pi nhân R bình phương", 9],
  ],
  stats: [
    ["cm²", "square centimetre", "xăng-ti-mét vuông", 6],
    ["m³", "cubic metre", "mét khối", 7],
    ["km/h", "kilometres per hour", "ki-lô-mét trên giờ", 6],
    ["P(A) = 1/6", "the probability of A is one sixth", "xác suất của biến cố A bằng một phần sáu", 8],
    ["n = 30", "the sample size is thirty", "cỡ mẫu bằng ba mươi", 9],
    ["f = 25%", "the relative frequency is twenty-five percent", "tần số tương đối bằng hai mươi lăm phần trăm", 9],
    ["[10; 20)", "from ten up to but not including twenty", "nửa khoảng từ 10 đến 20 (không lấy 20)", 9, "Nhóm số liệu ghép nhóm; quốc tế viết 10 ≤ x < 20"],
  ],
};

export const SYMBOLS: MathSymbol[] = (Object.keys(RAW) as SymbolTopic[]).flatMap((topic) =>
  RAW[topic].map(([sym, en, vi, grade, note], i) => ({ id: `${topic}-${i + 1}`, topic, sym, en, vi, grade, ...(note ? { note } : {}) }))
);

/** Câu máy đọc: phần trước dấu ";" (cách đọc chính) */
export const sayOf = (s: MathSymbol) => s.en.split(";")[0].trim();
