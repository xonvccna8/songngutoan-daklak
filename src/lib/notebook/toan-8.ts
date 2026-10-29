// Vở ghi Toán 8 — các bài trọng tâm (Đại số, Hình học). Bám SGK Kết nối tri thức với cuộc sống.
import type { NoteLesson } from "@/lib/notebook/types";

export const NOTES_TOAN_8: NoteLesson[] = [
  // ============================ BÀI 1. ĐƠN THỨC ============================
  {
    id: "k8-1",
    theory: [
      {
        h: "Đơn thức và đơn thức thu gọn",
        en: "Monomials",
        points: [
          "**Đơn thức** (monomial) là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến. Ví dụ: 5; x; −3x²y.",
          "**Đơn thức thu gọn** gồm một số (**hệ số** – coefficient) nhân với các biến, mỗi biến chỉ xuất hiện một lần với số mũ nguyên dương (**phần biến**).",
          "**Bậc** (degree) của đơn thức thu gọn có hệ số khác 0 là tổng số mũ của các biến. Ví dụ: −3x²y có bậc 3.",
        ],
      },
      {
        h: "Đơn thức đồng dạng",
        en: "Like monomials",
        points: [
          "Hai đơn thức **đồng dạng** (like monomials) là hai đơn thức có hệ số khác 0 và có cùng phần biến. Ví dụ: 2xy² và −5xy².",
          "Cộng (trừ) các đơn thức đồng dạng: cộng (trừ) các hệ số và giữ nguyên phần biến.",
          "Ví dụ: 2xy² + (−5xy²) = −3xy².",
        ],
        table: {
          head: ["Đơn thức", "Hệ số", "Phần biến", "Bậc"],
          rows: [
            ["4x³", "4", "x³", "3"],
            ["−x²y", "−1", "x²y", "3"],
            ["½xy²z", "½", "xy²z", "4"],
          ],
        },
      },
    ],
    remember: [
      "Đơn thức thu gọn = hệ số × phần biến.",
      "Bậc của đơn thức = tổng số mũ của các biến.",
      "Chỉ cộng, trừ được các đơn thức đồng dạng: cộng hệ số, giữ nguyên phần biến.",
    ],
    sentences: [
      { en: "Three x squared y is a monomial.", vi: "3x²y là một đơn thức." },
      { en: "The coefficient of minus five x y is minus five.", vi: "Hệ số của −5xy là −5." },
      { en: "Like monomials have the same variable part.", vi: "Các đơn thức đồng dạng có cùng phần biến." },
    ],
    mcq: [
      { q: "Biểu thức nào là đơn thức?", options: ["x + 1", "2x²y", "1/x", "x − y"], answer: 1 },
      { q: "Bậc của đơn thức −7x³y² là", options: ["2", "3", "5", "6"], answer: 2 },
      { q: "Đơn thức đồng dạng với 3x²y là", options: ["3xy²", "−x²y", "3x²", "x²y²"], answer: 1 },
      { q: "4ab − 9ab bằng", options: ["5ab", "−5ab", "−5", "13ab"], answer: 1 },
    ],
    tf: [
      { q: "Số 7 là một đơn thức.", answer: true },
      { q: "Hai đơn thức 2x²y và 2xy² đồng dạng.", answer: false },
      { q: "Hệ số của đơn thức −x³ là −1.", answer: true },
      { q: "Bậc của đơn thức 5x²y³ là 2.", answer: false },
    ],
    fill: [
      { q: "In 6x², the number 6 is the ___.", vi: "Trong 6x², số 6 là hệ số.", answer: "coefficient" },
      { q: "2xy and −7xy are ___ monomials.", vi: "2xy và −7xy là các đơn thức đồng dạng.", answer: "like" },
      { q: "The ___ of x²y³ is five.", vi: "Bậc của x²y³ là 5.", answer: "degree" },
    ],
    essay: [
      { q: "Thu gọn đơn thức: (−2x²y) · (3xy³). Chỉ ra hệ số, phần biến và bậc.", answer: "(−2x²y)(3xy³) = −6x³y⁴. Hệ số −6, phần biến x³y⁴, bậc 7." },
      { q: "Tính tổng: 3x²y + (−5x²y) + 7x²y.", answer: "(3 − 5 + 7)x²y = 5x²y." },
    ],
  },

  // ============================ BÀI 6. HẰNG ĐẲNG THỨC ============================
  {
    id: "k8-6",
    theory: [
      {
        h: "Hằng đẳng thức",
        en: "Identities",
        points: [
          "**Hằng đẳng thức** (identity) là đẳng thức mà hai vế luôn nhận cùng một giá trị với mọi giá trị của biến.",
          "Ba hằng đẳng thức đầu tiên giúp tính nhanh, khai triển và phân tích đa thức.",
        ],
      },
      {
        h: "Ba hằng đẳng thức đáng nhớ đầu tiên",
        en: "The first three special identities",
        points: [
          "**Bình phương của một tổng** (square of a sum): (A + B)² = A² + 2AB + B².",
          "**Bình phương của một hiệu** (square of a difference): (A − B)² = A² − 2AB + B².",
          "**Hiệu hai bình phương** (difference of two squares): A² − B² = (A − B)(A + B).",
        ],
        table: {
          head: ["Biểu thức", "Khai triển"],
          rows: [
            ["(x + 3)²", "x² + 6x + 9"],
            ["(2x − 1)²", "4x² − 4x + 1"],
            ["x² − 25", "(x − 5)(x + 5)"],
          ],
        },
      },
    ],
    remember: [
      "(A + B)² = A² + 2AB + B².",
      "(A − B)² = A² − 2AB + B².",
      "A² − B² = (A − B)(A + B).",
    ],
    sentences: [
      { en: "A plus B, all squared, equals A squared plus two A B plus B squared.", vi: "(A + B)² = A² + 2AB + B²." },
      { en: "This is the difference of two squares.", vi: "Đây là hiệu hai bình phương." },
      { en: "We use identities to calculate quickly.", vi: "Ta dùng hằng đẳng thức để tính nhanh." },
    ],
    mcq: [
      { q: "(x + 5)² bằng", options: ["x² + 25", "x² + 5x + 25", "x² + 10x + 25", "x² + 10x + 10"], answer: 2 },
      { q: "x² − 49 bằng", options: ["(x − 7)²", "(x − 7)(x + 7)", "(x + 7)²", "(x − 49)(x + 1)"], answer: 1 },
      { q: "Tính nhanh 99² bằng (100 − 1)² được", options: ["9 801", "9 899", "9 999", "10 199"], answer: 0 },
      { q: "4x² − 12x + 9 bằng", options: ["(2x + 3)²", "(2x − 3)²", "(4x − 3)²", "(2x − 9)²"], answer: 1 },
    ],
    tf: [
      { q: "(a − b)² = a² − b².", answer: false },
      { q: "(a − b)² = (b − a)².", answer: true },
      { q: "101 · 99 = 100² − 1 = 9 999.", answer: true },
      { q: "(x + 2)² = x² + 4.", answer: false },
    ],
    fill: [
      { q: "a² − b² is the difference of two ___.", vi: "a² − b² là hiệu hai bình phương.", answer: "squares" },
      { q: "(a + b)² is the square of a ___.", vi: "(a + b)² là bình phương của một tổng.", answer: "sum" },
      { q: "An ___ is true for all values of the variables.", vi: "Hằng đẳng thức đúng với mọi giá trị của biến.", answer: "identity" },
    ],
    essay: [
      { q: "Tính nhanh: 51² và 49².", answer: "51² = (50 + 1)² = 2 500 + 100 + 1 = 2 601; 49² = (50 − 1)² = 2 500 − 100 + 1 = 2 401." },
      { q: "Chứng minh (a + b)² − (a − b)² = 4ab.", answer: "(a + b)² − (a − b)² = (a² + 2ab + b²) − (a² − 2ab + b²) = 4ab." },
    ],
  },

  // ============================ BÀI 10. TỨ GIÁC ============================
  {
    id: "k8-10",
    theory: [
      {
        h: "Tứ giác và tứ giác lồi",
        en: "Quadrilaterals and convex quadrilaterals",
        points: [
          "**Tứ giác** ABCD (quadrilateral) gồm bốn đoạn thẳng AB, BC, CD, DA, trong đó không có hai đoạn thẳng nào cùng nằm trên một đường thẳng.",
          "**Tứ giác lồi** (convex quadrilateral) là tứ giác luôn nằm về một phía của đường thẳng chứa bất kì cạnh nào.",
          "Hai **đường chéo** (diagonals) của tứ giác ABCD là AC và BD.",
        ],
      },
      {
        h: "Tổng các góc của một tứ giác",
        en: "Angle sum of a quadrilateral",
        points: [
          "Tổng các góc của một tứ giác bằng **360°**.",
          "Giải thích: đường chéo AC chia tứ giác thành hai tam giác; mỗi tam giác có tổng ba góc 180°, nên tổng là 2 · 180° = 360°.",
        ],
      },
    ],
    remember: [
      "Tứ giác có 4 đỉnh, 4 cạnh, 4 góc và 2 đường chéo.",
      "Tổng các góc của một tứ giác bằng 360°.",
      "Một đường chéo chia tứ giác lồi thành hai tam giác.",
    ],
    sentences: [
      { en: "A quadrilateral has four sides and four angles.", vi: "Tứ giác có bốn cạnh và bốn góc." },
      { en: "The angles of a quadrilateral add up to three hundred and sixty degrees.", vi: "Tổng các góc của tứ giác bằng 360 độ." },
      { en: "AC and BD are the diagonals.", vi: "AC và BD là hai đường chéo." },
    ],
    mcq: [
      { q: "Tứ giác ABCD có ∠A = 80°, ∠B = 100°, ∠C = 90°. Số đo ∠D là", options: ["70°", "80°", "90°", "100°"], answer: 2 },
      { q: "Tứ giác có bao nhiêu đường chéo?", options: ["1", "2", "3", "4"], answer: 1 },
      { q: "Tứ giác có bốn góc bằng nhau thì mỗi góc bằng", options: ["45°", "60°", "90°", "120°"], answer: 2 },
      { q: "Một tứ giác có thể có nhiều nhất bao nhiêu góc tù?", options: ["1", "2", "3", "4"], answer: 2 },
    ],
    tf: [
      { q: "Tổng các góc của tứ giác bằng 180°.", answer: false },
      { q: "Một tứ giác có thể có bốn góc vuông.", answer: true },
      { q: "Một tứ giác có thể có bốn góc nhọn.", answer: false },
      { q: "Đường chéo AC chia tứ giác lồi ABCD thành hai tam giác.", answer: true },
    ],
    fill: [
      { q: "A ___ has four sides.", vi: "Tứ giác có bốn cạnh.", answer: "quadrilateral" },
      { q: "AC is a ___ of ABCD.", vi: "AC là một đường chéo của ABCD.", answer: "diagonal" },
      { q: "In a ___ quadrilateral, each diagonal lies inside the shape.", vi: "Trong tứ giác lồi, mỗi đường chéo nằm bên trong hình.", answer: "convex" },
    ],
    essay: [
      { q: "Tứ giác ABCD có ∠A = ∠C = 105°, ∠B = 2∠D. Tính ∠B, ∠D.", answer: "∠B + ∠D = 360° − 210° = 150°; 2∠D + ∠D = 150° nên ∠D = 50°, ∠B = 100°." },
      { q: "Vì sao một tứ giác không thể có bốn góc tù?", answer: "Bốn góc tù có tổng lớn hơn 4 · 90° = 360°, vượt quá tổng các góc của tứ giác. Vậy tứ giác có nhiều nhất ba góc tù." },
    ],
  },

  // ============================ BÀI 15. ĐỊNH LÍ THALÈS ============================
  {
    id: "k8-15",
    theory: [
      {
        h: "Đoạn thẳng tỉ lệ",
        en: "Proportional segments",
        points: [
          "Hai đoạn thẳng AB và CD **tỉ lệ** với hai đoạn thẳng A′B′ và C′D′ nếu AB/CD = A′B′/C′D′.",
        ],
      },
      {
        h: "Định lí Thalès và định lí đảo",
        en: "Thales' theorem and its converse",
        points: [
          "**Định lí Thalès** (Thales' theorem): nếu một đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại thì nó định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ.",
          "Tam giác ABC, M ∈ AB, N ∈ AC, MN ∥ BC ⇒ AM/AB = AN/AC; AM/MB = AN/NC.",
          "**Định lí đảo** (converse): nếu một đường thẳng cắt hai cạnh của tam giác và định ra trên hai cạnh này những đoạn thẳng tương ứng tỉ lệ thì đường thẳng đó song song với cạnh còn lại.",
        ],
      },
    ],
    remember: [
      "MN ∥ BC ⇒ AM/AB = AN/AC.",
      "AM/MB = AN/NC ⇒ MN ∥ BC (định lí đảo).",
      "Định lí Thalès dùng để tính độ dài và đo gián tiếp khoảng cách.",
    ],
    sentences: [
      { en: "MN is parallel to BC.", vi: "MN song song với BC." },
      { en: "The segments are proportional.", vi: "Các đoạn thẳng tỉ lệ với nhau." },
      { en: "We use Thales' theorem to find a missing length.", vi: "Ta dùng định lí Thalès để tìm độ dài chưa biết." },
    ],
    mcq: [
      { q: "Tam giác ABC có MN ∥ BC (M ∈ AB, N ∈ AC), AM = 2, MB = 3, AN = 4. NC bằng", options: ["5", "6", "8", "1,5"], answer: 1 },
      { q: "Nếu MN ∥ BC thì tỉ số nào đúng?", options: ["AM/AB = AN/AC", "AM/AB = AC/AN", "AM/MB = AC/AN", "AB/AM = NC/AN"], answer: 0 },
      { q: "AB = 6 cm, CD = 9 cm. Tỉ số AB/CD là", options: ["3/2", "2/3", "1/3", "6/15"], answer: 1 },
      { q: "Định lí đảo của định lí Thalès dùng để chứng minh", options: ["hai góc bằng nhau", "hai đường thẳng song song", "hai đoạn thẳng bằng nhau", "tam giác cân"], answer: 1 },
    ],
    tf: [
      { q: "Nếu MN ∥ BC thì AM/MB = AN/NC.", answer: true },
      { q: "Định lí Thalès chỉ đúng với tam giác vuông.", answer: false },
      { q: "Nếu AM/AB = AN/AC thì MN ∥ BC.", answer: true },
      { q: "Tỉ số của hai đoạn thẳng phụ thuộc vào đơn vị đo.", answer: false },
    ],
    fill: [
      { q: "MN is ___ to BC.", vi: "MN song song với BC.", answer: "parallel" },
      { q: "The two segments are ___.", vi: "Hai đoạn thẳng tỉ lệ.", answer: "proportional" },
      { q: "The ___ of Thales' theorem proves that two lines are parallel.", vi: "Định lí đảo của định lí Thalès chứng minh hai đường thẳng song song.", answer: "converse" },
    ],
    essay: [
      { q: "Tam giác ABC có AB = 8 cm, AC = 12 cm. Điểm M trên AB với AM = 2 cm; kẻ MN ∥ BC (N ∈ AC). Tính AN.", answer: "Theo định lí Thalès: AM/AB = AN/AC ⇒ 2/8 = AN/12 ⇒ AN = 3 cm." },
      { q: "Nêu cách đo chiều rộng một khúc sông mà không cần sang bờ bên kia bằng định lí Thalès.", answer: "Chọn điểm A bên kia sông, B, C bên này sao cho tạo tam giác; dựng MN ∥ BC trên bờ mình, đo các đoạn đo được rồi dùng tỉ số AM/AB = MN/BC để tính khoảng cách cần tìm." },
    ],
  },

  // ============================ BÀI 25. PHƯƠNG TRÌNH BẬC NHẤT ============================
  {
    id: "k8-25",
    theory: [
      {
        h: "Phương trình bậc nhất một ẩn",
        en: "Linear equations in one variable",
        points: [
          "**Phương trình bậc nhất một ẩn** (linear equation) có dạng ax + b = 0, với a, b là số đã biết, **a ≠ 0**; x là **ẩn** (unknown).",
          "Giá trị của x làm hai vế bằng nhau gọi là **nghiệm** (solution) của phương trình.",
        ],
      },
      {
        h: "Cách giải",
        en: "How to solve",
        points: [
          "**Quy tắc chuyển vế:** chuyển một hạng tử từ vế này sang vế kia thì phải **đổi dấu** hạng tử đó.",
          "**Quy tắc nhân (chia):** nhân hoặc chia cả hai vế với cùng một số khác 0.",
          "ax + b = 0 ⇔ ax = −b ⇔ x = −b/a. Ví dụ: 3x − 12 = 0 ⇔ 3x = 12 ⇔ x = 4.",
        ],
      },
    ],
    remember: [
      "ax + b = 0 (a ≠ 0) có đúng một nghiệm x = −b/a.",
      "Chuyển vế phải đổi dấu.",
      "Giải xong nên thử lại bằng cách thay nghiệm vào phương trình.",
    ],
    sentences: [
      { en: "Solve the equation three x minus twelve equals zero.", vi: "Giải phương trình 3x − 12 = 0." },
      { en: "Move the term to the other side and change its sign.", vi: "Chuyển hạng tử sang vế kia và đổi dấu." },
      { en: "The solution is x equals four.", vi: "Nghiệm là x = 4." },
    ],
    mcq: [
      { q: "Phương trình nào là phương trình bậc nhất một ẩn?", options: ["x² − 1 = 0", "2x + 5 = 0", "0x + 3 = 0", "1/x = 2"], answer: 1 },
      { q: "Nghiệm của 2x − 8 = 0 là", options: ["−4", "4", "6", "16"], answer: 1 },
      { q: "5x + 7 = 2x − 2 có nghiệm là", options: ["x = −3", "x = 3", "x = −5/3", "x = 9"], answer: 0 },
      { q: "x = 2 là nghiệm của phương trình", options: ["3x + 1 = 5", "4x − 8 = 0", "x + 2 = 0", "2x = 1"], answer: 1 },
    ],
    tf: [
      { q: "Khi chuyển vế ta phải đổi dấu hạng tử.", answer: true },
      { q: "Phương trình 0x + 5 = 0 là phương trình bậc nhất một ẩn.", answer: false },
      { q: "Phương trình 3x = 0 có nghiệm x = 0.", answer: true },
      { q: "Chia cả hai vế của phương trình cho 0 vẫn được phương trình tương đương.", answer: false },
    ],
    fill: [
      { q: "x is the ___ in the equation.", vi: "x là ẩn của phương trình.", answer: "unknown" },
      { q: "x = 4 is the ___ of the equation.", vi: "x = 4 là nghiệm của phương trình.", answer: "solution" },
      { q: "We ___ the equation to find x.", vi: "Ta giải phương trình để tìm x.", answer: "solve" },
    ],
    essay: [
      { q: "Giải phương trình: 3(x − 2) = x + 4.", answer: "3x − 6 = x + 4 ⇔ 2x = 10 ⇔ x = 5. Thử lại: 3 · 3 = 9 = 5 + 4. Đúng." },
      { q: "Tìm số biết rằng gấp ba số đó rồi trừ đi 7 thì được 20.", answer: "Gọi số đó là x: 3x − 7 = 20 ⇔ 3x = 27 ⇔ x = 9." },
    ],
  },

  // ============================ BÀI 35. ĐỊNH LÍ PYTHAGORE ============================
  {
    id: "k8-35",
    theory: [
      {
        h: "Định lí Pythagore",
        en: "Pythagoras' theorem",
        points: [
          "Trong một **tam giác vuông** (right triangle), bình phương **cạnh huyền** (hypotenuse) bằng tổng các bình phương của hai **cạnh góc vuông** (legs).",
          "Tam giác ABC vuông tại A: **BC² = AB² + AC²**.",
          "Ví dụ: AB = 3 cm, AC = 4 cm thì BC² = 9 + 16 = 25, nên BC = 5 cm.",
        ],
        table: {
          head: ["AB", "AC", "BC"],
          rows: [
            ["3", "4", "5"],
            ["6", "8", "10"],
            ["5", "12", "13"],
          ],
        },
      },
      {
        h: "Định lí Pythagore đảo",
        en: "The converse",
        points: [
          "Nếu một tam giác có bình phương một cạnh bằng tổng các bình phương của hai cạnh kia thì tam giác đó là **tam giác vuông**.",
          "Ứng dụng: kiểm tra góc vuông (quy tắc 3 – 4 – 5 của thợ xây), tính khoảng cách, chiều cao.",
        ],
      },
    ],
    remember: [
      "Tam giác ABC vuông tại A ⇔ BC² = AB² + AC².",
      "Cạnh huyền là cạnh dài nhất của tam giác vuông.",
      "Tìm cạnh góc vuông: AB² = BC² − AC².",
    ],
    sentences: [
      { en: "The hypotenuse is the longest side.", vi: "Cạnh huyền là cạnh dài nhất." },
      { en: "A squared plus b squared equals c squared.", vi: "a² + b² = c²." },
      { en: "This triangle is a right triangle because five squared equals three squared plus four squared.", vi: "Tam giác này vuông vì 5² = 3² + 4²." },
    ],
    mcq: [
      { q: "Tam giác vuông có hai cạnh góc vuông 6 cm và 8 cm. Cạnh huyền dài", options: ["10 cm", "12 cm", "14 cm", "100 cm"], answer: 0 },
      { q: "Tam giác vuông có cạnh huyền 13 cm, một cạnh góc vuông 5 cm. Cạnh còn lại dài", options: ["8 cm", "12 cm", "18 cm", "√194 cm"], answer: 1 },
      { q: "Bộ ba độ dài nào là ba cạnh của một tam giác vuông?", options: ["2, 3, 4", "4, 5, 6", "7, 24, 25", "5, 6, 7"], answer: 2 },
      { q: "Trong tam giác ABC vuông tại A, cạnh huyền là", options: ["AB", "AC", "BC", "đường cao AH"], answer: 2 },
    ],
    tf: [
      { q: "Cạnh huyền là cạnh dài nhất của tam giác vuông.", answer: true },
      { q: "Tam giác có ba cạnh 5 cm, 6 cm, 7 cm là tam giác vuông.", answer: false },
      { q: "Nếu BC² = AB² + AC² thì tam giác ABC vuông tại A.", answer: true },
      { q: "Định lí Pythagore đúng với mọi tam giác.", answer: false },
    ],
    fill: [
      { q: "The longest side of a right triangle is the ___.", vi: "Cạnh dài nhất của tam giác vuông là cạnh huyền.", answer: "hypotenuse" },
      { q: "The two shorter sides are the ___.", vi: "Hai cạnh ngắn hơn là hai cạnh góc vuông.", answer: "legs" },
      { q: "A squared plus b squared equals c ___.", vi: "a bình phương cộng b bình phương bằng c bình phương.", answer: "squared" },
    ],
    essay: [
      { q: "Một chiếc thang dài 5 m dựa vào tường, chân thang cách chân tường 3 m. Đầu thang chạm tường ở độ cao bao nhiêu?", answer: "Độ cao h: h² = 5² − 3² = 25 − 9 = 16 ⇒ h = 4 m." },
      { q: "Một sân trường hình chữ nhật dài 12 m, rộng 5 m. Tính độ dài đường chéo của sân.", answer: "Đường chéo chia sân thành hai tam giác vuông: d² = 12² + 5² = 144 + 25 = 169 ⇒ d = 13 m." },
    ],
  },
];
