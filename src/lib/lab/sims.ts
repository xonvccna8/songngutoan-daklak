// Hình học động & mô phỏng Toán dựng sẵn: mô phỏng PhET (ĐH Colorado, miễn phí, CC-BY) + ứng dụng GeoGebra cho Toán 6–9.
// Mỗi mô phỏng có nhiệm vụ song ngữ + từ vựng để HS vừa khám phá vừa luyện tiếng Anh.
// Chạy trong iframe; PhET và GeoGebra đổi được giao diện Anh / Việt (simLaunchUrl). Hàm thuần, có test trong tests/features.test.ts
import type { Bi } from "@/lib/live/types";
import { fold } from "@/lib/curriculum";
import { phetSlug } from "@/lib/library/resources";

/** Mạch nội dung môn Toán (CT 2018) */
export type LabTopic = "sd" | "hh" | "tk";

export const LAB_TOPICS: Record<LabTopic, { vi: string; en: string; color: string; soft: string }> = {
  sd: { vi: "Số và Đại số", en: "Numbers and Algebra", color: "#16A34A", soft: "#DCFCE7" },
  hh: { vi: "Hình học và Đo lường", en: "Geometry and Measurement", color: "#0891B2", soft: "#D7F3F8" },
  tk: { vi: "Thống kê và Xác suất", en: "Statistics and Probability", color: "#E8492E", soft: "#FFE6E0" },
};

export interface LabSim {
  /** Mã PhET (vd "graphing-lines") — hoặc mã riêng khi dùng `url` (GeoGebra) */
  slug: string;
  /** Không phải PhET: link chạy trực tiếp */
  url?: string;
  source?: "phet" | "geogebra";
  title: Bi;
  grades: number[];
  topic: LabTopic;
  about: Bi;
  tasks: Bi[];
  vocab: { en: string; vi: string }[];
}

export const LAB_SIMS: LabSim[] = [
  // ---------- Số và Đại số ----------
  {
    slug: "arithmetic",
    title: { en: "Arithmetic", vi: "Luyện bốn phép tính" },
    grades: [6],
    topic: "sd",
    about: { en: "Practise multiplication, factors and division as a game.", vi: "Luyện phép nhân, tìm thừa số và phép chia qua trò chơi." },
    tasks: [
      { en: "Play level 1 of “Multiply”. Say each answer in English: “Six times seven is forty-two.”", vi: "Chơi cấp 1 phần “Multiply”. Nói đáp án bằng tiếng Anh: “Six times seven is forty-two.”" },
      { en: "Open “Factor”. Find two numbers whose product is 36.", vi: "Mở phần “Factor”. Tìm hai số có tích bằng 36." },
      { en: "Open “Divide”. How do you say 48 : 6 = 8 in English?", vi: "Mở phần “Divide”. Đọc 48 : 6 = 8 bằng tiếng Anh thế nào?" },
    ],
    vocab: [
      { en: "multiply", vi: "nhân" },
      { en: "divide", vi: "chia" },
      { en: "product", vi: "tích" },
      { en: "factor", vi: "thừa số; ước" },
    ],
  },
  {
    slug: "number-line-integers",
    title: { en: "Number Line: Integers", vi: "Số nguyên trên trục số" },
    grades: [6],
    topic: "sd",
    about: { en: "Place positive and negative numbers on a number line.", vi: "Biểu diễn số nguyên dương, số nguyên âm trên trục số." },
    tasks: [
      { en: "Put −3 and 5 on the number line. Which one is greater?", vi: "Đặt −3 và 5 lên trục số. Số nào lớn hơn?" },
      { en: "Open the temperature scene. Is −5 °C colder or warmer than −2 °C?", vi: "Mở cảnh nhiệt độ. −5 °C lạnh hơn hay ấm hơn −2 °C?" },
      { en: "Complete: “The opposite of 4 is ___.”", vi: "Hoàn thành: “Số đối của 4 là ___.”" },
    ],
    vocab: [
      { en: "integer", vi: "số nguyên" },
      { en: "negative number", vi: "số âm" },
      { en: "opposite number", vi: "số đối" },
      { en: "number line", vi: "trục số" },
    ],
  },
  {
    slug: "number-line-operations",
    title: { en: "Number Line: Operations", vi: "Cộng, trừ trên trục số" },
    grades: [6, 7],
    topic: "sd",
    about: { en: "Add and subtract integers by jumping along a number line.", vi: "Cộng, trừ số nguyên bằng các bước nhảy trên trục số." },
    tasks: [
      { en: "Start at 2, then add −5. Where do you land?", vi: "Bắt đầu ở 2, cộng thêm −5. Em dừng ở đâu?" },
      { en: "Show that 3 − (−4) gives the same result as 3 + 4.", vi: "Chỉ ra 3 − (−4) cho cùng kết quả với 3 + 4." },
      { en: "Say in English: “Minus two plus seven equals five.”", vi: "Nói bằng tiếng Anh: “Minus two plus seven equals five.”" },
    ],
    vocab: [
      { en: "add", vi: "cộng" },
      { en: "subtract", vi: "trừ" },
      { en: "plus", vi: "cộng (dấu +)" },
      { en: "minus", vi: "trừ (dấu −)" },
    ],
  },
  {
    slug: "fractions-intro",
    title: { en: "Fractions Intro", vi: "Làm quen phân số" },
    grades: [6],
    topic: "sd",
    about: { en: "Build fractions with circles, bars and cakes.", vi: "Tạo phân số bằng hình tròn, thanh, bánh." },
    tasks: [
      { en: "Make 3/4 with circles. How many parts are shaded?", vi: "Tạo phân số 3/4 bằng hình tròn. Có bao nhiêu phần được tô?" },
      { en: "Compare 2/3 and 3/5 with bars. Which is bigger?", vi: "So sánh 2/3 và 3/5 bằng thanh. Phân số nào lớn hơn?" },
      { en: "Say: “The numerator is three and the denominator is four.”", vi: "Nói: “The numerator is three and the denominator is four.”" },
    ],
    vocab: [
      { en: "fraction", vi: "phân số" },
      { en: "numerator", vi: "tử số" },
      { en: "denominator", vi: "mẫu số" },
    ],
  },
  {
    slug: "fractions-equality",
    title: { en: "Fractions: Equality", vi: "Phân số bằng nhau" },
    grades: [6],
    topic: "sd",
    about: { en: "Find fractions that are equal to each other.", vi: "Tìm các phân số bằng nhau." },
    tasks: [
      { en: "Find two fractions equal to 1/2.", vi: "Tìm hai phân số bằng 1/2." },
      { en: "Use the multiply tool: what happens when you multiply the numerator and denominator by 3?", vi: "Dùng công cụ nhân: điều gì xảy ra khi nhân cả tử và mẫu với 3?" },
      { en: "Complete: “2/3 and 4/6 are ___ fractions.”", vi: "Hoàn thành: “2/3 and 4/6 are ___ fractions.”" },
    ],
    vocab: [
      { en: "equivalent fractions", vi: "phân số bằng nhau" },
      { en: "simplify", vi: "rút gọn" },
    ],
  },
  {
    slug: "build-a-fraction",
    title: { en: "Build a Fraction", vi: "Dựng phân số" },
    grades: [6],
    topic: "sd",
    about: { en: "Build fractions from shapes and numbers to match a target.", vi: "Dựng phân số từ hình và số cho khớp với yêu cầu." },
    tasks: [
      { en: "Play level 1 with shapes. Match each target fraction.", vi: "Chơi cấp 1 với hình. Ghép đúng các phân số yêu cầu." },
      { en: "Play with numbers. Find two ways to make 1/2.", vi: "Chơi với số. Tìm hai cách tạo ra 1/2." },
    ],
    vocab: [
      { en: "fraction", vi: "phân số" },
      { en: "whole", vi: "cái toàn thể" },
    ],
  },
  {
    slug: "area-model-decimals",
    title: { en: "Area Model: Decimals", vi: "Mô hình diện tích với số thập phân" },
    grades: [6],
    topic: "sd",
    about: { en: "Multiply decimals using the area of a rectangle.", vi: "Nhân số thập phân bằng diện tích hình chữ nhật." },
    tasks: [
      { en: "Find 1.2 × 2.5 using the rectangle.", vi: "Tính 1,2 × 2,5 bằng hình chữ nhật." },
      { en: "Why is 0.5 × 0.4 smaller than 0.5?", vi: "Vì sao 0,5 × 0,4 nhỏ hơn 0,5?" },
      { en: "Read aloud: “one point two times two point five”.", vi: "Đọc to: “one point two times two point five”." },
    ],
    vocab: [
      { en: "decimal", vi: "số thập phân" },
      { en: "decimal point", vi: "dấu phẩy thập phân" },
      { en: "area model", vi: "mô hình diện tích" },
    ],
  },
  {
    slug: "ratio-and-proportion",
    title: { en: "Ratio and Proportion", vi: "Tỉ số và tỉ lệ" },
    grades: [6, 7],
    topic: "sd",
    about: { en: "Move two hands to keep a ratio the same.", vi: "Di chuyển hai bàn tay để giữ đúng một tỉ số." },
    tasks: [
      { en: "Set the target ratio 1 : 2. Move the hands until the screen turns green.", vi: "Đặt tỉ số 1 : 2. Di chuyển hai tay đến khi màn hình chuyển xanh." },
      { en: "Find three more positions with the same ratio.", vi: "Tìm thêm ba vị trí có cùng tỉ số." },
      { en: "Say: “The ratio is one to two.”", vi: "Nói: “The ratio is one to two.”" },
    ],
    vocab: [
      { en: "ratio", vi: "tỉ số" },
      { en: "proportion", vi: "tỉ lệ thức" },
    ],
  },
  {
    slug: "proportion-playground",
    title: { en: "Proportion Playground", vi: "Sân chơi tỉ lệ" },
    grades: [7],
    topic: "sd",
    about: { en: "Mix paint, make necklaces and buy apples in proportion.", vi: "Pha sơn, xâu vòng, mua táo theo tỉ lệ." },
    tasks: [
      { en: "Mix 2 blue and 3 yellow. Make the same colour with a bigger amount.", vi: "Pha 2 phần xanh và 3 phần vàng. Pha cùng màu với lượng nhiều hơn." },
      { en: "In the Apples scene, how much do 6 apples cost?", vi: "Ở cảnh Táo, 6 quả táo giá bao nhiêu?" },
    ],
    vocab: [
      { en: "proportion", vi: "tỉ lệ thức" },
      { en: "in proportion", vi: "theo tỉ lệ" },
    ],
  },
  {
    slug: "unit-rates",
    title: { en: "Unit Rates", vi: "Đơn giá" },
    grades: [7],
    topic: "sd",
    about: { en: "Buy fruit and see a table of direct proportion.", vi: "Mua hoa quả và quan sát bảng đại lượng tỉ lệ thuận." },
    tasks: [
      { en: "Buy 1, 2 and 5 kg of apples. Is the cost directly proportional to the mass?", vi: "Mua 1, 2 và 5 kg táo. Số tiền có tỉ lệ thuận với khối lượng không?" },
      { en: "Find the unit rate (the price of 1 kg).", vi: "Tìm đơn giá (giá của 1 kg)." },
      { en: "Say: “The cost is directly proportional to the mass.”", vi: "Nói: “The cost is directly proportional to the mass.”" },
    ],
    vocab: [
      { en: "unit rate", vi: "đơn giá" },
      { en: "direct proportion", vi: "đại lượng tỉ lệ thuận" },
    ],
  },
  {
    slug: "expression-exchange",
    title: { en: "Expression Exchange", vi: "Thu gọn biểu thức" },
    grades: [7, 8],
    topic: "sd",
    about: { en: "Collect like terms using coins and variables.", vi: "Gom các hạng tử đồng dạng bằng đồng xu và biến." },
    tasks: [
      { en: "Build 2x + 3y + x. Simplify it by collecting like terms.", vi: "Tạo biểu thức 2x + 3y + x rồi thu gọn bằng cách gom hạng tử đồng dạng." },
      { en: "Can you add x and x²? Why or why not?", vi: "Có cộng được x với x² không? Vì sao?" },
    ],
    vocab: [
      { en: "like terms", vi: "các hạng tử đồng dạng" },
      { en: "expression", vi: "biểu thức" },
      { en: "simplify", vi: "rút gọn" },
    ],
  },
  {
    slug: "area-model-algebra",
    title: { en: "Area Model Algebra", vi: "Mô hình diện tích – Đại số" },
    grades: [7, 8],
    topic: "sd",
    about: { en: "Multiply polynomials with a rectangle split into parts.", vi: "Nhân đa thức bằng hình chữ nhật chia ô." },
    tasks: [
      { en: "Show (x + 2)(x + 3) as a rectangle. What is the area?", vi: "Biểu diễn (x + 2)(x + 3) bằng hình chữ nhật. Diện tích là bao nhiêu?" },
      { en: "Use the model to check (x + 1)² = x² + 2x + 1.", vi: "Dùng mô hình kiểm tra (x + 1)² = x² + 2x + 1." },
    ],
    vocab: [
      { en: "expand", vi: "khai triển" },
      { en: "polynomial", vi: "đa thức" },
      { en: "area model", vi: "mô hình diện tích" },
    ],
  },
  {
    slug: "equality-explorer",
    title: { en: "Equality Explorer", vi: "Cân bằng phương trình" },
    grades: [8],
    topic: "sd",
    about: { en: "Solve equations by keeping a balance scale level.", vi: "Giải phương trình bằng cách giữ cân thăng bằng." },
    tasks: [
      { en: "Solve 3x + 2 = 11 on the scale. What do you take away from both sides?", vi: "Giải 3x + 2 = 11 trên cân. Em bỏ đi gì ở cả hai đĩa?" },
      { en: "Why must we do the same thing to both sides?", vi: "Vì sao phải làm giống nhau ở cả hai vế?" },
      { en: "Say: “The solution is x equals three.”", vi: "Nói: “The solution is x equals three.”" },
    ],
    vocab: [
      { en: "equation", vi: "phương trình" },
      { en: "both sides", vi: "hai vế" },
      { en: "solution", vi: "nghiệm" },
    ],
  },
  {
    slug: "function-builder",
    title: { en: "Function Builder", vi: "Cỗ máy hàm số" },
    grades: [8],
    topic: "sd",
    about: { en: "Put numbers into function machines and guess the rule.", vi: "Đưa số vào “cỗ máy hàm số” và đoán quy tắc." },
    tasks: [
      { en: "Build the machine “× 2 then + 1”. What comes out for 3?", vi: "Ghép máy “× 2 rồi + 1”. Đưa 3 vào thì ra bao nhiêu?" },
      { en: "Open the graph. Write the rule as y = ax + b.", vi: "Mở đồ thị. Viết quy tắc dưới dạng y = ax + b." },
    ],
    vocab: [
      { en: "function", vi: "hàm số" },
      { en: "input", vi: "giá trị đầu vào" },
      { en: "output", vi: "giá trị đầu ra" },
    ],
  },
  {
    slug: "graphing-lines",
    title: { en: "Graphing Lines", vi: "Vẽ đường thẳng" },
    grades: [8],
    topic: "sd",
    about: { en: "Draw straight lines and read their equations.", vi: "Vẽ đường thẳng và đọc phương trình của nó." },
    tasks: [
      { en: "Drag two points to make the line y = 2x + 1.", vi: "Kéo hai điểm để tạo đường thẳng y = 2x + 1." },
      { en: "Make a line parallel to it. What is the same?", vi: "Tạo một đường thẳng song song với nó. Điều gì giống nhau?" },
    ],
    vocab: [
      { en: "slope", vi: "hệ số góc" },
      { en: "straight line", vi: "đường thẳng" },
      { en: "parallel", vi: "song song" },
    ],
  },
  {
    slug: "graphing-slope-intercept",
    title: { en: "Graphing Slope-Intercept", vi: "Hệ số góc và tung độ gốc" },
    grades: [8],
    topic: "sd",
    about: { en: "Change a and b in y = ax + b and watch the line move.", vi: "Thay đổi a, b trong y = ax + b và quan sát đường thẳng." },
    tasks: [
      { en: "Keep b = 1 and change a. What happens to the line?", vi: "Giữ b = 1 và thay đổi a. Đường thẳng thay đổi thế nào?" },
      { en: "Keep a = 2 and change b. Are the lines parallel?", vi: "Giữ a = 2 và thay đổi b. Các đường thẳng có song song không?" },
      { en: "Complete: “When a is negative, the line goes ___.”", vi: "Hoàn thành: “When a is negative, the line goes ___.” (đi xuống: down)" },
    ],
    vocab: [
      { en: "slope", vi: "hệ số góc" },
      { en: "y-intercept", vi: "tung độ gốc" },
      { en: "linear function", vi: "hàm số bậc nhất" },
    ],
  },
  {
    slug: "equality-explorer-two-variables",
    title: { en: "Equality Explorer: Two Variables", vi: "Cân bằng với hai ẩn" },
    grades: [9],
    topic: "sd",
    about: { en: "Explore equations with two unknowns on a balance scale.", vi: "Khám phá phương trình hai ẩn trên chiếc cân." },
    tasks: [
      { en: "Make x + y = 7 balance. Find three pairs (x; y).", vi: "Làm cho x + y = 7 cân bằng. Tìm ba cặp (x; y)." },
      { en: "Add a second rule x − y = 1. Which pair works for both?", vi: "Thêm điều kiện x − y = 1. Cặp nào thoả mãn cả hai?" },
    ],
    vocab: [
      { en: "system of equations", vi: "hệ phương trình" },
      { en: "unknown", vi: "ẩn" },
    ],
  },
  {
    slug: "graphing-quadratics",
    title: { en: "Graphing Quadratics", vi: "Đồ thị hàm số bậc hai" },
    grades: [9],
    topic: "sd",
    about: { en: "See how a changes the parabola y = ax².", vi: "Quan sát hệ số a làm thay đổi parabol y = ax² thế nào." },
    tasks: [
      { en: "Set y = x², then y = 2x² and y = −x². Describe each parabola.", vi: "Vẽ y = x², y = 2x² và y = −x². Mô tả từng parabol." },
      { en: "Where is the vertex? Where is the axis of symmetry?", vi: "Đỉnh nằm ở đâu? Trục đối xứng là đường nào?" },
      { en: "Say: “When a is positive, the parabola opens upwards.”", vi: "Nói: “When a is positive, the parabola opens upwards.”" },
    ],
    vocab: [
      { en: "parabola", vi: "parabol" },
      { en: "vertex", vi: "đỉnh" },
      { en: "axis of symmetry", vi: "trục đối xứng" },
    ],
  },
  {
    slug: "geogebra-graphing",
    url: "https://www.geogebra.org/graphing",
    source: "geogebra",
    title: { en: "GeoGebra Graphing", vi: "GeoGebra – vẽ đồ thị" },
    grades: [7, 8, 9],
    topic: "sd",
    about: { en: "Type any function and see its graph at once.", vi: "Gõ hàm số bất kì, đồ thị hiện ngay." },
    tasks: [
      { en: "Type y = 2x + 1 and y = −x + 4. Find where they intersect.", vi: "Gõ y = 2x + 1 và y = −x + 4. Tìm giao điểm của hai đường thẳng." },
      { en: "Type y = a x + 1 and move the slider a. What changes?", vi: "Gõ y = a x + 1 rồi kéo thanh trượt a. Điều gì thay đổi?" },
      { en: "Grade 9: type y = x^2 − 5x + 6. Where does it cut the x-axis?", vi: "Lớp 9: gõ y = x^2 − 5x + 6. Đồ thị cắt trục hoành ở đâu?" },
    ],
    vocab: [
      { en: "graph", vi: "đồ thị" },
      { en: "intersection point", vi: "giao điểm" },
      { en: "slider", vi: "thanh trượt" },
    ],
  },

  // ---------- Hình học và Đo lường ----------
  {
    slug: "area-builder",
    title: { en: "Area Builder", vi: "Xếp hình tính diện tích" },
    grades: [6],
    topic: "hh",
    about: { en: "Build shapes from unit squares and find area and perimeter.", vi: "Xếp hình từ ô vuông đơn vị, tìm diện tích và chu vi." },
    tasks: [
      { en: "Build a rectangle with an area of 12 squares. What is its perimeter?", vi: "Xếp hình chữ nhật có diện tích 12 ô. Chu vi là bao nhiêu?" },
      { en: "Build two shapes with the same area but different perimeters.", vi: "Xếp hai hình có cùng diện tích nhưng chu vi khác nhau." },
    ],
    vocab: [
      { en: "area", vi: "diện tích" },
      { en: "perimeter", vi: "chu vi" },
      { en: "square unit", vi: "đơn vị diện tích (ô vuông)" },
    ],
  },
  {
    slug: "quadrilateral",
    title: { en: "Quadrilateral", vi: "Khám phá tứ giác" },
    grades: [8],
    topic: "hh",
    about: { en: "Drag the corners and discover the properties of quadrilaterals.", vi: "Kéo các đỉnh và khám phá tính chất của tứ giác." },
    tasks: [
      { en: "Make a parallelogram. What do you notice about the opposite sides?", vi: "Tạo hình bình hành. Em nhận xét gì về các cạnh đối?" },
      { en: "Make a rhombus, then a square. What changes?", vi: "Tạo hình thoi rồi hình vuông. Điều gì thay đổi?" },
      { en: "Turn on the angle tool. Do the angles always add up to 360°?", vi: "Bật công cụ đo góc. Tổng các góc có luôn bằng 360° không?" },
    ],
    vocab: [
      { en: "quadrilateral", vi: "tứ giác" },
      { en: "parallelogram", vi: "hình bình hành" },
      { en: "rhombus", vi: "hình thoi" },
      { en: "opposite sides", vi: "các cạnh đối" },
    ],
  },
  {
    slug: "trig-tour",
    title: { en: "Trig Tour", vi: "Hành trình lượng giác" },
    grades: [9],
    topic: "hh",
    about: { en: "Move a point on a circle and read sin, cos and tan.", vi: "Di chuyển một điểm trên đường tròn và đọc sin, cos, tan." },
    tasks: [
      { en: "Set the angle to 30°. Read sin 30° and cos 30°.", vi: "Đặt góc 30°. Đọc sin 30° và cos 30°." },
      { en: "Compare sin 30° with cos 60°. What do you notice?", vi: "So sánh sin 30° với cos 60°. Em nhận thấy gì?" },
      { en: "Say: “Sine is opposite over hypotenuse.”", vi: "Nói: “Sine is opposite over hypotenuse.”" },
    ],
    vocab: [
      { en: "sine", vi: "sin" },
      { en: "cosine", vi: "côsin" },
      { en: "tangent", vi: "tang" },
    ],
  },
  {
    slug: "geogebra-geometry",
    url: "https://www.geogebra.org/geometry",
    source: "geogebra",
    title: { en: "GeoGebra Geometry", vi: "GeoGebra – hình học động" },
    grades: [6, 7, 8, 9],
    topic: "hh",
    about: { en: "Draw points, lines, circles and measure angles; drag to check properties.", vi: "Vẽ điểm, đường thẳng, đường tròn, đo góc; kéo hình để kiểm tra tính chất." },
    tasks: [
      { en: "Draw a triangle and measure its three angles. Drag a vertex: is the sum always 180°?", vi: "Vẽ tam giác, đo ba góc. Kéo một đỉnh: tổng ba góc có luôn bằng 180° không?" },
      { en: "Grade 8: draw a right triangle and check Pythagoras' theorem with the length tool.", vi: "Lớp 8: vẽ tam giác vuông, dùng công cụ đo độ dài để kiểm tra định lí Pythagore." },
      { en: "Grade 9: draw a circle and an inscribed angle. Compare it with the central angle.", vi: "Lớp 9: vẽ đường tròn và một góc nội tiếp. So sánh với góc ở tâm." },
    ],
    vocab: [
      { en: "triangle", vi: "tam giác" },
      { en: "angle", vi: "góc" },
      { en: "circle", vi: "đường tròn" },
      { en: "drag", vi: "kéo (bằng chuột/ngón tay)" },
    ],
  },
  {
    slug: "geogebra-3d",
    url: "https://www.geogebra.org/3d",
    source: "geogebra",
    title: { en: "GeoGebra 3D", vi: "GeoGebra – hình khối 3D" },
    grades: [7, 8, 9],
    topic: "hh",
    about: { en: "Build and rotate cubes, prisms, pyramids, cylinders and spheres.", vi: "Dựng và xoay hình lập phương, lăng trụ, hình chóp, hình trụ, hình cầu." },
    tasks: [
      { en: "Grade 7: build a cube and a prism. Count faces, edges and vertices.", vi: "Lớp 7: dựng hình lập phương và hình lăng trụ. Đếm số mặt, cạnh, đỉnh." },
      { en: "Grade 8: build a square pyramid. Show its apex and lateral faces.", vi: "Lớp 8: dựng hình chóp tứ giác đều. Chỉ ra đỉnh và các mặt bên." },
      { en: "Grade 9: build a cylinder and a cone with the same base and height. Compare their volumes.", vi: "Lớp 9: dựng hình trụ và hình nón cùng đáy, cùng chiều cao. So sánh thể tích." },
    ],
    vocab: [
      { en: "face", vi: "mặt" },
      { en: "edge", vi: "cạnh" },
      { en: "vertex", vi: "đỉnh" },
      { en: "volume", vi: "thể tích" },
    ],
  },

  // ---------- Thống kê và Xác suất ----------
  {
    slug: "plinko-probability",
    title: { en: "Plinko Probability", vi: "Bảng Plinko – xác suất" },
    grades: [6, 8],
    topic: "tk",
    about: { en: "Drop balls through pegs and compare results with predictions.", vi: "Thả bi qua các chốt và so sánh kết quả với dự đoán." },
    tasks: [
      { en: "Drop 10 balls, then 100, then 1000. How does the histogram change?", vi: "Thả 10 viên, rồi 100, rồi 1000 viên. Biểu đồ thay đổi thế nào?" },
      { en: "Which bin gets the most balls? Why?", vi: "Ô nào nhận nhiều bi nhất? Vì sao?" },
      { en: "Say: “The experimental probability gets closer to the theoretical probability.”", vi: "Nói: “The experimental probability gets closer to the theoretical probability.”" },
    ],
    vocab: [
      { en: "experimental probability", vi: "xác suất thực nghiệm" },
      { en: "trial", vi: "lần thử" },
      { en: "predict", vi: "dự đoán" },
    ],
  },
  {
    slug: "center-and-variability",
    title: { en: "Center and Variability", vi: "Số trung bình và độ phân tán" },
    grades: [7, 9],
    topic: "tk",
    about: { en: "Kick balls, record distances and find the mean and median.", vi: "Sút bóng, ghi khoảng cách, tìm số trung bình và trung vị." },
    tasks: [
      { en: "Kick 10 balls. Find the mean and the median of the distances.", vi: "Sút 10 quả. Tìm số trung bình và trung vị của các khoảng cách." },
      { en: "Change the player. Is the data more spread out?", vi: "Đổi cầu thủ. Dữ liệu có phân tán hơn không?" },
    ],
    vocab: [
      { en: "mean", vi: "số trung bình" },
      { en: "median", vi: "trung vị" },
      { en: "data", vi: "dữ liệu" },
    ],
  },
  {
    slug: "mean-share-and-balance",
    title: { en: "Mean: Share and Balance", vi: "Số trung bình: chia đều" },
    grades: [6, 7],
    topic: "tk",
    about: { en: "Share chocolate fairly to understand the mean.", vi: "Chia đều sô-cô-la để hiểu số trung bình." },
    tasks: [
      { en: "Give 4 friends different amounts. Share them equally. How much does each get?", vi: "Cho 4 bạn số kẹo khác nhau rồi chia đều. Mỗi bạn được bao nhiêu?" },
      { en: "Check: mean = total ÷ number of friends.", vi: "Kiểm tra: số trung bình = tổng : số bạn." },
    ],
    vocab: [
      { en: "mean", vi: "số trung bình" },
      { en: "total", vi: "tổng" },
      { en: "share equally", vi: "chia đều" },
    ],
  },
];

/** Link chạy một mô phỏng: PhET và GeoGebra theo ngôn ngữ chọn */
export const simLaunchUrl = (s: LabSim, locale: "en" | "vi" = "en") =>
  s.url ? (s.source === "geogebra" ? `${s.url}?lang=${locale}` : s.url) : `https://phet.colorado.edu/sims/html/${s.slug}/latest/${s.slug}_all.html?locale=${locale}`;

/** Học liệu (link) trùng với một mô phỏng dựng sẵn → không hiện lặp */
export const isBuiltInSim = (url: string) => {
  const slug = phetSlug(url);
  return LAB_SIMS.some((s) => (slug && !s.url && s.slug === slug) || (s.url && s.url === url));
};

/** Ghi công nguồn hiển thị */
export const SIM_SOURCE: Record<NonNullable<LabSim["source"]>, string> = {
  phet: "PhET – ĐH Colorado",
  geogebra: "GeoGebra",
};

/** Lọc theo khối, mạch và từ khoá (tiếng Việt/Anh, có dấu hay không) */
export function searchSims(opts: { grade?: number | null; topic?: LabTopic | ""; q?: string }): LabSim[] {
  const q = fold(opts.q?.trim() ?? "");
  return LAB_SIMS.filter(
    (s) =>
      (!opts.grade || s.grades.includes(opts.grade)) &&
      (!opts.topic || s.topic === opts.topic) &&
      (!q || fold([s.title.en, s.title.vi, s.about.en, s.about.vi, ...s.vocab.flatMap((v) => [v.en, v.vi])].join(" ")).includes(q))
  );
}
