// GĐ 5 — Trò chơi Toán song ngữ: mô hình dữ liệu (docs/KE-HOACH-TRANG-GIAO-VIEN.md mục 7)
//   lsn_games/{id}                 trạng thái công khai: chế độ, câu hỏi (KHÔNG có đáp án), câu đang chơi, công bố
//   lsn_games/{id}/live/board      bảng điểm (chỉ tivi + laptop GV theo dõi → tiết kiệm lượt đọc)
//   lsn_games/{id}/players/{uid}   trạng thái riêng từng em (câu đã làm, power-up, hạng gần nhất)
//   lsn_games/{id}/private/key     đáp án — chỉ máy chủ đọc
import type { Bi } from "@/lib/live/types";

/** arena = Đấu trường Song ngữ (kiểu Quizizz) · bell = Rung chuông vàng · boat = Đua thuyền tổ · match = Ghép bộ ba */
export type GameMode = "arena" | "bell" | "boat" | "match";
/** self = mỗi em tự làm theo tốc độ riêng · teacher = GV điều khiển từng câu */
export type Pace = "self" | "teacher";
export type GameLevel = "e1" | "e2" | "e3";
export type GameStatus = "lobby" | "play" | "paused" | "ended";

export const MODE_META: Record<GameMode, Bi & { icon: string; pace: Pace | "either"; team: boolean | "either"; hint: string; rules: Bi }> = {
  arena: {
    vi: "Đấu trường Song ngữ",
    en: "Bilingual Arena",
    icon: "⚔️",
    pace: "either",
    team: "either",
    hint: "Kiểu Quizizz: điểm theo đúng + nhanh, chuỗi đúng, power-up, bảng xếp hạng nhảy liên tục",
    rules: {
      en: "Answer fast and correctly. Keep your streak to earn bonus points. Use power-ups to climb the leaderboard!",
      vi: "Trả lời đúng và nhanh. Giữ chuỗi đúng để được thưởng. Dùng power-up để leo bảng xếp hạng!",
    },
  },
  bell: {
    vi: "Rung chuông vàng",
    en: "Golden Bell",
    icon: "🔔",
    pace: "teacher",
    team: false,
    hint: "Cả lớp cùng làm từng câu; sai thì bị loại, thầy cô có quyền cứu trợ",
    rules: { en: "Everyone answers the same question. A wrong answer means you are out — until the rescue!", vi: "Cả lớp cùng trả lời một câu. Sai là bị loại — chờ thầy cô cứu trợ!" },
  },
  boat: {
    vi: "Đua thuyền tổ",
    en: "Team Boat Race",
    icon: "🚤",
    pace: "self",
    team: true,
    hint: "Mỗi câu đúng đẩy thuyền của tổ tiến lên; tổ về đích trước thắng (tính trung bình mỗi bạn)",
    rules: { en: "Every correct answer moves your team's boat forward. Help your team reach the finish line first!", vi: "Mỗi câu đúng đẩy thuyền của tổ tiến lên. Cùng tổ về đích trước nhé!" },
  },
  match: {
    vi: "Ghép bộ ba",
    en: "Triple Match",
    icon: "🃏",
    pace: "self",
    team: false,
    hint: "Ghép thuật ngữ tiếng Anh – nghĩa tiếng Việt – phiên âm / kí hiệu, càng nhanh càng nhiều điểm",
    rules: { en: "Match each English term with its Vietnamese meaning and its symbol or pronunciation.", vi: "Ghép thuật ngữ tiếng Anh với nghĩa tiếng Việt và kí hiệu / phiên âm của nó." },
  },
};

export type GameQKind = "mcq" | "number" | "text" | "match";

/** Thẻ của câu Ghép bộ ba */
export interface MatchCard {
  id: string;
  text: string;
  /** en = thuật ngữ · vi = nghĩa · sym = kí hiệu / phiên âm */
  side: "en" | "vi" | "sym";
}

/** Câu hỏi công khai (gửi xuống điện thoại) — không có đáp án */
export interface GameQ {
  id: string;
  kind: GameQKind;
  prompt: Bi;
  options?: Bi[];
  unit?: string;
  /** Câu máy đọc (nút 🔊) */
  say?: string;
  /** "Nghe và chọn": chỉ đọc, không hiện chữ tiếng Anh của đề */
  listen?: boolean;
  /** Power-up "Gợi ý thuật ngữ": nghĩa tiếng Việt của từ khó */
  hint?: string;
  skill: "Toán" | "Ngôn ngữ";
  outcomeIds?: string[];
  cards?: MatchCard[];
}

/** Đáp án (chỉ máy chủ) */
export interface GameKey {
  answer?: number;
  num?: number;
  accept?: string[];
  /** Ghép bộ ba: mỗi nhóm là danh sách id thẻ */
  groups?: string[][];
  /** Đáp án hiển thị khi công bố */
  show: string;
  explain?: Bi;
}

export interface GameSettings {
  /** Số giây mỗi câu (0 = không tính giờ → mỗi câu đúng 1000 điểm) */
  qTime: number;
  count: number;
  level: GameLevel;
  powerups: boolean;
  stickers: boolean;
  music: boolean;
  /** Tivi thay tên thật bằng tên nhà toán học */
  hideNames: boolean;
  team: boolean;
}

export interface GameCur {
  i: number;
  phase: "q" | "reveal";
  startedAt: number;
  endsAt: number | null;
}

export interface GameDoc {
  id: string;
  sessionId: string;
  classId: string;
  schoolId: string | null;
  teacherId: string;
  lessonId: string;
  title: Bi;
  mode: GameMode;
  pace: Pace;
  settings: GameSettings;
  status: GameStatus;
  questions: GameQ[];
  /** GV điều khiển: câu đang chơi */
  cur: GameCur | null;
  /** Đáp án câu vừa công bố (GV điều khiển) */
  reveal: { i: number; answer?: number; show: string; explain?: Bi } | null;
  /** Power Play: cả lớp +50% điểm tới thời điểm này */
  powerPlayUntil: number | null;
  createdAt: number;
  startedAt: number | null;
  /** Lúc tiếp tục sau khi tạm dừng (tự làm: tính giờ câu từ lúc này) */
  resumedAt: number | null;
  pausedAt: number | null;
  endedAt: number | null;
  /** Kết quả cuối (ghi lúc kết thúc) */
  podium?: { uid: string; s: number }[];
  winnerTeam?: number | null;
}

/** Một dòng bảng điểm */
export interface BoardRow {
  /** điểm */
  s: number;
  /** chuỗi đúng hiện tại */
  st: number;
  /** chuỗi dài nhất */
  best: number;
  /** số câu đúng / đã làm */
  c: number;
  n: number;
  team: number;
  /** Rung chuông vàng: bị loại */
  out?: boolean;
  /** Tự làm: đã xong */
  done?: boolean;
}

export interface BoardDoc {
  rows: Record<string, BoardRow>;
  /** Thống kê từng câu: số em trả lời / đúng / phân bố đáp án trắc nghiệm */
  stats: Record<string, { a: number; c: number; pick?: Record<string, number> }>;
  /** Sự kiện mới nhất cho dòng chữ chạy trên tivi (tivi tự ghép tên / tên nhà toán học) */
  ev: { t: number; kind: "pass" | "streak" | "power" | "out" | "rescue"; uid?: string; n?: number } | null;
  updatedAt: number;
}

export type PowerKind = "fifty" | "eraser" | "double" | "freeze" | "saver" | "immunity" | "powerplay" | "hint" | "slow" | "flip";

/** Kết quả gần nhất của em (điện thoại hiện sau mỗi câu) */
export interface LastResult {
  qi: number;
  ok: boolean;
  pts: number;
  /** hạng trước / sau câu này */
  from: number;
  to: number;
  total: number;
  /** điểm còn thiếu để vượt bạn ngay trên */
  gap: number | null;
  streak: number;
  /** power-up vừa nhận */
  gift?: PowerKind | null;
  show?: string;
  explain?: Bi;
  at: number;
}

export interface PlayerDoc {
  uid: string;
  team: number;
  /** Tự làm: thứ tự câu (đảo riêng từng em) và vị trí hiện tại */
  order: number[];
  pos: number;
  /** Lúc câu hiện tại bắt đầu (giờ máy chủ) */
  qStart: number;
  /** Vòng cứu điểm: các câu sai, làm lại 1 lần */
  redeem: number[];
  redeemPos: number;
  phase: "q" | "redeem" | "done";
  answers: Record<string, { v: string; ok: boolean; pts: number; r?: boolean }>;
  s: number;
  st: number;
  best: number;
  c: number;
  n: number;
  /** Power-up đang có (tối đa 3) */
  inv: PowerKind[];
  /** Hiệu ứng cho câu hiện tại / câu sau */
  fx: { double?: boolean; freeze?: number; immunity?: number; saver?: boolean; hidden?: { qi: number; opts: number[] }; flip?: number };
  /** Ghép bộ ba: số lần ghép sai của câu hiện tại */
  wrongTries?: Record<string, number>;
  out?: boolean;
  last: LastResult | null;
}
