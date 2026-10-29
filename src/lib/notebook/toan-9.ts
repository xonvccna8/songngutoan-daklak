// Vở ghi Toán 9 — các bài trọng tâm. Bám SGK Kết nối tri thức với cuộc sống.
import type { NoteLesson } from "@/lib/notebook/types";

export const NOTES_TOAN_9: NoteLesson[] = [
  // ============================ BÀI 11. TỈ SỐ LƯỢNG GIÁC ============================
  {
    id: "k9-11",
    theory: [
      {
        h: "Tỉ số lượng giác của góc nhọn",
        en: "Trigonometric ratios",
        points: [
          "Cho tam giác ABC vuông tại A, góc nhọn B = α. Với góc α: AC là **cạnh đối** (opposite side), AB là **cạnh kề** (adjacent side), BC là **cạnh huyền** (hypotenuse).",
          "**sin α** = đối / huyền; **cos α** = kề / huyền; **tan α** = đối / kề; **cot α** = kề / đối.",
          "Mẹo nhớ tiếng Anh: **SOH – CAH – TOA** (Sine = Opposite/Hypotenuse, Cosine = Adjacent/Hypotenuse, Tangent = Opposite/Adjacent).",
        ],
      },
      {
        h: "Tỉ số lượng giác của hai góc phụ nhau",
        en: "Complementary angles",
        points: [
          "Nếu α + β = 90° thì **sin α = cos β**, **cos α = sin β**, **tan α = cot β**.",
          "Với góc nhọn α: 0 < sin α < 1 và 0 < cos α < 1.",
        ],
        table: {
          head: ["Góc", "sin", "cos", "tan"],
          rows: [
            ["30°", "1/2", "√3/2", "√3/3"],
            ["45°", "√2/2", "√2/2", "1"],
            ["60°", "√3/2", "1/2", "√3"],
          ],
        },
      },
    ],
    remember: [
      "sin = đối/huyền, cos = kề/huyền, tan = đối/kề, cot = kề/đối.",
      "Hai góc phụ nhau: sin góc này bằng cos góc kia.",
      "Sin và cos của góc nhọn luôn nằm giữa 0 và 1.",
    ],
    sentences: [
      { en: "Sine is opposite over hypotenuse.", vi: "Sin bằng cạnh đối chia cạnh huyền." },
      { en: "Cosine is adjacent over hypotenuse.", vi: "Côsin bằng cạnh kề chia cạnh huyền." },
      { en: "The sine of thirty degrees is one half.", vi: "Sin 30 độ bằng một phần hai." },
    ],
    mcq: [
      { q: "Tam giác ABC vuông tại A, AB = 3, AC = 4, BC = 5. sin B bằng", options: ["3/5", "4/5", "3/4", "4/3"], answer: 1 },
      { q: "cos 60° bằng", options: ["1/2", "√2/2", "√3/2", "1"], answer: 0 },
      { q: "sin 35° bằng", options: ["sin 55°", "cos 35°", "cos 55°", "tan 55°"], answer: 2 },
      { q: "tan α = đối / ?", options: ["huyền", "kề", "đối", "cạnh bất kì"], answer: 1 },
    ],
    tf: [
      { q: "sin α luôn nhỏ hơn 1 với α là góc nhọn.", answer: true },
      { q: "tan 45° = 1.", answer: true },
      { q: "cos α = cạnh đối / cạnh huyền.", answer: false },
      { q: "sin 30° = cos 30°.", answer: false },
    ],
    fill: [
      { q: "Sine is opposite over ___.", vi: "Sin bằng cạnh đối chia cạnh huyền.", answer: "hypotenuse" },
      { q: "Tangent is opposite over ___.", vi: "Tang bằng cạnh đối chia cạnh kề.", answer: "adjacent" },
      { q: "SOH CAH TOA helps us remember the trigonometric ___.", vi: "SOH CAH TOA giúp nhớ các tỉ số lượng giác.", answer: "ratios" },
    ],
    essay: [
      { q: "Một cái thang dài 4 m dựa vào tường, tạo với mặt đất góc 60°. Đầu thang cao bao nhiêu mét? (lấy √3 ≈ 1,73)", answer: "Độ cao h = 4 · sin 60° = 4 · √3/2 = 2√3 ≈ 3,46 m." },
      { q: "Tam giác ABC vuông tại A có BC = 10 cm, ∠B = 30°. Tính AC và AB.", answer: "AC = BC · sin B = 10 · 1/2 = 5 cm; AB = BC · cos B = 10 · √3/2 = 5√3 ≈ 8,66 cm." },
    ],
  },

  // ============================ BÀI 19. PHƯƠNG TRÌNH BẬC HAI ============================
  {
    id: "k9-19",
    theory: [
      {
        h: "Phương trình bậc hai một ẩn",
        en: "Quadratic equations",
        points: [
          "**Phương trình bậc hai một ẩn** (quadratic equation) có dạng ax² + bx + c = 0, với **a ≠ 0**.",
          "Ví dụ: x² − 5x + 6 = 0 (a = 1, b = −5, c = 6).",
        ],
      },
      {
        h: "Công thức nghiệm",
        en: "The quadratic formula",
        points: [
          "**Biệt thức** (discriminant): Δ = b² − 4ac.",
          "Δ > 0: phương trình có **hai nghiệm phân biệt** x₁,₂ = (−b ± √Δ) / (2a).",
          "Δ = 0: phương trình có **nghiệm kép** x₁ = x₂ = −b / (2a).",
          "Δ < 0: phương trình **vô nghiệm**.",
        ],
        table: {
          head: ["Phương trình", "Δ", "Nghiệm"],
          rows: [
            ["x² − 5x + 6 = 0", "1", "x₁ = 3, x₂ = 2"],
            ["x² − 4x + 4 = 0", "0", "x = 2 (nghiệm kép)"],
            ["x² + x + 1 = 0", "−3", "vô nghiệm"],
          ],
        },
      },
    ],
    remember: [
      "ax² + bx + c = 0 (a ≠ 0) là phương trình bậc hai.",
      "Δ = b² − 4ac quyết định số nghiệm.",
      "Nếu a và c trái dấu thì Δ > 0, phương trình luôn có hai nghiệm phân biệt.",
    ],
    sentences: [
      { en: "This is a quadratic equation.", vi: "Đây là một phương trình bậc hai." },
      { en: "The discriminant is b squared minus four a c.", vi: "Biệt thức bằng b bình phương trừ 4ac." },
      { en: "The equation has two distinct roots.", vi: "Phương trình có hai nghiệm phân biệt." },
    ],
    mcq: [
      { q: "Phương trình nào là phương trình bậc hai một ẩn?", options: ["2x + 1 = 0", "x² − 3x + 2 = 0", "0x² + x = 0", "x³ = 8"], answer: 1 },
      { q: "Δ của phương trình 2x² − 3x − 5 = 0 là", options: ["−31", "31", "49", "1"], answer: 2 },
      { q: "Phương trình x² − 6x + 9 = 0 có", options: ["hai nghiệm phân biệt", "nghiệm kép x = 3", "nghiệm kép x = −3", "vô nghiệm"], answer: 1 },
      { q: "Phương trình x² + 2x + 5 = 0", options: ["có hai nghiệm phân biệt", "có nghiệm kép", "vô nghiệm", "có nghiệm x = −1"], answer: 2 },
    ],
    tf: [
      { q: "Nếu Δ < 0 thì phương trình bậc hai vô nghiệm.", answer: true },
      { q: "Phương trình x² = 4 có một nghiệm duy nhất x = 2.", answer: false },
      { q: "Phương trình 3x² − x − 7 = 0 có hai nghiệm phân biệt vì a và c trái dấu.", answer: true },
      { q: "Với phương trình bậc hai, hệ số a có thể bằng 0.", answer: false },
    ],
    fill: [
      { q: "Δ = b² − 4ac is the ___.", vi: "Δ = b² − 4ac là biệt thức.", answer: "discriminant" },
      { q: "x² − 5x + 6 = 0 is a ___ equation.", vi: "x² − 5x + 6 = 0 là một phương trình bậc hai.", answer: "quadratic" },
      { q: "When Δ < 0, the equation has no real ___.", vi: "Khi Δ < 0, phương trình không có nghiệm.", answer: "roots" },
    ],
    essay: [
      { q: "Giải phương trình 2x² − 3x − 5 = 0.", answer: "Δ = 9 + 40 = 49, √Δ = 7. x₁ = (3 + 7)/4 = 5/2; x₂ = (3 − 7)/4 = −1." },
      { q: "Một mảnh vườn hình chữ nhật có chiều dài hơn chiều rộng 3 m và diện tích 40 m². Tính các kích thước.", answer: "Gọi chiều rộng x (m, x > 0): x(x + 3) = 40 ⇔ x² + 3x − 40 = 0, Δ = 169, x = 5 (nhận) hoặc x = −8 (loại). Chiều rộng 5 m, chiều dài 8 m." },
    ],
  },
];
