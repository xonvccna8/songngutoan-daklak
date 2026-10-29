// Kiểu dữ liệu dùng chung giữa trình duyệt và máy chủ (xem docs/DU-LIEU.md)

export type Role = "admin" | "teacher" | "student";

/** Custom claims gắn vào token Firebase */
export interface Claims {
  role?: Role;
  schoolId?: string;
  classIds?: string[];
}

export interface ClassSettings {
  /** Số tổ trong lớp */
  teams: number;
  /** Ngưỡng trạng thái ngoài giờ (7 ngày) */
  thresholds: {
    /** Tích cực khi học ≥ số ngày này và không trễ bài */
    activeDays: number;
    /** Chưa học khi trễ ≥ số bài này */
    inactiveLate: number;
  };
  /** Giờ yên lặng: không gửi thông báo có âm thanh */
  quietHours: { start: string; end: string };
  /** Số tin "Chú ý" tối đa cho 1 em trong 1 tiết */
  maxAttention: number;
  /** HS được dùng Trợ lý học tập AI (GV tắt được; nhật kí GV xem được) */
  aiTutor: boolean;
}

export const DEFAULT_CLASS_SETTINGS: ClassSettings = {
  teams: 4,
  thresholds: { activeDays: 3, inactiveLate: 2 },
  quietHours: { start: "21:00", end: "06:30" },
  maxAttention: 3,
  aiTutor: true,
};

export interface ClassDoc {
  id: string;
  name: string;
  grade: number;
  schoolId: string;
  teacherIds: string[];
  joinCode: string;
  settings: ClassSettings;
  studentCount: number;
  isSample?: boolean;
  /** GĐ 4 — bài SGK lớp đang học (id khung chương trình, vd "k8-15") */
  curLessonId?: string | null;
}

/** Chỉ lưu họ tên, số thứ tự, tổ — không email/SĐT (quy tắc riêng tư) */
export interface StudentDoc {
  uid: string;
  fullName: string;
  number: number;
  team: number;
  /** Đợt C — mức tiếng Anh GV đã xác nhận (chưa có = E2 song ngữ) */
  eLevel?: "e1" | "e2" | "e3";
}

export interface UserDoc {
  uid: string;
  role: Role | "pending";
  displayName: string;
  email?: string;
  schoolId: string | null;
  classIds: string[];
}

/** Một dòng phiếu đăng nhập (PIN chỉ có lúc vừa tạo, không lưu dạng rõ) */
export interface PinSlip {
  uid: string;
  fullName: string;
  number: number;
  team: number;
  pin: string;
}
