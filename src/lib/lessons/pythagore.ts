// Tiết mẫu "Định lí Pythagore và ứng dụng" (Toán 8 · Bài 35, mạch Hình học và Đo lường)
// Nạp vào Firestore bằng: npm run seed:lesson
import type { Activity, Slide, TeacherKey, Term } from "@/lib/live/types";

export const LESSON_ID = "toan8-pythagore";

export const LESSON = {
  title: { en: "Pythagoras' theorem and its applications", vi: "Định lí Pythagore và ứng dụng" },
  subtitle: "Toán 8 · Bài 35 · Định lí Pythagore",
  subject: "Toán",
  grade: 8,
  status: "approved" as const,
  /** Bài 35 SGK Toán 8 Kết nối tri thức (khung chương trình) */
  curLessonId: "k8-35",
};

export const TERMS: Term[] = [
  { en: "right triangle", ipa: "/raɪt ˈtraɪæŋɡl/", vi: "tam giác vuông", at: 0 },
  { en: "right angle", ipa: "/raɪt ˈæŋɡl/", vi: "góc vuông", at: 1 },
  { en: "leg", ipa: "/leɡ/", vi: "cạnh góc vuông; cạnh bên", at: 2 },
  { en: "hypotenuse", ipa: "/haɪˈpɒtənjuːz/", vi: "cạnh huyền", at: 2 },
  { en: "Pythagoras' theorem", ipa: "/paɪˈθæɡərəsɪz ˈθɪərəm/", vi: "định lí Pythagore", at: 2 },
  { en: "squared", ipa: "/skweəd/", vi: "bình phương", at: 7 },
  { en: "square root", ipa: "/skweə ruːt/", vi: "căn bậc hai", at: 8 },
];

/** Câu ví dụ cho thẻ từ vựng (ngân hàng thuật ngữ lsn_terms) */
export const TERM_EXAMPLES: Record<string, { en: string; vi: string }> = {
  "right triangle": { en: "A right triangle has one right angle.", vi: "Tam giác vuông có một góc vuông." },
  "right angle": { en: "A right angle measures 90 degrees.", vi: "Góc vuông có số đo 90 độ." },
  leg: { en: "The two legs make the right angle.", vi: "Hai cạnh góc vuông tạo thành góc vuông." },
  hypotenuse: { en: "The hypotenuse is the longest side.", vi: "Cạnh huyền là cạnh dài nhất." },
  "Pythagoras' theorem": { en: "We use Pythagoras' theorem to find a missing side.", vi: "Ta dùng định lí Pythagore để tìm cạnh chưa biết." },
  squared: { en: "Three squared is nine.", vi: "Ba bình phương bằng chín." },
  "square root": { en: "The square root of 100 is 10.", vi: "Căn bậc hai của 100 là 10." },
};

/** ID tài liệu thuật ngữ: "right triangle" → "right-triangle" */
export const termId = (en: string) => en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Def = Omit<Slide, "order"> & { key: TeacherKey };

const DEFS: Def[] = [
  {
    id: "s0",
    type: "content",
    title: { en: "Today’s lesson", vi: "Bài học hôm nay" },
    blocks: [
      { kind: "hero", step: 0, text: { en: "Pythagoras' theorem", vi: "Định lí Pythagore" } },
      { kind: "join", step: 0 },
      {
        kind: "goals",
        step: 1,
        items: [
          { en: "Explain Pythagoras' theorem.", vi: "Giải thích được định lí Pythagore." },
          { en: "Calculate a side of a right triangle.", vi: "Tính được độ dài một cạnh của tam giác vuông." },
          { en: "Say the key sentences in English.", vi: "Nói được các câu then chốt bằng tiếng Anh." },
        ],
      },
    ],
    key: {
      notes: [
        { vi: "Chào lớp, chờ học sinh vào lớp bằng mã trên tivi." },
        { en: "Good morning, class. Please open the class page on your phone." },
        { en: "Today we will learn Pythagoras' theorem." },
      ],
    },
  },
  {
    id: "s1",
    type: "mcq",
    title: { en: "Warm-up", vi: "Khởi động" },
    blocks: [
      {
        kind: "cols",
        left: [{ kind: "figure", step: 0, figure: "triangle-abc" }],
        right: [{ kind: "text", step: 1, text: { en: "Look at triangle ABC. One angle is a right angle (90°).", vi: "Quan sát tam giác ABC. Có một góc là góc vuông (90°)." } }],
      },
    ],
    question: {
      type: "mcq",
      time: 30,
      skill: "Ngôn ngữ",
      prompt: { en: "Which angle is the right angle?", vi: "Góc nào là góc vuông?" },
      options: [
        { en: "Angle B", vi: "Góc B" },
        { en: "Angle A", vi: "Góc A" },
        { en: "Angle C", vi: "Góc C" },
        { en: "No angle", vi: "Không có góc nào" },
      ],
    },
    key: {
      answer: 1,
      explain: { en: "Angle A is the right angle. ABC is a right triangle at A.", vi: "Góc A là góc vuông. Tam giác ABC vuông tại A." },
      notes: [
        { vi: "Cho học sinh quan sát kí hiệu góc vuông ở đỉnh A, rồi bấm Tiếp để mở câu hỏi trên điện thoại." },
        { en: "Look at the small square. Which angle is the right angle?" },
        { en: "Angle A is the right angle." },
      ],
    },
  },
  {
    id: "s2",
    type: "content",
    title: { en: "Legs and hypotenuse", vi: "Cạnh góc vuông và cạnh huyền" },
    blocks: [
      {
        kind: "cols",
        left: [{ kind: "figure", step: 0, figure: "right-triangle" }],
        right: [
          {
            kind: "text",
            step: 1,
            text: {
              en: "The two sides that make the right angle are the legs. The side opposite the right angle is the hypotenuse.",
              vi: "Hai cạnh tạo thành góc vuông là hai cạnh góc vuông. Cạnh đối diện với góc vuông là cạnh huyền.",
            },
          },
          {
            kind: "box",
            step: 4,
            highlight: true,
            tag: "Key idea · Ý chính",
            text: {
              en: "In a right triangle, the square of the hypotenuse equals the sum of the squares of the two legs.",
              vi: "Trong một tam giác vuông, bình phương cạnh huyền bằng tổng các bình phương của hai cạnh góc vuông.",
            },
          },
        ],
      },
    ],
    key: {
      notes: [
        { vi: "Bấm Tiếp từng bước: hình hiện dần hai cạnh góc vuông, cạnh huyền, rồi công thức. Bấm vào từ ở bảng từ để tivi đọc mẫu." },
        { en: "AB and AC are the legs." },
        { en: "BC is the hypotenuse. It is opposite the right angle." },
        { en: "BC squared equals AB squared plus AC squared." },
        { en: "Repeat after me: the hypotenuse is the longest side." },
      ],
    },
  },
  {
    id: "s3",
    type: "speak",
    title: { en: "Say it!", vi: "Luyện nói" },
    blocks: [
      { kind: "say", step: 0, text: { en: "The hypotenuse is the longest side.", vi: "Cạnh huyền là cạnh dài nhất." } },
      {
        kind: "ipa",
        step: 0,
        items: [
          { word: "hypotenuse", ipa: "/haɪˈpɒtənjuːz/" },
          { word: "longest", ipa: "/ˈlɒŋɡɪst/" },
        ],
      },
      {
        kind: "box",
        step: 1,
        text: {
          en: "On your phone: listen first, then tap the microphone and read the sentence aloud.",
          vi: "Trên điện thoại: nghe mẫu trước, rồi bấm micro và đọc to câu trên.",
        },
      },
    ],
    speak: { target: "The hypotenuse is the longest side.", time: 60 },
    key: {
      notes: [
        { vi: "Bấm vào câu mẫu để tivi đọc cho cả lớp nghe 2 lần. Bấm Tiếp để mở lượt luyện nói. Máy chấm từng em; giáo viên không cần tự sửa phát âm." },
        { en: "Listen and repeat." },
        { en: "Now use your phone. Read the sentence aloud." },
      ],
    },
  },
  {
    id: "s4",
    type: "mcq",
    title: { en: "Check", vi: "Kiểm tra" },
    blocks: [
      {
        kind: "cols",
        left: [{ kind: "figure", step: 0, figure: "pythagoras-squares" }],
        right: [
          {
            kind: "text",
            step: 2,
            text: { en: "The squares on the legs have areas 9 and 16. What is the area of the square on the hypotenuse?", vi: "Hai hình vuông trên hai cạnh góc vuông có diện tích 9 và 16. Hình vuông trên cạnh huyền có diện tích bao nhiêu?" },
          },
        ],
      },
    ],
    question: {
      type: "mcq",
      time: 25,
      skill: "Toán",
      prompt: { en: "Area of the big square?", vi: "Diện tích hình vuông lớn?" },
      options: [
        { en: "7", vi: "7" },
        { en: "12", vi: "12" },
        { en: "25", vi: "25" },
        { en: "144", vi: "144" },
      ],
    },
    key: {
      answer: 2,
      explain: { en: "9 + 16 = 25. The big square equals the two small squares together.", vi: "9 + 16 = 25. Hình vuông lớn bằng tổng hai hình vuông nhỏ." },
      method: { en: "Add the areas of the two small squares.", vi: "Cộng diện tích hai hình vuông nhỏ." },
      notes: [{ en: "What is the area of the big square?" }, { vi: "Nếu nhiều em chọn 7: các em đã trừ thay vì cộng. Chỉ lại trên hình: hình vuông lớn = hai hình vuông nhỏ ghép lại." }],
    },
  },
  {
    id: "s5",
    type: "content",
    title: { en: "Measure and check", vi: "Đo và kiểm tra" },
    phonesDown: true,
    blocks: [
      {
        kind: "steps",
        items: [
          { step: 0, text: { en: "Draw a right triangle with legs 3 cm and 4 cm.", vi: "Vẽ tam giác vuông có hai cạnh góc vuông 3 cm và 4 cm." } },
          { step: 1, text: { en: "Measure the hypotenuse with a ruler.", vi: "Dùng thước đo cạnh huyền." } },
          { step: 2, text: { en: "Calculate 3² + 4² and compare it with the hypotenuse squared.", vi: "Tính 3² + 4² rồi so sánh với bình phương cạnh huyền." } },
        ],
      },
      { kind: "box", step: 3, highlight: true, text: { en: "The hypotenuse is 5 cm, because 3² + 4² = 25 = 5².", vi: "Cạnh huyền dài 5 cm, vì 3² + 4² = 25 = 5²." } },
    ],
    key: {
      notes: [
        { vi: "Úp điện thoại xuống. Học sinh làm theo cặp, 5 phút, dùng ê ke để vẽ góc vuông cho chính xác." },
        { en: "Work in pairs. Use a set square to draw the right angle." },
        { en: "Measure the hypotenuse. What do you get?" },
      ],
    },
  },
  {
    id: "s6",
    type: "content",
    title: { en: "The converse", vi: "Định lí đảo" },
    blocks: [
      {
        kind: "box",
        step: 0,
        highlight: true,
        tag: "Converse · Định lí đảo",
        text: { en: "If BC² = AB² + AC², then triangle ABC is a right triangle at A.", vi: "Nếu BC² = AB² + AC² thì tam giác ABC vuông tại A." },
      },
      {
        kind: "text",
        step: 1,
        text: {
          en: "Builders use the 3 – 4 – 5 rule: a rope with sides 3 m, 4 m and 5 m makes a right angle.",
          vi: "Thợ xây dùng quy tắc 3 – 4 – 5: căng dây thành tam giác có cạnh 3 m, 4 m, 5 m thì được một góc vuông.",
        },
      },
      {
        kind: "box",
        step: 2,
        tag: "Use · Ứng dụng",
        text: { en: "We use the theorem to find a missing side and to check right angles.", vi: "Ta dùng định lí để tính cạnh chưa biết và để kiểm tra góc vuông." },
      },
    ],
    key: {
      notes: [
        { vi: "Có thể cho học sinh xem ảnh thợ xây căng dây 3 – 4 – 5 hoặc dùng thước đo kiểm tra góc bàn học." },
        { en: "If the sides are 3, 4 and 5, the triangle is a right triangle." },
        { en: "We can check right angles with Pythagoras' theorem." },
      ],
    },
  },
  {
    id: "s7",
    type: "speak",
    title: { en: "Say it!", vi: "Luyện nói" },
    blocks: [
      { kind: "say", step: 0, text: { en: "A squared plus b squared equals c squared.", vi: "a bình phương cộng b bình phương bằng c bình phương." } },
      {
        kind: "ipa",
        step: 0,
        items: [
          { word: "squared", ipa: "/skweəd/" },
          { word: "equals", ipa: "/ˈiːkwəlz/" },
        ],
      },
    ],
    speak: { target: "A squared plus b squared equals c squared.", time: 60 },
    key: {
      notes: [
        { en: "Listen and repeat." },
        { vi: "Sau khi khóa, bảng xếp hạng phát âm hiện trên tivi. Chỉ hiện 5 bạn cao nhất để khích lệ, không hiện ai thấp điểm." },
      ],
    },
  },
  {
    id: "s8",
    type: "number",
    title: { en: "Practice", vi: "Luyện tập" },
    blocks: [
      {
        kind: "text",
        step: 0,
        text: {
          en: "A right triangle has legs 6 cm and 8 cm. How long is the hypotenuse?",
          vi: "Một tam giác vuông có hai cạnh góc vuông dài 6 cm và 8 cm. Cạnh huyền dài bao nhiêu?",
        },
      },
    ],
    question: { type: "number", time: 60, skill: "Toán", prompt: { en: "Hypotenuse (cm)?", vi: "Cạnh huyền dài bao nhiêu cm?" } },
    key: {
      answer: 10,
      show: "√(6² + 8²) = √100 = 10 cm",
      method: {
        en: "Hypotenuse² = leg² + leg². Then take the square root.",
        vi: "Cạnh huyền² = cạnh góc vuông² + cạnh góc vuông². Sau đó lấy căn bậc hai.",
      },
      explain: { en: "6² + 8² = 36 + 64 = 100, so the hypotenuse is √100 = 10 cm.", vi: "6² + 8² = 36 + 64 = 100, nên cạnh huyền là √100 = 10 cm." },
      notes: [{ en: "Work out the hypotenuse. You have one minute." }, { vi: "Nếu học sinh nhập 14: các em đã cộng hai cạnh thay vì dùng định lí. Nếu nhập 100: quên lấy căn bậc hai." }],
    },
  },
  {
    id: "s9",
    type: "text",
    title: { en: "Complete the sentence", vi: "Hoàn thành câu" },
    blocks: [
      {
        kind: "say",
        step: 0,
        text: { en: "The longest side of a right triangle is the ______.", vi: "Cạnh dài nhất của tam giác vuông là ______." },
      },
    ],
    question: { type: "text", time: 60, skill: "Ngôn ngữ", prompt: { en: "Type the missing word.", vi: "Gõ từ còn thiếu bằng tiếng Anh." } },
    key: {
      accept: ["hypotenuse", "the hypotenuse"],
      show: "hypotenuse",
      method: { en: "Look at the triangle on the second page. Which side is opposite the right angle?", vi: "Xem lại hình ở trang thứ hai. Cạnh nào đối diện với góc vuông?" },
      explain: {
        en: "The longest side of a right triangle is the hypotenuse.",
        vi: "Cạnh dài nhất của tam giác vuông là cạnh huyền.",
      },
      notes: [
        { vi: "Câu trả lời của học sinh hiện trên laptop. Bấm “Chiếu” để đưa câu hay lên tivi; câu không phù hợp sẽ không bao giờ lên tivi." },
        { en: "Type the missing word." },
      ],
    },
  },
  {
    id: "s10",
    type: "mcq",
    title: { en: "True or false?", vi: "Đúng hay sai?" },
    blocks: [
      {
        kind: "say",
        step: 0,
        text: { en: "A triangle with sides 5 cm, 6 cm and 7 cm is a right triangle.", vi: "Tam giác có ba cạnh 5 cm, 6 cm, 7 cm là tam giác vuông." },
      },
    ],
    question: {
      type: "mcq",
      time: 25,
      skill: "Toán",
      prompt: { en: "True or false?", vi: "Đúng hay sai?" },
      options: [
        { en: "True", vi: "Đúng" },
        { en: "False", vi: "Sai" },
      ],
    },
    key: {
      answer: 1,
      explain: { en: "False. 5² + 6² = 61, but 7² = 49, so it is not a right triangle.", vi: "Sai. 5² + 6² = 61, còn 7² = 49, nên đây không phải tam giác vuông." },
      method: { en: "Use the converse: compare the square of the longest side with the sum of the other two squares.", vi: "Dùng định lí đảo: so sánh bình phương cạnh dài nhất với tổng bình phương hai cạnh còn lại." },
      notes: [{ en: "True or false?" }],
    },
  },
  {
    id: "s11",
    type: "final",
    title: { en: "Great work!", vi: "Tổng kết" },
    blocks: [
      {
        kind: "box",
        step: 0,
        highlight: true,
        tag: "Key sentences · Câu then chốt",
        text: {
          en: "The hypotenuse is the longest side. A squared plus b squared equals c squared.",
          vi: "Cạnh huyền là cạnh dài nhất. a bình phương cộng b bình phương bằng c bình phương.",
        },
      },
      {
        kind: "text",
        step: 1,
        text: {
          en: "Homework: measure the length, the width and the diagonal of your desk. Check Pythagoras' theorem in English.",
          vi: "Về nhà: đo chiều dài, chiều rộng và đường chéo mặt bàn học. Kiểm tra định lí Pythagore và viết lại bằng tiếng Anh.",
        },
      },
    ],
    key: { notes: [{ vi: "Khen top 5, nhắc bài về nhà. Báo cáo chi tiết của tiết nằm ở bảng bên dưới." }, { en: "Great work today, everyone!" }] },
  },
];

// Câu hỏi / luyện nói đo YCCĐ của Bài 35: (1) giải thích định lí · (2) tính độ dài cạnh · (3) vận dụng thực tiễn
const OUTCOMES: Record<string, string[]> = {
  s1: ["k8-35-1"],
  s3: ["k8-35-1"],
  s4: ["k8-35-1"],
  s7: ["k8-35-1"],
  s8: ["k8-35-2"],
  s9: ["k8-35-1"],
  s10: ["k8-35-3"],
};

// 4 hoạt động CV 5512 (thanh thời gian trên laptop GV): 1 Mở đầu · 2 Hình thành kiến thức · 3 Luyện tập · 4 Vận dụng/Tổng kết
const ACTIVITY: Record<string, Activity> = { s0: 1, s1: 1, s2: 2, s3: 2, s4: 2, s5: 2, s6: 2, s7: 2, s8: 3, s9: 3, s10: 3, s11: 4 };

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- tách đáp án (key) ra khỏi nội dung trang
export const SLIDES: Slide[] = DEFS.map(({ key, ...s }, i) => ({ ...s, order: i, activity: ACTIVITY[s.id], ...(OUTCOMES[s.id] ? { outcomeIds: OUTCOMES[s.id] } : {}) }));
export const KEYS: Record<string, TeacherKey> = Object.fromEntries(DEFS.map((d) => [d.id, d.key]));
