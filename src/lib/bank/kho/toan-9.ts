// Ngân hàng câu hỏi Toán 9 — các bài trọng tâm. Câu hỏi tự soạn theo SGK Kết nối tri thức + YCCĐ.
import { mc, nu, sp, tf, tx, type KhoQuestion } from "@/lib/bank/kho/helpers";

const T9 = "k9-11", Q9 = "k9-19";

export const KHO_TOAN_9: KhoQuestion[] = [
  // ===================== Bài 11. Tỉ số lượng giác của góc nhọn =====================
  mc(T9, "01", "K", 1, ["sin α = …", "sin α = …"],
    [["opposite / hypotenuse", "cạnh đối / cạnh huyền"], ["adjacent / hypotenuse", "cạnh kề / cạnh huyền"], ["opposite / adjacent", "cạnh đối / cạnh kề"], ["adjacent / opposite", "cạnh kề / cạnh đối"]], 0,
    ["SOH: Sine = Opposite / Hypotenuse.", "SOH: sin = đối / huyền."]),
  mc(T9, "02", "K", 1, ["cos 60° = …", "cos 60° = …"],
    [["1/2", "1/2"], ["√3/2", "√3/2"], ["√2/2", "√2/2"], ["1", "1"]], 0,
    ["cos 60° = sin 30° = 1/2.", "cos 60° = sin 30° = 1/2."]),
  mc(T9, "03", "U", 1, ["Right triangle ABC (right angle at A): AB = 6, AC = 8, BC = 10. tan B = …", "Tam giác ABC vuông tại A: AB = 6, AC = 8, BC = 10. tan B = …"],
    [["4/3", "4/3"], ["3/4", "3/4"], ["3/5", "3/5"], ["4/5", "4/5"]], 0,
    ["tan B = opposite / adjacent = AC / AB = 8/6 = 4/3.", "tan B = đối / kề = AC / AB = 8/6 = 4/3."]),
  tf(T9, "04", "U", 1, ["sin 40° = cos 50°.", "sin 40° = cos 50°."], true,
    ["40° + 50° = 90°: sine of an angle equals cosine of its complement.", "40° + 50° = 90°: sin góc này bằng cos góc phụ với nó."]),
  tf(T9, "05", "K", 1, ["For an acute angle α, sin α can be greater than 1.", "Với góc nhọn α, sin α có thể lớn hơn 1."], false,
    ["The opposite side is shorter than the hypotenuse, so 0 < sin α < 1.", "Cạnh đối ngắn hơn cạnh huyền nên 0 < sin α < 1."]),
  nu(T9, "06", "A", 1, ["A ramp is 10 m long and makes a 30° angle with the ground. How high is the top of the ramp (m)?", "Một con dốc dài 10 m, nghiêng 30° so với mặt đất. Đỉnh dốc cao bao nhiêu mét?"], 5, "m",
    ["Height = length · sin 30°.", "Độ cao = độ dài dốc · sin 30°."],
    ["10 · 1/2 = 5 m.", "10 · 1/2 = 5 m."]),
  tx(T9, "07", "K", 1, ["Type the English word for “cạnh kề”: ___ side.", "Gõ từ tiếng Anh còn thiếu của “cạnh kề”: ___ side."], ["adjacent"], ["“adjacent side” = cạnh kề.", "“adjacent side” nghĩa là cạnh kề."]),
  sp(T9, "08", 1, "Sine is opposite over hypotenuse.", "Sin bằng cạnh đối chia cạnh huyền"),

  // ===================== Bài 19. Phương trình bậc hai một ẩn =====================
  mc(Q9, "01", "K", 1, ["Which is a quadratic equation in one variable?", "Phương trình nào là phương trình bậc hai một ẩn?"],
    [["2x² − 5x + 1 = 0", "2x² − 5x + 1 = 0"], ["3x − 1 = 0", "3x − 1 = 0"], ["0x² + 2x = 0", "0x² + 2x = 0"], ["x³ − 1 = 0", "x³ − 1 = 0"]], 0,
    ["ax² + bx + c = 0 with a ≠ 0.", "Dạng ax² + bx + c = 0 với a ≠ 0."]),
  nu(Q9, "02", "K", 1, ["Find the discriminant Δ of x² − 4x − 5 = 0.", "Tính biệt thức Δ của phương trình x² − 4x − 5 = 0."], 36, "",
    ["Δ = b² − 4ac with a = 1, b = −4, c = −5.", "Δ = b² − 4ac với a = 1, b = −4, c = −5."],
    ["Δ = 16 + 20 = 36.", "Δ = 16 + 20 = 36."]),
  mc(Q9, "03", "U", 1, ["The equation x² − 10x + 25 = 0 has…", "Phương trình x² − 10x + 25 = 0 có…"],
    [["a double root x = 5", "nghiệm kép x = 5"], ["two distinct roots", "hai nghiệm phân biệt"], ["no real roots", "vô nghiệm"], ["a double root x = −5", "nghiệm kép x = −5"]], 0,
    ["Δ = 100 − 100 = 0, x = 10 / 2 = 5.", "Δ = 100 − 100 = 0, x = 10 / 2 = 5."]),
  tf(Q9, "04", "U", 1, ["The equation x² + x + 3 = 0 has no real roots.", "Phương trình x² + x + 3 = 0 vô nghiệm."], true,
    ["Δ = 1 − 12 = −11 < 0.", "Δ = 1 − 12 = −11 < 0."]),
  nu(Q9, "05", "A", 1, ["Solve x² − 5x + 6 = 0. Give the larger root.", "Giải phương trình x² − 5x + 6 = 0. Ghi nghiệm lớn hơn."], 3, "",
    ["Δ = 25 − 24 = 1; x = (5 ± 1) / 2.", "Δ = 25 − 24 = 1; x = (5 ± 1) / 2."],
    ["x₁ = 3, x₂ = 2. The larger root is 3.", "x₁ = 3, x₂ = 2. Nghiệm lớn hơn là 3."]),
  nu(Q9, "06", "A", 1, ["A rectangle is 4 m longer than it is wide. Its area is 60 m². Find its width (m).", "Một hình chữ nhật có chiều dài hơn chiều rộng 4 m và diện tích 60 m². Tính chiều rộng (m)."], 6, "m",
    ["Let x be the width: x(x + 4) = 60.", "Gọi chiều rộng là x: x(x + 4) = 60."],
    ["x² + 4x − 60 = 0, x = 6 (x = −10 is rejected).", "x² + 4x − 60 = 0, x = 6 (loại x = −10)."]),
  tx(Q9, "07", "K", 1, ["Type the English word for “biệt thức (Δ)”.", "Gõ từ tiếng Anh của “biệt thức (Δ)”."], ["discriminant", "the discriminant"], ["“discriminant” = biệt thức.", "“discriminant” nghĩa là biệt thức."]),
  sp(Q9, "08", 1, "The discriminant is b squared minus four a c.", "Biệt thức bằng b bình phương trừ bốn ac"),
];
