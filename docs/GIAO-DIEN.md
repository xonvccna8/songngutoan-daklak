# Giao diện (theo bộ thiết kế "Lớp Song Ngữ – Giao diện")

Phong cách: tươi sáng nhưng không trẻ con; nút dày có bóng đổ như phím bấm; bo góc lớn; hình học (tam giác, tròn, vuông, thoi) làm điểm nhấn.

## Màu
| Token | Mã | Dùng cho |
|---|---|---|
| ink | #1C1B3A | chữ chính, nền tivi (#17163A), sidebar GV |
| ink-2 | #55537A | chữ phụ |
| paper | #F6F4FF | nền ứng dụng |
| card | #FFFFFF, viền #E6E2F6 (2px) | thẻ |
| blue | #2F5BEA, bóng #1E3FB8 | nút chính, đáp án B |
| sun | #FFC93C, bóng #C9951A | XP, nhấn mạnh, tin "Chú ý", đáp án C (chữ ink) |
| coral | #E8492E, bóng #B23620 | đáp án A, cảnh báo |
| teal | #0E9F8A, bóng #0A7565 | thành công, linh vật, đáp án D |
| success bg | #E9FBF3 / chữ #0A7A50 | màn trả lời đúng |
Chip trạng thái: Đang học #DDF7EE/#0A6F5F · Đã trả lời #E7ECFF/#1E3FB8 · Rời trang #FFE3DD/#A3301B · Chưa trả lời #FFF1D2/#8A5A00 · Mất kết nối #ECEAF4/#4A4870.

## Chữ
Tiêu đề, con số: **Bricolage Grotesque** 700–800 · Chữ thường: **Be Vietnam Pro** 400–700 · Nội dung trình chiếu tivi: **Lexend** 500–700. Tiếng Anh chữ thẳng; tiếng Việt nghiêng, màu ink-2.

## Thành phần
- Nút chính: bo 14px, `box-shadow: 0 4px 0 <màu bóng>`, chữ 700. Nút phụ: viền 2px #E0DBF3.
- 4 ô đáp án: màu coral/blue/sun/teal + hình tam giác/thoi/tròn/vuông (không chỉ phân biệt bằng màu), bo 20px, bóng 6px.
- Thẻ: bo 18–24px. Viên (pill) cho chuỗi ngày (lửa cam) và XP (tia sét xanh).
- Linh vật "Tam": tam giác cân màu teal có mắt; xuất hiện khi trả lời đúng, khi nhắc chú ý, trạng thái rỗng.
- Trạng thái luôn = màu + biểu tượng + chữ. Nút ≥44px. Tương phản chữ ≥4,5:1.

## Màn hình
Điện thoại HS (390×844): Trang chủ (chào, chuỗi ngày, XP, thẻ "Lớp đang học – Vào lớp", vòng mục tiêu ngày, lộ trình chương, tin GV, thanh điều hướng 4 mục) · Trả lời câu hỏi (nền ink, thanh thời gian vàng, thẻ câu hỏi trắng có hình, 4 ô đáp án, Giơ tay) · Trả lời đúng (nền xanh nhạt, Tam reo mừng, điểm câu, chuỗi đúng, đóng góp cho tổ, "Vì sao") · Luyện phát âm (từ đúng xanh, từ sai gạch sóng đỏ, vòng điểm, nút micro lớn) · Tin Chú ý (nền vàng toàn màn hình, nút "Em đã chú ý").
Tivi (16:9, nền ink): Câu hỏi (đồng hồ vòng, số đã trả lời dạng chấm, bảng từ, 4 ô đáp án lớn) · Thi đua theo tổ (đường đua 4 tổ, mục tiêu cả lớp, top 5 phát âm; không bao giờ hiện ai đứng cuối).
Laptop GV: sidebar ink (danh sách lớp), dải "Đang dạy", 5 ô chỉ số, tab, lưới thẻ HS có chip trạng thái + nút chuông, cột phải "Cần chú ý ngay" + khung nhắn tin 4 loại + trạng thái tin.
