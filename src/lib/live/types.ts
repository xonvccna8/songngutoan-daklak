// Mô hình tiết học & phiên dạy trực tiếp (GĐ 2) — xem docs/DU-LIEU.md
export interface Bi {
  en: string;
  vi: string;
}

/** Hình vẽ Toán dựng sẵn (components/live/figures.tsx) */
export type FigureId = "triangle-abc" | "right-triangle" | "pythagoras-squares" | "coordinate-plane" | "similar-triangles";

/** Khối nội dung trên một trang; `step` = bước bấm Tiếp thì khối hiện ra */
export type Block =
  | { kind: "hero"; step: number; text: Bi }
  | { kind: "join"; step: number }
  | { kind: "goals"; step: number; items: Bi[] }
  | { kind: "steps"; items: { step: number; text: Bi }[] }
  | { kind: "text"; step: number; text: Bi; keep?: boolean }
  | { kind: "say"; step: number; text: Bi }
  | { kind: "ipa"; step: number; items: { word: string; ipa: string }[] }
  | { kind: "box"; step: number; tag?: string; text: Bi; highlight?: boolean; small?: boolean }
  | { kind: "figure"; step: number; figure: FigureId; labels?: { top?: string; left?: string } }
  | { kind: "cols"; left: Block[]; right: Block[] };

export type SlideType = "content" | "mcq" | "number" | "text" | "label" | "speak" | "final";
/** "Toán" = kiến thức môn Toán · "Ngôn ngữ" = tiếng Anh. Dữ liệu KHTN có thể có "Khoa học" → coi như "Toán". */
export type Skill = "Toán" | "Ngôn ngữ";
export type QType = "mcq" | "number" | "text" | "label";

export interface Question {
  type: QType;
  time: number;
  skill: Skill;
  prompt: Bi;
  /** mcq: các phương án; label: các nhãn để ghép (có thể thừa nhãn gây nhiễu) */
  options?: Bi[];
  /** label: các ô cần gắn nhãn */
  targets?: Bi[];
  unit?: string;
}

/** 4 hoạt động theo CV 5512 */
export type Activity = 1 | 2 | 3 | 4;

export interface Slide {
  id: string;
  order: number;
  type: SlideType;
  title: Bi;
  blocks: Block[];
  question?: Question;
  speak?: { target: string; time: number };
  phonesDown?: boolean;
  activity?: Activity;
  /** GĐ 4 — câu hỏi đo những yêu cầu cần đạt nào (id YCCĐ, src/lib/curriculum) */
  outcomeIds?: string[];
}

/** Phần chỉ GV đọc được: đáp án, lời giải, ghi chú */
export interface TeacherKey {
  answer?: number;
  /** label: order[i] = chỉ số nhãn đúng cho ô thứ i */
  order?: number[];
  accept?: string[];
  show?: string;
  explain?: Bi;
  /** Gợi ý "cách làm" cho bài tập về nhà (tầng 2) — không lộ đáp án */
  method?: Bi;
  notes: { en?: string; vi?: string }[];
}

export interface Term {
  en: string;
  ipa: string;
  vi: string;
  /** Thuật ngữ xuất hiện từ trang thứ mấy (0-based) */
  at: number;
}

export type LessonStatus = "draft" | "pending" | "approved";

/** Mục tiêu theo khung 4C (CLIL) */
export interface Objectives4C {
  content: Bi;
  communication: Bi;
  cognition: Bi;
  culture: Bi;
}

/** Thông tin từng hoạt động cho giáo án CV 5512 */
export interface ActivityPlan {
  goal: string;
  product: string;
}

export interface LessonDoc {
  id: string;
  title: Bi;
  subtitle: string;
  subject: string;
  grade: number;
  status: LessonStatus;
  slideIds: string[];
  terms: Term[];
  /** GĐ 6 — soạn bài. Tiết mẫu nạp bằng script: ownerId = null */
  ownerId?: string | null;
  ownerName?: string;
  schoolId?: string | null;
  objectives?: Objectives4C;
  activities?: ActivityPlan[];
  equipment?: string;
  /** Số phút của tiết */
  duration?: number;
  /** Đợt B — số phút từng chặng: Mở đầu, Hình thành KT, Luyện tập, Vận dụng, Tổng kết */
  timing?: number[];
  sourceId?: string | null;
  reviewNote?: string | null;
  /** GĐ 6b — tiết do trợ lý AI đề xuất (nhắc GV kiểm tra kĩ) */
  aiDraft?: boolean;
  /** GĐ 4 — bài tương ứng trong SGK (id khung chương trình, vd "k8-15") */
  curLessonId?: string | null;
  updatedAt?: { toMillis(): number } | null;
}

export type Phase = "idle" | "open" | "locked" | "reveal";
export type Lang = "en" | "bi" | "vi";

export interface LiveState {
  slideIndex: number;
  step: number;
  phase: Phase;
  lang: Lang;
  /** Đồng hồ: số ms còn lại tính tại thời điểm writtenAt (tránh lệch giờ giữa các máy) */
  timerMs: number | null;
  writtenAt: number;
  called: { uid: string; name: string; at: number } | null;
  calledUids: string[];
  /** Câu gõ được GV bấm "Chiếu" lên tivi: slideId → uid[] */
  pinned: Record<string, string[]>;
  /** Đáp án chỉ đưa xuống điện thoại khi công bố */
  reveal: { slideId: string; answer?: number; show?: string; explain?: Bi } | null;
  /** Đợt A — GV bật hiện tổng đèn hiểu bài (ẩn danh) trên tivi */
  showLights?: boolean;
  /** Đợt B — mốc bắt đầu từng chặng (1–4 hoạt động, 5 tổng kết), ms */
  actStarts?: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
  /** Đợt B — cặp hỗ trợ (chỉ uid; lý do ghép chỉ GV thấy) và có hiện lên tivi không */
  pairs?: Pair[];
  /** Tên ngắn của các em trong cặp (điện thoại HS không đọc được danh sách lớp) */
  pairNames?: Record<string, string>;
  showPairs?: boolean;
  /** Đợt D — thời gian tivi ở từng chế độ ngôn ngữ (ms) và mốc bắt đầu đoạn đang đếm */
  langMs?: Record<Lang, number>;
  langAt?: number;
}

/** Cặp hỗ trợ: a + b (c = em thứ ba khi lớp lẻ). Firestore không lưu được mảng lồng nhau nên dùng object. */
export interface Pair {
  a: string;
  b: string;
  c?: string;
}

export interface SessionDoc {
  id: string;
  classId: string;
  schoolId: string;
  lessonId: string;
  lessonTitle: Bi;
  teacherId: string;
  status: "live" | "ended";
  slideIds: string[];
  state: LiveState;
  summary?: { participants: number; avgPoints: number; accuracy?: number };
  /** Có sau khi kết thúc tiết (GĐ 3) */
  results?: Record<string, import("@/lib/live/summary").StudentResult>;
  questions?: Record<string, import("@/lib/live/summary").QuestionStat>;
  wrongWords?: Record<string, number>;
  /** Đợt D — tỉ lệ tiếng Anh thực tế, ghi khi kết thúc tiết */
  english?: import("@/lib/live/english").EnglishStat;
  /** Đợt D — đã giao bài về nhà từ câu sai của tiết này */
  remedialIds?: string[];
  createdAt?: { toMillis(): number } | null;
  endedAt?: { toMillis(): number } | null;
  isSample?: boolean;
  /** GĐ 5 — trò chơi đang mở trong tiết (tivi + điện thoại tự chuyển vào trò chơi) */
  gameId?: string | null;
}

/** Đèn hiểu bài: xanh = hiểu, vàng = chưa chắc, đỏ = chưa hiểu */
export type Light = "g" | "y" | "r";

/** Phiếu ra về 3-2-1: 3 từ mới (trong thuật ngữ của tiết), 2 ý chính, 1 câu hỏi */
export interface ExitTicket {
  words: string[];
  ideas: string[];
  question: string;
  at: number;
}

export interface ParticipantDoc {
  uid: string;
  joinedAt?: unknown;
  lastSeenAt?: { toMillis(): number } | null;
  visible?: boolean;
  leftCount?: number;
  raisedHandAt?: number | null;
  points?: number;
  /** Đợt A — đèn hiểu bài theo "slideId:bước" (máy chủ ghi) */
  lights?: Record<string, Light>;
  /** Đợt A — phiếu ra về (máy chủ ghi) */
  exit?: ExitTicket;
}

export interface ResponseDoc {
  id: string;
  uid: string;
  slideId: string;
  qtype: QType | "speak";
  skill: Skill;
  value?: string | number;
  correct?: boolean;
  points: number;
  score?: number;
  transcript?: string;
  /** Luyện nói: các từ đọc chưa đúng (để thống kê từ phát âm sai) */
  wrongWords?: string[];
  attempts: number;
  answeredAt: number;
  /** Đợt A — lúc trả lời em có xem đề tiếng Việt không (song ngữ hoặc bấm "Xem tiếng Việt") */
  vi?: boolean;
  /** Câu gõ chữ do AI chấm (máy so khớp chấm sai) + nhận xét song ngữ */
  aiGraded?: boolean;
  aiFeedback?: Bi | null;
}

/** Phiếu của em (lsn_sessions/{id}/mine/{uid}) — máy chủ ghi; results chỉ có câu GV đã công bố */
export interface MineDoc {
  answers?: Record<string, { value: string | number; at: number }>;
  results?: Record<string, { correct: boolean; points: number }>;
  speak?: Record<string, { score: number; attempts: number }>;
}

/** Câu trả lời của em cho một trang, như điện thoại hiển thị (correct/points chỉ có sau khi công bố) */
export interface MyAnswer {
  slideId: string;
  value?: string | number;
  correct?: boolean;
  points?: number;
  score?: number;
  attempts?: number;
}

export const INITIAL_STATE: LiveState = {
  slideIndex: 0,
  step: 0,
  phase: "idle",
  lang: "bi",
  timerMs: null,
  writtenAt: 0,
  called: null,
  calledUids: [],
  pinned: {},
  reveal: null,
};
