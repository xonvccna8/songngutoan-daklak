// Kho học liệu Toán 6–9 (Kết nối tri thức): học liệu (link) + thuật ngữ song ngữ cho TỪNG BÀI SGK.
// Chỉ gồm link từ nguồn uy tín, đã kiểm tra tự động ngày 29/10/2026 (mở được, mã trả về 200):
//   PhET – ĐH Colorado (mô phỏng Toán, đổi được giao diện Tiếng Việt) · Math is Fun (bài đọc tiếng Anh dễ, nhiều hình) ·
//   GeoGebra (hình học động) · Hành trang số (NXB Giáo dục VN).
// Nạp vào Firestore bằng: npm run seed:kho  (scripts/seed-kho.mts — id cố định, chạy lại không bị trùng; --remove để gỡ).
// Thuật ngữ: tiếng Anh + IPA (Anh – Anh) + nghĩa theo SGK; gắn curLessonIds để hiện ở "Xem trước bài" và trình soạn bài.
import type { Bi } from "@/lib/live/types";
import type { ResourceKind } from "@/lib/library/resources";

export const KHO_SEED = "kho-toan-v1";

export interface KhoResource {
  kind: ResourceKind;
  url: string;
  title: Bi;
  /** Nguồn + gợi ý dùng trên lớp */
  note: string;
}

export interface KhoTerm {
  en: string;
  ipa: string;
  vi: string;
}

export interface KhoLesson {
  /** Mã bài trong khung chương trình (src/lib/curriculum) */
  curLessonId: string;
  resources: KhoResource[];
  terms: KhoTerm[];
}

const MIF = "Nguồn: Math is Fun (tiếng Anh dễ, nhiều hình). Chiếu lên tivi, cả lớp đọc to câu định nghĩa; cuối trang có câu hỏi tự kiểm tra.";
const PHET = "Nguồn: PhET – ĐH Colorado (miễn phí). Mở giao diện tiếng Anh, khi chưa hiểu thì đổi sang Tiếng Việt.";

const mif = (path: string, vi: string, en: string, tip = ""): KhoResource => ({ kind: "web", url: `https://www.mathsisfun.com/${path}`, title: { vi, en }, note: tip ? `${MIF} ${tip}` : MIF });
const phet = (slug: string, vi: string, en: string, tip: string): KhoResource => ({
  kind: "simulation",
  url: `https://phet.colorado.edu/en/simulations/${slug}`,
  title: { vi, en },
  note: `${PHET} ${tip}`,
});
const t = (en: string, ipa: string, vi: string): KhoTerm => ({ en, ipa, vi });
const L = (curLessonId: string, resources: KhoResource[], terms: KhoTerm[]): KhoLesson => ({ curLessonId, resources, terms });

// Thuật ngữ dùng lại ở nhiều bài
const T = {
  naturalNumber: t("natural number", "/ˈnætʃrəl ˈnʌmbə(r)/", "số tự nhiên"),
  numberLine: t("number line", "/ˈnʌmbə laɪn/", "trục số"),
  power: t("power", "/ˈpaʊə(r)/", "luỹ thừa"),
  base: t("base", "/beɪs/", "cơ số; đáy"),
  exponent: t("exponent", "/ɪkˈspəʊnənt/", "số mũ"),
  bracket: t("bracket", "/ˈbrækɪt/", "dấu ngoặc"),
  factor: t("factor", "/ˈfæktə(r)/", "ước; nhân tử"),
  multiple: t("multiple", "/ˈmʌltɪpl/", "bội"),
  product: t("product", "/ˈprɒdʌkt/", "tích"),
  quotient: t("quotient", "/ˈkwəʊʃnt/", "thương"),
  remainder: t("remainder", "/rɪˈmeɪndə(r)/", "số dư"),
  sum: t("sum", "/sʌm/", "tổng"),
  difference: t("difference", "/ˈdɪfrəns/", "hiệu"),
  integer: t("integer", "/ˈɪntɪdʒə(r)/", "số nguyên"),
  vertex: t("vertex", "/ˈvɜːteks/", "đỉnh"),
  side: t("side", "/saɪd/", "cạnh"),
  fraction: t("fraction", "/ˈfrækʃn/", "phân số"),
  numerator: t("numerator", "/ˈnjuːməreɪtə(r)/", "tử số; tử thức"),
  denominator: t("denominator", "/dɪˈnɒmɪneɪtə(r)/", "mẫu số; mẫu thức"),
  commonDenominator: t("common denominator", "/ˈkɒmən dɪˈnɒmɪneɪtə(r)/", "mẫu chung"),
  simplify: t("simplify", "/ˈsɪmplɪfaɪ/", "rút gọn"),
  reciprocal: t("reciprocal", "/rɪˈsɪprəkl/", "số nghịch đảo"),
  decimal: t("decimal", "/ˈdesɪml/", "số thập phân"),
  ratio: t("ratio", "/ˈreɪʃiəʊ/", "tỉ số"),
  percentage: t("percentage", "/pəˈsentɪdʒ/", "tỉ số phần trăm"),
  angle: t("angle", "/ˈæŋɡl/", "góc"),
  degree: t("degree", "/dɪˈɡriː/", "độ; bậc"),
  data: t("data", "/ˈdeɪtə/", "dữ liệu"),
  table: t("table", "/ˈteɪbl/", "bảng"),
  barChart: t("bar chart", "/bɑː tʃɑːt/", "biểu đồ cột"),
  pieChart: t("pie chart", "/paɪ tʃɑːt/", "biểu đồ hình quạt tròn"),
  lineGraph: t("line graph", "/laɪn ɡrɑːf/", "biểu đồ đoạn thẳng"),
  outcome: t("outcome", "/ˈaʊtkʌm/", "kết quả có thể"),
  event: t("event", "/ɪˈvent/", "biến cố; sự kiện"),
  probability: t("probability", "/ˌprɒbəˈbɪləti/", "xác suất"),
  experimentalProbability: t("experimental probability", "/ɪkˌsperɪˈmentl ˌprɒbəˈbɪləti/", "xác suất thực nghiệm"),
  equallyLikely: t("equally likely", "/ˈiːkwəli ˈlaɪkli/", "đồng khả năng"),
  triangle: t("triangle", "/ˈtraɪæŋɡl/", "tam giác"),
  rightTriangle: t("right triangle", "/raɪt ˈtraɪæŋɡl/", "tam giác vuông"),
  hypotenuse: t("hypotenuse", "/haɪˈpɒtənjuːz/", "cạnh huyền"),
  leg: t("leg", "/leɡ/", "cạnh góc vuông; cạnh bên"),
  parallel: t("parallel", "/ˈpærəlel/", "song song"),
  perpendicular: t("perpendicular", "/ˌpɜːpənˈdɪkjələ(r)/", "vuông góc"),
  midpoint: t("midpoint", "/ˈmɪdpɔɪnt/", "trung điểm"),
  diagonal: t("diagonal", "/daɪˈæɡənl/", "đường chéo"),
  oppositeSides: t("opposite sides", "/ˈɒpəzɪt saɪdz/", "các cạnh đối"),
  oppositeAngles: t("opposite angles", "/ˈɒpəzɪt ˈæŋɡlz/", "các góc đối"),
  angleBisector: t("angle bisector", "/ˈæŋɡl baɪˈsektə(r)/", "tia phân giác; đường phân giác"),
  correspondingSides: t("corresponding sides", "/ˌkɒrəˈspɒndɪŋ saɪdz/", "các cạnh tương ứng"),
  correspondingAngles: t("corresponding angles", "/ˌkɒrəˈspɒndɪŋ ˈæŋɡlz/", "các góc tương ứng; góc đồng vị"),
  polynomial: t("polynomial", "/ˌpɒliˈnəʊmiəl/", "đa thức"),
  monomial: t("monomial", "/mɒˈnəʊmiəl/", "đơn thức"),
  coefficient: t("coefficient", "/ˌkəʊɪˈfɪʃnt/", "hệ số"),
  variable: t("variable", "/ˈveəriəbl/", "biến"),
  term: t("term", "/tɜːm/", "hạng tử; số hạng"),
  likeTerms: t("like terms", "/laɪk tɜːmz/", "các hạng tử đồng dạng"),
  expand: t("expand", "/ɪkˈspænd/", "khai triển"),
  identity: t("identity", "/aɪˈdentəti/", "hằng đẳng thức"),
  factorise: t("factorise", "/ˈfæktəraɪz/", "phân tích thành nhân tử"),
  equation: t("equation", "/ɪˈkweɪʒn/", "phương trình"),
  solution: t("solution", "/səˈluːʃn/", "nghiệm"),
  unknown: t("unknown", "/ʌnˈnəʊn/", "ẩn (số)"),
  setUpEquation: t("set up an equation", "/set ʌp ən ɪˈkweɪʒn/", "lập phương trình"),
  wordProblem: t("word problem", "/wɜːd ˈprɒbləm/", "bài toán có lời văn"),
  graph: t("graph", "/ɡrɑːf/", "đồ thị"),
  squareRoot: t("square root", "/skweə ruːt/", "căn bậc hai"),
  radical: t("radical", "/ˈrædɪkl/", "căn thức"),
  circle: t("circle", "/ˈsɜːkl/", "đường tròn"),
  radius: t("radius", "/ˈreɪdiəs/", "bán kính"),
  volume: t("volume", "/ˈvɒljuːm/", "thể tích"),
  lateralArea: t("lateral surface area", "/ˈlætərəl ˈsɜːfɪs ˈeəriə/", "diện tích xung quanh"),
  area: t("area", "/ˈeəriə/", "diện tích"),
  frequency: t("frequency", "/ˈfriːkwənsi/", "tần số"),
  favourableOutcome: t("favourable outcome", "/ˈfeɪvərəbl ˈaʊtkʌm/", "kết quả thuận lợi"),
  randomExperiment: t("random experiment", "/ˈrændəm ɪkˈsperɪmənt/", "phép thử ngẫu nhiên"),
  similar: t("similar", "/ˈsɪmələ(r)/", "đồng dạng"),
  regularPolygon: t("regular polygon", "/ˈreɡjələ ˈpɒlɪɡən/", "đa giác đều"),
};

/** Dùng chung cho mọi khối (không gắn bài) */
export const KHO_COMMON: KhoResource[] = [
  {
    kind: "web",
    url: "https://hanhtrangso.nxbgd.vn/",
    title: { vi: "Sách điện tử Toán – Kết nối tri thức (Hành trang số)", en: "Maths e-textbooks (Hanh trang so)" },
    note: "Nguồn chính thức: NXB Giáo dục Việt Nam. Đăng nhập, nhập mã trên tem sách để mở SGK + học liệu điện tử của bộ Kết nối tri thức.",
  },
  {
    kind: "web",
    url: "https://www.geogebra.org/geometry",
    title: { vi: "GeoGebra Hình học – vẽ hình động", en: "GeoGebra Geometry" },
    note: "Nguồn: GeoGebra (miễn phí). Vẽ điểm, đường thẳng, đường tròn, đo góc, đo độ dài; kéo điểm để HS thấy tính chất không đổi.",
  },
  {
    kind: "web",
    url: "https://www.geogebra.org/graphing",
    title: { vi: "GeoGebra Vẽ đồ thị", en: "GeoGebra Graphing Calculator" },
    note: "Nguồn: GeoGebra (miễn phí). Gõ y = 2x + 1 hoặc y = x^2 để vẽ đồ thị ngay; dùng thanh trượt cho hệ số a, b.",
  },
];

export const KHO_TOAN: KhoLesson[] = [
  // ======================================================= LỚP 6 =======================================================
  L("k6-1", [mif("sets/sets-introduction.html", "Giới thiệu về tập hợp", "Introduction to Sets")], [
    t("set", "/set/", "tập hợp"),
    t("element", "/ˈelɪmənt/", "phần tử"),
    t("belong to", "/bɪˈlɒŋ tə/", "thuộc"),
    T.naturalNumber,
  ]),
  L("k6-2", [], [t("digit", "/ˈdɪdʒɪt/", "chữ số"), t("place value", "/ˈpleɪs ˌvæljuː/", "giá trị theo vị trí"), t("Roman numeral", "/ˈrəʊmən ˈnjuːmərəl/", "số La Mã")]),
  L("k6-3", [], [t("greater than", "/ˈɡreɪtə ðən/", "lớn hơn"), t("less than", "/ˈles ðən/", "nhỏ hơn"), T.numberLine]),
  L("k6-4", [phet("arithmetic", "Luyện phép tính", "Arithmetic", "Chơi theo cấp độ, nói to phép tính bằng tiếng Anh.")], [
    t("add", "/æd/", "cộng"),
    t("subtract", "/səbˈtrækt/", "trừ"),
    T.sum,
    T.difference,
  ]),
  L("k6-5", [], [t("multiply", "/ˈmʌltɪplaɪ/", "nhân"), t("divide", "/dɪˈvaɪd/", "chia"), T.product, T.quotient, T.remainder]),
  L("k6-6", [mif("exponent.html", "Luỹ thừa và số mũ", "Exponents")], [T.power, T.base, T.exponent, t("squared", "/skweəd/", "bình phương"), t("cubed", "/kjuːbd/", "lập phương")]),
  L("k6-7", [mif("operation-order-pemdas.html", "Thứ tự thực hiện các phép tính", "Order of Operations")], [
    t("order of operations", "/ˈɔːdər əv ˌɒpəˈreɪʃnz/", "thứ tự thực hiện các phép tính"),
    T.bracket,
    t("expression", "/ɪkˈspreʃn/", "biểu thức"),
  ]),
  L("k6-8", [], [t("divisible", "/dɪˈvɪzəbl/", "chia hết"), T.factor, T.multiple]),
  L("k6-9", [mif("divisibility-rules.html", "Dấu hiệu chia hết", "Divisibility Rules")], [
    t("divisibility rule", "/dɪˌvɪzəˈbɪləti ruːl/", "dấu hiệu chia hết"),
    t("even number", "/ˈiːvn ˈnʌmbə(r)/", "số chẵn"),
    t("odd number", "/ɒd ˈnʌmbə(r)/", "số lẻ"),
  ]),
  L("k6-10", [mif("prime_numbers.html", "Số nguyên tố và hợp số", "Prime and Composite Numbers")], [
    t("prime number", "/praɪm ˈnʌmbə(r)/", "số nguyên tố"),
    t("composite number", "/ˈkɒmpəzɪt ˈnʌmbə(r)/", "hợp số"),
    t("prime factorisation", "/praɪm ˌfæktəraɪˈzeɪʃn/", "phân tích ra thừa số nguyên tố"),
  ]),
  L("k6-11", [mif("greatest-common-factor.html", "Ước chung lớn nhất", "Greatest Common Factor")], [
    t("common factor", "/ˈkɒmən ˈfæktə(r)/", "ước chung; nhân tử chung"),
    t("greatest common factor", "/ˈɡreɪtɪst ˈkɒmən ˈfæktə(r)/", "ước chung lớn nhất (ƯCLN)"),
    T.factor,
  ]),
  L("k6-12", [mif("least-common-multiple.html", "Bội chung nhỏ nhất", "Least Common Multiple")], [
    t("common multiple", "/ˈkɒmən ˈmʌltɪpl/", "bội chung"),
    t("least common multiple", "/liːst ˈkɒmən ˈmʌltɪpl/", "bội chung nhỏ nhất (BCNN)"),
    T.multiple,
  ]),
  L(
    "k6-13",
    [
      mif("positive-negative-integers.html", "Số nguyên dương, số nguyên âm", "Positive and Negative Integers"),
      phet("number-line-integers", "Số nguyên trên trục số", "Number Line: Integers", "Kéo điểm trên trục số, so sánh nhiệt độ dưới 0 °C."),
    ],
    [T.integer, t("negative number", "/ˈneɡətɪv ˈnʌmbə(r)/", "số âm"), t("positive number", "/ˈpɒzətɪv ˈnʌmbə(r)/", "số dương"), t("opposite number", "/ˈɒpəzɪt ˈnʌmbə(r)/", "số đối"), T.numberLine]
  ),
  L("k6-14", [phet("number-line-operations", "Cộng, trừ trên trục số", "Number Line: Operations", "Thêm phép cộng/trừ và xem bước nhảy trên trục số.")], [
    t("absolute value", "/ˈæbsəluːt ˈvæljuː/", "giá trị tuyệt đối"),
    t("plus", "/plʌs/", "cộng (dấu +)"),
    t("minus", "/ˈmaɪnəs/", "trừ (dấu −)"),
    T.integer,
  ]),
  L("k6-15", [], [T.bracket, t("sign", "/saɪn/", "dấu"), t("opposite sign", "/ˈɒpəzɪt saɪn/", "dấu ngược lại")]),
  L("k6-16", [mif("multiplying-negatives.html", "Nhân với số âm", "Multiplying Negatives")], [t("rule of signs", "/ruːl əv saɪnz/", "quy tắc dấu"), t("multiply", "/ˈmʌltɪplaɪ/", "nhân"), T.product]),
  L("k6-17", [], [t("divisor", "/dɪˈvaɪzə(r)/", "số chia; ước"), t("dividend", "/ˈdɪvɪdend/", "số bị chia"), T.factor, T.multiple]),
  L("k6-18", [mif("geometry/regular-polygons.html", "Đa giác đều", "Regular Polygons")], [
    t("equilateral triangle", "/ˌiːkwɪˈlætərəl ˈtraɪæŋɡl/", "tam giác đều"),
    t("square", "/skweə(r)/", "hình vuông"),
    t("regular hexagon", "/ˈreɡjələ ˈheksəɡən/", "lục giác đều"),
    T.side,
    T.vertex,
  ]),
  L("k6-19", [mif("quadrilaterals.html", "Các loại tứ giác", "Quadrilaterals")], [
    t("rectangle", "/ˈrektæŋɡl/", "hình chữ nhật"),
    t("rhombus", "/ˈrɒmbəs/", "hình thoi"),
    t("parallelogram", "/ˌpærəˈleləɡræm/", "hình bình hành"),
    t("isosceles trapezoid", "/aɪˈsɒsəliːz ˈtræpəzɔɪd/", "hình thang cân"),
  ]),
  L(
    "k6-20",
    [mif("area.html", "Diện tích", "Area"), phet("area-builder", "Xếp hình tính diện tích", "Area Builder", "Xếp ô vuông tạo hình có diện tích, chu vi cho trước.")],
    [t("perimeter", "/pəˈrɪmɪtə(r)/", "chu vi"), T.area, t("square metre", "/skweə ˈmiːtə(r)/", "mét vuông")]
  ),
  L("k6-21", [mif("geometry/symmetry-reflection.html", "Đối xứng trục", "Reflection Symmetry")], [
    t("line of symmetry", "/laɪn əv ˈsɪmətri/", "trục đối xứng"),
    t("symmetric", "/sɪˈmetrɪk/", "đối xứng"),
    t("reflection", "/rɪˈflekʃn/", "phép đối xứng trục"),
  ]),
  L("k6-22", [mif("geometry/symmetry-rotational.html", "Đối xứng tâm (đối xứng quay)", "Rotational Symmetry")], [
    t("centre of symmetry", "/ˈsentər əv ˈsɪmətri/", "tâm đối xứng"),
    t("rotation", "/rəʊˈteɪʃn/", "phép quay"),
  ]),
  L(
    "k6-23",
    [mif("equivalent_fractions.html", "Phân số bằng nhau", "Equivalent Fractions"), phet("fractions-equality", "Phân số bằng nhau", "Fractions: Equality", "Ghép hai phân số bằng nhau bằng hình tròn, thanh.")],
    [T.fraction, T.numerator, T.denominator, t("equivalent fractions", "/ɪˈkwɪvələnt ˈfrækʃnz/", "phân số bằng nhau")]
  ),
  L(
    "k6-24",
    [mif("mixed-fractions.html", "Hỗn số", "Mixed Fractions"), phet("fractions-intro", "Làm quen phân số", "Fractions Intro", "So sánh phân số bằng hình vẽ.")],
    [t("compare", "/kəmˈpeə(r)/", "so sánh"), T.commonDenominator, t("mixed number", "/mɪkst ˈnʌmbə(r)/", "hỗn số")]
  ),
  L(
    "k6-25",
    [mif("fractions_addition.html", "Cộng phân số", "Adding Fractions"), phet("build-a-fraction", "Dựng phân số", "Build a Fraction", "Dựng phân số từ hình và số.")],
    [T.commonDenominator, T.simplify, T.sum, T.difference]
  ),
  L("k6-26", [mif("fractions_multiplication.html", "Nhân phân số", "Multiplying Fractions")], [T.reciprocal, T.product, T.quotient]),
  L("k6-27", [], [t("whole", "/həʊl/", "cái toàn thể"), t("part", "/pɑːt/", "phần"), T.fraction]),
  L(
    "k6-28",
    [mif("decimals.html", "Số thập phân", "Decimals"), phet("area-model-decimals", "Mô hình diện tích với số thập phân", "Area Model: Decimals", "Nhân hai số thập phân bằng hình chữ nhật.")],
    [T.decimal, t("decimal point", "/ˈdesɪml pɔɪnt/", "dấu phẩy thập phân"), t("tenth", "/tenθ/", "một phần mười"), t("hundredth", "/ˈhʌndrədθ/", "một phần trăm")]
  ),
  L("k6-29", [], [T.decimal, T.product, T.quotient]),
  L("k6-30", [mif("rounding-numbers.html", "Làm tròn số", "Rounding Numbers")], [t("round", "/raʊnd/", "làm tròn"), t("estimate", "/ˈestɪmeɪt/", "ước lượng"), t("approximately", "/əˈprɒksɪmətli/", "xấp xỉ")]),
  L(
    "k6-31",
    [mif("percentage.html", "Tỉ số phần trăm", "Percentage"), phet("ratio-and-proportion", "Tỉ số và tỉ lệ", "Ratio and Proportion", "Giữ hai bàn tay theo đúng tỉ số.")],
    [T.ratio, T.percentage, t("per cent", "/pə ˈsent/", "phần trăm")]
  ),
  L("k6-32", [mif("geometry/point.html", "Điểm", "Point"), mif("geometry/line.html", "Đường thẳng, tia, đoạn thẳng", "Line")], [
    t("point", "/pɔɪnt/", "điểm"),
    t("line", "/laɪn/", "đường thẳng"),
    t("lie on", "/laɪ ɒn/", "thuộc (nằm trên)"),
    t("collinear", "/kəˈlɪniə(r)/", "thẳng hàng"),
  ]),
  L("k6-33", [], [t("ray", "/reɪ/", "tia"), t("between", "/bɪˈtwiːn/", "nằm giữa"), t("origin", "/ˈɒrɪdʒɪn/", "gốc (của tia)")]),
  L("k6-34", [], [t("line segment", "/laɪn ˈseɡmənt/", "đoạn thẳng"), t("length", "/leŋθ/", "độ dài"), t("ruler", "/ˈruːlə(r)/", "thước thẳng")]),
  L("k6-35", [], [T.midpoint, t("equal", "/ˈiːkwəl/", "bằng nhau"), t("line segment", "/laɪn ˈseɡmənt/", "đoạn thẳng")]),
  L("k6-36", [mif("geometry/degrees.html", "Góc và độ", "Degrees (Angles)")], [T.angle, T.vertex, t("arm", "/ɑːm/", "cạnh của góc")]),
  L("k6-37", [mif("geometry/protractor-using.html", "Dùng thước đo góc", "Using a Protractor")], [
    t("protractor", "/prəˈtræktə(r)/", "thước đo góc"),
    t("acute angle", "/əˈkjuːt ˈæŋɡl/", "góc nhọn"),
    t("right angle", "/raɪt ˈæŋɡl/", "góc vuông"),
    t("obtuse angle", "/əbˈtjuːs ˈæŋɡl/", "góc tù"),
    t("straight angle", "/streɪt ˈæŋɡl/", "góc bẹt"),
  ]),
  L("k6-38", [mif("data/data.html", "Dữ liệu là gì?", "What is Data?")], [T.data, t("collect", "/kəˈlekt/", "thu thập"), t("survey", "/ˈsɜːveɪ/", "cuộc khảo sát")]),
  L("k6-39", [mif("data/pictographs.html", "Biểu đồ tranh", "Pictographs")], [T.table, t("pictogram", "/ˈpɪktəɡræm/", "biểu đồ tranh"), t("key", "/kiː/", "chú thích")]),
  L("k6-40", [mif("data/bar-graphs.html", "Biểu đồ cột", "Bar Graphs")], [T.barChart, t("axis", "/ˈæksɪs/", "trục"), T.data]),
  L("k6-41", [], [t("double bar chart", "/ˈdʌbl bɑː tʃɑːt/", "biểu đồ cột kép"), T.barChart, t("compare", "/kəmˈpeə(r)/", "so sánh")]),
  L("k6-42", [], [T.outcome, T.event, t("dice", "/daɪs/", "xúc xắc"), t("coin", "/kɔɪn/", "đồng xu")]),
  L(
    "k6-43",
    [mif("data/probability.html", "Xác suất", "Probability"), phet("plinko-probability", "Bảng Plinko – xác suất", "Plinko Probability", "Thả nhiều viên bi, so sánh kết quả với dự đoán.")],
    [T.experimentalProbability, t("trial", "/ˈtraɪəl/", "lần thử"), T.outcome]
  ),

  // ======================================================= LỚP 7 =======================================================
  L("k7-1", [mif("rational-numbers.html", "Số hữu tỉ", "Rational Numbers")], [t("rational number", "/ˈræʃnəl ˈnʌmbə(r)/", "số hữu tỉ"), T.fraction, T.numberLine]),
  L("k7-2", [], [t("operation", "/ˌɒpəˈreɪʃn/", "phép tính"), T.reciprocal, T.sum, T.product]),
  L("k7-3", [], [T.power, T.base, T.exponent]),
  L("k7-4", [], [t("equals sign", "/ˈiːkwəlz saɪn/", "dấu bằng"), T.term, t("order of operations", "/ˈɔːdər əv ˌɒpəˈreɪʃnz/", "thứ tự thực hiện các phép tính")]),
  L("k7-5", [], [
    t("recurring decimal", "/rɪˈkɜːrɪŋ ˈdesɪml/", "số thập phân vô hạn tuần hoàn"),
    t("terminating decimal", "/ˈtɜːmɪneɪtɪŋ ˈdesɪml/", "số thập phân hữu hạn"),
    t("period", "/ˈpɪəriəd/", "chu kì"),
  ]),
  L("k7-6", [mif("irrational-numbers.html", "Số vô tỉ", "Irrational Numbers"), mif("square-root.html", "Căn bậc hai", "Square Roots")], [
    t("irrational number", "/ɪˈræʃənl ˈnʌmbə(r)/", "số vô tỉ"),
    T.squareRoot,
  ]),
  L("k7-7", [mif("numbers/real-numbers.html", "Số thực", "Real Numbers")], [t("real number", "/rɪəl ˈnʌmbə(r)/", "số thực"), T.numberLine, t("absolute value", "/ˈæbsəluːt ˈvæljuː/", "giá trị tuyệt đối")]),
  L("k7-8", [], [
    t("adjacent angles", "/əˈdʒeɪsnt ˈæŋɡlz/", "hai góc kề nhau"),
    t("vertically opposite angles", "/ˈvɜːtɪkli ˈɒpəzɪt ˈæŋɡlz/", "hai góc đối đỉnh"),
    t("supplementary angles", "/ˌsʌplɪˈmentri ˈæŋɡlz/", "hai góc bù nhau"),
    T.angleBisector,
  ]),
  L("k7-9", [mif("geometry/parallel-lines.html", "Đường thẳng song song và các cặp góc", "Parallel Lines and Pairs of Angles")], [
    t("parallel lines", "/ˈpærəlel laɪnz/", "hai đường thẳng song song"),
    t("transversal", "/trænzˈvɜːsl/", "đường thẳng cắt hai đường thẳng (cát tuyến)"),
    t("alternate angles", "/ɔːlˈtɜːnət ˈæŋɡlz/", "hai góc so le trong"),
    T.correspondingAngles,
  ]),
  L("k7-10", [], [t("axiom", "/ˈæksiəm/", "tiên đề"), t("property", "/ˈprɒpəti/", "tính chất"), T.parallel]),
  L("k7-11", [], [
    t("theorem", "/ˈθɪərəm/", "định lí"),
    t("proof", "/pruːf/", "chứng minh"),
    t("hypothesis", "/haɪˈpɒθəsɪs/", "giả thiết"),
    t("conclusion", "/kənˈkluːʒn/", "kết luận"),
  ]),
  L("k7-12", [mif("angle180.html", "Tổng ba góc của tam giác bằng 180°", "Triangles Contain 180°")], [
    T.triangle,
    t("interior angle", "/ɪnˈtɪəriər ˈæŋɡl/", "góc trong"),
    t("exterior angle", "/ɪkˈstɪəriər ˈæŋɡl/", "góc ngoài"),
    t("angle sum", "/ˈæŋɡl sʌm/", "tổng các góc"),
  ]),
  L("k7-13", [mif("geometry/triangles-congruent.html", "Tam giác bằng nhau", "Congruent Triangles")], [
    t("congruent triangles", "/ˈkɒŋɡruənt ˈtraɪæŋɡlz/", "hai tam giác bằng nhau"),
    T.correspondingSides,
    t("side-side-side", "/saɪd saɪd saɪd/", "cạnh – cạnh – cạnh (c.c.c)"),
  ]),
  L("k7-14", [], [
    t("included angle", "/ɪnˈkluːdɪd ˈæŋɡl/", "góc xen giữa"),
    t("side-angle-side", "/saɪd ˈæŋɡl saɪd/", "cạnh – góc – cạnh (c.g.c)"),
    t("angle-side-angle", "/ˈæŋɡl saɪd ˈæŋɡl/", "góc – cạnh – góc (g.c.g)"),
  ]),
  L("k7-15", [], [T.rightTriangle, T.hypotenuse, T.leg]),
  L("k7-16", [], [
    t("isosceles triangle", "/aɪˈsɒsəliːz ˈtraɪæŋɡl/", "tam giác cân"),
    t("base angle", "/beɪs ˈæŋɡl/", "góc ở đáy"),
    t("perpendicular bisector", "/ˌpɜːpənˈdɪkjələ baɪˈsektə(r)/", "đường trung trực"),
  ]),
  L("k7-17", [], [
    t("qualitative data", "/ˈkwɒlɪtətɪv ˈdeɪtə/", "dữ liệu định tính"),
    t("quantitative data", "/ˈkwɒntɪtətɪv ˈdeɪtə/", "dữ liệu định lượng"),
    t("classify", "/ˈklæsɪfaɪ/", "phân loại"),
  ]),
  L("k7-18", [mif("data/pie-charts.html", "Biểu đồ hình quạt tròn", "Pie Charts")], [T.pieChart, t("sector", "/ˈsektə(r)/", "hình quạt tròn"), T.percentage]),
  L("k7-19", [mif("data/line-graphs.html", "Biểu đồ đoạn thẳng", "Line Graphs")], [T.lineGraph, t("trend", "/trend/", "xu hướng"), t("increase", "/ɪnˈkriːs/", "tăng")]),
  L(
    "k7-20",
    [mif("algebra/proportions.html", "Tỉ lệ thức", "Proportions"), phet("proportion-playground", "Sân chơi tỉ lệ", "Proportion Playground", "Pha màu, xếp vòng cổ theo tỉ lệ.")],
    [t("proportion", "/prəˈpɔːʃn/", "tỉ lệ thức"), T.ratio, t("extremes", "/ɪkˈstriːmz/", "ngoại tỉ"), t("means", "/miːnz/", "trung tỉ")]
  ),
  L("k7-21", [], [t("equal ratios", "/ˈiːkwəl ˈreɪʃiəʊz/", "dãy tỉ số bằng nhau"), T.ratio, T.sum]),
  L(
    "k7-22",
    [mif("algebra/directly-inversely-proportional.html", "Tỉ lệ thuận, tỉ lệ nghịch", "Directly and Inversely Proportional"), phet("unit-rates", "Đơn giá", "Unit Rates", "Mua táo theo đơn giá, nhìn bảng tỉ lệ thuận.")],
    [t("direct proportion", "/dəˈrekt prəˈpɔːʃn/", "đại lượng tỉ lệ thuận"), t("constant of proportionality", "/ˈkɒnstənt əv prəˌpɔːʃəˈnæləti/", "hệ số tỉ lệ"), T.ratio, t("unit rate", "/ˈjuːnɪt reɪt/", "đơn giá")]
  ),
  L("k7-23", [], [t("inverse proportion", "/ˈɪnvɜːs prəˈpɔːʃn/", "đại lượng tỉ lệ nghịch"), t("constant of proportionality", "/ˈkɒnstənt əv prəˌpɔːʃəˈnæləti/", "hệ số tỉ lệ")]),
  L(
    "k7-24",
    [mif("algebra/definitions.html", "Các từ cơ bản trong Đại số", "Algebra Definitions"), phet("expression-exchange", "Thu gọn biểu thức", "Expression Exchange", "Gom các hạng tử giống nhau thành biểu thức gọn.")],
    [t("algebraic expression", "/ˌældʒɪˈbreɪɪk ɪkˈspreʃn/", "biểu thức đại số"), T.variable, t("substitute", "/ˈsʌbstɪtjuːt/", "thay (giá trị vào biến)")]
  ),
  L("k7-25", [mif("algebra/polynomials.html", "Đa thức", "Polynomials")], [
    t("polynomial in one variable", "/ˌpɒliˈnəʊmiəl ɪn wʌn ˈveəriəbl/", "đa thức một biến"),
    T.degree,
    T.coefficient,
    t("root of a polynomial", "/ruːt əv ə ˌpɒliˈnəʊmiəl/", "nghiệm của đa thức"),
  ]),
  L("k7-26", [mif("algebra/polynomials-adding-subtracting.html", "Cộng, trừ đa thức", "Adding and Subtracting Polynomials")], [T.likeTerms, T.sum, T.difference]),
  L(
    "k7-27",
    [mif("algebra/polynomials-multiplying.html", "Nhân đa thức", "Multiplying Polynomials"), phet("area-model-algebra", "Mô hình diện tích – Đại số", "Area Model Algebra", "Nhân đa thức bằng hình chữ nhật chia ô.")],
    [t("distributive property", "/dɪˈstrɪbjətɪv ˈprɒpəti/", "tính chất phân phối"), T.product, T.expand]
  ),
  L("k7-28", [mif("algebra/polynomials-division-long.html", "Chia đa thức (đặt tính)", "Polynomial Long Division")], [
    t("long division", "/lɒŋ dɪˈvɪʒn/", "phép chia đặt tính"),
    T.quotient,
    T.remainder,
  ]),
  L("k7-29", [mif("data/probability-events-types.html", "Các loại biến cố", "Types of Events")], [
    t("certain event", "/ˈsɜːtn ɪˈvent/", "biến cố chắc chắn"),
    t("impossible event", "/ɪmˈpɒsəbl ɪˈvent/", "biến cố không thể"),
    t("random event", "/ˈrændəm ɪˈvent/", "biến cố ngẫu nhiên"),
  ]),
  L("k7-30", [mif("data/probability.html", "Xác suất", "Probability")], [T.probability, T.equallyLikely, T.event]),
  L("k7-31", [], [t("opposite side", "/ˈɒpəzɪt saɪd/", "cạnh đối diện"), T.angle, T.triangle]),
  L("k7-32", [], [
    t("oblique line", "/əˈbliːk laɪn/", "đường xiên"),
    t("projection", "/prəˈdʒekʃn/", "hình chiếu"),
    t("distance", "/ˈdɪstəns/", "quãng đường; khoảng cách"),
    T.perpendicular,
  ]),
  L("k7-33", [mif("geometry/triangle-inequality-theorem.html", "Bất đẳng thức tam giác", "Triangle Inequality Theorem")], [
    t("triangle inequality", "/ˈtraɪæŋɡl ˌɪnɪˈkwɒləti/", "bất đẳng thức tam giác"),
    T.side,
  ]),
  L("k7-34", [mif("geometry/triangle-centers.html", "Các điểm đặc biệt của tam giác", "Triangle Centers")], [
    t("median", "/ˈmiːdiən/", "đường trung tuyến"),
    t("centroid", "/ˈsentrɔɪd/", "trọng tâm"),
    t("concurrent", "/kənˈkʌrənt/", "đồng quy"),
    T.angleBisector,
  ]),
  L("k7-35", [], [
    t("altitude", "/ˈæltɪtjuːd/", "đường cao"),
    t("orthocentre", "/ˈɔːθəʊsentə(r)/", "trực tâm"),
    t("perpendicular bisector", "/ˌpɜːpənˈdɪkjələ baɪˈsektə(r)/", "đường trung trực"),
  ]),
  L("k7-36", [mif("geometry/cuboids-rectangular-prisms.html", "Hình hộp chữ nhật", "Cuboids")], [
    t("cuboid", "/ˈkjuːbɔɪd/", "hình hộp chữ nhật"),
    t("cube", "/kjuːb/", "hình lập phương; lập phương"),
    t("face", "/feɪs/", "mặt"),
    t("edge", "/edʒ/", "cạnh (của hình khối)"),
    T.volume,
  ]),
  L("k7-37", [mif("geometry/prisms.html", "Hình lăng trụ", "Prisms")], [t("prism", "/ˈprɪzəm/", "hình lăng trụ"), T.lateralArea, T.base]),

  // ======================================================= LỚP 8 =======================================================
  L("k8-1", [phet("expression-exchange", "Thu gọn biểu thức", "Expression Exchange", "Gom các đơn thức đồng dạng.")], [
    T.monomial,
    T.coefficient,
    t("like monomials", "/laɪk mɒˈnəʊmiəlz/", "các đơn thức đồng dạng"),
    T.degree,
    T.variable,
  ]),
  L("k8-2", [mif("algebra/polynomials.html", "Đa thức", "Polynomials")], [T.polynomial, T.term, T.degree, t("evaluate", "/ɪˈvæljueɪt/", "tính giá trị"), T.variable]),
  L("k8-3", [mif("algebra/polynomials-adding-subtracting.html", "Cộng, trừ đa thức", "Adding and Subtracting Polynomials")], [
    T.likeTerms,
    t("collect like terms", "/kəˈlekt laɪk tɜːmz/", "thu gọn các hạng tử đồng dạng"),
    T.sum,
    T.difference,
    T.bracket,
  ]),
  L(
    "k8-4",
    [mif("algebra/polynomials-multiplying.html", "Nhân đa thức", "Multiplying Polynomials"), phet("area-model-algebra", "Mô hình diện tích – Đại số", "Area Model Algebra", "Nhân đa thức bằng hình chữ nhật chia ô.")],
    [t("distributive property", "/dɪˈstrɪbjətɪv ˈprɒpəti/", "tính chất phân phối"), T.product, T.expand, t("area model", "/ˈeəriə ˈmɒdl/", "mô hình diện tích"), T.polynomial]
  ),
  L("k8-5", [], [t("divide", "/dɪˈvaɪd/", "chia"), T.quotient, t("divisible", "/dɪˈvɪzəbl/", "chia hết"), T.monomial, t("exact division", "/ɪɡˈzækt dɪˈvɪʒn/", "phép chia hết")]),
  L("k8-6", [mif("algebra/special-binomial-products.html", "Các tích đặc biệt", "Special Binomial Products")], [
    T.identity,
    t("difference of two squares", "/ˈdɪfrəns əv tuː skweəz/", "hiệu hai bình phương"),
    t("square of a sum", "/skweər əv ə sʌm/", "bình phương của một tổng"),
    t("square of a difference", "/skweər əv ə ˈdɪfrəns/", "bình phương của một hiệu"),
    t("perfect square", "/ˈpɜːfɪkt skweə(r)/", "bình phương đúng"),
  ]),
  L("k8-7", [], [
    t("cube of a sum", "/kjuːb əv ə sʌm/", "lập phương của một tổng"),
    t("cube of a difference", "/kjuːb əv ə ˈdɪfrəns/", "lập phương của một hiệu"),
    t("binomial", "/baɪˈnəʊmiəl/", "nhị thức"),
    T.identity,
    T.expand,
  ]),
  L("k8-8", [], [
    t("sum of two cubes", "/sʌm əv tuː kjuːbz/", "tổng hai lập phương"),
    t("difference of two cubes", "/ˈdɪfrəns əv tuː kjuːbz/", "hiệu hai lập phương"),
    T.identity,
    T.factor,
    T.product,
  ]),
  L("k8-9", [mif("algebra/factoring.html", "Phân tích thành nhân tử", "Factoring in Algebra")], [
    T.factorise,
    t("common factor", "/ˈkɒmən ˈfæktə(r)/", "ước chung; nhân tử chung"),
    t("group terms", "/ɡruːp tɜːmz/", "nhóm hạng tử"),
    T.identity,
    T.factor,
  ]),
  L(
    "k8-10",
    [mif("quadrilaterals.html", "Các loại tứ giác", "Quadrilaterals"), phet("quadrilateral", "Khám phá tứ giác", "Quadrilateral", "Kéo đỉnh, xem các cạnh song song, góc bằng nhau.")],
    [t("quadrilateral", "/ˌkwɒdrɪˈlætərəl/", "tứ giác"), t("convex", "/ˈkɒnveks/", "lồi"), T.diagonal, T.vertex, t("angle sum", "/ˈæŋɡl sʌm/", "tổng các góc")]
  ),
  L("k8-11", [mif("geometry/trapezoid.html", "Hình thang", "Trapezoid")], [
    t("trapezoid", "/ˈtræpəzɔɪd/", "hình thang"),
    t("isosceles trapezoid", "/aɪˈsɒsəliːz ˈtræpəzɔɪd/", "hình thang cân"),
    T.base,
    T.leg,
    T.diagonal,
  ]),
  L("k8-12", [mif("geometry/parallelogram.html", "Hình bình hành", "Parallelogram")], [
    t("parallelogram", "/ˌpærəˈleləɡræm/", "hình bình hành"),
    T.oppositeSides,
    T.oppositeAngles,
    t("bisect", "/baɪˈsekt/", "chia đôi; cắt nhau tại trung điểm"),
    T.parallel,
  ]),
  L("k8-13", [mif("geometry/rectangle.html", "Hình chữ nhật", "Rectangle")], [
    t("rectangle", "/ˈrektæŋɡl/", "hình chữ nhật"),
    t("right angle", "/raɪt ˈæŋɡl/", "góc vuông"),
    T.diagonal,
    t("equal", "/ˈiːkwəl/", "bằng nhau"),
    T.midpoint,
  ]),
  L("k8-14", [mif("geometry/rhombus.html", "Hình thoi", "Rhombus"), mif("geometry/square.html", "Hình vuông", "Square")], [
    t("rhombus", "/ˈrɒmbəs/", "hình thoi"),
    t("square", "/skweə(r)/", "hình vuông"),
    T.perpendicular,
    T.angleBisector,
    T.diagonal,
  ]),
  L("k8-15", [], [
    t("Thales' theorem", "/ˈθeɪliːz ˈθɪərəm/", "định lí Thalès"),
    t("proportional segments", "/prəˈpɔːʃənl ˈseɡmənts/", "các đoạn thẳng tỉ lệ"),
    t("converse", "/ˈkɒnvɜːs/", "định lí đảo"),
    T.parallel,
    T.ratio,
  ]),
  L("k8-16", [], [t("midsegment", "/ˈmɪdseɡmənt/", "đường trung bình"), T.midpoint, t("half", "/hɑːf/", "một nửa"), T.parallel, T.triangle]),
  L("k8-17", [], [T.angleBisector, t("adjacent sides", "/əˈdʒeɪsnt saɪdz/", "hai cạnh kề"), T.ratio, t("line segment", "/laɪn ˈseɡmənt/", "đoạn thẳng"), T.triangle]),
  L("k8-18", [mif("data/data.html", "Dữ liệu là gì?", "What is Data?")], [
    T.data,
    t("collect", "/kəˈlekt/", "thu thập"),
    t("classify", "/ˈklæsɪfaɪ/", "phân loại"),
    t("reasonable", "/ˈriːznəbl/", "hợp lí"),
    t("survey", "/ˈsɜːveɪ/", "cuộc khảo sát"),
  ]),
  L("k8-19", [mif("data/bar-graphs.html", "Biểu đồ cột", "Bar Graphs"), mif("data/pie-charts.html", "Biểu đồ hình quạt tròn", "Pie Charts")], [
    T.table,
    T.barChart,
    T.pieChart,
    T.lineGraph,
    t("represent", "/ˌreprɪˈzent/", "biểu diễn"),
  ]),
  L("k8-20", [mif("data/line-graphs.html", "Biểu đồ đoạn thẳng", "Line Graphs")], [
    t("analyse", "/ˈænəlaɪz/", "phân tích"),
    t("trend", "/trend/", "xu hướng"),
    t("increase", "/ɪnˈkriːs/", "tăng"),
    t("decrease", "/dɪˈkriːs/", "giảm"),
    t("conclusion", "/kənˈkluːʒn/", "kết luận"),
  ]),
  L("k8-21", [mif("algebra/rational-expression.html", "Phân thức đại số", "Rational Expressions")], [
    t("algebraic fraction", "/ˌældʒɪˈbreɪɪk ˈfrækʃn/", "phân thức đại số"),
    T.numerator,
    T.denominator,
    t("condition", "/kənˈdɪʃn/", "điều kiện"),
    t("defined", "/dɪˈfaɪnd/", "xác định"),
  ]),
  L("k8-22", [], [T.simplify, T.commonDenominator, T.factor, t("cancel", "/ˈkænsl/", "giản ước (rút gọn)"), t("equivalent", "/ɪˈkwɪvələnt/", "bằng nhau; tương đương")]),
  L("k8-23", [], [t("algebraic fraction", "/ˌældʒɪˈbreɪɪk ˈfrækʃn/", "phân thức đại số"), T.commonDenominator, T.sum, T.difference, T.simplify]),
  L("k8-24", [], [t("multiply", "/ˈmʌltɪplaɪ/", "nhân"), t("divide", "/dɪˈvaɪd/", "chia"), T.reciprocal, T.product, T.quotient]),
  L(
    "k8-25",
    [mif("algebra/linear-equations.html", "Phương trình bậc nhất", "Linear Equations"), phet("equality-explorer", "Cân bằng phương trình", "Equality Explorer", "Đặt vật lên hai đĩa cân, giữ cân bằng khi biến đổi phương trình.")],
    [t("linear equation", "/ˈlɪniər ɪˈkweɪʒn/", "phương trình bậc nhất"), T.unknown, T.solution, t("solve", "/sɒlv/", "giải"), T.equation]
  ),
  L("k8-26", [], [T.wordProblem, T.setUpEquation, t("speed", "/spiːd/", "vận tốc"), t("distance", "/ˈdɪstəns/", "quãng đường; khoảng cách"), t("time", "/taɪm/", "thời gian")]),
  L(
    "k8-27",
    [
      mif("data/cartesian-coordinates.html", "Toạ độ trên mặt phẳng", "Cartesian Coordinates"),
      phet("function-builder", "Cỗ máy hàm số", "Function Builder", "Ghép các “máy” biến đổi số, đoán quy tắc của hàm."),
    ],
    [
      t("function", "/ˈfʌŋkʃn/", "hàm số"),
      T.graph,
      t("coordinate plane", "/kəʊˈɔːdɪnət pleɪn/", "mặt phẳng toạ độ"),
      t("x-axis", "/ˈeks ˌæksɪs/", "trục hoành"),
      t("y-axis", "/ˈwaɪ ˌæksɪs/", "trục tung"),
      t("coordinates", "/kəʊˈɔːdɪnəts/", "toạ độ"),
    ]
  ),
  L(
    "k8-28",
    [mif("equation_of_line.html", "Phương trình đường thẳng", "Equation of a Straight Line"), phet("graphing-lines", "Vẽ đường thẳng", "Graphing Lines", "Kéo hai điểm, đọc phương trình y = ax + b.")],
    [
      t("linear function", "/ˈlɪniə ˈfʌŋkʃn/", "hàm số bậc nhất"),
      t("straight line", "/streɪt laɪn/", "đường thẳng"),
      t("table of values", "/ˈteɪbl əv ˈvæljuːz/", "bảng giá trị"),
      t("plot", "/plɒt/", "biểu diễn (điểm) trên mặt phẳng toạ độ"),
      T.graph,
    ]
  ),
  L(
    "k8-29",
    [mif("gradient.html", "Độ dốc của đường thẳng", "Gradient (Slope) of a Straight Line"), phet("graphing-slope-intercept", "Hệ số góc", "Graphing Slope-Intercept", "Đổi a, b và quan sát đường thẳng.")],
    [t("slope", "/sləʊp/", "hệ số góc"), t("gradient", "/ˈɡreɪdiənt/", "độ dốc"), t("intersect", "/ˌɪntəˈsekt/", "cắt nhau"), T.parallel, t("coincide", "/ˌkəʊɪnˈsaɪd/", "trùng nhau")]
  ),
  L("k8-30", [], [T.outcome, T.favourableOutcome, T.randomExperiment, T.event, T.equallyLikely]),
  L("k8-31", [mif("data/probability.html", "Xác suất", "Probability")], [T.probability, T.ratio, T.event, T.outcome, t("chance", "/tʃɑːns/", "khả năng")]),
  L("k8-32", [phet("plinko-probability", "Bảng Plinko – xác suất", "Plinko Probability", "Thả 100 rồi 1000 viên bi: xác suất thực nghiệm tiến gần lí thuyết.")], [
    T.experimentalProbability,
    t("trial", "/ˈtraɪəl/", "lần thử"),
    T.frequency,
    t("estimate", "/ˈestɪmeɪt/", "ước lượng"),
    t("repeat", "/rɪˈpiːt/", "lặp lại"),
  ]),
  L("k8-33", [mif("geometry/triangles-similar.html", "Tam giác đồng dạng", "Similar Triangles")], [
    t("similar triangles", "/ˈsɪmələ ˈtraɪæŋɡlz/", "hai tam giác đồng dạng"),
    t("scale factor", "/skeɪl ˈfæktə(r)/", "tỉ số đồng dạng"),
    T.correspondingAngles,
    T.correspondingSides,
    t("proportional", "/prəˈpɔːʃənl/", "tỉ lệ"),
  ]),
  L("k8-34", [], [
    t("similarity case", "/ˌsɪməˈlærəti keɪs/", "trường hợp đồng dạng"),
    t("side-side-side", "/saɪd saɪd saɪd/", "cạnh – cạnh – cạnh (c.c.c)"),
    t("side-angle-side", "/saɪd ˈæŋɡl saɪd/", "cạnh – góc – cạnh (c.g.c)"),
    t("angle-angle", "/ˈæŋɡl ˈæŋɡl/", "góc – góc (g.g)"),
    t("indirect measurement", "/ˌɪndəˈrekt ˈmeʒəmənt/", "đo gián tiếp"),
  ]),
  L("k8-35", [mif("pythagoras.html", "Định lí Pythagore", "Pythagoras' Theorem")], [
    t("Pythagoras' theorem", "/paɪˈθæɡərəsɪz ˈθɪərəm/", "định lí Pythagore"),
    T.hypotenuse,
    T.leg,
    T.rightTriangle,
    T.squareRoot,
  ]),
  L("k8-36", [], [T.rightTriangle, t("acute angle", "/əˈkjuːt ˈæŋɡl/", "góc nhọn"), T.similar, T.hypotenuse, T.leg]),
  L("k8-37", [mif("geometry/similar.html", "Hình đồng dạng", "Similar Figures"), mif("geometry/transformations.html", "Các phép biến hình", "Transformations")], [
    t("similar figures", "/ˈsɪmələ ˈfɪɡəz/", "các hình đồng dạng"),
    t("enlargement", "/ɪnˈlɑːdʒmənt/", "phép vị tự (phóng to)"),
    t("scale", "/skeɪl/", "tỉ lệ"),
    T.similar,
    t("shape", "/ʃeɪp/", "hình dạng"),
  ]),
  L("k8-38", [mif("geometry/pyramids.html", "Hình chóp", "Pyramids")], [
    t("regular triangular pyramid", "/ˈreɡjələ traɪˈæŋɡjələ ˈpɪrəmɪd/", "hình chóp tam giác đều"),
    t("apex", "/ˈeɪpeks/", "đỉnh (hình chóp)"),
    t("lateral face", "/ˈlætərəl feɪs/", "mặt bên"),
    t("slant height", "/slɑːnt haɪt/", "trung đoạn"),
    T.base,
  ]),
  L("k8-39", [], [t("regular square pyramid", "/ˈreɡjələ skweə ˈpɪrəmɪd/", "hình chóp tứ giác đều"), T.volume, T.lateralArea, t("height", "/haɪt/", "chiều cao"), T.base]),

  // ======================================================= LỚP 9 =======================================================
  L(
    "k9-1",
    [
      mif("algebra/systems-linear-equations.html", "Hệ phương trình bậc nhất", "Systems of Linear Equations"),
      phet("equality-explorer-two-variables", "Cân bằng hai ẩn", "Equality Explorer: Two Variables", "Giữ cân bằng với hai ẩn x, y."),
    ],
    [
      t("linear equation in two variables", "/ˈlɪniər ɪˈkweɪʒn ɪn tuː ˈveəriəblz/", "phương trình bậc nhất hai ẩn"),
      t("system of equations", "/ˈsɪstəm əv ɪˈkweɪʒnz/", "hệ phương trình"),
      T.solution,
    ]
  ),
  L("k9-2", [], [
    t("substitution method", "/ˌsʌbstɪˈtjuːʃn ˈmeθəd/", "phương pháp thế"),
    t("elimination method", "/ɪˌlɪmɪˈneɪʃn ˈmeθəd/", "phương pháp cộng đại số"),
    T.solution,
  ]),
  L("k9-3", [], [T.wordProblem, t("system of equations", "/ˈsɪstəm əv ɪˈkweɪʒnz/", "hệ phương trình"), T.unknown]),
  L("k9-4", [], [t("domain condition", "/dəˈmeɪn kənˈdɪʃn/", "điều kiện xác định"), T.factorise, T.equation]),
  L("k9-5", [mif("algebra/inequality.html", "Bất đẳng thức", "Inequality")], [
    t("inequality", "/ˌɪnɪˈkwɒləti/", "bất đẳng thức; bất phương trình"),
    t("greater than or equal to", "/ˈɡreɪtə ðən ɔːr ˈiːkwəl tə/", "lớn hơn hoặc bằng"),
    t("less than or equal to", "/ˈles ðən ɔːr ˈiːkwəl tə/", "nhỏ hơn hoặc bằng"),
  ]),
  L("k9-6", [mif("algebra/inequality-solving.html", "Giải bất phương trình", "Solving Inequalities")], [
    t("linear inequality", "/ˈlɪniər ˌɪnɪˈkwɒləti/", "bất phương trình bậc nhất"),
    t("solution set", "/səˈluːʃn set/", "tập nghiệm"),
    t("reverse the sign", "/rɪˈvɜːs ðə saɪn/", "đổi chiều bất phương trình"),
  ]),
  L("k9-7", [mif("square-root.html", "Căn bậc hai", "Square Roots")], [
    T.squareRoot,
    T.radical,
    t("principal square root", "/ˈprɪnsəpl skweə ruːt/", "căn bậc hai số học"),
  ]),
  L("k9-8", [], [
    t("square root of a product", "/skweə ruːt əv ə ˈprɒdʌkt/", "căn bậc hai của một tích"),
    t("square root of a quotient", "/skweə ruːt əv ə ˈkwəʊʃnt/", "căn bậc hai của một thương"),
    T.radical,
  ]),
  L("k9-9", [], [
    T.simplify,
    t("rationalise the denominator", "/ˈræʃnəlaɪz ðə dɪˈnɒmɪneɪtə(r)/", "trục căn thức ở mẫu"),
    t("bring a factor outside the root", "/brɪŋ ə ˈfæktər ˌaʊtˈsaɪd ðə ruːt/", "đưa thừa số ra ngoài dấu căn"),
  ]),
  L("k9-10", [mif("numbers/cube-root.html", "Căn bậc ba", "Cube Root")], [t("cube root", "/kjuːb ruːt/", "căn bậc ba"), t("cube", "/kjuːb/", "hình lập phương; lập phương"), T.radical]),
  L(
    "k9-11",
    [mif("algebra/sohcahtoa.html", "Sin, Cos, Tan – SOH CAH TOA", "SOH CAH TOA"), phet("trig-tour", "Hành trình lượng giác", "Trig Tour", "Kéo góc trên đường tròn đơn vị, đọc sin, cos, tan.")],
    [
      t("trigonometric ratio", "/ˌtrɪɡənəˈmetrɪk ˈreɪʃiəʊ/", "tỉ số lượng giác"),
      t("sine", "/saɪn/", "sin"),
      t("cosine", "/ˈkəʊsaɪn/", "côsin"),
      t("tangent", "/ˈtændʒənt/", "tang; tiếp tuyến"),
      t("cotangent", "/kəʊˈtændʒənt/", "côtang"),
    ]
  ),
  L("k9-12", [], [
    t("angle of elevation", "/ˈæŋɡl əv ˌelɪˈveɪʃn/", "góc nâng"),
    t("solve a right triangle", "/sɒlv ə raɪt ˈtraɪæŋɡl/", "giải tam giác vuông"),
    t("adjacent side", "/əˈdʒeɪsnt saɪd/", "cạnh kề"),
    t("opposite side", "/ˈɒpəzɪt saɪd/", "cạnh đối diện"),
  ]),
  L("k9-13", [mif("geometry/circle.html", "Đường tròn", "Circle")], [
    T.circle,
    t("centre", "/ˈsentə(r)/", "tâm"),
    T.radius,
    t("diameter", "/daɪˈæmɪtə(r)/", "đường kính"),
  ]),
  L("k9-14", [mif("geometry/arc.html", "Cung tròn", "Arc")], [t("arc", "/ɑːk/", "cung"), t("chord", "/kɔːd/", "dây (cung)"), t("central angle", "/ˈsentrəl ˈæŋɡl/", "góc ở tâm")]),
  L("k9-15", [mif("geometry/circle-sector-segment.html", "Hình quạt tròn", "Circle Sector and Segment"), mif("geometry/annulus.html", "Hình vành khuyên", "Annulus")], [
    t("arc length", "/ɑːk leŋθ/", "độ dài cung"),
    t("sector", "/ˈsektə(r)/", "hình quạt tròn"),
    t("annulus", "/ˈænjələs/", "hình vành khuyên"),
    t("pi", "/paɪ/", "số pi (π)"),
  ]),
  L("k9-16", [mif("geometry/tangent-secant-lines.html", "Tiếp tuyến và cát tuyến", "Tangent and Secant Lines")], [
    t("tangent", "/ˈtændʒənt/", "tang; tiếp tuyến"),
    t("secant", "/ˈsiːkənt/", "cát tuyến"),
    t("point of tangency", "/pɔɪnt əv ˈtændʒənsi/", "tiếp điểm"),
  ]),
  L("k9-17", [], [
    t("intersecting circles", "/ˌɪntəˈsektɪŋ ˈsɜːklz/", "hai đường tròn cắt nhau"),
    t("tangent circles", "/ˈtændʒənt ˈsɜːklz/", "hai đường tròn tiếp xúc"),
    t("line of centres", "/laɪn əv ˈsentəz/", "đường nối tâm"),
  ]),
  L(
    "k9-18",
    [mif("algebra/quadratic-equation-graph.html", "Đồ thị hàm bậc hai", "Graphing Quadratic Equations"), phet("graphing-quadratics", "Vẽ parabol", "Graphing Quadratics", "Đổi hệ số a, quan sát parabol mở lên / xuống.")],
    [
      t("quadratic function", "/kwɒˈdrætɪk ˈfʌŋkʃn/", "hàm số bậc hai"),
      t("parabola", "/pəˈræbələ/", "parabol"),
      T.vertex,
      t("axis of symmetry", "/ˈæksɪs əv ˈsɪmətri/", "trục đối xứng"),
    ]
  ),
  L("k9-19", [mif("algebra/quadratic-equation.html", "Phương trình bậc hai", "Quadratic Equations")], [
    t("quadratic equation", "/kwɒˈdrætɪk ɪˈkweɪʒn/", "phương trình bậc hai"),
    t("discriminant", "/dɪˈskrɪmɪnənt/", "biệt thức (Δ)"),
    t("root", "/ruːt/", "nghiệm"),
    t("quadratic formula", "/kwɒˈdrætɪk ˈfɔːmjələ/", "công thức nghiệm"),
  ]),
  L("k9-20", [mif("algebra/polynomials-sums-products-roots.html", "Tổng và tích các nghiệm", "Sums and Products of Roots")], [
    t("Vieta's theorem", "/viˈeɪtəz ˈθɪərəm/", "định lí Viète"),
    t("sum of the roots", "/sʌm əv ðə ruːts/", "tổng các nghiệm"),
    t("product of the roots", "/ˈprɒdʌkt əv ðə ruːts/", "tích các nghiệm"),
  ]),
  L("k9-21", [], [T.wordProblem, T.setUpEquation, t("quadratic equation", "/kwɒˈdrætɪk ɪˈkweɪʒn/", "phương trình bậc hai")]),
  L("k9-22", [mif("data/frequency-distribution.html", "Bảng tần số", "Frequency Distribution")], [T.frequency, t("frequency table", "/ˈfriːkwənsi ˈteɪbl/", "bảng tần số"), T.barChart]),
  L("k9-23", [mif("data/relative-frequency.html", "Tần số tương đối", "Relative Frequency")], [t("relative frequency", "/ˈrelətɪv ˈfriːkwənsi/", "tần số tương đối"), T.percentage, T.pieChart]),
  L("k9-24", [mif("data/frequency-grouped-mean-median-mode.html", "Dữ liệu ghép nhóm", "Grouped Frequency")], [
    t("grouped data", "/ɡruːpt ˈdeɪtə/", "dữ liệu ghép nhóm"),
    t("class interval", "/klɑːs ˈɪntəvl/", "nhóm số liệu (khoảng)"),
    t("histogram", "/ˈhɪstəɡræm/", "biểu đồ tần số ghép nhóm (histogram)"),
  ]),
  L("k9-25", [], [T.randomExperiment, t("sample space", "/ˈsɑːmpl speɪs/", "không gian mẫu"), T.outcome]),
  L("k9-26", [mif("data/probability.html", "Xác suất", "Probability")], [T.probability, T.favourableOutcome, T.equallyLikely]),
  L("k9-27", [mif("geometry/circle-theorems.html", "Các định lí về đường tròn", "Circle Theorems")], [
    t("inscribed angle", "/ɪnˈskraɪbd ˈæŋɡl/", "góc nội tiếp"),
    t("intercepted arc", "/ˌɪntəˈseptɪd ɑːk/", "cung bị chắn"),
    t("semicircle", "/ˈsemisɜːkl/", "nửa đường tròn"),
  ]),
  L("k9-28", [mif("geometry/triangle-centers.html", "Các điểm đặc biệt của tam giác", "Triangle Centers")], [
    t("circumscribed circle", "/ˈsɜːkəmskraɪbd ˈsɜːkl/", "đường tròn ngoại tiếp"),
    t("inscribed circle", "/ɪnˈskraɪbd ˈsɜːkl/", "đường tròn nội tiếp"),
    t("circumcentre", "/ˈsɜːkəmsentə(r)/", "tâm đường tròn ngoại tiếp"),
    t("incentre", "/ˈɪnsentə(r)/", "tâm đường tròn nội tiếp"),
  ]),
  L("k9-29", [mif("geometry/circle-theorems.html", "Các định lí về đường tròn", "Circle Theorems")], [
    t("cyclic quadrilateral", "/ˈsaɪklɪk ˌkwɒdrɪˈlætərəl/", "tứ giác nội tiếp"),
    T.oppositeAngles,
    t("supplementary", "/ˌsʌplɪˈmentri/", "bù nhau"),
  ]),
  L("k9-30", [mif("geometry/regular-polygons.html", "Đa giác đều", "Regular Polygons")], [T.regularPolygon, t("rotation", "/rəʊˈteɪʃn/", "phép quay"), t("centre", "/ˈsentə(r)/", "tâm")]),
  L("k9-31", [mif("geometry/cylinder.html", "Hình trụ", "Cylinder"), mif("geometry/cone.html", "Hình nón", "Cone")], [
    t("cylinder", "/ˈsɪlɪndə(r)/", "hình trụ"),
    t("cone", "/kəʊn/", "hình nón"),
    T.lateralArea,
    T.volume,
  ]),
  L("k9-32", [mif("geometry/sphere.html", "Hình cầu", "Sphere")], [
    t("sphere", "/sfɪə(r)/", "hình cầu"),
    T.radius,
    t("surface area", "/ˈsɜːfɪs ˈeəriə/", "diện tích mặt cầu (diện tích bề mặt)"),
    T.volume,
  ]),
];

export const khoResourceId = (curLessonId: string, i: number) => `kho-${curLessonId}-${String(i + 1).padStart(2, "0")}`;
/** Học liệu dùng chung: nạp cho từng khối (mỗi khối một bản để lọc theo khối) */
export const khoCommonId = (grade: number, i: number) => `kho-k${grade}-chung-${String(i + 1).padStart(2, "0")}`;
