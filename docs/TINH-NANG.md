# Đặc tả chức năng

Bối cảnh: GV có laptop, lớp có tivi (HDMI), HS dùng điện thoại; Wi-Fi có thể yếu. GV Toán không giỏi tiếng Anh → web có câu mẫu kèm phát âm, AI chấm phát âm.

## §1. Vai trò & đăng nhập
- Quản trị (Google/email): quản lý GV, lớp, duyệt tiết mẫu. GV (Google/email): lớp mình dạy. HS: **mã lớp + chọn tên + PIN 6 số**, không email.
- Vai trò = custom claims (`role`, `schoolId`, `classIds`).
- `/api/auth/student`: kiểm PIN (hash bcrypt), trả custom token. Sai 5 lần khóa 15 phút. GV đặt lại PIN.
- GV in phiếu đăng nhập cả lớp (tên, mã lớp, PIN, QR có sẵn mã lớp). HS giữ phiên đăng nhập dài.

## §2. Quản lý lớp
Trang chủ GV: thẻ lớp (sĩ số, đang trực tuyến, điểm TB tuần, số em cần chú ý, nút "Bắt đầu tiết học"). Quản lý lớp: thêm HS (gõ hoặc dán từ Excel), chia tổ, đặt lại PIN, in phiếu, cài đặt ngưỡng trạng thái và giờ yên lặng.

## §3. Dạy trực tiếp (theo `reference/lop-song-ngu.html`)
Route: `/present/[sessionId]` (tivi) · `/teacher/session/[sessionId]` (laptop) · `/s/live` (điện thoại).
1. Một nút **Tiếp** (→, Space, PageDown, bút trình chiếu): hiện bước → mở câu hỏi → khóa → công bố → sang trang. Có dòng gợi ý "Bấm Tiếp để…". ← lùi.
2. Điện thoại hiện đúng nội dung tivi; khi câu hỏi mở thì chuyển sang chế độ trả lời.
3. Kiểu trả lời: chọn đáp án, nhập số, gõ chữ, nói (AI chấm phát âm), kéo nhãn, chụp ảnh nhóm.
4. Công tắc Anh / Song ngữ / Việt trên tivi (phím L); mỗi HS có công tắc riêng.
5. Bảng từ có phát âm; gọi tên ngẫu nhiên (ưu tiên em chưa gọi); đồng hồ (hết giờ tự khóa); "Phones up/down"; nút Giơ tay.
6. Câu gõ chỉ hiện trên laptop, GV bấm "Chiếu" mới lên tivi.
7. Laptop: lưới HS với trạng thái thời gian thực, số đã trả lời, % đúng, tách lỗi Toán/Ngôn ngữ, hàng chờ giơ tay, bấm 1 chạm "Nhắc chú ý".
8. Luyện nói: tivi chỉ hiện top 5; laptop xếp thấp → cao.
9. Vào muộn/mất mạng vào lại nhận ngay trạng thái hiện tại. Kết thúc tiết: lưu kết quả, cập nhật thống kê, báo cáo tiết.

## §4. Theo dõi học sinh
- Trang lớp, tab: **Tổng quan** (chỉ số + lưới thẻ HS: trạng thái màu+biểu tượng+chữ, điểm, % đúng, điểm Toán/Ngôn ngữ, phát âm, chuỗi ngày, hoạt động gần nhất, nút chuông; lọc Cần chú ý/Chưa học/Tích cực, theo tổ) · **Bảng điểm** (HS × tiết/bài, xuất Excel) · **Hoạt động** (dòng thời gian) · **Phân tích** (tiến bộ tuần, câu sai nhiều, thuật ngữ yếu) · **Quản lý lớp**.
- Hồ sơ HS: biểu đồ điểm, từng tiết (vào lúc nào, trả lời/đúng bao nhiêu, rời trang mấy lần), bài tập (mở/làm/trễ/thời gian thật), chi tiết từng câu, từ phát âm sai, lịch sử tin nhắn; nút Nhắc chú ý / Nhắn tin / Khen / Đặt lại PIN.

## §5. Nhắn tin & cảnh báo
- Gửi cho: 1 em / nhiều em / tổ / cả lớp. Mẫu tin nhanh song ngữ, GV sửa được.
- Loại: **Chú ý** (chuông 2 lần + rung + khung vàng toàn màn hình đến khi bấm "Em đã chú ý") · **Nhắc nhở** (âm vừa + thẻ) · **Khen ngợi** (âm vui, có thể cộng điểm) · **Thông báo** (im lặng).
- Trạng thái: Đã gửi → Đã nhận → Đã xem → Đã xác nhận. HS trả lời nhanh: "Em hiểu rồi" / "Em cần giúp". Không có chat giữa HS.
- Kênh: web đang mở → listener Firestore + âm thanh + `navigator.vibrate`; web đóng → FCM qua service worker (iPhone phải thêm vào màn hình chính, iOS 16.4+).
- Trình duyệt chặn tự phát âm thanh: lần đăng nhập đầu hiện nút "Bật âm thanh thông báo".
- Giới hạn 3 tin Chú ý/em/tiết; giờ yên lặng 21:00–6:30; lưu mọi tin cho quản trị xem.

## §6. Học sinh tự học
Trang chủ (nút Vào tiết học, bài đến hạn, chuỗi ngày, điểm, huy hiệu, tin nhắn) · thẻ từ vựng có phát âm, ôn lặp ngắt quãng · luyện phát âm (Nghe mẫu/Nghe chậm) · bài tập gợi ý 3 tầng (từ vựng → cách làm → lời giải) · xem lại tiết · kết quả của em · bảng xếp hạng chỉ top 5 + hạng của mình · thi đua theo tổ.
Giao bài: chọn câu từ tiết/ngân hàng, hạn nộp, giao lớp/tổ/em, tự chấm, nhắc trước hạn 1 ngày.

## §7. Soạn bài & thuật ngữ
- Khung CV 5512 + 4C (Content, Communication, Cognition, Culture); 4 hoạt động, mỗi hoạt động gồm trang trình chiếu; mỗi khối nội dung có số bước hiện.
- Hai cột Việt–Anh; chèn thuật ngữ, chèn câu lệnh lớp học; ghi chú GV có câu tiếng Anh kèm nút nghe.
- Loại trang: nội dung, trắc nghiệm, đúng/sai, nhập số, gõ chữ, luyện nói, kéo nhãn, chụp ảnh, tổng kết. Xem trước tivi/điện thoại; nhân bản; xuất Word; trạng thái Nháp → Chờ duyệt → Đã duyệt.
- Thuật ngữ: en, IPA, vi, hình, câu ví dụ, cách đọc kí hiệu, trạng thái duyệt. Không dịch máy tự động.

## §8. AI
- Phát âm: Web Speech API + so khớp từng từ (như bản thử); interface `PronunciationScorer` để sau thay bằng Azure Pronunciation Assessment qua `/api/speech/assess`. Không lưu ghi âm.
- Chấm câu gõ: so khớp gần đúng; tùy chọn LLM qua `/api/ai/grade`; GV sửa được.
- Trợ lý soạn bài: từ giáo án tiếng Việt → đề xuất trang song ngữ, luôn là Nháp chờ duyệt. Giới hạn số lần gọi AI.
- Bài tập AI (`/api/questions/ai`): từ bài SGK + YCCĐ → 3–10 câu song ngữ vào ngân hàng ở trạng thái "Nháp AI"; GV phải mở, kiểm tra, Lưu thì mới giao bài được. Dùng chung hạn mức lượt AI.

## §9. Hình học động & mô phỏng Toán
- Danh mục dựng sẵn `src/lib/lab/sims.ts`: 26 mô phỏng PhET + GeoGebra theo 3 mạch (Số và Đại số, Hình học và Đo lường, Thống kê và Xác suất) và theo khối 6–9, mỗi mô phỏng có 2–3 nhiệm vụ song ngữ + từ vựng có nút nghe. Công tắc giao diện English / Tiếng Việt (PhET `?locale=`, GeoGebra `?lang=`), nút toàn màn hình để chiếu tivi.
- Học liệu: `geogebra` (hình geogebra.org/m/…), `simulation` (PhET hoặc ứng dụng GeoGebra) và `model3d` (sketchfab.com) — nhúng ngay trên trang, quy trình duyệt như học liệu khác.
- GV: Học liệu số → tab "Hình học động · Mô phỏng". HS: Tự học → Hình học động (`/s/lab`, chỉ học liệu đã duyệt của khối mình).

## §10. Ngân hàng câu hỏi (`lsn_questions`, chỉ GV đọc)
- Câu gắn khối, bài SGK, YCCĐ, mức độ TT 22, phần chấm Toán / Ngôn ngữ. Dạng: trắc nghiệm 4 lựa chọn, đúng/sai, nhập số, gõ chữ, luyện nói. Có gợi ý cách làm (tầng 2) và lời giải (tầng 3).
- Mỗi câu lưu sẵn `slide` + `key` như tiết học → giao bài về nhà (`/api/questions/assign`, `lessonId = "bank"`) dùng lại toàn bộ chấm điểm, XP, Sao thành thạo.
- GV thêm → Chờ duyệt (vẫn tự giao được); quản trị duyệt. Lọc theo khối / bài / mức độ / dạng; thống kê số câu theo mức; xuất Word (đề + bảng đặc tả + đáp án).

## §11. Dự án STEM (`lsn_projects` + `teams/{tổ}`)
- GV tạo dự án cho lớp (16 mẫu Toán 6–9 hoặc tự soạn), hạn nộp, từ vựng; lớp nhận thông báo.
- Mỗi tổ: 6 bước (Xác định vấn đề → Ý tưởng → Kế hoạch → Chế tạo → Thử nghiệm–cải tiến → Trình bày), ghi chú từng bước, ≤ 6 link sản phẩm (https), suy ngẫm Anh/Việt, Nộp / Rút lại. HS chỉ đọc và sửa tổ của mình (máy chủ xác định tổ).
- GV chấm rubric 4 tiêu chí (Kiến thức Toán, Sản phẩm, Hợp tác, Trình bày tiếng Anh) mức 1–4 → thang 10; mỗi em trong tổ +XP (tối đa 50, chỉ lần chấm đầu). Chấm xong / đóng dự án thì tổ không sửa được.

## §12. Cộng đồng học tập (`lsn_posts` + `replies`)
- Hỏi – đáp, chia sẻ trong lớp. Bài và trả lời của HS ở "Chờ duyệt" cho tới khi GV duyệt; GV ẩn / xoá được; GV đăng thì hiện ngay.
- An toàn: không nhắn riêng giữa HS, HS không đăng link / số điện thoại, chỉ hiện tên gọi + tổ, tối đa 10 lượt đăng/em/ngày.
- Khung câu tiếng Anh để hỏi / trả lời; GV chọn "Trả lời hay nhất" → HS +10 XP.
