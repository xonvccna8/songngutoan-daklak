// Nhắn tin & cảnh báo (GĐ 4) — xem docs/TINH-NANG.md §5
import type { Bi } from "@/lib/live/types";

export type MessageKind = "attention" | "reminder" | "praise" | "notice";
export type Reply = "understood" | "need_help";
export type ReceiptStatus = "sent" | "delivered" | "read" | "acked";

export const KIND_META: Record<MessageKind, { label: string; en: string; bg: string; fg: string; soft: string; desc: string }> = {
  attention: { label: "Chú ý", en: "Attention", bg: "#FFC93C", fg: "#14213D", soft: "#FFF4D6", desc: "Chuông 2 lần + rung + khung vàng toàn màn hình đến khi em xác nhận" },
  reminder: { label: "Nhắc nhở", en: "Reminder", bg: "#16A34A", fg: "#FFFFFF", soft: "#DCFCE7", desc: "Âm báo vừa + thẻ tin" },
  praise: { label: "Khen ngợi", en: "Well done", bg: "#E8492E", fg: "#FFFFFF", soft: "#FFE6E0", desc: "Âm vui, có thể cộng điểm thưởng" },
  notice: { label: "Thông báo", en: "Notice", bg: "#14213D", fg: "#FFFFFF", soft: "#ECFDF3", desc: "Im lặng, chỉ hiện trong hộp tin" },
};

/** Mẫu tin nhanh song ngữ (GV sửa được trước khi gửi) */
export const TEMPLATES: Record<MessageKind, Bi[]> = {
  attention: [
    { en: "Please pay attention!", vi: "Em chú ý lên bảng nhé!" },
    { en: "Look at the TV, please.", vi: "Em nhìn lên tivi nhé." },
    { en: "Please stop and listen.", vi: "Em dừng lại và lắng nghe nhé." },
  ],
  reminder: [
    { en: "Please answer the question.", vi: "Em trả lời câu hỏi nhé." },
    { en: "Put your phone down and work with your group.", vi: "Em úp điện thoại và làm việc nhóm nhé." },
    { en: "Please come back to the lesson page.", vi: "Em quay lại trang bài học nhé." },
    { en: "Remember to do your homework.", vi: "Em nhớ làm bài về nhà nhé." },
  ],
  praise: [
    { en: "Great job!", vi: "Làm tốt lắm!" },
    { en: "Excellent pronunciation!", vi: "Phát âm rất tốt!" },
    { en: "Well done, keep it up!", vi: "Giỏi lắm, cố gắng tiếp nhé!" },
    { en: "Thank you for helping your group.", vi: "Cảm ơn em đã giúp cả nhóm." },
  ],
  notice: [
    { en: "The lesson starts in 5 minutes.", vi: "5 phút nữa vào tiết học." },
    { en: "Please bring a leaf sample and a hand lens tomorrow.", vi: "Ngày mai em mang một mẫu lá cây và kính lúp nhé." },
    { en: "Check your vocabulary list at home.", vi: "Về nhà em ôn lại bảng từ vựng nhé." },
  ],
};

export const REPLY_LABEL: Record<Reply, string> = { understood: "Em hiểu rồi", need_help: "Em cần giúp" };

export interface MessageDoc {
  id: string;
  classId: string;
  schoolId: string;
  fromUid: string;
  fromName: string;
  kind: MessageKind;
  text: Bi;
  toUids: string[];
  /** Nhãn người nhận cho GV/quản trị đọc: "Cả lớp", "Tổ 2", "Nguyễn Văn An"… */
  toLabel: string;
  sessionId: string | null;
  /** Tin gắn với bài tập (bài mới / nhắc hạn) → bấm vào mở bài */
  assignmentId?: string | null;
  points: number;
  /** Trong giờ yên lặng → không chuông, không rung */
  silent: boolean;
  createdAt?: { toMillis(): number } | null;
}

export interface ReceiptDoc {
  uid: string;
  status: ReceiptStatus;
  deliveredAt?: { toMillis(): number } | null;
  readAt?: { toMillis(): number } | null;
  ackAt?: { toMillis(): number } | null;
  reply?: Reply | null;
}

export const STATUS_LABEL: Record<ReceiptStatus, string> = { sent: "Đã gửi", delivered: "Đã nhận", read: "Đã xem", acked: "Đã xác nhận" };
export const STATUS_ORDER: ReceiptStatus[] = ["sent", "delivered", "read", "acked"];
