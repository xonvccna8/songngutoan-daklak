# Cài đặt Firebase & Vercel

> **Trạng thái (11/10/2026): đã cấu hình xong.** Web chạy tại https://lop-song-ngu.vercel.app

## Project Firebase DÙNG CHUNG — quy tắc bắt buộc
Project `xonvccna8` đang chạy nhiều app khác (TeaCare, Giám Hộ Số, quản lý trường…) dùng chung Auth + Firestore.
Vì vậy mọi thứ của Lớp Song Ngữ có tiền tố riêng (xem `src/lib/namespace.ts`):
- Bộ sưu tập: `lsn_users`, `lsn_classes` (+ `students`), `lsn_schools`, `lsn_private`, `lsn_studentStats`.
- Custom claims: `lsnRole`, `lsnSchool`, `lsnClasses` — chỉ được ghép thêm qua `setLsnClaims`, **không ghi đè** claims của app khác.
- Rules: **KHÔNG** chạy `firebase deploy --only firestore:rules` (sẽ xoá rules của app khác). Chỉ dùng `npm run deploy:rules` — script chỉ thay đoạn giữa `>>> LOP SONG NGU` và `<<< LOP SONG NGU`, biên dịch thử trước khi đăng, lưu bản cũ ở `rules-backup/`.

## Những gì đã được thiết lập
| Hạng mục | Giá trị |
|---|---|
| Web app Firebase | "Lop Song Ngu" (khoá trong `.env.local` và Vercel) |
| Service account riêng | `lop-song-ngu-admin@xonvccna8.iam.gserviceaccount.com` — quyền Firebase Auth Admin + Cloud Datastore User |
| Authorized domains | đã thêm `lop-song-ngu.vercel.app` |
| Đăng nhập | Email/Password + Google đều đang bật |
| Quản trị đầu tiên | `ADMIN_EMAILS=huyenxo01@gmail.com` |
| Vercel | project `xonvccna8s-projects/lop-song-ngu`, Node 24, máy chủ Singapore `sin1` (vercel.json — gần Firestore asia-southeast1) |
| Đã thử tải | 50 HS cùng lúc: đăng nhập PIN ~2,5 s, gửi câu trả lời ~0,3 s, 0 lỗi (11/10/2026) |

## Lệnh thường dùng
```
npm run dev                                       # chạy thử ở máy: http://localhost:3000
npm run check -- --email=ten@gmail.com            # kiểm tra kết nối Firebase + xem vai trò một tài khoản
npm run make-admin -- --email=ten@gmail.com       # cấp quyền quản trị (tài khoản phải đăng nhập web 1 lần trước)
npm run make-admin -- --email=ten@gmail.com --role=teacher
npm run deploy:rules                              # đăng rules an toàn (có --dry để chỉ kiểm tra)
npm run seed / npm run seed:clear                 # lớp 7A mẫu 30 em / xoá dữ liệu mẫu
npm run seed:lesson                               # nạp/cập nhật tiết mẫu "Tam giác cân" (src/lib/lessons/)
npm run seed:history                              # 9 tiết mẫu 3 tuần cho lớp 7A (biểu đồ có số liệu khi trình bày)
npm run indexes                                   # tạo chỉ mục Firestore (chỉ thêm, không xoá chỉ mục app khác)
npx vercel deploy --prod                          # đưa bản mới lên Vercel
```
Thử trên điện thoại cùng Wi-Fi: `npm run dev -- -H 0.0.0.0` rồi mở `http://<IP-máy-tính>:3000/s/login`.

## Đổi biến môi trường trên Vercel
Vào https://vercel.com/xonvccna8s-projects/lop-song-ngu/settings/environment-variables → sửa → Redeploy.
Nếu dùng dòng lệnh trên Windows PowerShell: dùng `--value=...`, **không** dùng `echo ... |` (PowerShell 5.1 chèn kí tự BOM ẩn vào đầu giá trị → Firebase báo sai project).

## Kiểm thử
- `npm test` — hàm xử lý (đọc danh sách Excel, mã lớp, PIN, khoá 5 lần sai…).
- `npm run test:rules` — security rules bằng Emulator, **cần Java 11+** (https://adoptium.net).
