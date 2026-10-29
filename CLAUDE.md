# Lớp Song Ngữ — hướng dẫn cho Claude Code

Web dạy và học song ngữ Việt–Anh cho THCS (Toán trước). Người dùng là giáo viên, không phải lập trình viên: giải thích ngắn, bằng tiếng Việt, hướng dẫn từng bước khi cần thao tác trên Firebase/Vercel.

## Công nghệ (cố định)
Next.js App Router + TypeScript + Tailwind + shadcn/ui + lucide-react + Recharts · Firebase (Auth, Firestore, Storage, FCM) · API route trên Vercel dùng firebase-admin (để chạy gói Spark miễn phí, không dùng Cloud Functions) · PWA · Deploy Vercel.

## Tài liệu (CHỈ đọc file cần cho giai đoạn đang làm)
- `docs/GIAI-DOAN.md` — các giai đoạn, tiêu chí xong, mỗi giai đoạn cần đọc file nào
- `docs/TINH-NANG.md` — đặc tả chức năng (chia mục §1–§8)
- `docs/DU-LIEU.md` — mô hình Firestore, security rules, cách tính trạng thái học, tính điểm
- `docs/GIAO-DIEN.md` — màu, phông, thành phần giao diện, danh sách màn hình
- `reference/lop-song-ngu.html` — bản chạy thử luồng dạy 3 màn hình (chỉ đọc ở giai đoạn 2)

## Quy tắc làm việc
1. Mỗi lần chỉ làm MỘT giai đoạn. Đầu giai đoạn: nêu kế hoạch ngắn (≤15 dòng), chờ tôi đồng ý rồi mới code.
2. Không đọc file không liên quan; không quét toàn bộ dự án khi không cần.
3. Cuối giai đoạn: chạy `npm run build` và test; báo cáo ≤10 dòng: đã làm gì, cách thử, việc tôi cần làm.
4. Không lặp lại mã đã viết trong câu trả lời; không tóm tắt dài.
5. Bí mật chỉ ở `.env.local` (đã có `.env.example`). Không bao giờ in khóa ra màn hình hay commit.
6. Giao diện tiếng Việt; nội dung bài học song ngữ (tiếng Anh màu nhấn chữ thẳng, tiếng Việt xám nghiêng).
7. Riêng tư học sinh (dưới 18 tuổi): chỉ lưu họ tên, lớp, tổ; không email, không số điện thoại, không lưu ghi âm.
8. Mã chia module nhỏ; chú thích tiếng Việt ở chỗ quan trọng.

## Compact instructions
Khi compact, giữ lại: giai đoạn đang làm, quyết định kiến trúc, cấu trúc thư mục, lỗi chưa sửa. Bỏ nội dung file đã đọc.
