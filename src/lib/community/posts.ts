// Cộng đồng học tập: hỏi – đáp, chia sẻ trong lớp (lsn_posts + replies). An toàn cho HS dưới 18 tuổi:
// bài / trả lời của HS phải được GV duyệt mới hiện cho cả lớp · không nhắn riêng giữa HS · không đăng link ·
// chỉ hiện tên gọi + tổ · giới hạn số lượt mỗi ngày. Hàm thuần, có test trong tests/community.test.ts
import type { Bi } from "@/lib/live/types";

export type PostKind = "question" | "share";
export type PostStatus = "pending" | "approved" | "hidden";
export type AuthorRole = "student" | "teacher";

export const POST_KINDS: Record<PostKind, { vi: string; en: string }> = {
  question: { vi: "Câu hỏi", en: "Question" },
  share: { vi: "Chia sẻ", en: "Sharing" },
};

export const COMMUNITY_LIMITS = { minChars: 5, maxChars: 600, perStudentPerDay: 10 };

export interface PostDoc {
  id: string;
  classId: string;
  schoolId: string;
  authorUid: string;
  authorName: string;
  authorRole: AuthorRole;
  team: number | null;
  kind: PostKind;
  text: string;
  /** Bài SGK liên quan (không bắt buộc) */
  curLessonId: string | null;
  /** HS viết bằng tiếng Anh (tự đánh dấu) */
  english: boolean;
  status: PostStatus;
  replyCount: number;
  bestReplyId: string | null;
  createdAt?: { toMillis(): number } | null;
}

export interface ReplyDoc {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: AuthorRole;
  team: number | null;
  text: string;
  english: boolean;
  status: PostStatus;
  createdAt?: { toMillis(): number } | null;
}

/** Khung câu giúp HS hỏi / trả lời bằng tiếng Anh */
export const ASK_FRAMES: Bi[] = [
  { en: "What is the difference between ___ and ___?", vi: "___ và ___ khác nhau thế nào?" },
  { en: "Why does ___ happen?", vi: "Vì sao ___ xảy ra?" },
  { en: "How do you say “___” in English?", vi: "“___” nói bằng tiếng Anh thế nào?" },
  { en: "Can someone explain ___, please?", vi: "Bạn nào giải thích giúp mình ___ với?" },
  { en: "I found out that ___.", vi: "Mình phát hiện ra rằng ___." },
];
export const ANSWER_FRAMES: Bi[] = [
  { en: "I think ___ because ___.", vi: "Mình nghĩ ___ vì ___." },
  { en: "The main difference is that ___.", vi: "Điểm khác chính là ___." },
  { en: "For example, ___.", vi: "Ví dụ, ___." },
];

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|vn|org|io|me|ly|gg)\b)/i;
const PHONE = /(\+?84|0)\d{9,10}\b/;

/** Làm sạch nội dung; HS không được đăng link hay số điện thoại. Trả chuỗi lỗi nếu không hợp lệ */
export function cleanPostText(raw: unknown, role: AuthorRole): string | { error: string } {
  const text = String(raw ?? "")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (text.length < COMMUNITY_LIMITS.minChars) return { error: "Nội dung quá ngắn." };
  if (text.length > COMMUNITY_LIMITS.maxChars) return { error: `Tối đa ${COMMUNITY_LIMITS.maxChars} kí tự.` };
  if (role === "student" && LINK.test(text)) return { error: "Em không đăng đường liên kết ở đây nhé." };
  if (role === "student" && PHONE.test(text.replace(/[\s.-]/g, ""))) return { error: "Không đăng số điện thoại để giữ an toàn cho em." };
  return text;
}

/** Tên hiển thị: tên gọi (chữ cuối của họ tên) — không hiện họ tên đầy đủ */
export const displayName = (fullName: string) => fullName.trim().split(/\s+/).pop() ?? "Bạn";

/** Mới nhất trước; bài vừa gửi (chưa có giờ máy chủ) lên đầu */
export const sortPosts = (list: PostDoc[]) => [...list].sort((a, b) => (b.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER) - (a.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER));
