// Ngân hàng KHUNG CÂU (sentence frames) cho môn Toán THCS, theo chức năng ngôn ngữ (CLIL)
// + tư duy toán học (Cambridge "Thinking and Working Mathematically": đặc biệt hoá, khái quát, phỏng đoán, thuyết phục…).
// Mỗi khung có 3 mức: E1 (cụm ngắn) · E2 (câu đầy đủ) · E3 (câu học thuật). "___" = chỗ trống HS điền.
import type { Bi } from "@/lib/live/types";

export type FrameFn = "describe" | "compare" | "classify" | "explain" | "justify" | "conjecture" | "generalise" | "critique" | "sequence" | "ask";

export const FRAME_FNS: Record<FrameFn, Bi & { twm?: string; hint: string }> = {
  describe: { vi: "Mô tả, đọc kí hiệu", en: "Describing", twm: "Characterising", hint: "Hình, số, biểu thức, đồ thị trông thế nào, có tính chất gì" },
  compare: { vi: "So sánh", en: "Comparing", hint: "Lớn hơn, nhỏ hơn, bằng nhau; giống và khác giữa hai hình, hai cách giải" },
  classify: { vi: "Phân loại", en: "Classifying", twm: "Classifying", hint: "Xếp nhóm số, hình, tam giác; ví dụ và phản ví dụ" },
  explain: { vi: "Giải thích", en: "Explaining", hint: "Vì sao, áp dụng quy tắc, định lí nào" },
  justify: { vi: "Lập luận, chứng minh", en: "Reasoning & proving", twm: "Convincing", hint: "Vì… nên…, theo định lí…, suy ra…" },
  conjecture: { vi: "Dự đoán, phỏng đoán", en: "Conjecturing", twm: "Conjecturing", hint: "Em đoán…, thử với vài số trường hợp đặc biệt" },
  generalise: { vi: "Khái quát, liên hệ", en: "Generalising & connecting", twm: "Generalising", hint: "Quy luật chung, công thức tổng quát, liên hệ thực tế" },
  critique: { vi: "Nhận xét, phản biện", en: "Critiquing & improving", twm: "Critiquing / Improving", hint: "Đồng ý, không đồng ý, chỉ ra lỗi sai, cách giải tốt hơn" },
  sequence: { vi: "Trình bày các bước giải", en: "Describing a method", hint: "Đầu tiên, tiếp theo, cuối cùng; các bước vẽ hình, giải toán" },
  ask: { vi: "Hỏi, xin hỗ trợ", en: "Asking for help", hint: "Hỏi thầy cô và bạn bằng tiếng Anh" },
};

export interface Frame {
  id: string;
  fn: FrameFn;
  e1: Bi;
  e2: Bi;
  e3: Bi;
}

type Row = [e1en: string, e1vi: string, e2en: string, e2vi: string, e3en: string, e3vi: string];

const RAW: Record<FrameFn, Row[]> = {
  describe: [
    ["It is a ___.", "Đây là ___.", "This shape is a ___ because it has ___.", "Hình này là ___ vì nó có ___.", "This quadrilateral is a ___ because it has ___ and ___.", "Tứ giác này là ___ vì nó có ___ và ___."],
    ["It has ___ sides.", "Nó có ___ cạnh.", "A ___ has ___ sides and ___ angles.", "Một ___ có ___ cạnh và ___ góc.", "A regular ___ has ___ equal sides, and each interior angle measures ___ degrees.", "Một ___ đều có ___ cạnh bằng nhau và mỗi góc trong bằng ___ độ."],
    ["x squared", "x bình phương", "We read x² as “x squared”.", "Ta đọc x² là “x bình phương”.", "The expression ___ is read as “___” and it means ___.", "Biểu thức ___ đọc là “___” và có nghĩa là ___."],
    ["The point is ___.", "Điểm đó là ___.", "Point ___ has coordinates (___; ___).", "Điểm ___ có toạ độ (___; ___).", "Point ___ lies on the ___ axis, ___ units from the origin.", "Điểm ___ nằm trên trục ___, cách gốc toạ độ ___ đơn vị."],
    ["The angle is ___ degrees.", "Góc bằng ___ độ.", "Angle ___ is a(n) ___ angle; it measures ___ degrees.", "Góc ___ là góc ___; số đo bằng ___ độ.", "Since angle ___ measures ___ degrees, it is a(n) ___ angle.", "Vì góc ___ có số đo ___ độ nên đó là góc ___."],
    ["The chart shows ___.", "Biểu đồ cho biết ___.", "The bar chart shows that ___ is the highest.", "Biểu đồ cột cho thấy ___ cao nhất.", "According to the chart, ___ increased from ___ to ___ between ___ and ___.", "Theo biểu đồ, ___ tăng từ ___ lên ___ trong khoảng từ ___ đến ___."],
  ],
  compare: [
    ["___ is greater than ___.", "___ lớn hơn ___.", "___ is greater than ___ because ___.", "___ lớn hơn ___ vì ___.", "Since ___ > ___, we can conclude that ___ is greater than ___.", "Vì ___ > ___ nên ta kết luận ___ lớn hơn ___."],
    ["Same: ___. Different: ___.", "Giống: ___. Khác: ___.", "Both ___ and ___ have ___.", "Cả ___ và ___ đều có ___.", "Both ___ and ___ have ___; however, only ___ has ___.", "Cả ___ và ___ đều có ___; tuy nhiên chỉ ___ có ___."],
    ["___ equals ___.", "___ bằng ___.", "___ is equal to ___, so ___.", "___ bằng ___, nên ___.", "The two triangles are congruent, so their corresponding sides and angles are equal.", "Hai tam giác bằng nhau nên các cạnh và góc tương ứng bằng nhau."],
    ["___ is ___ times bigger.", "___ lớn gấp ___ lần.", "The area of ___ is ___ times the area of ___.", "Diện tích ___ gấp ___ lần diện tích ___.", "If the scale factor is ___, then the area becomes ___ times larger.", "Nếu tỉ số đồng dạng là ___ thì diện tích lớn gấp ___ lần."],
    ["Method A is faster.", "Cách A nhanh hơn.", "Method ___ is easier than method ___ because ___.", "Cách ___ dễ hơn cách ___ vì ___.", "Both methods give the same result, but method ___ is more efficient because ___.", "Hai cách cho cùng kết quả, nhưng cách ___ hiệu quả hơn vì ___."],
    ["The difference is ___.", "Điểm khác là ___.", "The difference between ___ and ___ is ___.", "Điểm khác nhau giữa ___ và ___ là ___.", "The main difference between a ___ and a ___ is that ___.", "Điểm khác nhau chủ yếu giữa ___ và ___ là ___."],
  ],
  classify: [
    ["It is a ___ number.", "Đó là số ___.", "___ is a ___ number because ___.", "___ là số ___ vì ___.", "___ is a ___ number because it has exactly ___ factors.", "___ là số ___ vì nó có đúng ___ ước."],
    ["Group A: ___. Group B: ___.", "Nhóm A: ___. Nhóm B: ___.", "We can sort them into ___ and ___.", "Ta có thể chia chúng thành ___ và ___.", "We sorted the ___ by ___: those that ___ and those that ___.", "Chúng em phân loại các ___ theo ___: loại ___ và loại ___."],
    ["It is a ___ triangle.", "Đó là tam giác ___.", "Triangle ___ is a(n) ___ triangle because ___.", "Tam giác ___ là tam giác ___ vì ___.", "Triangle ___ is both ___ and ___ because ___ and ___.", "Tam giác ___ vừa ___ vừa ___ vì ___ và ___."],
    ["Every ___ is a ___.", "Mọi ___ đều là ___.", "Every ___ is a ___, but not every ___ is a ___.", "Mọi ___ đều là ___, nhưng không phải ___ nào cũng là ___.", "A ___ is a special ___ because it has all the properties of a ___ and also ___.", "___ là ___ đặc biệt vì nó có mọi tính chất của ___ và còn ___."],
    ["Example: ___. Not: ___.", "Ví dụ: ___. Không phải: ___.", "___ is an example of ___, but ___ is not.", "___ là ví dụ về ___, còn ___ thì không.", "___ is a counterexample, because it ___ but it is not ___.", "___ là một phản ví dụ, vì nó ___ nhưng không phải là ___."],
    ["It is (not) a function.", "Đó (không) là hàm số.", "This is a function because each x has ___ value of y.", "Đây là hàm số vì mỗi giá trị x cho ___ giá trị y.", "This relation is not a function, because x = ___ gives two values of y: ___ and ___.", "Quan hệ này không phải hàm số vì x = ___ cho hai giá trị y là ___ và ___."],
  ],
  explain: [
    ["Because ___.", "Vì ___.", "___ because ___.", "___ vì ___.", "This is true because ___, so ___.", "Điều này đúng vì ___, do đó ___."],
    ["Rule: ___.", "Quy tắc: ___.", "We use the rule ___ to ___.", "Ta dùng quy tắc ___ để ___.", "By the ___ rule, we can ___ without changing the value of the expression.", "Theo quy tắc ___, ta có thể ___ mà không làm thay đổi giá trị biểu thức."],
    ["We use ___.", "Ta dùng ___.", "We use the formula ___ to find ___.", "Ta dùng công thức ___ để tính ___.", "To find ___, we substitute ___ = ___ into the formula ___.", "Để tính ___, ta thay ___ = ___ vào công thức ___."],
    ["___ means ___.", "___ nghĩa là ___.", "In this problem, x stands for ___.", "Trong bài này, x là ___.", "Let x be ___ (x > 0). Then ___ is equal to ___.", "Gọi x là ___ (x > 0). Khi đó ___ bằng ___."],
    ["The answer is ___.", "Đáp số là ___.", "The answer is ___ because ___.", "Đáp số là ___ vì ___.", "The answer is ___, which is reasonable because ___.", "Đáp số là ___, hợp lí vì ___."],
    ["It is parallel.", "Nó song song.", "___ is parallel to ___ because ___.", "___ song song với ___ vì ___.", "___ is parallel to ___ because the two ___ angles are equal.", "___ song song với ___ vì có hai góc ___ bằng nhau."],
  ],
  justify: [
    ["So ___.", "Vậy ___.", "Since ___, ___.", "Vì ___ nên ___.", "Since ___ and ___, it follows that ___.", "Vì ___ và ___ nên suy ra ___."],
    ["By ___.", "Theo ___.", "By ___ theorem, ___.", "Theo định lí ___, ___.", "Applying ___ theorem to triangle ___, we get ___.", "Áp dụng định lí ___ vào tam giác ___, ta có ___."],
    ["Given: ___. Prove: ___.", "GT: ___. KL: ___.", "We are given ___ and we need to prove ___.", "Ta có giả thiết ___ và cần chứng minh ___.", "From the given information ___, we will prove that ___ by showing ___.", "Từ giả thiết ___, ta chứng minh ___ bằng cách chỉ ra ___."],
    ["Check: ___.", "Thử lại: ___.", "Check: when x = ___, the left side equals ___.", "Thử lại: khi x = ___, vế trái bằng ___.", "Substituting x = ___ back into the equation gives ___ = ___, so the solution is correct.", "Thay x = ___ vào phương trình được ___ = ___, nên nghiệm đúng."],
    ["Congruent (___).", "Bằng nhau (___).", "Triangle ___ = triangle ___ (___).", "Tam giác ___ = tam giác ___ (___).", "Triangles ___ and ___ are congruent by ___, so ___ = ___ (corresponding sides).", "Hai tam giác ___ và ___ bằng nhau theo trường hợp ___, nên ___ = ___ (hai cạnh tương ứng)."],
    ["The data show ___.", "Số liệu cho thấy ___.", "The data show that ___, so ___.", "Số liệu cho thấy ___, nên ___.", "Based on ___ out of ___ results, the experimental probability is ___, so ___.", "Dựa vào ___ trên ___ kết quả, xác suất thực nghiệm là ___, nên ___."],
  ],
  conjecture: [
    ["I think ___.", "Em nghĩ ___.", "I think the answer is ___ because ___.", "Em nghĩ đáp số là ___ vì ___.", "I conjecture that ___; I will test it with ___.", "Em phỏng đoán rằng ___; em sẽ kiểm tra với ___."],
    ["Maybe ___.", "Có lẽ ___.", "If ___ gets bigger, then ___ gets ___.", "Nếu ___ tăng thì ___ sẽ ___.", "If we double ___, I predict that ___ will ___, because ___.", "Nếu gấp đôi ___, em dự đoán ___ sẽ ___, vì ___."],
    ["Let's try ___.", "Thử với ___.", "Let's try with x = ___ first.", "Thử với x = ___ trước nhé.", "Let's test a special case: when ___ = ___, we get ___.", "Thử một trường hợp đặc biệt: khi ___ = ___, ta được ___."],
    ["It looks like ___.", "Có vẻ như ___.", "It looks like the angles are always ___.", "Có vẻ các góc luôn ___.", "When I drag the point in GeoGebra, ___ stays ___; maybe this is always true.", "Khi kéo điểm trên GeoGebra, ___ luôn ___; có lẽ điều này luôn đúng."],
    ["About ___.", "Khoảng ___.", "I estimate the answer is about ___.", "Em ước lượng đáp số khoảng ___.", "My estimate is about ___, so an answer of ___ seems too ___.", "Em ước lượng khoảng ___, nên đáp số ___ có vẻ quá ___."],
    ["The next one is ___.", "Số tiếp theo là ___.", "The next number in the pattern is ___.", "Số tiếp theo của dãy là ___.", "Each term is ___ more than the previous one, so the ___th term is ___.", "Mỗi số hạng hơn số trước ___, nên số hạng thứ ___ là ___."],
  ],
  generalise: [
    ["Always ___.", "Luôn luôn ___.", "This is always true for ___.", "Điều này luôn đúng với ___.", "This works for every ___, because ___.", "Điều này đúng với mọi ___, vì ___."],
    ["In general, ___.", "Tổng quát, ___.", "In general, the ___ is ___.", "Tổng quát, ___ bằng ___.", "In general, for any n, the formula is ___.", "Tổng quát, với mọi n, công thức là ___."],
    ["The rule is ___.", "Quy luật là ___.", "The rule is: ___.", "Quy luật là: ___.", "We can write the rule as an algebraic expression: ___.", "Ta có thể viết quy luật thành biểu thức đại số: ___."],
    ["In real life, ___.", "Trong thực tế, ___.", "We can use this to ___ in real life.", "Ta có thể dùng điều này để ___ trong thực tế.", "This idea is used in ___, for example when ___.", "Ý tưởng này được dùng trong ___, ví dụ khi ___."],
    ["Like ___.", "Giống như ___.", "This is like the ___ we learnt in grade ___.", "Điều này giống ___ đã học ở lớp ___.", "This connects to ___: both use the idea of ___.", "Điều này liên quan đến ___: cả hai đều dùng ý tưởng ___."],
    ["Never ___.", "Không bao giờ ___.", "This is never true because ___.", "Điều này không bao giờ đúng vì ___.", "This is sometimes true: it is true when ___ but false when ___.", "Điều này chỉ đúng đôi khi: đúng khi ___ nhưng sai khi ___."],
  ],
  critique: [
    ["I agree.", "Em đồng ý.", "I agree with ___ because ___.", "Em đồng ý với ___ vì ___.", "I agree with ___'s method, and I would like to add that ___.", "Em đồng ý với cách làm của ___, và em muốn bổ sung rằng ___."],
    ["I disagree.", "Em không đồng ý.", "I disagree with ___ because ___.", "Em không đồng ý với ___ vì ___.", "I see your point, but I think ___, because ___.", "Em hiểu ý bạn, nhưng em nghĩ ___, vì ___."],
    ["Mistake: ___.", "Lỗi sai: ___.", "The mistake is in step ___. It should be ___.", "Lỗi sai ở bước ___. Đúng ra phải là ___.", "There is an error in step ___: ___ should be ___ because ___.", "Bước ___ có lỗi: ___ phải là ___ vì ___."],
    ["Check the sign.", "Kiểm tra dấu.", "You forgot to change the sign when ___.", "Bạn quên đổi dấu khi ___.", "When we multiply both sides by a negative number, we must reverse the inequality sign.", "Khi nhân hai vế với một số âm, ta phải đổi chiều bất đẳng thức."],
    ["Better: ___.", "Tốt hơn: ___.", "A better way is to ___.", "Một cách tốt hơn là ___.", "We could solve it faster by ___ instead of ___.", "Có thể giải nhanh hơn bằng cách ___ thay vì ___."],
    ["Good job!", "Bạn làm tốt!", "I like ___'s answer because ___.", "Em thích lời giải của ___ vì ___.", "___'s solution is clear because ___; next time we could also ___.", "Lời giải của ___ rõ ràng vì ___; lần sau có thể ___."],
  ],
  sequence: [
    ["First ___, then ___.", "Đầu tiên ___, sau đó ___.", "First, ___. Then, ___. Finally, ___.", "Đầu tiên ___. Sau đó ___. Cuối cùng ___.", "We start by ___, then ___, and finally ___.", "Ta bắt đầu bằng ___, sau đó ___, cuối cùng ___."],
    ["Draw ___.", "Vẽ ___.", "Draw ___, then mark ___.", "Vẽ ___, rồi đánh dấu ___.", "Use a ruler to draw ___, then use a compass to ___.", "Dùng thước kẻ ___, rồi dùng compa để ___."],
    ["Let x = ___.", "Gọi x là ___.", "Let x be ___. Then ___ is ___.", "Gọi x là ___. Khi đó ___ là ___.", "Step 1: choose the unknown. Step 2: write the equation ___. Step 3: solve and check.", "Bước 1: chọn ẩn. Bước 2: lập phương trình ___. Bước 3: giải và đối chiếu điều kiện."],
    ["Move ___ to ___.", "Chuyển ___ sang ___.", "Move ___ to the other side and change its sign.", "Chuyển ___ sang vế kia và đổi dấu.", "Subtract ___ from both sides, then divide both sides by ___.", "Trừ hai vế cho ___, rồi chia hai vế cho ___."],
    ["Collect data: ___.", "Thu thập: ___.", "We collected data about ___ from ___ students.", "Chúng em thu thập dữ liệu về ___ từ ___ bạn.", "We surveyed ___ students, organised the data in a table and drew a ___ chart.", "Chúng em khảo sát ___ bạn, lập bảng số liệu rồi vẽ biểu đồ ___."],
    ["Answer: ___.", "Đáp số: ___.", "So the answer is ___ (unit: ___).", "Vậy đáp số là ___ (đơn vị: ___).", "Therefore, ___ is ___ ___ (answer with the correct unit).", "Vậy ___ là ___ ___ (trả lời kèm đơn vị đúng)."],
  ],
  ask: [
    ["Help, please.", "Giúp em với ạ.", "Can you help me with ___, please?", "Thầy/cô giúp em phần ___ được không ạ?", "I don't understand ___. Could you explain it again, please?", "Em chưa hiểu ___. Thầy/cô giảng lại giúp em được không ạ?"],
    ["Again, please.", "Nhắc lại giúp em ạ.", "Can you say that again, please?", "Thầy/cô nói lại được không ạ?", "Could you say it more slowly, please?", "Thầy/cô nói chậm hơn được không ạ?"],
    ["What is ___?", "___ là gì ạ?", "What does ___ mean?", "___ nghĩa là gì ạ?", "How do you say ___ in English?", "___ tiếng Anh nói thế nào ạ?"],
    ["How do I read it?", "Đọc thế nào ạ?", "How do you read ___ in English?", "Kí hiệu ___ đọc bằng tiếng Anh thế nào ạ?", "Is “___” the correct way to read this expression?", "Đọc biểu thức này là “___” có đúng không ạ?"],
    ["Is it right?", "Đúng không ạ?", "Is my answer correct?", "Đáp án của em đúng không ạ?", "I got ___. Is that correct, or did I make a mistake?", "Em ra ___. Đúng không ạ, hay em sai ở đâu?"],
    ["Which formula?", "Dùng công thức nào ạ?", "Which formula should I use here?", "Ở đây em dùng công thức nào ạ?", "Should I use ___ or ___ to solve this problem?", "Bài này em nên dùng ___ hay ___ ạ?"],
  ],
};

export const FRAMES: Frame[] = (Object.keys(RAW) as FrameFn[]).flatMap((fn) =>
  RAW[fn].map(([a, b, c, d, e, f], i) => ({ id: `${fn}-${i + 1}`, fn, e1: { en: a, vi: b }, e2: { en: c, vi: d }, e3: { en: e, vi: f } }))
);
