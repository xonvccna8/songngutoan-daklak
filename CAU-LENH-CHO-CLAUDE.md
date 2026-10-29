# Câu lệnh dán vào Claude Code (dành cho thầy/cô, Claude không cần đọc file này)

## Chuẩn bị một lần
1. Giải nén thư mục này vào máy, mở bằng VS Code.
2. Tạo file `.env.local` (chép từ `.env.example`), điền thông tin Firebase **trên máy**, không dán vào chat.
   - Cấu hình web: Firebase Console > ⚙ Project settings > Your apps > biểu tượng `</>` (Web app).
   - File `google-services.json` (có `"project_info"`) là của ứng dụng Android, **không dùng cho web**.
   - Khóa Admin (Service accounts > Generate new private key) là bí mật: chỉ để trong `.env.local` và trong Environment Variables của Vercel.
3. **Không đính kèm** file thiết kế HTML 4 MB vào chat. Màu sắc và bố cục đã được ghi gọn trong `docs/GIAO-DIEN.md`.

## Mỗi giai đoạn: 1 phiên chat
Mở phiên mới (hoặc gõ `/clear`), chọn model rồi dán đúng 1 câu lệnh:

**GĐ 1**
> Làm giai đoạn 1 trong docs/GIAI-DOAN.md. Chỉ đọc các file ghi ở cột "Đọc". Nêu kế hoạch ngắn trước, chờ tôi đồng ý.

**GĐ 2**
> Làm giai đoạn 2 trong docs/GIAI-DOAN.md. Đọc docs/TINH-NANG.md §3 và reference/lop-song-ngu.html. Nêu kế hoạch ngắn trước.

**GĐ 3 đến 7**: giống trên, thay số giai đoạn.

**Khi có lỗi**
> Trang /teacher/class/7A báo lỗi: [dán đúng dòng lỗi]. Sửa lỗi này, không thay đổi phần khác.

**Deploy Vercel (cuối GĐ 7)**
> Hướng dẫn tôi deploy lên Vercel từng bước và cách nhập biến môi trường từ .env.local vào Vercel.

## Mẹo tiết kiệm (quan trọng)
| Làm | Vì sao |
|---|---|
| Hết mỗi giai đoạn gõ `/rename gd1` rồi `/clear` | Cuộc trò chuyện càng dài, mỗi tin nhắn càng tốn token. `/clear` không tốn gì |
| Dùng **Sonnet** khi viết code (`/model`), chỉ dùng **Opus** khi lập kế hoạch giai đoạn hoặc lỗi khó | Sonnet rẻ hơn và làm tốt phần lớn việc lập trình |
| Việc đơn giản: hạ mức suy nghĩ bằng `/effort` | Suy nghĩ tính như token đầu ra |
| Đầu giai đoạn bấm **Shift+Tab** để vào chế độ lập kế hoạch | Tránh làm sai hướng rồi phải làm lại |
| Thấy Claude đi sai hướng: bấm **Esc** ngay, rồi nói rõ cần gì | Dừng sớm đỡ phí |
| Câu lệnh cụ thể: nêu đúng trang, đúng lỗi | Câu mơ hồ làm Claude đọc nhiều file |
| Gõ `/usage` để xem đã dùng bao nhiêu | Biết lúc nào nên `/clear` |
| Làm xong GĐ 1–2 thì dạy thử trước | Không tốn token cho tính năng chưa cần |
