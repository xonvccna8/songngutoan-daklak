// 16 dự án STEM mẫu cho Toán 6–9 (Kết nối tri thức): mỗi dự án gắn bài SGK, có tiêu chí sản phẩm đo được,
// vật liệu rẻ dễ kiếm, lưu ý an toàn, từ vựng song ngữ. GV chọn mẫu ở “Tạo dự án STEM” rồi sửa tự do cho phù hợp lớp mình.
import type { StemTemplate } from "@/lib/stem/projects";

const SAFE = "An toàn: dùng kéo, dao rọc giấy, keo nến có GV giám sát; đo đạc ngoài sân theo nhóm, không trèo cao.";

export const STEM_TEMPLATES_TOAN: StemTemplate[] = [
  // ===================== LỚP 6 =====================
  {
    id: "t6-school-garden",
    grade: 6,
    curLessonId: "k6-20",
    title: { en: "Design a school flower garden", vi: "Thiết kế bồn hoa cho sân trường" },
    goal: { en: "Design a garden made of rectangles, squares and trapezoids, and calculate its perimeter and area.", vi: "Thiết kế bồn hoa ghép từ hình chữ nhật, hình vuông, hình thang và tính chu vi, diện tích." },
    brief: {
      en: "Draw the garden on grid paper at a scale of 1 cm : 1 m. Use at least three of the shapes we learnt. Calculate the total area (to buy soil) and the perimeter (to buy a fence). The budget is 2 000 000 VND: fence 50 000 VND/m, soil 40 000 VND/m². Present the plan in English.",
      vi: "Vẽ bồn hoa trên giấy kẻ ô theo tỉ lệ 1 cm : 1 m, dùng ít nhất 3 loại hình đã học. Tính tổng diện tích (để mua đất) và chu vi (để mua hàng rào). Ngân sách 2 000 000 đồng: hàng rào 50 000 đồng/m, đất 40 000 đồng/m². Tiêu chí: bản vẽ đúng tỉ lệ, tính đúng chu vi – diện tích, tổng chi phí không vượt ngân sách. Trình bày bằng tiếng Anh 2 phút.",
    },
    materials: "Giấy kẻ ô, thước kẻ, bút màu, máy tính cầm tay.",
    vocab: [
      { en: "perimeter", vi: "chu vi" },
      { en: "area", vi: "diện tích" },
      { en: "scale", vi: "tỉ lệ" },
      { en: "budget", vi: "ngân sách" },
    ],
  },
  {
    id: "t6-symmetry-logo",
    grade: 6,
    curLessonId: "k6-21",
    title: { en: "A symmetric logo for our class", vi: "Logo đối xứng cho lớp em" },
    goal: { en: "Design a class logo that has at least one line of symmetry.", vi: "Thiết kế logo lớp có ít nhất một trục đối xứng." },
    brief: {
      en: "Fold a paper in half, cut and decorate it to make a logo. Mark all lines of symmetry. Then make a second version with a centre of symmetry. Explain in English how you checked the symmetry.",
      vi: "Gấp đôi tờ giấy, cắt và trang trí để tạo logo; đánh dấu mọi trục đối xứng. Làm thêm một phiên bản có tâm đối xứng. Tiêu chí: logo có ≥ 1 trục đối xứng được chỉ rõ, phiên bản thứ hai có tâm đối xứng, giải thích bằng tiếng Anh cách kiểm tra.",
    },
    materials: "Giấy màu, kéo, bút dạ, thước. " + SAFE,
    vocab: [
      { en: "line of symmetry", vi: "trục đối xứng" },
      { en: "centre of symmetry", vi: "tâm đối xứng" },
      { en: "fold", vi: "gấp" },
    ],
  },
  {
    id: "t6-class-survey",
    grade: 6,
    curLessonId: "k6-40",
    title: { en: "Our class in numbers", vi: "Lớp em qua những con số" },
    goal: { en: "Collect data about the class and present it in a bar chart poster.", vi: "Thu thập dữ liệu về lớp và trình bày bằng áp phích biểu đồ cột." },
    brief: {
      en: "Choose a question (favourite sport, way to go to school, hours of sleep…). Ask every classmate, make a table and draw a bar chart. Write three sentences in English about what the chart shows.",
      vi: "Chọn một câu hỏi khảo sát (môn thể thao yêu thích, cách đến trường, số giờ ngủ…). Hỏi mọi bạn trong lớp, lập bảng thống kê và vẽ biểu đồ cột. Tiêu chí: hỏi đủ cả lớp, bảng và biểu đồ khớp nhau, trục có tên và đơn vị, có 3 câu nhận xét bằng tiếng Anh.",
    },
    materials: "Giấy A3 hoặc A0, bút màu, thước kẻ.",
    vocab: [
      { en: "survey", vi: "cuộc khảo sát" },
      { en: "bar chart", vi: "biểu đồ cột" },
      { en: "the most popular", vi: "phổ biến nhất" },
    ],
  },
  {
    id: "t6-spinner",
    grade: 6,
    curLessonId: "k6-43",
    title: { en: "Is our spinner fair?", vi: "Con quay của tổ có công bằng không?" },
    goal: { en: "Make a spinner and use experimental probability to test if it is fair.", vi: "Làm con quay và dùng xác suất thực nghiệm để kiểm tra nó có công bằng không." },
    brief: {
      en: "Make a spinner with 4 equal parts. Spin it 100 times and record the results in a table. Calculate the experimental probability of each colour. Then make an unfair spinner and compare.",
      vi: "Làm con quay chia 4 phần bằng nhau, quay 100 lần và ghi kết quả vào bảng. Tính xác suất thực nghiệm của mỗi màu. Làm thêm một con quay không công bằng (các phần không bằng nhau) để so sánh. Tiêu chí: đủ 100 lần quay, bảng kiểm đếm rõ ràng, tính đúng xác suất thực nghiệm, kết luận bằng tiếng Anh.",
    },
    materials: "Bìa cứng, compa, thước đo góc, que tăm hoặc bút chì, bút màu. " + SAFE,
    vocab: [
      { en: "spinner", vi: "con quay" },
      { en: "experimental probability", vi: "xác suất thực nghiệm" },
      { en: "fair", vi: "công bằng" },
    ],
  },

  // ===================== LỚP 7 =====================
  {
    id: "t7-time-pie",
    grade: 7,
    curLessonId: "k7-18",
    title: { en: "How do we spend our day?", vi: "Một ngày của em được dùng thế nào?" },
    goal: { en: "Draw a pie chart of how a student spends 24 hours.", vi: "Vẽ biểu đồ hình quạt tròn cho 24 giờ của một học sinh." },
    brief: {
      en: "Each member records their time for one school day (sleep, school, homework, screen time…). Find the group average, change it to percentages and degrees, and draw a pie chart. Suggest one healthy change in English.",
      vi: "Mỗi bạn ghi lại thời gian trong một ngày đi học (ngủ, học ở trường, làm bài, dùng màn hình…). Tính trung bình của tổ, đổi ra phần trăm và số đo góc, vẽ biểu đồ hình quạt tròn. Tiêu chí: tổng đúng 24 giờ, tổng các góc đúng 360°, biểu đồ có chú thích, đề xuất 1 thay đổi lành mạnh bằng tiếng Anh.",
    },
    materials: "Compa, thước đo góc, giấy A3, bút màu, máy tính cầm tay. " + SAFE,
    vocab: [
      { en: "pie chart", vi: "biểu đồ hình quạt tròn" },
      { en: "percentage", vi: "tỉ số phần trăm" },
      { en: "sector", vi: "hình quạt" },
    ],
  },
  {
    id: "t7-recipe",
    grade: 7,
    curLessonId: "k7-22",
    title: { en: "A recipe for the whole class", vi: "Công thức món ăn cho cả lớp" },
    goal: { en: "Use direct proportion to scale a recipe from 4 people to the whole class.", vi: "Dùng đại lượng tỉ lệ thuận để tính nguyên liệu từ 4 người lên cả lớp." },
    brief: {
      en: "Choose a simple recipe for 4 people (fruit salad, lemonade…). Use direct proportion to find the ingredients for the whole class, then estimate the total cost. Make a bilingual recipe card.",
      vi: "Chọn một món đơn giản cho 4 người (salad hoa quả, nước chanh…). Dùng tỉ lệ thuận tính lượng nguyên liệu cho cả lớp, ước tính tổng chi phí. Làm thẻ công thức song ngữ. Tiêu chí: lập bảng tỉ lệ thuận đúng, chỉ ra hệ số tỉ lệ, chi phí hợp lí, thẻ công thức đủ hai thứ tiếng.",
    },
    materials: "Giấy bìa màu, bút, máy tính cầm tay; (tuỳ chọn) nguyên liệu để làm thật dưới sự giám sát của GV.",
    vocab: [
      { en: "direct proportion", vi: "tỉ lệ thuận" },
      { en: "ingredient", vi: "nguyên liệu" },
      { en: "constant of proportionality", vi: "hệ số tỉ lệ" },
    ],
  },
  {
    id: "t7-pencil-box",
    grade: 7,
    curLessonId: "k7-36",
    title: { en: "A cuboid pencil box", vi: "Hộp bút hình hộp chữ nhật" },
    goal: { en: "Design and build a cuboid box with a volume of about 600 cm³.", vi: "Thiết kế và làm hộp bút hình hộp chữ nhật có thể tích khoảng 600 cm³." },
    brief: {
      en: "Choose the length, width and height so that the volume is close to 600 cm³ and a pencil fits inside. Draw the net, calculate the surface area (cardboard needed) and build the box.",
      vi: "Chọn chiều dài, rộng, cao sao cho thể tích gần 600 cm³ và vừa một chiếc bút chì. Vẽ hình khai triển, tính diện tích toàn phần (lượng bìa cần dùng) rồi làm hộp. Tiêu chí: thể tích trong khoảng 550–650 cm³, hình khai triển đúng, sai số kích thước ≤ 3 mm, dùng ít bìa nhất có thể.",
    },
    materials: "Bìa cứng, thước kẻ, ê ke, kéo, keo. " + SAFE,
    vocab: [
      { en: "cuboid", vi: "hình hộp chữ nhật" },
      { en: "volume", vi: "thể tích" },
      { en: "net", vi: "hình khai triển" },
    ],
  },
  {
    id: "t7-straw-bridge",
    grade: 7,
    curLessonId: "k7-13",
    title: { en: "A strong triangle bridge", vi: "Cây cầu tam giác vững chắc" },
    goal: { en: "Build a straw bridge from congruent triangles and test how much weight it holds.", vi: "Làm cầu bằng ống hút ghép từ các tam giác bằng nhau và thử sức chịu tải." },
    brief: {
      en: "Compare a square frame and a triangle frame: which one keeps its shape? Build a 40 cm bridge using congruent triangles. Test it with coins or books and record the maximum load.",
      vi: "So sánh khung hình vuông và khung tam giác: khung nào giữ được hình dạng? Làm cầu dài 40 cm ghép từ các tam giác bằng nhau. Thử tải bằng đồng xu hoặc sách, ghi lại tải lớn nhất. Tiêu chí: cầu dài ≥ 40 cm, dùng ≤ 30 ống hút, các tam giác bằng nhau (đo kiểm tra c.c.c), chịu được ≥ 500 g.",
    },
    materials: "Ống hút, băng dính, ghim, thước, cân hoặc sách để thử tải. " + SAFE,
    vocab: [
      { en: "congruent triangles", vi: "hai tam giác bằng nhau" },
      { en: "rigid", vi: "cứng, không biến dạng" },
      { en: "load", vi: "tải trọng" },
    ],
  },

  // ===================== LỚP 8 =====================
  {
    id: "t8-flagpole",
    grade: 8,
    curLessonId: "k8-34",
    title: { en: "How tall is our flagpole?", vi: "Cột cờ trường em cao bao nhiêu?" },
    goal: { en: "Measure the height of the school flagpole without climbing it, using similar triangles.", vi: "Đo chiều cao cột cờ mà không cần trèo, bằng tam giác đồng dạng." },
    brief: {
      en: "Method 1: measure the shadow of the flagpole and the shadow of a stick at the same time. Method 2: use a mirror on the ground. Draw the similar triangles, calculate the height and compare the two methods.",
      vi: "Cách 1: đo bóng cột cờ và bóng một cây gậy cùng lúc. Cách 2: đặt gương dưới đất, đứng lùi đến khi thấy đỉnh cột cờ trong gương. Vẽ các cặp tam giác đồng dạng, tính chiều cao và so sánh hai cách. Tiêu chí: vẽ hình đúng, nêu rõ trường hợp đồng dạng, hai kết quả lệch nhau ≤ 10%, trình bày bằng tiếng Anh.",
    },
    materials: "Thước dây, cây gậy 1–1,5 m, gương nhỏ, giấy ghi chép. " + SAFE,
    vocab: [
      { en: "similar triangles", vi: "hai tam giác đồng dạng" },
      { en: "shadow", vi: "bóng" },
      { en: "indirect measurement", vi: "đo gián tiếp" },
    ],
  },
  {
    id: "t8-right-angle-rope",
    grade: 8,
    curLessonId: "k8-35",
    title: { en: "The builder's 3-4-5 rope", vi: "Sợi dây 3 – 4 – 5 của thợ xây" },
    goal: { en: "Make a rope tool and use Pythagoras' theorem to check right angles around the school.", vi: "Làm dụng cụ dây thắt nút và dùng định lí Pythagore kiểm tra các góc vuông quanh trường." },
    brief: {
      en: "Tie 13 knots at equal distances on a rope to make a 3-4-5 triangle. Use it to check 5 corners (classroom, desk, door, yard…). Measure the diagonal of the classroom and compare it with the value from Pythagoras' theorem.",
      vi: "Thắt 13 nút cách đều trên sợi dây để căng thành tam giác 3 – 4 – 5. Dùng nó kiểm tra 5 góc (góc lớp, bàn, cửa, sân…). Đo đường chéo phòng học và so sánh với kết quả tính bằng định lí Pythagore. Tiêu chí: dây chia đúng 12 đoạn bằng nhau, kiểm tra đủ 5 góc, sai số đường chéo ≤ 5%, báo cáo song ngữ.",
    },
    materials: "Sợi dây dài 12–15 m, thước dây, phấn, sổ ghi. " + SAFE,
    vocab: [
      { en: "right angle", vi: "góc vuông" },
      { en: "hypotenuse", vi: "cạnh huyền" },
      { en: "Pythagoras' theorem", vi: "định lí Pythagore" },
    ],
  },
  {
    id: "t8-pyramid-lantern",
    grade: 8,
    curLessonId: "k8-39",
    title: { en: "A pyramid lantern", vi: "Đèn lồng hình chóp tứ giác đều" },
    goal: { en: "Design a regular square pyramid lantern and calculate its surface area and volume.", vi: "Thiết kế đèn lồng hình chóp tứ giác đều, tính diện tích xung quanh và thể tích." },
    brief: {
      en: "Choose the base edge and the height. Calculate the slant height, the lateral surface area (paper needed) and the volume. Build the lantern from a net and decorate it.",
      vi: "Chọn cạnh đáy và chiều cao. Tính trung đoạn, diện tích xung quanh (lượng giấy cần) và thể tích. Làm đèn từ hình khai triển và trang trí. Tiêu chí: tính đúng trung đoạn (dùng định lí Pythagore), sai số kích thước ≤ 3 mm, 4 mặt bên bằng nhau, thuyết trình bằng tiếng Anh.",
    },
    materials: "Giấy bìa màu hoặc giấy kiếng, thước, ê ke, kéo, keo, đèn LED nhỏ (không dùng nến). " + SAFE,
    vocab: [
      { en: "regular square pyramid", vi: "hình chóp tứ giác đều" },
      { en: "slant height", vi: "trung đoạn" },
      { en: "lateral face", vi: "mặt bên" },
    ],
  },
  {
    id: "t8-data-plan",
    grade: 8,
    curLessonId: "k8-28",
    title: { en: "Which mobile data plan is better?", vi: "Gói cước 4G nào có lợi hơn?" },
    goal: { en: "Use linear functions and their graphs to compare two price plans.", vi: "Dùng hàm số bậc nhất và đồ thị để so sánh hai gói cước." },
    brief: {
      en: "Plan A: 50 000 VND per month + 5 000 VND per GB. Plan B: 10 000 VND per GB. Write a function for each plan, make a table of values, draw both graphs on the same coordinate plane and find when each plan is cheaper.",
      vi: "Gói A: 50 000 đồng/tháng + 5 000 đồng/GB. Gói B: 10 000 đồng/GB. Viết hàm số cho mỗi gói, lập bảng giá trị, vẽ hai đồ thị trên cùng mặt phẳng toạ độ (có thể dùng GeoGebra) và tìm khi nào gói nào rẻ hơn. Tiêu chí: hàm số đúng, đồ thị đúng, tìm đúng giao điểm (10 GB), đưa lời khuyên bằng tiếng Anh.",
    },
    materials: "Giấy kẻ ô, thước, bút màu; máy tính hoặc điện thoại có GeoGebra.",
    vocab: [
      { en: "linear function", vi: "hàm số bậc nhất" },
      { en: "graph", vi: "đồ thị" },
      { en: "intersection point", vi: "giao điểm" },
    ],
  },

  // ===================== LỚP 9 =====================
  {
    id: "t9-clinometer",
    grade: 9,
    curLessonId: "k9-12",
    title: { en: "Measure a tree with a clinometer", vi: "Đo chiều cao cây bằng giác kế tự làm" },
    goal: { en: "Make a clinometer and use the tangent ratio to find the height of a tall object.", vi: "Làm giác kế đơn giản và dùng tỉ số tang để tính chiều cao vật cao." },
    brief: {
      en: "Make a clinometer from a protractor, a straw and a string with a weight. Stand at a measured distance, find the angle of elevation to the top of a tree or building, and calculate its height with tan.",
      vi: "Làm giác kế từ thước đo góc, ống hút và sợi dây có quả dọi. Đứng cách gốc cây (hoặc toà nhà) một khoảng đo được, đo góc nâng lên đỉnh và tính chiều cao bằng tỉ số tang (nhớ cộng chiều cao tầm mắt). Tiêu chí: đo ở 2 vị trí khác nhau, hai kết quả lệch ≤ 10%, vẽ hình và trình bày lời giải bằng tiếng Anh.",
    },
    materials: "Thước đo góc, ống hút, dây, vòng đệm làm quả dọi, băng dính, thước dây, máy tính cầm tay. " + SAFE,
    vocab: [
      { en: "angle of elevation", vi: "góc nâng" },
      { en: "tangent", vi: "tang" },
      { en: "clinometer", vi: "giác kế đo góc nâng" },
    ],
  },
  {
    id: "t9-paper-cup",
    grade: 9,
    curLessonId: "k9-31",
    title: { en: "A 200 ml paper cup", vi: "Cốc giấy 200 ml tiết kiệm giấy" },
    goal: { en: "Design a cylinder cup that holds 200 ml using as little paper as possible.", vi: "Thiết kế cốc hình trụ chứa 200 ml mà tốn ít giấy nhất." },
    brief: {
      en: "Try at least 4 different radii. For each radius, find the height so that V = 200 cm³, then calculate the paper area (side + bottom). Make a table, choose the best design, build it and test it with water.",
      vi: "Thử ít nhất 4 bán kính khác nhau. Với mỗi bán kính, tính chiều cao để V = 200 cm³, rồi tính diện tích giấy (xung quanh + đáy). Lập bảng, chọn thiết kế tốt nhất, làm cốc và đổ nước thử. Tiêu chí: bảng tính đúng, cốc chứa được 200 ml (sai số ≤ 10%), giải thích lựa chọn bằng tiếng Anh.",
    },
    materials: "Giấy bìa cứng chống thấm hoặc giấy tráng nhựa, compa, thước, kéo, keo, ca đong. " + SAFE,
    vocab: [
      { en: "cylinder", vi: "hình trụ" },
      { en: "radius", vi: "bán kính" },
      { en: "lateral surface area", vi: "diện tích xung quanh" },
    ],
  },
  {
    id: "t9-vegetable-bed",
    grade: 9,
    curLessonId: "k9-21",
    title: { en: "A vegetable bed with 20 m of fence", vi: "Luống rau với 20 m hàng rào" },
    goal: { en: "Use a quadratic equation to design a rectangular vegetable bed with a given area.", vi: "Dùng phương trình bậc hai để thiết kế luống rau hình chữ nhật có diện tích cho trước." },
    brief: {
      en: "You have 20 m of fence. Find the length and width of a rectangle with an area of 24 m² by setting up a quadratic equation. Then find the largest possible area with GeoGebra and draw the plan.",
      vi: "Có 20 m hàng rào. Lập phương trình bậc hai để tìm chiều dài, chiều rộng của luống rau hình chữ nhật có diện tích 24 m². Sau đó dùng GeoGebra tìm diện tích lớn nhất có thể và vẽ sơ đồ luống rau. Tiêu chí: lập và giải đúng phương trình, loại nghiệm không phù hợp, chỉ ra diện tích lớn nhất 25 m², trình bày bằng tiếng Anh.",
    },
    materials: "Giấy kẻ ô, thước, bút màu; máy tính có GeoGebra; (tuỳ chọn) dây và cọc để căng thử ngoài sân.",
    vocab: [
      { en: "quadratic equation", vi: "phương trình bậc hai" },
      { en: "fence", vi: "hàng rào" },
      { en: "maximum area", vi: "diện tích lớn nhất" },
    ],
  },
  {
    id: "t9-dice-game",
    grade: 9,
    curLessonId: "k9-26",
    title: { en: "Design a fair dice game", vi: "Thiết kế trò chơi xúc xắc công bằng" },
    goal: { en: "Use sample spaces and probability to design a fair game with two dice.", vi: "Dùng không gian mẫu và xác suất để thiết kế trò chơi hai xúc xắc công bằng." },
    brief: {
      en: "List the sample space of rolling two dice (36 outcomes). Design game rules so that both players have the same probability of winning. Play 50 rounds to check, and explain the rules in English.",
      vi: "Liệt kê không gian mẫu khi gieo hai xúc xắc (36 kết quả). Thiết kế luật chơi để hai người có xác suất thắng bằng nhau. Chơi thử 50 ván để kiểm tra rồi giải thích luật bằng tiếng Anh. Tiêu chí: không gian mẫu đúng, tính đúng xác suất thắng của mỗi người, kết quả thực nghiệm gần với lí thuyết.",
    },
    materials: "2 con xúc xắc, giấy, bút, bảng kiểm đếm.",
    vocab: [
      { en: "sample space", vi: "không gian mẫu" },
      { en: "fair game", vi: "trò chơi công bằng" },
      { en: "probability", vi: "xác suất" },
    ],
  },
];
