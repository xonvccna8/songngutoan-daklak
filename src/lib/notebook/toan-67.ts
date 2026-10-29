// Vở ghi Toán 6, 7 — các bài trọng tâm. Bám SGK Kết nối tri thức với cuộc sống.
import type { NoteLesson } from "@/lib/notebook/types";

export const NOTES_TOAN_67: NoteLesson[] = [
  // ============================ TOÁN 6 · BÀI 10 ============================
  {
    id: "k6-10",
    theory: [
      {
        h: "Số nguyên tố và hợp số",
        en: "Prime and composite numbers",
        points: [
          "**Số nguyên tố** (prime number) là số tự nhiên lớn hơn 1, chỉ có hai ước là 1 và chính nó. Ví dụ: 2, 3, 5, 7, 11, 13.",
          "**Hợp số** (composite number) là số tự nhiên lớn hơn 1, có nhiều hơn hai ước. Ví dụ: 4, 6, 8, 9, 10.",
          "Số 0 và số 1 **không phải** số nguyên tố, cũng **không phải** hợp số.",
          "2 là số nguyên tố chẵn duy nhất.",
        ],
      },
      {
        h: "Phân tích một số ra thừa số nguyên tố",
        en: "Prime factorisation",
        points: [
          "**Phân tích ra thừa số nguyên tố** (prime factorisation) là viết số đó dưới dạng tích các thừa số nguyên tố.",
          "Cách làm: chia liên tiếp cho các số nguyên tố từ nhỏ đến lớn (2, 3, 5, 7…) cho đến khi thương bằng 1.",
          "Ví dụ: 60 = 2 · 2 · 3 · 5 = 2² · 3 · 5.",
        ],
        table: {
          head: ["Số", "Phân tích", "Viết gọn"],
          rows: [
            ["12", "2 · 2 · 3", "2² · 3"],
            ["45", "3 · 3 · 5", "3² · 5"],
            ["100", "2 · 2 · 5 · 5", "2² · 5²"],
          ],
        },
      },
    ],
    remember: [
      "Số nguyên tố chỉ có hai ước: 1 và chính nó.",
      "Hợp số có nhiều hơn hai ước; 0 và 1 không là số nguyên tố, không là hợp số.",
      "Mọi hợp số đều phân tích được ra thừa số nguyên tố, và chỉ có một kết quả (không kể thứ tự).",
    ],
    sentences: [
      { en: "A prime number has exactly two factors.", vi: "Số nguyên tố có đúng hai ước." },
      { en: "Nine is a composite number.", vi: "Chín là một hợp số." },
      { en: "Sixty equals two squared times three times five.", vi: "Sáu mươi bằng hai bình phương nhân ba nhân năm." },
    ],
    mcq: [
      { q: "Số nào là số nguyên tố?", options: ["1", "9", "17", "21"], answer: 2 },
      { q: "Số nào là hợp số?", options: ["2", "13", "15", "19"], answer: 2 },
      { q: "Phân tích 36 ra thừa số nguyên tố được", options: ["4 · 9", "2² · 3²", "6²", "2 · 18"], answer: 1 },
      { q: "Số nguyên tố chẵn duy nhất là", options: ["0", "2", "4", "6"], answer: 1 },
    ],
    tf: [
      { q: "Số 1 là số nguyên tố.", answer: false },
      { q: "Mọi số nguyên tố đều là số lẻ.", answer: false },
      { q: "51 là hợp số vì 51 = 3 · 17.", answer: true },
      { q: "2² · 3 · 5 là kết quả phân tích số 60 ra thừa số nguyên tố.", answer: true },
    ],
    fill: [
      { q: "Seven is a ___ number.", vi: "Bảy là một số nguyên tố.", answer: "prime" },
      { q: "Ten is a ___ number.", vi: "Mười là một hợp số.", answer: "composite" },
      { q: "Two and three are the prime ___ of six.", vi: "Hai và ba là các thừa số nguyên tố của sáu.", answer: "factors" },
    ],
    essay: [
      { q: "Phân tích các số 84 và 90 ra thừa số nguyên tố.", answer: "84 = 2² · 3 · 7; 90 = 2 · 3² · 5." },
      { q: "Bạn An nói: “Tổng của hai số nguyên tố luôn là số chẵn.” Bạn An nói đúng không? Cho ví dụ.", answer: "Sai. Ví dụ 2 + 3 = 5 là số lẻ. Khẳng định chỉ đúng khi cả hai số nguyên tố đều lẻ." },
    ],
  },

  // ============================ TOÁN 6 · BÀI 23 ============================
  {
    id: "k6-23",
    theory: [
      {
        h: "Mở rộng khái niệm phân số",
        en: "Extending fractions",
        points: [
          "**Phân số** (fraction) có dạng a/b với a, b là số nguyên, b ≠ 0. a là **tử số** (numerator), b là **mẫu số** (denominator).",
          "Mỗi số nguyên n đều viết được dưới dạng phân số n/1.",
          "Ví dụ: −3/4 đọc là “âm ba phần tư” (negative three quarters).",
        ],
      },
      {
        h: "Hai phân số bằng nhau",
        en: "Equivalent fractions",
        points: [
          "a/b = c/d nếu **a · d = b · c**.",
          "**Tính chất cơ bản:** nhân (hoặc chia) cả tử và mẫu với cùng một số khác 0 (là ước chung) thì được phân số bằng phân số đã cho.",
          "**Rút gọn** (simplify) phân số: chia cả tử và mẫu cho ước chung lớn nhất của chúng. Ví dụ: 12/18 = 2/3.",
        ],
      },
    ],
    remember: [
      "Mẫu số của phân số luôn khác 0.",
      "a/b = c/d khi và chỉ khi a · d = b · c.",
      "Phân số tối giản là phân số mà tử và mẫu chỉ có ước chung là 1 và −1.",
    ],
    sentences: [
      { en: "Two quarters is equal to one half.", vi: "Hai phần tư bằng một phần hai." },
      { en: "The denominator cannot be zero.", vi: "Mẫu số không thể bằng không." },
      { en: "We simplify a fraction by dividing the numerator and the denominator by the same number.", vi: "Ta rút gọn phân số bằng cách chia tử và mẫu cho cùng một số." },
    ],
    mcq: [
      { q: "Phân số nào bằng 3/5?", options: ["5/3", "6/10", "6/15", "9/20"], answer: 1 },
      { q: "Rút gọn 24/36 đến tối giản được", options: ["12/18", "4/6", "2/3", "3/2"], answer: 2 },
      { q: "Biểu thức nào KHÔNG phải là phân số?", options: ["−2/7", "0/5", "4/1", "3/0"], answer: 3 },
      { q: "Tìm x biết x/4 = 6/8", options: ["2", "3", "4", "12"], answer: 1 },
    ],
    tf: [
      { q: "−1/2 = 2/−4.", answer: true },
      { q: "Phân số 8/12 đã tối giản.", answer: false },
      { q: "Mọi số nguyên đều viết được dưới dạng phân số.", answer: true },
      { q: "Nhân cả tử và mẫu với 0 ta được phân số bằng phân số ban đầu.", answer: false },
    ],
    fill: [
      { q: "In 3/4, the number 4 is the ___.", vi: "Trong phân số 3/4, số 4 là mẫu số.", answer: "denominator" },
      { q: "In 3/4, the number 3 is the ___.", vi: "Trong phân số 3/4, số 3 là tử số.", answer: "numerator" },
      { q: "1/2 and 2/4 are ___ fractions.", vi: "1/2 và 2/4 là hai phân số bằng nhau.", answer: "equivalent" },
    ],
    essay: [
      { q: "Rút gọn các phân số: 15/45; −28/42.", answer: "15/45 = 1/3 (chia cả tử và mẫu cho 15); −28/42 = −2/3 (chia cả tử và mẫu cho 14)." },
      { q: "Lớp 6A có 40 học sinh, trong đó 24 em thích bóng đá. Viết phân số tối giản chỉ phần học sinh thích bóng đá.", answer: "24/40 = 3/5. Vậy 3/5 số học sinh lớp 6A thích bóng đá." },
    ],
  },

  // ============================ TOÁN 7 · BÀI 12 ============================
  {
    id: "k7-12",
    theory: [
      {
        h: "Định lí tổng ba góc của tam giác",
        en: "The angle sum of a triangle",
        points: [
          "**Tổng ba góc** của một tam giác bằng **180°** (angle sum of a triangle).",
          "Trong tam giác ABC: ∠A + ∠B + ∠C = 180°.",
          "Cách thấy nhanh: cắt ba góc của tam giác giấy rồi ghép lại, ba góc tạo thành một **góc bẹt**.",
        ],
      },
      {
        h: "Áp dụng vào tam giác vuông và góc ngoài",
        en: "Right triangles and exterior angles",
        points: [
          "Trong **tam giác vuông**, hai góc nhọn **phụ nhau** (tổng bằng 90°).",
          "**Góc ngoài** (exterior angle) của tam giác là góc kề bù với một góc trong.",
          "Mỗi góc ngoài bằng **tổng hai góc trong không kề** với nó.",
        ],
        table: {
          head: ["∠A", "∠B", "∠C = 180° − ∠A − ∠B"],
          rows: [
            ["60°", "70°", "50°"],
            ["90°", "35°", "55°"],
            ["120°", "25°", "35°"],
          ],
        },
      },
    ],
    remember: [
      "Tổng ba góc trong một tam giác bằng 180°.",
      "Trong tam giác vuông, hai góc nhọn phụ nhau.",
      "Góc ngoài của tam giác bằng tổng hai góc trong không kề với nó.",
    ],
    sentences: [
      { en: "The angles in a triangle add up to one hundred and eighty degrees.", vi: "Tổng các góc trong một tam giác bằng 180 độ." },
      { en: "In a right triangle, the two acute angles add up to ninety degrees.", vi: "Trong tam giác vuông, hai góc nhọn có tổng bằng 90 độ." },
      { en: "An exterior angle equals the sum of the two opposite interior angles.", vi: "Góc ngoài bằng tổng hai góc trong không kề với nó." },
    ],
    mcq: [
      { q: "Tam giác ABC có ∠A = 50°, ∠B = 60°. Số đo ∠C là", options: ["60°", "70°", "80°", "110°"], answer: 1 },
      { q: "Tam giác vuông có một góc nhọn bằng 40°. Góc nhọn còn lại bằng", options: ["40°", "50°", "60°", "140°"], answer: 1 },
      { q: "Một tam giác có thể có", options: ["hai góc vuông", "hai góc tù", "một góc tù và hai góc nhọn", "ba góc 70°"], answer: 2 },
      { q: "Góc ngoài tại đỉnh C của tam giác ABC có ∠A = 45°, ∠B = 65° bằng", options: ["70°", "110°", "135°", "180°"], answer: 1 },
    ],
    tf: [
      { q: "Một tam giác có thể có hai góc vuông.", answer: false },
      { q: "Tam giác đều có mỗi góc bằng 60°.", answer: true },
      { q: "Góc ngoài của tam giác luôn lớn hơn mỗi góc trong không kề với nó.", answer: true },
      { q: "Tổng ba góc của tam giác lớn thì lớn hơn 180°.", answer: false },
    ],
    fill: [
      { q: "The angles in a triangle add up to 180 ___.", vi: "Tổng các góc trong tam giác bằng 180 độ.", answer: "degrees" },
      { q: "A triangle with a 90° angle is a ___ triangle.", vi: "Tam giác có góc 90° là tam giác vuông.", answer: "right" },
      { q: "The two acute angles of a right triangle add up to ___ degrees.", vi: "Hai góc nhọn của tam giác vuông có tổng 90 độ.", answer: "ninety" },
    ],
    essay: [
      { q: "Tam giác ABC có ∠B = 2∠C và ∠A = 75°. Tính ∠B và ∠C.", answer: "∠B + ∠C = 180° − 75° = 105°; 2∠C + ∠C = 105° nên ∠C = 35°, ∠B = 70°." },
      { q: "Giải thích vì sao một tam giác không thể có hai góc tù.", answer: "Mỗi góc tù lớn hơn 90°, nên hai góc tù có tổng lớn hơn 180°, vượt quá tổng ba góc của tam giác. Vậy tam giác có nhiều nhất một góc tù." },
    ],
  },

  // ============================ TOÁN 7 · BÀI 22 ============================
  {
    id: "k7-22",
    theory: [
      {
        h: "Định nghĩa đại lượng tỉ lệ thuận",
        en: "Direct proportion",
        points: [
          "Nếu y = k · x (k là hằng số khác 0) thì y **tỉ lệ thuận** (directly proportional) với x theo **hệ số tỉ lệ** k.",
          "Khi đó x cũng tỉ lệ thuận với y theo hệ số tỉ lệ 1/k.",
          "Ví dụ: mua táo giá 30 000 đồng/kg thì số tiền y (đồng) = 30 000 · x (kg).",
        ],
      },
      {
        h: "Tính chất",
        en: "Properties",
        points: [
          "Tỉ số hai giá trị tương ứng **luôn không đổi**: y₁/x₁ = y₂/x₂ = … = k.",
          "Tỉ số hai giá trị bất kì của đại lượng này bằng tỉ số hai giá trị tương ứng của đại lượng kia: x₁/x₂ = y₁/y₂.",
        ],
        table: {
          head: ["x (kg)", "1", "2", "3", "5"],
          rows: [["y (nghìn đồng)", "30", "60", "90", "150"]],
        },
      },
    ],
    remember: [
      "y tỉ lệ thuận với x khi y = k · x (k ≠ 0).",
      "Hai đại lượng tỉ lệ thuận: tỉ số các giá trị tương ứng luôn bằng k.",
      "x tăng bao nhiêu lần thì y cũng tăng bấy nhiêu lần.",
    ],
    sentences: [
      { en: "The cost is directly proportional to the mass.", vi: "Số tiền tỉ lệ thuận với khối lượng." },
      { en: "The constant of proportionality is thirty thousand.", vi: "Hệ số tỉ lệ là ba mươi nghìn." },
      { en: "If x doubles, y also doubles.", vi: "Nếu x gấp đôi thì y cũng gấp đôi." },
    ],
    mcq: [
      { q: "y tỉ lệ thuận với x theo hệ số 3. Khi x = 4 thì y bằng", options: ["7", "12", "4/3", "3/4"], answer: 1 },
      { q: "Công thức nào cho y tỉ lệ thuận với x?", options: ["y = x + 2", "y = 5/x", "y = −2x", "y = x²"], answer: 2 },
      { q: "5 kg gạo giá 100 000 đồng. 8 kg gạo cùng loại giá", options: ["120 000 đồng", "160 000 đồng", "180 000 đồng", "800 000 đồng"], answer: 1 },
      { q: "y tỉ lệ thuận với x, khi x = 2 thì y = 10. Hệ số tỉ lệ của y đối với x là", options: ["2", "5", "10", "20"], answer: 1 },
    ],
    tf: [
      { q: "Chu vi hình vuông tỉ lệ thuận với độ dài cạnh.", answer: true },
      { q: "Diện tích hình vuông tỉ lệ thuận với độ dài cạnh.", answer: false },
      { q: "Nếu y = 4x thì x tỉ lệ thuận với y theo hệ số 1/4.", answer: true },
      { q: "Trong hai đại lượng tỉ lệ thuận, x tăng thì y luôn giảm.", answer: false },
    ],
    fill: [
      { q: "y is directly ___ to x.", vi: "y tỉ lệ thuận với x.", answer: "proportional" },
      { q: "k is the ___ of proportionality.", vi: "k là hệ số tỉ lệ.", answer: "constant" },
      { q: "If x ___, y doubles too.", vi: "Nếu x gấp đôi thì y cũng gấp đôi.", answer: "doubles" },
    ],
    essay: [
      { q: "Ba tổ trồng cây, số cây tỉ lệ thuận với số học sinh: tổ 1 có 8 em, tổ 2 có 10 em, tổ 3 có 12 em. Cả ba tổ trồng được 60 cây. Tính số cây mỗi tổ.", answer: "Gọi số cây là a, b, c: a/8 = b/10 = c/12 = (a + b + c)/30 = 60/30 = 2. Vậy a = 16, b = 20, c = 24 cây." },
      { q: "Một ô tô đi 120 km hết 9 lít xăng. Hỏi đi 200 km hết bao nhiêu lít xăng (giả sử lượng xăng tỉ lệ thuận với quãng đường)?", answer: "Số lít xăng = 9 · 200/120 = 15 lít." },
    ],
  },
];
