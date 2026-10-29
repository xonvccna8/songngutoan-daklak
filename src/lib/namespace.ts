// Project Firebase dùng CHUNG với các app khác (Auth + Firestore) → mọi dữ liệu của
// Lớp Song Ngữ đều có tiền tố "lsn" để không đụng chạm dữ liệu/quyền của app khác.
import type { Claims, Role } from "@/lib/types";

/** Tên bộ sưu tập Firestore */
export const COL = {
  schools: "lsn_schools",
  users: "lsn_users",
  classes: "lsn_classes",
  /** bộ sưu tập con của lsn_classes/{id} */
  students: "students",
  private: "lsn_private",
  stats: "lsn_studentStats",
  /** Tiết học: lsn_lessons/{id} + slides/{slideId} (HS đọc được) + teacher/{slideId} (đáp án, chỉ GV) */
  lessons: "lsn_lessons",
  slides: "slides",
  teacherKeys: "teacher",
  /** Phiên dạy: lsn_sessions/{id} + participants/{uid} + responses/{uid}~{slideId} */
  sessions: "lsn_sessions",
  participants: "participants",
  responses: "responses",
  /** Phiếu của từng em: lsn_sessions/{id}/mine/{uid} — câu đã gửi + kết quả câu ĐÃ CÔNG BỐ (máy chủ ghi) */
  mine: "mine",
  /** Bộ đếm số em trả lời đúng mỗi câu (xếp hạng thưởng tốc độ, chỉ máy chủ): lsn_sessions/{id}/qstats/{slideId} */
  qstats: "qstats",
  /** Tin nhắn GV → HS: lsn_messages/{id} + receipts/{uid} (biên nhận của từng em) */
  messages: "lsn_messages",
  receipts: "receipts",
  /** Mã thiết bị nhận thông báo đẩy: lsn_fcmTokens/{uid}/tokens/{id} */
  fcmTokens: "lsn_fcmTokens",
  tokens: "tokens",
  /** GĐ 5 — Bài tập về nhà: lsn_assignments/{id} + submissions/{uid} (chỉ máy chủ ghi) */
  assignments: "lsn_assignments",
  submissions: "submissions",
  /** Thời gian học thật theo ngày: lsn_studyDaily/{uid}_{yyyymmdd} */
  studyDaily: "lsn_studyDaily",
  /** Thẻ từ vựng (lịch ôn lặp ngắt quãng) của từng em: lsn_cards/{uid} */
  cards: "lsn_cards",
  /** Ngân hàng thuật ngữ: lsn_terms/{id} */
  terms: "lsn_terms",
  /** GĐ 6b — số lượt dùng trợ lý AI theo ngày: lsn_aiUsage/{uid}_{ngày} (chỉ máy chủ) */
  aiUsage: "lsn_aiUsage",
  /** GĐ 3 mới — sự kiện học tập (mỗi lần cộng XP / lên cấp), chỉ máy chủ ghi: lsn_events/{id} */
  events: "lsn_events",
  /** Điểm thi đua tuần của lớp (1 tài liệu/lớp/tuần): lsn_weekly/{classId}_{yyyy-Www} */
  weekly: "lsn_weekly",
  /** GĐ 4 — học liệu do GV thêm (link GeoGebra / video / phiếu học tập): lsn_resources/{id} */
  resources: "lsn_resources",
  /** GĐ 5 — trò chơi: lsn_games/{id} + live/board + players/{uid} + private/key (src/lib/games/types.ts) */
  games: "lsn_games",
  gameLive: "live",
  gamePlayers: "players",
  gamePrivate: "private",
  /** Ngân hàng câu hỏi: lsn_questions/{id} (đề + đáp án — chỉ GV đọc; HS nhận câu qua bài tập) */
  questions: "lsn_questions",
  /** Dự án STEM theo tổ: lsn_projects/{id} + teams/{số tổ} (máy chủ ghi) */
  projects: "lsn_projects",
  projectTeams: "teams",
  /** Cộng đồng học tập (hỏi – đáp trong lớp, GV duyệt): lsn_posts/{id} + replies/{id} */
  posts: "lsn_posts",
  replies: "replies",
  /** Trợ lý học tập AI: nhật kí trò chuyện mỗi em mỗi ngày lsn_tutor/{uid}_{ngày} (chỉ máy chủ đọc/ghi; GV xem qua API) */
  tutor: "lsn_tutor",
} as const;

/** ID câu trả lời: mỗi em một câu trả lời cho mỗi trang */
export const responseId = (uid: string, slideId: string) => `${uid}~${slideId}`;

/** Tên custom claims (app khác đã dùng "role", "schoolId" — không được ghi đè) */
export const CLAIM = { role: "lsnRole", school: "lsnSchool", classes: "lsnClasses" } as const;

export function readClaims(raw: Record<string, unknown> | undefined | null): Claims {
  const r = raw ?? {};
  return {
    role: r[CLAIM.role] as Role | undefined,
    schoolId: r[CLAIM.school] as string | undefined,
    classIds: (r[CLAIM.classes] as string[] | undefined) ?? [],
  };
}

export function toClaims(c: Claims): Record<string, unknown> {
  return { [CLAIM.role]: c.role, [CLAIM.school]: c.schoolId, [CLAIM.classes]: c.classIds ?? [] };
}
