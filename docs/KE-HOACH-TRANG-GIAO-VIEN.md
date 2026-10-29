# Kế hoạch tổng thể bản mới — Lớp Song Ngữ (chưa code)

> GĐ 1–2 đã xong (đăng nhập, quản lý lớp, dạy trực tiếp 3 màn hình). File này là **kế hoạch thay cho GĐ 3 trở đi**.
> Hai mục tiêu chính:
> (1) **Hỗ trợ tối đa GV Toán chưa giỏi tiếng Anh**: web lo phần ngôn ngữ, GV chỉ cần bấm.
> (2) **HS vừa học vừa chơi**: điểm, cấp độ, xếp hạng, trò chơi, tất cả **đồng bộ** giữa 7 mục và giữa GV với HS.

---

## Phần A. Nền tảng

### A1. Căn cứ chương trình và phương pháp
- **CT GDPT 2018 môn Toán:** 3 mạch (Số và Đại số; Hình học và Đo lường; Thống kê và Xác suất) · 5 năng lực · yêu cầu cần đạt (YCCĐ).
- **CV 5512:** giáo án 4 hoạt động.
- **TT 22/2021:** đánh giá thường xuyên và định kỳ; đề định kỳ phải có ma trận và bản đặc tả, tỉ lệ thường dùng Biết 40 / Hiểu 30 / Vận dụng 30.
- **QĐ 2371/QĐ-TTg (2025):** tiếng Anh là ngôn ngữ thứ hai, chia mức 1 → 3. Web dùng **3 mức tiếng Anh E1 / E2 / E3** tương ứng.
- **CLIL 4C:** mỗi bài có mục tiêu Toán và mục tiêu ngôn ngữ. Dạy theo **chức năng ngôn ngữ** (mô tả, so sánh, giải thích, chứng minh) bằng **khung câu**. Giàn giáo rút dần. Cho HS dùng tiếng Việt làm bước đệm (translanguaging). Biểu diễn đa phương thức. HS được nói toán nhiều.
- **Cambridge TWM:** 4 cặp tư duy (Specialising/Generalising, Conjecturing/Convincing, Characterising/Classifying, Critiquing/Improving), mỗi cặp có khung câu tiếng Anh riêng.

### A2. Nghiên cứu về trò chơi hóa và cách áp dụng
| Nghiên cứu cho thấy | Thiết kế trong web |
|---|---|
| Trò chơi hóa nhìn chung có tác dụng tích cực vừa phải với kết quả học (tổng hợp 30 nghiên cứu, g ≈ 0,46) | Dùng điểm, cấp độ và huy hiệu, nhưng mọi điểm phải gắn với **việc học thật** |
| **Bảng xếp hạng giúp HS khá nhưng có thể làm HS yếu nản và căng thẳng** | Xếp hạng **reset hằng tuần**; chỉ hiện **top 5 + hạng của em + 2 bạn gần em**; có thêm bảng **Tiến bộ nhất** và bảng **theo tổ**; tivi có thể ẩn tên |
| Động lực bền đến từ cảm giác **tự chủ, giỏi lên, gắn kết** (thuyết tự quyết SDT) | Thanh tiến độ cá nhân, "kỉ lục của em", được chọn nhiệm vụ, thi đua theo tổ |
| Chơi hợp tác giúp HS **thích môn học** hơn; thi đấu giúp **tăng thành tích khi chơi** | Xen kẽ trò chơi cá nhân, đối kháng theo đội và hợp tác cả lớp |
| Trò chơi lặp lại nhiều thì HS chán (domino); game nhập vai dễ gây nghiện (Prodigy) | Mỗi trò 5–10 phút, xoay vòng nhiều trò; **giới hạn điểm ở nhà mỗi ngày** |
| Duolingo: XP, chuỗi ngày, giải đấu hằng tuần có lên và xuống hạng | Cấp độ dùng XP cộng dồn (không bao giờ mất); xếp hạng tuần chỉ để thi đua, tuần sau làm lại từ đầu |
| Kahoot, Blooket, Gimkit, Rung chuông vàng: nhịp nhanh, đội nhóm, có cơ hội lật ngược | Mẫu trò chơi chiếu lên tivi, có yếu tố may mắn và cơ hội gỡ điểm để HS yếu vẫn có thể thắng |

### A3. Nguyên tắc ĐỒNG BỘ (quan trọng nhất)
Mọi hoạt động của HS ở bất kỳ mục nào đều sinh ra **một sự kiện học tập**. Từ sự kiện đó, hệ thống tự cập nhật **cùng một bộ số liệu**. GV và HS nhìn thấy cùng con số, theo thời gian thực.

```
 Trên lớp (4) ─┐
 Ở nhà (5)  ───┤                       ┌─► Mức thành thạo theo YCCĐ (Toán | Ngôn ngữ)
 Trò chơi (7) ─┼─► SỰ KIỆN HỌC TẬP ───►├─► XP, cấp độ, huy hiệu, chuỗi ngày
 Kiểm tra (6) ─┤   (máy chủ chấm)      ├─► Điểm thi đua tuần: Trên lớp | Ở nhà | Tổ
 GV khen (1) ──┘                       ├─► Bảng điều khiển GV + màn hình "Hành trình" của HS
                                       └─► Gợi ý ôn tập (5) + cảnh báo cho GV (1)
```
- **Một nguồn sự thật:** điểm chỉ được tính ở **máy chủ** (API Vercel). HS không tự ghi điểm được, nên không gian lận được.
- **Một mã nội dung:** câu hỏi, thuật ngữ và học liệu đều gắn với khung chương trình (Lớp → Mạch → Chương → Bài → YCCĐ). Vì vậy bài soạn (2) tự sinh ra trò chơi (7), bài ôn (5) và câu kiểm tra (6). **GV không phải soạn lại.**
- **Đồng bộ GV và HS:**
  - GV khen thì điện thoại HS hiện "+10 XP" ngay.
  - HS lên cấp thì laptop GV hiện thông báo "🎉 An lên Khám phá II".
  - GV giao bài thì bài hiện ngay trong mục "Nhiệm vụ hôm nay" của HS.

---

## Phần B. Vai trò
| Vai trò | Quyền chính |
|---|---|
| **Quản trị** | Quản lý GV, lớp, năm học, khung chương trình; cấu hình điểm và cấp độ toàn trường; xem nhật ký tin nhắn |
| **Tổ trưởng chuyên môn** | Phân công soạn bài, **duyệt Toán**, xem tiến độ soạn và thống kê các lớp trong tổ |
| **GV Toán** | Quản lý lớp, soạn bài, dạy, mở trò chơi, giao bài, kiểm tra, khen thưởng và nhắc nhở |
| **GV tiếng Anh** | **Duyệt ngôn ngữ**; làm đồng GV ở lớp; chấm phần nói và viết |
| **GV dự giờ** | Chỉ xem tiết hoặc lớp được mời |
| **Học sinh** | Đăng nhập bằng mã lớp + PIN. Học trên lớp, ôn ở nhà, chơi, làm kiểm tra, xem hành trình và hạng của mình |

Quyền riêng tư HS: chỉ lưu họ tên, lớp, tổ; không email, không số điện thoại, không lưu ghi âm. Trên bảng xếp hạng chỉ hiện tên gọi và ảnh đại diện (avatar) tự chọn.

---

## Phần C. Hệ thống điểm, cấp độ, xếp hạng (dùng chung cho mọi mục)

### C1. Ba loại điểm
| Loại | Ý nghĩa | Có mất không? |
|---|---|---|
| **XP (kinh nghiệm)** | Tổng công sức học, dùng để **lên cấp độ** | Không bao giờ mất |
| **Điểm thi đua tuần** | Chia 2 bảng: **Trên lớp** và **Ở nhà**. Dùng để xếp hạng | Thứ Hai đầu tuần làm lại từ 0 |
| **Sao Toán ⭐ / Sao Ngôn ngữ 🗣️** | Mức thành thạo thật theo YCCĐ, từ 0 đến 3 sao | Giảm dần nếu lâu không ôn, để nhắc HS ôn lại |

### C2. Bảng tích điểm (GV chỉnh được hệ số)
| Hoạt động | XP |
|---|---|
| **Trên lớp:** trả lời một câu (dù sai) | +2 (thưởng cho việc tham gia) |
| Trả lời đúng | +10 |
| Trả lời bằng tiếng Anh, nói hoặc viết, đạt yêu cầu | +5 |
| Được gọi lên trả lời, hoặc giơ tay rồi trả lời | +3 |
| Phiếu ra về đúng | +5 |
| GV khen (nút Khen) | +5 / +10 / +20 |
| **Ở nhà:** hoàn thành bài về nhà | +20; nộp đúng hạn thêm +10 |
| Mỗi câu đúng trong bài về nhà | +5; tự làm đúng không cần mở gợi ý thêm +2 |
| Ôn thẻ từ vựng | +1 mỗi thẻ (tối đa 30/ngày) |
| Luyện phát âm đạt từ 80% | +5 mỗi câu |
| Nhiệm vụ "Explain in English" hằng tuần | +30 |
| Thử thách hằng ngày (5 câu) | +15 |
| **Trò chơi:** theo kết quả | +5 → +30; đội thắng mỗi người thêm +10; phá kỉ lục cá nhân +5 |
| **Kiểm tra:** hoàn thành bài | +20; đạt từ 8 điểm thêm +20 (chỉ cộng một lần mỗi đề) |
| **Chuỗi ngày học:** 3 / 7 / 30 ngày | +10 / +30 / +100 |

- **Giới hạn ở nhà: tối đa 200 XP/ngày.** Mục đích: chống "cày điểm" và chống nghiện, khuyến khích học đều mỗi ngày.
- **Không trừ điểm khi sai.** Sai thì nhận lời giải thích song ngữ, và có câu làm lại để gỡ điểm.

### C3. Cấp độ kiểu game (8 hạng × 3 bậc = 24 cấp)
| Hạng | Tên (VN / EN) | XP cộng dồn | **Điều kiện thăng hạng** (ngoài XP) |
|---|---|---|---|
| 1 | 🌱 **Nhập môn / Novice** | 0 | — |
| 2 | 📘 Tập sự / Apprentice | 300 | Thuộc 20 thuật ngữ |
| 3 | 🧭 Khám phá / Explorer | 800 | Đạt 1⭐ ở 5 YCCĐ; đọc đúng 10 kí hiệu toán bằng tiếng Anh |
| 4 | 🔧 Thành thạo / Skilled | 1 600 | Đạt 2⭐ ở 10 YCCĐ; nói 10 câu giải thích đạt yêu cầu |
| 5 | 💎 Tinh anh / Expert | 3 000 | Hoàn thành 2 bài "Explain in English"; chuỗi 7 ngày |
| 6 | 🏅 Bậc thầy / Master | 5 000 | Đạt 3⭐ ở 15 YCCĐ; thắng thử thách thăng hạng |
| 7 | 🧠 Đại sư / Grandmaster | 8 000 | Giải bài vận dụng, trình bày bằng tiếng Anh, GV duyệt |
| 8 | 👑 **Huyền thoại / Legend** | 12 000 | Hướng dẫn bạn (được 5 lần "Đồng đội tốt") |

- **Thăng hạng phải qua "Thử thách thăng hạng"** (5–8 câu, một nửa Toán, một nửa ngôn ngữ). Như vậy cấp độ phản ánh **năng lực thật**, không chỉ là chăm bấm.
- Màn hình HS luôn hiện: hạng hiện tại, thanh XP, **"Còn 120 XP và 1 điều kiện nữa để lên Khám phá"**. Như vậy HS biết mình đang ở đâu và cần làm gì tiếp.
- **Huy hiệu song ngữ** (khoảng 20 cái): Vua thuật ngữ / Term King · Phát âm chuẩn / Clear Speaker · Thám tử lỗi sai / Error Detective · Đồng đội tốt / Team Player · Chuỗi lửa 30 ngày / 30-day Streak…
- **Avatar và khung ảnh** mở khóa theo hạng. Chỉ để trang trí, không mua bán gì.

### C4. Bảng xếp hạng
| Bảng | Tính từ | Hiện ở đâu |
|---|---|---|
| **Trên lớp (tiết học)** | Điểm trong tiết | Tivi cuối tiết (top 5, có thể ẩn tên), điện thoại (hạng của em) |
| **Trên lớp (tuần)** | Tổng điểm các tiết trong tuần | Trang HS, trang GV |
| **Ở nhà (tuần)** | Ôn luyện, bài về nhà, trò chơi ở nhà | Trang HS, trang GV |
| **Tiến bộ nhất** | Tăng Sao so với tuần trước | Để HS yếu cũng có cơ hội được vinh danh |
| **Thi đua tổ** | Trung bình điểm các thành viên trong tổ | Tivi đầu tuần, khuyến khích các bạn giúp nhau |
| **Giải đấu học kỳ** (tùy chọn) | Tổng điểm tuần của học kỳ | GV xuất danh sách khen thưởng |

---

## Phần D. Bảy mục của trang Giáo viên (và phần tương ứng bên HS)

```
GV: Trang chủ | 1 Quản lý lớp | 2 Soạn bài | 3 Học liệu số | 4 Dạy trên lớp | 5 Ôn luyện ở nhà | 6 Kiểm tra | 7 Trò chơi
HS: Trang chủ (Hành trình) | Vào tiết | Nhiệm vụ hôm nay | Học liệu | Trò chơi | Kiểm tra | Xếp hạng | Tin nhắn
```

### 1. Quản lý lớp học: quản lý HS trên lớp và ở nhà
**Bảng điều khiển lớp** có 3 tab, dữ liệu thời gian thực:
| Tab | GV thấy gì | GV làm được gì (1 chạm) |
|---|---|---|
| **Trên lớp** | Lưới HS: đang trực tuyến, đang làm, đã trả lời, đúng hay sai, nấc gợi ý đã mở, có rời màn hình không | Nhắc chú ý · Khen +XP · Gọi tên · Chiếu bài làm |
| **Ở nhà** | Hôm nay ai đã học, bao nhiêu phút **thật**; bài về nhà: chưa mở / đang làm / đã nộp / trễ; chuỗi ngày; XP hôm nay | Nhắc ôn · Giao bài bù cho nhóm · Khen |
| **Tiến bộ** | Bản đồ thành thạo HS × YCCĐ (Toán / Ngôn ngữ), cấp độ từng em, xếp hạng tuần, nhóm "Cần chú ý" | Xuất Excel và PDF · Tạo nhóm phụ đạo |

- **Cảnh báo tự động cho GV:** 3 ngày chưa ôn · chuỗi ngày sắp đứt · Sao giảm · trượt thử thách thăng hạng 2 lần · làm bài nhanh bất thường (đoán bừa).
- **Hồ sơ HS:** cấp độ, XP, huy hiệu, sao theo YCCĐ, lịch sử tiết học, bài ở nhà, trò chơi, kiểm tra, tin nhắn.
- **Quản lý chung:** lớp, tổ (hệ thống tự gợi ý chia tổ đều trình độ), PIN, in phiếu, năm học, đồng GV, khảo sát mức tiếng Anh đầu năm (E1 / E2 / E3), kế hoạch dạy học theo tuần, cài đặt điểm (hệ số, giới hạn mỗi ngày, ẩn tên trên tivi).
- **Bên HS (Trang chủ "Hành trình của em"):** hạng và thanh XP, nhiệm vụ hôm nay, chuỗi ngày, sao theo chương, hạng tuần (trên lớp và ở nhà), huy hiệu mới, tin nhắn của GV.

### 2. Soạn bài: nhiều GV cùng soạn song ngữ
- **Quy trình:** Phân công → Soạn → Duyệt Toán → Duyệt ngôn ngữ → Đã duyệt → Thư viện chung. Có nút "Yêu cầu sửa" kèm nhận xét.
  - Nếu trường không có GV tiếng Anh, bỏ bước duyệt ngôn ngữ.
- **Cộng tác:** khóa từng trang khi có người đang sửa, nhận xét gắn vào từng khối, lịch sử phiên bản, nhân bản bài đã duyệt để chỉnh cho lớp mình.
- **Mẫu bài 5512 + 4C:** mục tiêu Toán (chọn YCCĐ) · mục tiêu ngôn ngữ (chức năng và khung câu) · thuật ngữ trọng tâm.
- **Soạn hai cột Việt | Anh**, mỗi nội dung có 3 mức E1 / E2 / E3.
- **Kiểm tra ngôn ngữ tự động:** thuật ngữ thiếu trong ngân hàng, câu quá dài so với mức, thiếu cách đọc kí hiệu.
- **Hỗ trợ GV không giỏi tiếng Anh:**
  - **Kịch bản lời giảng** từng trang, có nút nghe và nghe chậm.
  - AI đề xuất phần tiếng Anh từ giáo án tiếng Việt (luôn là Nháp).
  - Chọn câu có sẵn từ ngân hàng thay vì phải tự viết.
- **Đồng bộ:** khi soạn bài, GV đánh dấu câu nào dùng cho *Trên lớp / Bài về nhà / Trò chơi / Kiểm tra*. Bài được duyệt thì các mục 4, 5, 6, 7 **tự có sẵn nội dung**.
- Xuất Word theo mẫu 5512.

### 3. Học liệu số
- **Ngân hàng thuật ngữ:** tiếng Anh, IPA, nghĩa tiếng Việt, hình, ví dụ, cách đọc, từ dễ nhầm, lớp học lần đầu.
- **Ngân hàng khung câu** theo chức năng ngôn ngữ và cặp TWM, mỗi khung có 3 mức.
- **Câu lệnh lớp học:** khoảng 150 câu GV hay dùng, có phát âm.
- **Cách đọc kí hiệu toán:** phân số, lũy thừa, căn, góc, song song, vuông góc…, có âm thanh.
- **Hình động GeoGebra** có nhãn đổi Việt / Anh; **video** lưu dạng link; phiếu học tập; tiết mẫu.
- Lọc theo lớp, chương, YCCĐ, mức tiếng Anh; tìm bằng cả tiếng Việt và tiếng Anh.
- **Đồng bộ:** thuật ngữ trong bài tự vào bộ thẻ ôn của HS (5) và tự thành dữ liệu cho trò chơi từ vựng (7).
- **Bên HS:** tab Học liệu trong mỗi bài. Xem trước tiết học được +XP (học trước rồi lên lớp).

### 4. Dạy học trên lớp
- **Có sẵn từ GĐ 2:** 3 màn hình, nút Tiếp, 6 kiểu trả lời, công tắc Anh / Song ngữ / Việt, gọi tên, đồng hồ, giơ tay.
- **Thêm:**
  - Giới hạn trang HS được làm; Tạm dừng cả lớp (điện thoại hiện "Eyes on the board!").
  - **Chụp bài làm và ẩn danh** để chiếu và thảo luận theo khung câu.
  - **Giàn giáo 3 nấc** trên điện thoại.
  - Nói theo cặp (Turn and talk).
  - Trả lời hai bước: tiếng Việt trước, tiếng Anh sau (+5 XP).
  - Phiếu ra về.
  - Chế độ chạy khi mạng yếu.
- **Hỗ trợ GV tối đa:**
  - Laptop luôn hiện câu tiếng Anh GV cần nói ở trang hiện tại, có nút 🔊.
  - Tivi **tự đọc** đề và luật chơi bằng tiếng Anh (có phụ đề Việt), GV không cần tự đọc.
- **Nút "🎮 Trò chơi"** ngay trên thanh điều khiển tiết học. Bấm vào thì chuyển cả lớp sang trò chơi (mục 7), chơi xong quay lại đúng trang đang dạy.
- **Điểm trực tiếp:** mỗi câu trả lời cộng XP ngay; cuối tiết tivi hiện bảng **Top 5 của tiết + Tổ dẫn đầu + Bạn tiến bộ nhất**.

### 5. Ôn luyện ở nhà
- **"Nhiệm vụ hôm nay"** khoảng 15 phút, hệ thống tự xếp:
  1. Bài GV giao (nếu có).
  2. Ôn giãn cách: câu cũ quay lại sau 1 → 3 → 7 → 14 ngày, trộn nhiều dạng bài.
  3. 5–10 thẻ từ vựng.
  4. 1 câu luyện phát âm.
  5. Thử thách hằng ngày.
- **Ví dụ mẫu rút dần** từng bước · **bài tập thích ứng** (sai thì câu dễ hơn, đúng 3 lần liên tiếp thì lên mức) · gợi ý 3 tầng · nhiệm vụ "Explain in English" hằng tuần.
- **Trò chơi ở nhà:** một số trò ở mục 7 có chế độ chơi một mình hoặc thách đấu kỉ lục của lớp.
- **Tách lỗi:** sai Toán thì gợi ý cách làm; sai ngôn ngữ thì gợi ý từ hoặc khung câu.
- **GV quản lý:** tab "Ở nhà" (mục 1) xem thời gian học thật; GV giao bài cho lớp, tổ hoặc từng em, có hạn nộp; nhắc trước hạn 1 ngày; giao bài bù chỉ bằng 1 lần bấm.
- Giới hạn 200 XP/ngày; giờ yên lặng 21:00–6:30 (không gửi thông báo).

### 6. Kiểm tra thường xuyên
- **Ngân hàng câu hỏi** gắn YCCĐ, mức độ, năng lực, cặp TWM, mức tiếng Anh. Đề song song Việt / Anh; chạm vào thuật ngữ để xem nghĩa, 🔊 nghe đề (GV bật hoặc tắt các hỗ trợ này cho từng đề).
- **Đánh giá thường xuyên:** tự gom kết quả trên lớp, ở nhà và trò chơi. **Thang chấm song ngữ** cho thuyết trình hoặc sản phẩm (Toán + Giao tiếp). GV chọn lần đánh giá nào ghi vào sổ.
- **Kiểm tra định kỳ hoặc bài kiểm tra 15 phút:**
  - Nhập ma trận → tự sinh bản đặc tả → rút câu ra đề → xuất Word.
  - Làm trên điện thoại: tính giờ, đảo câu, tự chấm trắc nghiệm; GV chấm tự luận qua ảnh chụp.
  - Hai chế độ: *Chính thức* và *Song ngữ tham khảo*.
- **Đồng bộ:** kết quả kiểm tra cập nhật Sao theo YCCĐ. Câu sai tự vào lịch ôn ở nhà (5). Mỗi đề cộng XP hoàn thành một lần. Trong giờ kiểm tra **tắt bảng xếp hạng** để HS không bị áp lực.
- **Thử thách thăng hạng** (phần C3) cũng dùng ngân hàng câu hỏi này.

### 7. Trò chơi toán học song ngữ (mục mới)
**Cách dùng trên lớp: GV chỉ cần 3 lần bấm.**
1. Bấm **🎮 Trò chơi** trên laptop. Hệ thống gợi ý 3 trò hợp với bài đang dạy.
2. Chọn trò. Nội dung **tự lấy** từ thuật ngữ và câu hỏi của bài, GV không phải soạn gì thêm.
3. Bấm **Bắt đầu**. Điện thoại HS tự chuyển sang màn hình chơi (không cần nhập mã, vì HS đã ở trong tiết). Tivi tự đọc luật chơi bằng tiếng Anh, có phụ đề Việt.

**Nguyên tắc thiết kế để trò chơi hấp dẫn và có ích:**
- **Ngắn:** mỗi trò 5–10 phút. Hệ thống gợi ý dùng trò khác nhau, không lặp lại một trò liên tục.
- **Có mục đích rõ:** Khởi động · Củng cố thuật ngữ · Luyện tính · Vận dụng · Ôn tập chương.
- **Song ngữ có thang:** nút E1 / E2 / E3 đổi lượng tiếng Anh trong đề. Âm thanh đọc mẫu ở mọi chỗ.
- **Công bằng cho HS yếu:**
  - Tính điểm chủ yếu theo **đúng**, điểm nhanh chỉ là phần thưởng nhỏ.
  - Không trừ điểm khi sai.
  - Có yếu tố may mắn (rương vàng, vòng quay) và **cơ hội gỡ** điểm.
  - Đội được chia đều trình độ tự động.
- **Học thật trong lúc chơi:** sau mỗi câu, tivi hiện đáp án và **1 câu giải thích song ngữ** kèm âm đọc. Câu sai tự vào lịch ôn ở nhà.
- **Kịch tính:** nhạc và đếm ngược, hiệu ứng, bảng điểm động trên tivi, "lật ngược thế cờ" ở vòng cuối.

#### 7A. ⚔️ Đấu trường Song ngữ / Bilingual Arena (trò chính, theo phong cách Quizizz)
Đây là trò chơi chính, dùng được cho mọi bài, lấy ý tưởng từ Quizizz (nay là Wayground): mỗi HS tự làm trên điện thoại, **bảng xếp hạng nhảy liên tục**, có power-up, có sticker động viên, cuối ván có câu cứu điểm.
Phần nào **in đậm "song ngữ"** là phần tôi thêm cho Toán song ngữ, Quizizz không có.

**1. Hai cách chơi**
| Chế độ | Cách chạy | Dùng khi |
|---|---|---|
| **Tự do** (giống Classic) | Mỗi em làm theo tốc độ riêng; tivi hiện bảng xếp hạng chạy liên tục | Luyện tập, ôn chương |
| **GV điều khiển** | Cả lớp làm cùng 1 câu; hết giờ thì tivi hiện đáp án, giải thích và bảng xếp hạng sau câu đó | Khởi động, chữa bài, cần thảo luận |
| **Đội / Tổ** | Điểm tổ = trung bình điểm các thành viên, để tổ nào đông người cũng công bằng | Thi đua tổ |
| **Ở nhà** | Giao như bài về nhà, có hạn nộp; xếp hạng tính vào bảng **Ở nhà** | Ôn luyện |

**2. Cách tính điểm mỗi câu** (mô phỏng Quizizz: đúng 600 + tốc độ 0–400)
| Thành phần | Điểm |
|---|---|
| Trả lời đúng | **600** |
| Thưởng tốc độ | 0 → **400** (càng nhanh càng nhiều; nếu GV tắt đồng hồ thì mỗi câu đúng được 1000) |
| **Thưởng chuỗi đúng** | Đúng 3 câu liền +100 · 5 câu +200 · từ 7 câu trở đi +300 mỗi câu. Sai thì chuỗi về 0 |
| **Thưởng song ngữ** | +100 nếu làm ở mức E3 (đề toàn tiếng Anh), hoặc câu nói hay viết tiếng Anh đạt yêu cầu |
| Trả lời sai | 0. **Không trừ điểm**; điện thoại hiện lời giải thích song ngữ |

Thời gian được tính bằng **giờ của máy chủ** (không dùng giờ điện thoại), để em mạng chậm không bị thiệt và không ai chỉnh giờ để gian lận.

**3. Bảng xếp hạng thay đổi liên tục** (điểm hấp dẫn nhất)
- **Hạng thay đổi khi:**
  1. Trả lời đúng.
  2. Trả lời nhanh hơn bạn.
  3. Có thưởng chuỗi.
  4. Dùng power-up (×2, Power Play).
  5. Bạn khác vượt lên, hoặc bị mất chuỗi.
  6. Đến vòng câu cứu điểm.
- **Trên tivi:**
  - Top 10 là các thanh điểm chạy, **tự đổi chỗ có hiệu ứng trượt** mỗi khi có người vượt.
  - Dòng chữ chạy: "🔥 An đang có chuỗi 5!", "⚡ Bình vừa vượt lên hạng 2!".
  - Bên cạnh là bảng điểm tổ.
- **Trên điện thoại sau mỗi câu:**
  - Hạng của em kèm mũi tên **▲3 / ▼1**.
  - "Còn 120 điểm nữa là vượt bạn hạng trên".
  - Chuỗi hiện tại 🔥.
- **Bảo vệ HS yếu** (theo nghiên cứu ở A2):
  - Em ở nửa dưới bảng chỉ thấy **mức tăng** ("Em vừa tăng 4 bậc! / You moved up 4 places!"), không thấy con số "hạng 28".
  - Tivi có thể ẩn tên và chỉ hiện avatar.
  - GV tắt được bảng xếp hạng.
- **Kết thúc:** bục vinh quang Top 3 có pháo giấy, kèm "Tổ vô địch", "Chuỗi dài nhất", "Tiến bộ nhất trận".

**4. Power-up 🎁** (nhận được khi đúng 3 câu liền, hoặc ngẫu nhiên sau một câu đúng)
| Power-up | Tác dụng | Nguồn |
|---|---|---|
| ✂️ 50-50 | Bỏ bớt một nửa số đáp án sai | Quizizz |
| 🧽 Cục tẩy / Eraser | Bỏ 1 đáp án sai | Quizizz |
| ✖️2 Nhân đôi | Câu tiếp theo được gấp đôi điểm | Quizizz |
| ⏸️ Đóng băng / Time Freeze | Dừng đồng hồ của em ở câu này | Quizizz |
| 🛡️ Giữ chuỗi / Streak Saver | Sai 1 câu vẫn không mất chuỗi | Quizizz |
| 🔁 Làm lại / Immunity | Sai được làm lại câu đó một lần | Quizizz |
| 🎉 Power Play | **Cả lớp** được +50% điểm trong 20 giây. Đây là món quà chung, giúp lớp vui và đoàn kết | Quizizz |
| 📖 **Gợi ý thuật ngữ / Term Hint** | Hiện nghĩa tiếng Việt của từ khó trong đề | **Song ngữ** |
| 🎧 **Nghe chậm / Slow Listen** | Đọc lại đề tiếng Anh chậm | **Song ngữ** |
| 🔤 **Lật đề / Flip** | Đổi đề sang tiếng Việt (mất thưởng song ngữ của câu đó) | **Song ngữ** |

- **Cơ hội lật ngược** (giống Mario Kart): em đang xếp nửa dưới dễ nhận power-up mạnh hơn (×2, Giữ chuỗi). Em ở top 3 chủ yếu nhận 50-50 hoặc Cục tẩy.
- GV bật hoặc tắt từng power-up. Khi chơi ở chế độ kiểm tra thì tắt toàn bộ.

**5. Sticker động viên và âm thanh**
- Sau mỗi câu, điện thoại hiện 1 **sticker song ngữ** có sẵn, kèm âm đọc tiếng Anh:
  - Khi đúng: "Awesome! / Tuyệt vời!", "Math genius! / Thiên tài Toán!".
  - Khi sai: "Nice try! / Cố lên!", "Almost there! / Gần đúng rồi!".
  - Đây là bộ hình tự vẽ, **không dùng meme có bản quyền**.
- Nhạc nền nhẹ, có nhịp đếm ngược mỗi câu. GV bật hoặc tắt nhạc trên laptop.

**6. Vòng câu cứu điểm / Redemption round**
- Cuối ván, các câu em làm sai quay lại **một lần**, mỗi câu tối đa 300 điểm.
- Vòng này giúp gỡ điểm, nhất là với HS yếu, và cũng là lần các em học lại ngay câu vừa sai.

**7. Hỗ trợ song ngữ trong khi chơi**
- Đề có 3 mức E1 / E2 / E3. Mỗi HS dùng mức đã xếp theo khảo sát (mục 1), và tự chọn lên mức cao hơn để được thưởng.
- Nút 🔊 đọc đề. Thuật ngữ được gạch chân, chạm vào để xem nghĩa (miễn phí ở mức E1, mức cao hơn thì mất thưởng song ngữ).
- Câu nói ("Đọc biểu thức sau bằng tiếng Anh") do AI chấm trên máy, không lưu ghi âm.

**8. GV điều khiển (laptop)**
- Bắt đầu trò chơi chỉ với 3 lần bấm (nội dung tự lấy từ bài).
- Cài đặt nhanh: đồng hồ mỗi câu (10 / 20 / 30 / 60 giây), số câu, đảo câu, power-up, sticker, nhạc, ẩn tên, chế độ Tự do / GV điều khiển / Tổ.
- Trong lúc chơi: Tạm dừng · Bỏ qua câu · Kết thúc sớm · xem **tỉ lệ đúng từng câu ngay lúc đó**.
  - Câu nào dưới 50% đúng thì laptop gợi ý "Dừng lại giảng câu này" kèm câu tiếng Anh GV nói.
- Sau trận: báo cáo từng câu và từng em, câu sai nhiều tự vào lịch ôn ở nhà (5) và cập nhật Sao (C1).

**9. Đồng bộ với hệ thống điểm chung**
- Điểm trận được **quy đổi ra XP**: điểm ÷ 1000, tối đa 30 XP mỗi trận, cộng thêm thưởng đội thắng và phá kỉ lục (theo bảng C2).
- Điểm trận ghi vào bảng **Trên lớp** hoặc **Ở nhà** theo nơi chơi. Kết quả đi vào sự kiện học tập (A3) nên GV và HS thấy ngay.

**10. Kỹ thuật (để chạy mượt, không gian lận)**
- **Đáp án không gửi xuống điện thoại.** Điện thoại gửi câu trả lời lên API, máy chủ chấm, tính điểm rồi cập nhật bảng xếp hạng.
- Mỗi trận có 1 tài liệu trạng thái (`lsn_gameSessions/{id}`) và 1 tài liệu bảng xếp hạng (gom cập nhật khoảng mỗi giây một lần), tivi và điện thoại theo dõi tài liệu này.
- 30 em × 20 câu ≈ 1 200 lượt ghi mỗi trận. Hạn mức miễn phí là 20 000 lượt ghi/ngày, nên chơi được khoảng 10 trận mỗi ngày.
- Hiệu ứng đổi chỗ trên bảng xếp hạng dùng Framer Motion (layout animation); pháo giấy dùng canvas-confetti; âm thanh dùng Web Audio.

**Kho trò chơi (12 trò, làm dần):**
| # | Trò chơi | Kiểu | Cách chơi | Kĩ năng song ngữ |
|---|---|---|---|---|
| 1 | 🔔 **Rung chuông vàng song ngữ** | Cả lớp, loại dần | Câu hỏi đọc bằng tiếng Anh; sai thì bị loại; GV có quyền "cứu trợ" cho cả lớp quay lại | Nghe hiểu đề tiếng Anh |
| 2 | 🚤 **Đua thuyền tổ / Team Boat Race** | Đối kháng theo tổ | Mỗi câu đúng đẩy thuyền của tổ tiến lên trên tivi; tổ về đích trước thắng | Đọc đề, tính nhanh |
| 3 | 🃏 **Ghép bộ ba / Triple Match** | Cá nhân hoặc ở nhà | Ghép 3 thẻ: thuật ngữ tiếng Anh ↔ nghĩa tiếng Việt ↔ hình hoặc kí hiệu | Thuật ngữ |
| 4 | 🎧 **Nghe và tính / Listen & Solve** | Cá nhân | Tivi đọc "Seven squared minus five", HS nhập đáp số | Nghe số và phép tính |
| 5 | 🗣️ **Đọc chuẩn kí hiệu / Say It Right** | Cá nhân hoặc ở nhà | Màn hình hiện biểu thức như "√16 = 4", HS đọc bằng tiếng Anh, AI chấm | Nói, đọc kí hiệu |
| 6 | 🎯 **Bingo Toán** | Cả lớp | Phiếu bingo trên điện thoại chứa đáp số hoặc thuật ngữ; tivi đọc câu hỏi tiếng Anh; ai được 1 hàng thì hô "Bingo!" | Nghe và tính |
| 7 | 🔗 **Tôi có… Ai có… / I have… Who has…** | Hợp tác cả lớp | Mỗi em giữ 1 thẻ; cả lớp nối thành chuỗi càng nhanh càng tốt để phá **kỉ lục của lớp** | Nói câu hoàn chỉnh |
| 8 | 💰 **Săn kho báu / Treasure Hunt** | Cá nhân, có may mắn | Trả lời đúng thì được mở rương: vàng, nhân đôi, hoặc lấy của bạn | Luyện tập chung |
| 9 | 🕵️ **Thám tử lỗi sai / Error Detective** | Theo cặp | Xem lời giải có 1 lỗi; tìm lỗi rồi giải thích bằng khung câu "The mistake is… It should be…" | Critiquing & Improving |
| 10 | 🔐 **Phòng thoát hiểm / Escape Room** | Hợp tác theo tổ | 4–5 ổ khóa, mỗi ổ là một câu đố song ngữ; mở hết khóa thì tổ "thoát ra" | Vận dụng, đọc hiểu |
| 11 | 🚫 **Cấm từ / Math Taboo** | Theo tổ (mức E3) | Mô tả thuật ngữ bằng tiếng Anh nhưng không được dùng các từ bị cấm; GV bấm Đúng / Bỏ qua | Nói giải thích |
| 12 | ⚡ **Thử thách hằng ngày / Daily Duel** | Ở nhà | 5 câu mỗi ngày, so với kỉ lục của em và trung bình lớp | Ôn tập giãn cách |

**Ai hưởng lợi gì:**
- **GV:** báo cáo sau mỗi trò (câu sai nhiều, em nào cần giúp), điểm tự vào sổ.
- **HS:** XP, huy hiệu, kỉ lục cá nhân. Trò chơi ở nhà tính vào bảng xếp hạng Ở nhà.

---

## Phần E. Công nghệ
| Phần | Công nghệ |
|---|---|
| Giao diện | Next.js App Router, TypeScript, Tailwind, shadcn/ui, lucide-react, Recharts (bản đồ thành thạo, biểu đồ tiến bộ) |
| Hiệu ứng trò chơi | CSS và Framer Motion (thuyền chạy, mở rương); âm thanh bằng Web Audio; pháo giấy bằng canvas-confetti |
| Đăng nhập, phân quyền | Firebase Auth + custom claims (thêm vai trò tổ trưởng và GV tiếng Anh) |
| Dữ liệu thời gian thực | Firestore (tiền tố `lsn_`) |
| Tính điểm | **API route Vercel + firebase-admin** chấm và cộng XP; security rules cấm HS tự ghi điểm |
| Giọng nói | Web Speech API (đọc đề, chấm phát âm); sau này có thể dùng Azure |
| AI | LLM qua `/api/ai/*`, có giới hạn số lần gọi |
| Thông báo đẩy | FCM qua service worker |
| Lưu file | Firebase Storage nếu dùng được; nếu không thì lưu link (Google Drive) |
| Xuất file | Word (giáo án, đề), Excel (bảng điểm), PDF (báo cáo) |
| Ứng dụng | PWA, tải trước nội dung để dùng khi mạng yếu; deploy Vercel |

**Dữ liệu chính (mới):**
| Collection | Nội dung |
|---|---|
| `lsn_curriculum` | Khung chương trình |
| `lsn_resources` | Thuật ngữ, khung câu, câu lệnh lớp học, học liệu |
| `lsn_lessons` (+ `locks`, `comments`, `versions`) | Bài soạn và cộng tác |
| `lsn_questions` | Ngân hàng câu hỏi |
| `lsn_events` | **Sự kiện học tập**, chỉ ghi thêm, không sửa |
| `lsn_progress/{studentId}` | XP, cấp, huy hiệu, chuỗi ngày, XP hôm nay |
| `lsn_mastery` | Sao theo YCCĐ |
| `lsn_leaderboards/{classId}_{tuần}` | Gộp sẵn **1 tài liệu cho mỗi lớp mỗi tuần**, để tiết kiệm lượt đọc |
| `lsn_games`, `lsn_gameSessions` | Mẫu trò chơi, ván chơi |
| `lsn_tests` (+ `attempts`) | Đề và bài làm |
| `lsn_assignments` | Bài giao và phân công soạn |

Với khoảng 50 HS, một ván trò chơi tốn khoảng 30 em × 20 câu = 600 lượt ghi, vẫn nằm trong hạn mức miễn phí của Firestore (20 000 lượt ghi/ngày).

---

## Phần F. Lộ trình (chưa code)
| GĐ | Nội dung | Xong khi |
|---|---|---|
| 3 | Khung chương trình + **sự kiện học tập + XP, cấp độ, xếp hạng** + Quản lý lớp (3 tab Trên lớp / Ở nhà / Tiến bộ) + trang "Hành trình" của HS | Tiết học cũ (GĐ 2) cộng XP; GV và HS thấy cùng con số |
| 4 | Học liệu số (thuật ngữ, khung câu, câu lệnh lớp học, kí hiệu, link GeoGebra) | Tìm "isosceles" ra đủ học liệu |
| 5 | **Trò chơi đợt 1:** ⚔️ **Đấu trường Song ngữ** (7A: điểm, chuỗi, bảng xếp hạng nhảy, power-up, câu cứu điểm) + Rung chuông vàng, Đua thuyền tổ, Ghép bộ ba + nút 🎮 trong tiết học | 30 điện thoại chơi 1 trận 15 câu bài Tam giác cân; bảng xếp hạng đổi chỗ mượt trên tivi; XP vào hệ thống chung |
| 6 | Soạn bài cộng tác (phân công, khóa trang, 2 lớp duyệt, 3 mức E, đánh dấu dùng cho mục 4/5/6/7) + AI | 2 GV cùng soạn 1 bài; bài tự có trò chơi và bài ôn |
| 7 | Dạy trên lớp nâng cao + nhắn tin (§5 cũ) | Dạy trọn 1 tiết mới, có trò chơi giữa tiết |
| 8 | Ôn luyện ở nhà (Nhiệm vụ hôm nay, ôn giãn cách, thích ứng) + trò chơi 5, 12 | HS ôn 1 tuần, bảng xếp hạng Ở nhà chạy đúng |
| 9 | Kiểm tra (ngân hàng câu hỏi, ma trận, thử thách thăng hạng) | Đề 15 phút theo ma trận, kết quả cập nhật Sao |
| 10 | Trò chơi đợt 2 (6–11), huy hiệu, avatar, PWA, deploy, tài liệu hướng dẫn | Chạy ổn định 1 tuần tại trường |

**Cho cuộc thi KHKT (khoảng 50 HS):** làm sâu GĐ 3–5 và GĐ 7–8 cho **một chương** (Tam giác, lớp 7). Đo trước và sau: điểm Toán, điểm ngôn ngữ, thời gian tự học và mức hứng thú (phiếu khảo sát), tách riêng số liệu ở lớp và ở nhà.

## Phần G. Việc cần thầy/cô quyết định
1. Bộ sách nào (Kết nối tri thức, Chân trời sáng tạo, Cánh Diều) và dạy những lớp nào?
2. Có GV tiếng Anh tham gia duyệt ngôn ngữ không?
3. Tên 8 hạng ở C3 và bảng điểm ở C2 đã ổn chưa, có muốn đổi gì không?
4. Có cho hiện tên thật trên bảng xếp hạng ở tivi không? Đề xuất: tên gọi + avatar, GV bật hoặc tắt.
5. Có đồng ý lộ trình mới (làm trò chơi sớm ở GĐ 5) không?
