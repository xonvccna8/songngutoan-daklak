// Ngân hàng CÂU LỆNH LỚP HỌC (classroom language) cho giáo viên Toán THCS — 15 nhóm × 10 câu, có nút nghe.
import type { Bi } from "@/lib/live/types";

export type PhraseGroup =
  | "start"
  | "attention"
  | "instructions"
  | "pairs"
  | "phones"
  | "questions"
  | "hints"
  | "praise"
  | "mistakes"
  | "checking"
  | "board"
  | "time"
  | "discussion"
  | "summary"
  | "homework";

export const PHRASE_GROUPS: Record<PhraseGroup, Bi> = {
  start: { vi: "Bắt đầu tiết học", en: "Starting the lesson" },
  attention: { vi: "Ổn định, thu hút chú ý", en: "Getting attention" },
  instructions: { vi: "Giao nhiệm vụ", en: "Giving instructions" },
  pairs: { vi: "Làm việc cặp, nhóm", en: "Pair and group work" },
  phones: { vi: "Dùng điện thoại", en: "Using phones" },
  questions: { vi: "Đặt câu hỏi", en: "Asking questions" },
  hints: { vi: "Gợi ý, hỗ trợ", en: "Giving hints" },
  praise: { vi: "Khen ngợi", en: "Praising" },
  mistakes: { vi: "Động viên khi sai", en: "Handling mistakes" },
  checking: { vi: "Kiểm tra, chữa bài", en: "Checking answers" },
  board: { vi: "Làm bài trên bảng, vẽ hình", en: "Board work and drawing" },
  time: { vi: "Thời gian", en: "Time" },
  discussion: { vi: "Thảo luận, giải thích", en: "Discussion" },
  summary: { vi: "Tổng kết bài", en: "Summing up" },
  homework: { vi: "Bài về nhà, kết thúc", en: "Homework and goodbye" },
};

export interface Phrase extends Bi {
  id: string;
  group: PhraseGroup;
}

const RAW: Record<PhraseGroup, [string, string][]> = {
  start: [
    ["Good morning, class!", "Chào cả lớp!"],
    ["How are you today?", "Hôm nay các em thế nào?"],
    ["Please sit down.", "Mời các em ngồi."],
    ["Who is absent today?", "Hôm nay bạn nào vắng?"],
    ["Let's start our lesson.", "Chúng ta bắt đầu bài học nhé."],
    ["Today we are going to learn about ___.", "Hôm nay chúng ta học về ___."],
    ["Do you remember what we learnt last time?", "Các em còn nhớ buổi trước học gì không?"],
    ["Look at today's goals on the screen.", "Các em xem mục tiêu bài hôm nay trên màn hình."],
    ["Let's warm up with a quick question.", "Khởi động bằng một câu hỏi nhanh nhé."],
    ["Take out your notebook and pen.", "Các em lấy vở và bút ra."],
  ],
  attention: [
    ["Look at the board, please.", "Các em nhìn lên bảng nhé."],
    ["Eyes on me, please.", "Các em nhìn cô/thầy nhé."],
    ["Listen carefully.", "Các em nghe kĩ nhé."],
    ["Be quiet, please.", "Các em giữ trật tự nhé."],
    ["Stop talking, please.", "Các em dừng nói chuyện nhé."],
    ["Are you ready?", "Các em sẵn sàng chưa?"],
    ["Put your pens down.", "Các em đặt bút xuống."],
    ["Pay attention to this part.", "Các em chú ý phần này nhé."],
    ["Everybody, look here.", "Cả lớp nhìn đây."],
    ["Thank you for listening.", "Cảm ơn các em đã lắng nghe."],
  ],
  instructions: [
    ["Read the question carefully.", "Đọc kĩ đề bài."],
    ["Listen and repeat.", "Nghe và nhắc lại."],
    ["Work on your own first.", "Các em tự làm trước."],
    ["Write your answer in your notebook.", "Viết câu trả lời vào vở."],
    ["Underline the key words.", "Gạch chân các từ khoá."],
    ["Label the vertices of the triangle.", "Ghi tên các đỉnh của tam giác."],
    ["Match each word with its symbol.", "Nối mỗi từ với kí hiệu của nó."],
    ["Complete the table.", "Hoàn thành bảng."],
    ["Fill in the blanks.", "Điền vào chỗ trống."],
    ["Draw the figure and write what is given.", "Vẽ hình và ghi giả thiết, kết luận."],
  ],
  pairs: [
    ["Work in pairs.", "Làm việc theo cặp."],
    ["Work in groups of four.", "Làm việc nhóm bốn bạn."],
    ["Turn to your partner.", "Quay sang bạn bên cạnh."],
    ["Discuss with your partner.", "Thảo luận với bạn cùng cặp."],
    ["Share your idea with your group.", "Chia sẻ ý tưởng với nhóm."],
    ["Who will be the group leader?", "Ai sẽ làm nhóm trưởng?"],
    ["One person writes, one person checks.", "Một bạn viết, một bạn kiểm tra."],
    ["Help each other.", "Các em giúp đỡ nhau nhé."],
    ["Each group, choose one person to present.", "Mỗi nhóm cử một bạn trình bày."],
    ["Go back to your seats, please.", "Các em về chỗ nhé."],
  ],
  phones: [
    ["Phones up! Answer on your phone.", "Mở điện thoại, trả lời trên điện thoại."],
    ["Phones down, please.", "Các em úp điện thoại xuống."],
    ["Choose the correct answer on your phone.", "Chọn đáp án đúng trên điện thoại."],
    ["Type your answer and press Send.", "Gõ câu trả lời rồi bấm Gửi."],
    ["Press the microphone and read aloud.", "Bấm micro và đọc to."],
    ["Take a photo of your group's work.", "Chụp ảnh bài làm của nhóm."],
    ["Is your phone connected?", "Điện thoại của em đã kết nối chưa?"],
    ["Wait for the next question.", "Các em chờ câu hỏi tiếp theo."],
    ["Raise your hand on the app if you need help.", "Cần giúp thì bấm Giơ tay trên ứng dụng."],
    ["Let's see the results on the screen.", "Cùng xem kết quả trên màn hình."],
  ],
  questions: [
    ["Who can answer this question?", "Bạn nào trả lời được câu này?"],
    ["Raise your hand, please.", "Các em giơ tay nhé."],
    ["What do you notice?", "Các em nhận thấy điều gì?"],
    ["What is the answer?", "Đáp án là gì?"],
    ["How did you get that?", "Em làm thế nào ra kết quả đó?"],
    ["Can you explain why?", "Em giải thích vì sao được không?"],
    ["Is there another way?", "Còn cách khác không?"],
    ["What is the first step?", "Bước đầu tiên là gì?"],
    ["What do we know? What do we need to find?", "Ta đã biết gì? Cần tìm gì?"],
    ["Do you have any questions?", "Các em có câu hỏi nào không?"],
  ],
  hints: [
    ["Here is a hint.", "Cô/thầy gợi ý nhé."],
    ["Look at the figure again.", "Nhìn lại hình vẽ nhé."],
    ["Think about ___.", "Hãy nghĩ về ___."],
    ["Remember the formula we learnt last time.", "Nhớ lại công thức đã học buổi trước."],
    ["Try a small number first, for example 2.", "Thử với một số nhỏ trước, ví dụ số 2."],
    ["Draw a picture to help you.", "Vẽ hình ra để dễ làm."],
    ["Which theorem can we use here?", "Ở đây ta dùng được định lí nào?"],
    ["You are on the right track.", "Em đang đi đúng hướng rồi."],
    ["Use the sentence frame on the screen.", "Dùng khung câu trên màn hình."],
    ["You can answer in Vietnamese first.", "Em có thể trả lời bằng tiếng Việt trước."],
  ],
  praise: [
    ["Well done!", "Giỏi lắm!"],
    ["Excellent work!", "Làm rất tốt!"],
    ["Great job!", "Tuyệt vời!"],
    ["That's right!", "Đúng rồi!"],
    ["Perfect!", "Hoàn hảo!"],
    ["Good thinking!", "Suy nghĩ hay đấy!"],
    ["What a clever idea!", "Ý tưởng thông minh quá!"],
    ["Your English is getting better!", "Tiếng Anh của em tiến bộ rồi đấy!"],
    ["Give him/her a big hand!", "Cả lớp vỗ tay cho bạn nào!"],
    ["I'm proud of you.", "Cô/thầy tự hào về các em."],
  ],
  mistakes: [
    ["Don't worry, try again.", "Không sao, thử lại nhé."],
    ["Almost! Check it again.", "Gần đúng rồi! Kiểm tra lại nhé."],
    ["Good try!", "Cố gắng tốt lắm!"],
    ["It's OK to make mistakes.", "Sai cũng không sao cả."],
    ["We learn from mistakes.", "Chúng ta học từ những lỗi sai."],
    ["Not quite. Who can help?", "Chưa đúng lắm. Bạn nào giúp bạn?"],
    ["Let's look at it together.", "Cùng xem lại nhé."],
    ["Check your calculation again.", "Kiểm tra lại phép tính nhé."],
    ["Read the question again.", "Đọc lại đề bài nhé."],
    ["Take your time.", "Cứ từ từ nhé."],
  ],
  checking: [
    ["Let's check the answer.", "Cùng kiểm tra đáp án nhé."],
    ["The correct answer is ___.", "Đáp án đúng là ___."],
    ["Swap notebooks with your partner.", "Đổi vở cho bạn bên cạnh."],
    ["Check your partner's work.", "Kiểm tra bài của bạn."],
    ["How many did you get right?", "Em làm đúng bao nhiêu câu?"],
    ["Hands up if you got it right.", "Ai làm đúng thì giơ tay."],
    ["Let's look at a common mistake.", "Cùng xem một lỗi sai hay gặp."],
    ["Correct your answer in red.", "Sửa lại bằng bút đỏ."],
    ["Let's look at this answer on the screen.", "Cùng xem câu trả lời này trên màn hình."],
    ["Is this answer correct? Why?", "Câu trả lời này đúng không? Vì sao?"],
  ],
  board: [
    ["Come to the board, please.", "Em lên bảng nhé."],
    ["Write the solution step by step.", "Trình bày lời giải từng bước."],
    ["Use a ruler to draw a straight line.", "Dùng thước để kẻ đường thẳng."],
    ["Use a compass to draw a circle.", "Dùng compa để vẽ đường tròn."],
    ["Use a protractor to measure the angle.", "Dùng thước đo góc để đo góc."],
    ["Use a set square to draw a right angle.", "Dùng ê ke để vẽ góc vuông."],
    ["Mark the equal sides on the figure.", "Đánh dấu các cạnh bằng nhau trên hình."],
    ["Write the formula first, then substitute the numbers.", "Viết công thức trước rồi thay số."],
    ["Don't forget the unit: centimetres, square metres…", "Đừng quên đơn vị: xăng-ti-mét, mét vuông…"],
    ["Record your results in the table.", "Ghi kết quả vào bảng."],
  ],
  time: [
    ["You have one minute.", "Các em có một phút."],
    ["You have five minutes.", "Các em có năm phút."],
    ["Thirty seconds left!", "Còn ba mươi giây!"],
    ["Time is up!", "Hết giờ!"],
    ["Hurry up, please.", "Các em nhanh lên nhé."],
    ["Are you finished?", "Các em xong chưa?"],
    ["Who needs more time?", "Bạn nào cần thêm thời gian?"],
    ["Let's do it quickly.", "Làm nhanh nhé."],
    ["We don't have much time left.", "Chúng ta không còn nhiều thời gian."],
    ["Let's move on.", "Chúng ta chuyển sang phần tiếp theo."],
  ],
  discussion: [
    ["Do you agree with your friend?", "Em có đồng ý với bạn không?"],
    ["Why do you think so?", "Vì sao em nghĩ vậy?"],
    ["Can you say it in English?", "Em nói bằng tiếng Anh được không?"],
    ["Say it in a full sentence, please.", "Em nói thành câu đầy đủ nhé."],
    ["Who has a different answer?", "Bạn nào có đáp án khác?"],
    ["Let's compare the two answers.", "Cùng so sánh hai câu trả lời."],
    ["What would happen if ___?", "Điều gì xảy ra nếu ___?"],
    ["Can you give an example?", "Em cho một ví dụ được không?"],
    ["Speak louder, please.", "Em nói to hơn nhé."],
    ["Thank you for sharing.", "Cảm ơn em đã chia sẻ."],
  ],
  summary: [
    ["Let's sum up what we have learnt today.", "Cùng tóm tắt những gì đã học hôm nay."],
    ["What have you learnt today?", "Hôm nay các em học được gì?"],
    ["Remember these key words.", "Nhớ các từ khoá này nhé."],
    ["The main idea is ___.", "Ý chính là ___."],
    ["Today we learnt how to ___.", "Hôm nay chúng ta đã học cách ___."],
    ["Read the summary aloud together.", "Cả lớp cùng đọc to phần tóm tắt."],
    ["Which part was difficult?", "Phần nào khó với các em?"],
    ["Let's look at the leaderboard.", "Cùng xem bảng xếp hạng nhé."],
    ["Answer the exit ticket on your phone.", "Trả lời phiếu ra về trên điện thoại."],
    ["Next lesson, we will learn about ___.", "Buổi sau chúng ta học về ___."],
  ],
  homework: [
    ["Your homework is on the app.", "Bài tập về nhà có trên ứng dụng."],
    ["Do exercises ___ on page ___.", "Làm bài ___ trang ___."],
    ["Review the new words at home.", "Ôn từ mới ở nhà nhé."],
    ["Practise reading the sentences aloud.", "Luyện đọc to các câu nhé."],
    ["The deadline is ___.", "Hạn nộp là ___."],
    ["Watch the video before the next lesson.", "Xem video trước buổi học sau."],
    ["Don't forget your homework.", "Đừng quên bài tập về nhà nhé."],
    ["Stand up, please.", "Các em đứng dậy."],
    ["Thank you, class.", "Cảm ơn cả lớp."],
    ["Goodbye, see you next time!", "Tạm biệt, hẹn gặp lại!"],
  ],
};

export const PHRASES: Phrase[] = (Object.keys(RAW) as PhraseGroup[]).flatMap((group) => RAW[group].map(([en, vi], i) => ({ id: `${group}-${i + 1}`, group, en, vi })));
