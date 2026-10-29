// Mục lục SGK Toán 6–9 bộ "Kết nối tri thức với cuộc sống" (đối chiếu mục lục SGK, 10/2026)
// + Yêu cầu cần đạt (YCCĐ) theo Chương trình GDPT 2018 môn Toán (Thông tư 32/2018/TT-BGDĐT).
// YCCĐ chi tiết: LỚP 8 và chương Tam giác lớp 7. Bài chưa có YCCĐ dùng 1 YCCĐ chung (xem curriculum/index.ts) — tổ chuyên môn bổ sung sau.
// LƯU Ý: câu chữ YCCĐ bám sát CT 2018 nhưng chưa đối chiếu từng chữ với văn bản gốc — tổ chuyên môn cần rà lại.
import type { Strand } from "@/lib/curriculum/types";

type RawOutcome = [vi: string, en: string];
type RawLesson = [no: number, vi: string, en: string, outcomes?: RawOutcome[]];
type RawChapter = [no: number, strand: Strand, vi: string, en: string, lessons: RawLesson[]];

export const KNTT: Record<number, RawChapter[]> = {
  6: [
    [1, "sd", "Tập hợp các số tự nhiên", "The set of natural numbers", [
      [1, "Tập hợp", "Sets"],
      [2, "Cách ghi số tự nhiên", "Writing natural numbers"],
      [3, "Thứ tự trong tập hợp các số tự nhiên", "Ordering natural numbers"],
      [4, "Phép cộng và phép trừ số tự nhiên", "Addition and subtraction of natural numbers"],
      [5, "Phép nhân và phép chia số tự nhiên", "Multiplication and division of natural numbers"],
      [6, "Luỹ thừa với số mũ tự nhiên", "Powers with natural exponents"],
      [7, "Thứ tự thực hiện các phép tính", "Order of operations"],
    ]],
    [2, "sd", "Tính chia hết trong tập hợp các số tự nhiên", "Divisibility of natural numbers", [
      [8, "Quan hệ chia hết và tính chất", "Divisibility and its properties"],
      [9, "Dấu hiệu chia hết", "Divisibility rules"],
      [10, "Số nguyên tố", "Prime numbers"],
      [11, "Ước chung. Ước chung lớn nhất", "Common factors. Greatest common factor"],
      [12, "Bội chung. Bội chung nhỏ nhất", "Common multiples. Least common multiple"],
    ]],
    [3, "sd", "Số nguyên", "Integers", [
      [13, "Tập hợp các số nguyên", "The set of integers"],
      [14, "Phép cộng và phép trừ số nguyên", "Addition and subtraction of integers"],
      [15, "Quy tắc dấu ngoặc", "Rules for brackets"],
      [16, "Phép nhân số nguyên", "Multiplication of integers"],
      [17, "Phép chia hết. Ước và bội của một số nguyên", "Exact division. Factors and multiples of an integer"],
    ]],
    [4, "hh", "Một số hình phẳng trong thực tiễn", "Plane shapes in real life", [
      [18, "Hình tam giác đều. Hình vuông. Hình lục giác đều", "Equilateral triangles. Squares. Regular hexagons"],
      [19, "Hình chữ nhật. Hình thoi. Hình bình hành. Hình thang cân", "Rectangles. Rhombuses. Parallelograms. Isosceles trapezoids"],
      [20, "Chu vi và diện tích của một số tứ giác đã học", "Perimeter and area of quadrilaterals"],
    ]],
    [5, "hh", "Tính đối xứng của hình phẳng trong tự nhiên", "Symmetry of plane shapes in nature", [
      [21, "Hình có trục đối xứng", "Shapes with a line of symmetry"],
      [22, "Hình có tâm đối xứng", "Shapes with a centre of symmetry"],
    ]],
    [6, "sd", "Phân số", "Fractions", [
      [23, "Mở rộng phân số. Phân số bằng nhau", "Extending fractions. Equal fractions"],
      [24, "So sánh phân số. Hỗn số dương", "Comparing fractions. Positive mixed numbers"],
      [25, "Phép cộng và phép trừ phân số", "Adding and subtracting fractions"],
      [26, "Phép nhân và phép chia phân số", "Multiplying and dividing fractions"],
      [27, "Hai bài toán về phân số", "Two problems with fractions"],
    ]],
    [7, "sd", "Số thập phân", "Decimals", [
      [28, "Số thập phân", "Decimals"],
      [29, "Tính toán với số thập phân", "Calculating with decimals"],
      [30, "Làm tròn và ước lượng", "Rounding and estimation"],
      [31, "Một số bài toán về tỉ số và tỉ số phần trăm", "Problems with ratios and percentages"],
    ]],
    [8, "hh", "Những hình hình học cơ bản", "Basic geometric figures", [
      [32, "Điểm và đường thẳng", "Points and lines"],
      [33, "Điểm nằm giữa hai điểm. Tia", "A point between two points. Rays"],
      [34, "Đoạn thẳng. Độ dài đoạn thẳng", "Line segments. Length of a segment"],
      [35, "Trung điểm của đoạn thẳng", "Midpoint of a segment"],
      [36, "Góc", "Angles"],
      [37, "Số đo góc", "Measuring angles"],
    ]],
    [9, "tk", "Dữ liệu và xác suất thực nghiệm", "Data and experimental probability", [
      [38, "Dữ liệu và thu thập dữ liệu", "Data and data collection"],
      [39, "Bảng thống kê và biểu đồ tranh", "Statistical tables and pictograms"],
      [40, "Biểu đồ cột", "Bar charts"],
      [41, "Biểu đồ cột kép", "Double bar charts"],
      [42, "Kết quả có thể và sự kiện trong trò chơi, thí nghiệm", "Possible outcomes and events in games and experiments"],
      [43, "Xác suất thực nghiệm", "Experimental probability"],
    ]],
  ],

  7: [
    [1, "sd", "Số hữu tỉ", "Rational numbers", [
      [1, "Tập hợp các số hữu tỉ", "The set of rational numbers"],
      [2, "Cộng, trừ, nhân, chia số hữu tỉ", "Operations on rational numbers"],
      [3, "Luỹ thừa với số mũ tự nhiên của một số hữu tỉ", "Powers of a rational number"],
      [4, "Thứ tự thực hiện các phép tính. Quy tắc chuyển vế", "Order of operations. Moving terms across the equals sign"],
    ]],
    [2, "sd", "Số thực", "Real numbers", [
      [5, "Làm quen với số thập phân vô hạn tuần hoàn", "Recurring decimals"],
      [6, "Số vô tỉ. Căn bậc hai số học", "Irrational numbers. Square roots"],
      [7, "Tập hợp các số thực", "The set of real numbers"],
    ]],
    [3, "hh", "Góc và đường thẳng song song", "Angles and parallel lines", [
      [8, "Góc ở vị trí đặc biệt. Tia phân giác của một góc", "Special pairs of angles. Angle bisectors"],
      [9, "Hai đường thẳng song song và dấu hiệu nhận biết", "Parallel lines and how to recognise them"],
      [10, "Tiên đề Euclid. Tính chất của hai đường thẳng song song", "Euclid's axiom. Properties of parallel lines"],
      [11, "Định lí và chứng minh định lí", "Theorems and proofs"],
    ]],
    [4, "hh", "Tam giác bằng nhau", "Congruent triangles", [
      [12, "Tổng các góc trong một tam giác", "Angle sum of a triangle", [
        ["Giải thích được định lí về tổng các góc trong một tam giác bằng 180°.", "Explain why the angles in a triangle add up to 180°."],
      ]],
      [13, "Hai tam giác bằng nhau. Trường hợp bằng nhau thứ nhất của tam giác", "Congruent triangles. The SSS case", [
        ["Nhận biết được khái niệm hai tam giác bằng nhau.", "Recognise congruent triangles."],
        ["Giải thích được trường hợp bằng nhau cạnh – cạnh – cạnh của hai tam giác.", "Explain the side–side–side (SSS) congruence case."],
      ]],
      [14, "Trường hợp bằng nhau thứ hai và thứ ba của tam giác", "The SAS and ASA cases", [
        ["Giải thích được trường hợp bằng nhau cạnh – góc – cạnh và góc – cạnh – góc của hai tam giác.", "Explain the side–angle–side (SAS) and angle–side–angle (ASA) congruence cases."],
      ]],
      [15, "Các trường hợp bằng nhau của tam giác vuông", "Congruence of right triangles", [
        ["Giải thích được các trường hợp bằng nhau của hai tam giác vuông.", "Explain the congruence cases of right triangles."],
      ]],
      [16, "Tam giác cân. Đường trung trực của đoạn thẳng", "Isosceles triangles. Perpendicular bisectors", [
        ["Mô tả được tam giác cân và giải thích được tính chất của tam giác cân (hai cạnh bên bằng nhau, hai góc đáy bằng nhau).", "Describe isosceles triangles and explain their properties (two equal legs, two equal base angles)."],
        ["Nhận biết được đường trung trực của một đoạn thẳng và các tính chất cơ bản của đường trung trực.", "Recognise the perpendicular bisector of a segment and its basic properties."],
      ]],
    ]],
    [5, "tk", "Thu thập và biểu diễn dữ liệu", "Collecting and representing data", [
      [17, "Thu thập và phân loại dữ liệu", "Collecting and classifying data"],
      [18, "Biểu đồ hình quạt tròn", "Pie charts"],
      [19, "Biểu đồ đoạn thẳng", "Line graphs"],
    ]],
    [6, "sd", "Tỉ lệ thức và đại lượng tỉ lệ", "Proportions and proportional quantities", [
      [20, "Tỉ lệ thức", "Proportions"],
      [21, "Tính chất của dãy tỉ số bằng nhau", "Properties of equal ratios"],
      [22, "Đại lượng tỉ lệ thuận", "Direct proportion"],
      [23, "Đại lượng tỉ lệ nghịch", "Inverse proportion"],
    ]],
    [7, "sd", "Biểu thức đại số và đa thức một biến", "Algebraic expressions and polynomials in one variable", [
      [24, "Biểu thức đại số", "Algebraic expressions"],
      [25, "Đa thức một biến", "Polynomials in one variable"],
      [26, "Phép cộng và phép trừ đa thức một biến", "Adding and subtracting polynomials"],
      [27, "Phép nhân đa thức một biến", "Multiplying polynomials"],
      [28, "Phép chia đa thức một biến", "Dividing polynomials"],
    ]],
    [8, "tk", "Làm quen với biến cố và xác suất của biến cố", "Introduction to events and probability", [
      [29, "Làm quen với biến cố", "Introduction to events"],
      [30, "Làm quen với xác suất của biến cố", "Introduction to the probability of an event"],
    ]],
    [9, "hh", "Quan hệ giữa các yếu tố trong một tam giác", "Relations between parts of a triangle", [
      [31, "Quan hệ giữa góc và cạnh đối diện trong một tam giác", "Angles and opposite sides in a triangle"],
      [32, "Quan hệ giữa đường vuông góc và đường xiên", "Perpendiculars and obliques"],
      [33, "Quan hệ giữa ba cạnh của một tam giác", "The triangle inequality"],
      [34, "Sự đồng quy của ba đường trung tuyến, ba đường phân giác trong một tam giác", "Concurrency of medians and angle bisectors"],
      [35, "Sự đồng quy của ba đường trung trực, ba đường cao trong một tam giác", "Concurrency of perpendicular bisectors and altitudes"],
    ]],
    [10, "hh", "Một số hình khối trong thực tiễn", "3D shapes in real life", [
      [36, "Hình hộp chữ nhật và hình lập phương", "Cuboids and cubes"],
      [37, "Hình lăng trụ đứng tam giác và hình lăng trụ đứng tứ giác", "Right triangular and quadrilateral prisms"],
    ]],
  ],

  8: [
    [1, "sd", "Đa thức", "Polynomials", [
      [1, "Đơn thức", "Monomials", [
        ["Nhận biết được đơn thức, đơn thức thu gọn, hệ số, phần biến và bậc của đơn thức.", "Recognise monomials, simplified monomials, coefficients, variable parts and the degree of a monomial."],
        ["Nhận biết được các đơn thức đồng dạng; thực hiện được phép cộng, trừ các đơn thức đồng dạng.", "Recognise like monomials; add and subtract like monomials."],
      ]],
      [2, "Đa thức", "Polynomials", [
        ["Nhận biết được đa thức nhiều biến, đa thức thu gọn và bậc của đa thức.", "Recognise polynomials in several variables, simplified polynomials and their degree."],
        ["Tính được giá trị của đa thức khi biết giá trị của các biến.", "Evaluate a polynomial for given values of its variables."],
      ]],
      [3, "Phép cộng và phép trừ đa thức", "Adding and subtracting polynomials", [
        ["Thực hiện được phép cộng, phép trừ hai đa thức nhiều biến.", "Add and subtract polynomials in several variables."],
      ]],
      [4, "Phép nhân đa thức", "Multiplying polynomials", [
        ["Thực hiện được phép nhân đơn thức với đa thức và phép nhân đa thức với đa thức.", "Multiply a monomial by a polynomial and a polynomial by a polynomial."],
      ]],
      [5, "Phép chia đa thức cho đơn thức", "Dividing a polynomial by a monomial", [
        ["Thực hiện được phép chia hết một đơn thức cho một đơn thức, một đa thức cho một đơn thức trong những trường hợp đơn giản.", "Divide a monomial or a polynomial by a monomial exactly, in simple cases."],
      ]],
    ]],
    [2, "sd", "Hằng đẳng thức đáng nhớ và ứng dụng", "Special identities and applications", [
      [6, "Hiệu hai bình phương. Bình phương của một tổng hay một hiệu", "Difference of two squares. Square of a sum or a difference", [
        ["Nhận biết được các khái niệm đồng nhất thức, hằng đẳng thức.", "Recognise identities."],
        ["Mô tả được các hằng đẳng thức: hiệu hai bình phương, bình phương của một tổng, bình phương của một hiệu.", "Describe the identities: difference of two squares, square of a sum, square of a difference."],
      ]],
      [7, "Lập phương của một tổng. Lập phương của một hiệu", "Cube of a sum. Cube of a difference", [
        ["Mô tả được các hằng đẳng thức: lập phương của một tổng, lập phương của một hiệu.", "Describe the identities: cube of a sum, cube of a difference."],
      ]],
      [8, "Tổng và hiệu hai lập phương", "Sum and difference of two cubes", [
        ["Mô tả được các hằng đẳng thức: tổng hai lập phương, hiệu hai lập phương.", "Describe the identities: sum of two cubes, difference of two cubes."],
      ]],
      [9, "Phân tích đa thức thành nhân tử", "Factorising polynomials", [
        ["Vận dụng được các hằng đẳng thức để phân tích đa thức thành nhân tử ở dạng: đặt nhân tử chung, nhóm hạng tử, sử dụng hằng đẳng thức.", "Factorise polynomials by taking out a common factor, grouping terms and using identities."],
      ]],
    ]],
    [3, "hh", "Tứ giác", "Quadrilaterals", [
      [10, "Tứ giác", "Quadrilaterals", [
        ["Mô tả được tứ giác, tứ giác lồi.", "Describe quadrilaterals and convex quadrilaterals."],
        ["Giải thích được định lí về tổng các góc trong một tứ giác lồi bằng 360°.", "Explain why the angles of a convex quadrilateral add up to 360°."],
      ]],
      [11, "Hình thang cân", "Isosceles trapezoids", [
        ["Giải thích được tính chất về góc kề một đáy, cạnh bên, đường chéo của hình thang cân.", "Explain the properties of an isosceles trapezoid: base angles, legs and diagonals."],
        ["Nhận biết được dấu hiệu để một hình thang là hình thang cân.", "Recognise when a trapezoid is isosceles."],
      ]],
      [12, "Hình bình hành", "Parallelograms", [
        ["Giải thích được tính chất về cạnh đối, góc đối, đường chéo của hình bình hành.", "Explain the properties of a parallelogram: opposite sides, opposite angles and diagonals."],
        ["Nhận biết được dấu hiệu để một tứ giác là hình bình hành.", "Recognise when a quadrilateral is a parallelogram."],
      ]],
      [13, "Hình chữ nhật", "Rectangles", [
        ["Giải thích được tính chất về hai đường chéo của hình chữ nhật.", "Explain the property of the diagonals of a rectangle."],
        ["Nhận biết được dấu hiệu để một hình bình hành là hình chữ nhật.", "Recognise when a parallelogram is a rectangle."],
      ]],
      [14, "Hình thoi và hình vuông", "Rhombuses and squares", [
        ["Giải thích được tính chất về đường chéo của hình thoi, hình vuông.", "Explain the properties of the diagonals of a rhombus and a square."],
        ["Nhận biết được dấu hiệu để một hình bình hành là hình thoi, một hình chữ nhật là hình vuông.", "Recognise when a parallelogram is a rhombus and when a rectangle is a square."],
      ]],
    ]],
    [4, "hh", "Định lí Thalès", "Thales' theorem", [
      [15, "Định lí Thalès trong tam giác", "Thales' theorem in a triangle", [
        ["Giải thích được định lí Thalès trong tam giác (định lí thuận và đảo).", "Explain Thales' theorem in a triangle (the theorem and its converse)."],
        ["Tính được độ dài đoạn thẳng bằng cách sử dụng định lí Thalès.", "Calculate lengths of segments using Thales' theorem."],
        ["Giải quyết được một số vấn đề thực tiễn gắn với việc vận dụng định lí Thalès.", "Solve real-life problems using Thales' theorem."],
      ]],
      [16, "Đường trung bình của tam giác", "Midsegments of a triangle", [
        ["Mô tả được định nghĩa đường trung bình của tam giác; giải thích được tính chất đường trung bình của tam giác.", "Describe the midsegment of a triangle and explain its property."],
      ]],
      [17, "Tính chất đường phân giác của tam giác", "The angle bisector theorem", [
        ["Giải thích được tính chất đường phân giác trong của tam giác.", "Explain the property of an interior angle bisector of a triangle."],
      ]],
    ]],
    [5, "tk", "Dữ liệu và biểu đồ", "Data and charts", [
      [18, "Thu thập và phân loại dữ liệu", "Collecting and classifying data", [
        ["Thu thập và phân loại được dữ liệu theo các tiêu chí cho trước.", "Collect and classify data by given criteria."],
        ["Chứng tỏ được tính hợp lí của dữ liệu theo các tiêu chí toán học đơn giản.", "Show whether data are reasonable using simple mathematical criteria."],
      ]],
      [19, "Biểu diễn dữ liệu bằng bảng, biểu đồ", "Representing data in tables and charts", [
        ["Mô tả và biểu diễn được dữ liệu trên các bảng, biểu đồ thích hợp.", "Describe and represent data in suitable tables and charts."],
        ["Chuyển được dữ liệu từ dạng biểu diễn này sang dạng biểu diễn khác.", "Convert data from one representation to another."],
      ]],
      [20, "Phân tích dữ liệu thống kê dựa vào biểu đồ", "Analysing statistical data from charts", [
        ["Phát hiện được vấn đề hoặc quy luật đơn giản dựa trên phân tích số liệu thu được ở dạng bảng, biểu đồ.", "Identify simple issues or patterns by analysing data in tables and charts."],
        ["Giải quyết được những vấn đề đơn giản liên quan đến các số liệu thu được.", "Solve simple problems involving the data collected."],
      ]],
    ]],
    [6, "sd", "Phân thức đại số", "Algebraic fractions", [
      [21, "Phân thức đại số", "Algebraic fractions", [
        ["Nhận biết được các khái niệm cơ bản về phân thức đại số: định nghĩa, điều kiện xác định, giá trị của phân thức, hai phân thức bằng nhau.", "Recognise algebraic fractions: definition, domain condition, value, and equal fractions."],
      ]],
      [22, "Tính chất cơ bản của phân thức đại số", "Basic properties of algebraic fractions", [
        ["Mô tả được những tính chất cơ bản của phân thức đại số (rút gọn, quy đồng mẫu thức).", "Describe the basic properties of algebraic fractions (simplifying, finding a common denominator)."],
      ]],
      [23, "Phép cộng và phép trừ phân thức đại số", "Adding and subtracting algebraic fractions", [
        ["Thực hiện được các phép tính cộng, trừ phân thức đại số.", "Add and subtract algebraic fractions."],
      ]],
      [24, "Phép nhân và phép chia phân thức đại số", "Multiplying and dividing algebraic fractions", [
        ["Thực hiện được các phép tính nhân, chia phân thức đại số.", "Multiply and divide algebraic fractions."],
        ["Vận dụng được các tính chất giao hoán, kết hợp, phân phối và quy tắc dấu ngoặc với phân thức đại số trong tính toán.", "Use commutative, associative and distributive properties and bracket rules when calculating with algebraic fractions."],
      ]],
    ]],
    [7, "sd", "Phương trình bậc nhất và hàm số bậc nhất", "Linear equations and linear functions", [
      [25, "Phương trình bậc nhất một ẩn", "Linear equations in one variable", [
        ["Hiểu được khái niệm phương trình bậc nhất một ẩn và cách giải.", "Understand linear equations in one variable and how to solve them."],
      ]],
      [26, "Giải bài toán bằng cách lập phương trình", "Solving problems by setting up equations", [
        ["Giải quyết được một số vấn đề thực tiễn gắn với phương trình bậc nhất (ví dụ: bài toán chuyển động, năng suất, phần trăm…).", "Solve real-life problems with linear equations (e.g. motion, productivity, percentages)."],
      ]],
      [27, "Khái niệm hàm số và đồ thị của hàm số", "Functions and their graphs", [
        ["Nhận biết được những mô hình thực tế dẫn đến khái niệm hàm số; tính được giá trị của hàm số khi hàm số được cho bằng công thức.", "Recognise real-life models of functions; evaluate a function given by a formula."],
        ["Xác định được toạ độ của một điểm trên mặt phẳng toạ độ và xác định được điểm khi biết toạ độ; nhận biết được đồ thị hàm số.", "Find the coordinates of a point, plot a point from its coordinates, and recognise the graph of a function."],
      ]],
      [28, "Hàm số bậc nhất và đồ thị của hàm số bậc nhất", "Linear functions and their graphs", [
        ["Thiết lập được bảng giá trị và vẽ được đồ thị của hàm số bậc nhất y = ax + b (a ≠ 0).", "Make a table of values and draw the graph of the linear function y = ax + b (a ≠ 0)."],
        ["Vận dụng được hàm số bậc nhất và đồ thị vào giải quyết một số bài toán thực tiễn.", "Use linear functions and their graphs to solve real-life problems."],
      ]],
      [29, "Hệ số góc của đường thẳng", "The slope of a line", [
        ["Nhận biết được khái niệm hệ số góc của đường thẳng y = ax + b (a ≠ 0).", "Recognise the slope of the line y = ax + b (a ≠ 0)."],
        ["Sử dụng được hệ số góc để nhận biết và giải thích được sự cắt nhau hoặc song song của hai đường thẳng.", "Use slopes to recognise and explain whether two lines intersect or are parallel."],
      ]],
    ]],
    [8, "tk", "Mở đầu về tính xác suất của biến cố", "Introduction to calculating probability", [
      [30, "Kết quả có thể và kết quả thuận lợi", "Possible outcomes and favourable outcomes", [
        ["Mô tả được các kết quả có thể của một phép thử và các kết quả thuận lợi cho một biến cố.", "Describe the possible outcomes of an experiment and the outcomes favourable to an event."],
      ]],
      [31, "Cách tính xác suất của biến cố bằng tỉ số", "Probability as a ratio", [
        ["Sử dụng được tỉ số để mô tả xác suất của một biến cố ngẫu nhiên trong một số ví dụ đơn giản.", "Use a ratio to describe the probability of a random event in simple examples."],
      ]],
      [32, "Mối liên hệ giữa xác suất thực nghiệm với xác suất và ứng dụng", "Experimental probability versus probability", [
        ["Nhận biết được mối liên hệ giữa xác suất thực nghiệm của một biến cố với xác suất của biến cố đó qua một số ví dụ đơn giản.", "Recognise how experimental probability relates to probability in simple examples."],
      ]],
    ]],
    [9, "hh", "Tam giác đồng dạng", "Similar triangles", [
      [33, "Hai tam giác đồng dạng", "Similar triangles", [
        ["Mô tả được định nghĩa của hai tam giác đồng dạng.", "Describe the definition of similar triangles."],
      ]],
      [34, "Ba trường hợp đồng dạng của hai tam giác", "Three cases of similar triangles", [
        ["Giải thích được các trường hợp đồng dạng của hai tam giác.", "Explain the cases of similarity of two triangles."],
        ["Giải quyết được một số vấn đề thực tiễn gắn với hai tam giác đồng dạng (ví dụ: đo gián tiếp chiều cao của vật, tính khoảng cách đến vị trí không tới được).", "Solve real-life problems with similar triangles (e.g. measuring heights indirectly, finding distances to unreachable places)."],
      ]],
      [35, "Định lí Pythagore và ứng dụng", "Pythagoras' theorem and its applications", [
        ["Giải thích được định lí Pythagore.", "Explain Pythagoras' theorem."],
        ["Tính được độ dài cạnh trong tam giác vuông bằng cách sử dụng định lí Pythagore.", "Calculate side lengths in a right triangle using Pythagoras' theorem."],
        ["Giải quyết được một số vấn đề thực tiễn gắn với việc vận dụng định lí Pythagore.", "Solve real-life problems using Pythagoras' theorem."],
      ]],
      [36, "Các trường hợp đồng dạng của hai tam giác vuông", "Similarity of right triangles", [
        ["Giải thích được các trường hợp đồng dạng của hai tam giác vuông.", "Explain the cases of similarity of right triangles."],
      ]],
      [37, "Hình đồng dạng", "Similar figures", [
        ["Nhận biết được hình đồng dạng phối cảnh (hình vị tự), hình đồng dạng qua các hình ảnh cụ thể.", "Recognise similar figures, including enlargements, from concrete pictures."],
        ["Nhận biết được vẻ đẹp trong tự nhiên, nghệ thuật, kiến trúc, công nghệ… biểu hiện qua hình đồng dạng.", "Recognise beauty in nature, art, architecture and technology shown by similar figures."],
      ]],
    ]],
    [10, "hh", "Một số hình khối trong thực tiễn", "3D shapes in real life", [
      [38, "Hình chóp tam giác đều", "Regular triangular pyramids", [
        ["Mô tả (đỉnh, mặt đáy, mặt bên, cạnh bên) và tạo lập được hình chóp tam giác đều.", "Describe (apex, base, lateral faces, lateral edges) and make a regular triangular pyramid."],
        ["Tính được diện tích xung quanh, thể tích của hình chóp tam giác đều và giải quyết một số vấn đề thực tiễn liên quan.", "Calculate the lateral area and volume of a regular triangular pyramid and solve related real-life problems."],
      ]],
      [39, "Hình chóp tứ giác đều", "Regular square pyramids", [
        ["Mô tả (đỉnh, mặt đáy, mặt bên, cạnh bên) và tạo lập được hình chóp tứ giác đều.", "Describe (apex, base, lateral faces, lateral edges) and make a regular square pyramid."],
        ["Tính được diện tích xung quanh, thể tích của hình chóp tứ giác đều và giải quyết một số vấn đề thực tiễn liên quan.", "Calculate the lateral area and volume of a regular square pyramid and solve related real-life problems."],
      ]],
    ]],
  ],

  9: [
    [1, "sd", "Phương trình và hệ hai phương trình bậc nhất hai ẩn", "Linear equations and systems in two variables", [
      [1, "Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn", "Linear equations and systems of two linear equations in two variables"],
      [2, "Giải hệ hai phương trình bậc nhất hai ẩn", "Solving systems of two linear equations"],
      [3, "Giải bài toán bằng cách lập hệ phương trình", "Solving problems by setting up systems of equations"],
    ]],
    [2, "sd", "Phương trình và bất phương trình bậc nhất một ẩn", "Linear equations and inequalities in one variable", [
      [4, "Phương trình quy về phương trình bậc nhất một ẩn", "Equations reducible to linear equations"],
      [5, "Bất đẳng thức và tính chất", "Inequalities and their properties"],
      [6, "Bất phương trình bậc nhất một ẩn", "Linear inequalities in one variable"],
    ]],
    [3, "sd", "Căn bậc hai và căn bậc ba", "Square roots and cube roots", [
      [7, "Căn bậc hai và căn thức bậc hai", "Square roots and radical expressions"],
      [8, "Khai căn bậc hai với phép nhân và phép chia", "Square roots with multiplication and division"],
      [9, "Biến đổi đơn giản và rút gọn biểu thức chứa căn thức bậc hai", "Simplifying expressions with square roots"],
      [10, "Căn bậc ba và căn thức bậc ba", "Cube roots and cube-root expressions"],
    ]],
    [4, "hh", "Hệ thức lượng trong tam giác vuông", "Trigonometry in right triangles", [
      [11, "Tỉ số lượng giác của góc nhọn", "Trigonometric ratios of acute angles"],
      [12, "Một số hệ thức giữa cạnh, góc trong tam giác vuông và ứng dụng", "Relations between sides and angles in right triangles"],
    ]],
    [5, "hh", "Đường tròn", "Circles", [
      [13, "Mở đầu về đường tròn", "Introduction to circles"],
      [14, "Cung và dây của một đường tròn", "Arcs and chords"],
      [15, "Độ dài của cung tròn. Diện tích hình quạt tròn và hình vành khuyên", "Arc length. Area of a sector and an annulus"],
      [16, "Vị trí tương đối của đường thẳng và đường tròn", "Positions of a line and a circle"],
      [17, "Vị trí tương đối của hai đường tròn", "Positions of two circles"],
    ]],
    [6, "sd", "Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn", "The function y = ax² (a ≠ 0). Quadratic equations", [
      [18, "Hàm số y = ax² (a ≠ 0)", "The function y = ax² (a ≠ 0)"],
      [19, "Phương trình bậc hai một ẩn", "Quadratic equations in one variable"],
      [20, "Định lí Viète và ứng dụng", "Vieta's theorem and its applications"],
      [21, "Giải bài toán bằng cách lập phương trình", "Solving problems by setting up equations"],
    ]],
    [7, "tk", "Tần số và tần số tương đối", "Frequency and relative frequency", [
      [22, "Bảng tần số và biểu đồ tần số", "Frequency tables and charts"],
      [23, "Bảng tần số tương đối và biểu đồ tần số tương đối", "Relative frequency tables and charts"],
      [24, "Bảng tần số, tần số tương đối ghép nhóm và biểu đồ", "Grouped frequency tables and charts"],
    ]],
    [8, "tk", "Xác suất của biến cố trong một số mô hình xác suất đơn giản", "Probability in simple models", [
      [25, "Phép thử ngẫu nhiên và không gian mẫu", "Random experiments and sample spaces"],
      [26, "Xác suất của biến cố liên quan tới phép thử", "Probability of events in an experiment"],
    ]],
    [9, "hh", "Đường tròn ngoại tiếp và đường tròn nội tiếp", "Circumscribed and inscribed circles", [
      [27, "Góc nội tiếp", "Inscribed angles"],
      [28, "Đường tròn ngoại tiếp và đường tròn nội tiếp của một tam giác", "Circumcircle and incircle of a triangle"],
      [29, "Tứ giác nội tiếp", "Cyclic quadrilaterals"],
      [30, "Đa giác đều", "Regular polygons"],
    ]],
    [10, "hh", "Một số hình khối trong thực tiễn", "3D shapes in real life", [
      [31, "Hình trụ và hình nón", "Cylinders and cones"],
      [32, "Hình cầu", "Spheres"],
    ]],
  ],
};
