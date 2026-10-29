// Đợt D — Tự tạo bài về nhà từ câu sai của tiết (hàm thuần, test trong tests/remedial.test.ts).
// Máy chủ tính lại từ câu trả lời thật (không tin danh sách điện thoại / laptop gửi lên).
import type { ResponseDoc } from "@/lib/live/types";

/** Câu lớp sai (hoặc bỏ trống) từ 40% số em vào tiết trở lên → giao cả lớp */
export const CLASS_WRONG_MIN = 0.4;

type Resp = Pick<ResponseDoc, "uid" | "slideId" | "qtype" | "correct">;

/** Chỉ tính câu hỏi đã mở trong tiết (có ít nhất 1 em trả lời); bỏ luyện nói */
function openedQuestions(responses: Resp[], questionIds: string[]) {
  const opened = new Set(responses.filter((r) => r.qtype !== "speak").map((r) => r.slideId));
  return questionIds.filter((id) => opened.has(id));
}

export interface ClassPick {
  slideId: string;
  /** Tỉ lệ sai hoặc bỏ trống trong số em vào tiết */
  wrongPct: number;
}

export function classRemedial(responses: Resp[], joined: string[], questionIds: string[], min = CLASS_WRONG_MIN): ClassPick[] {
  if (!joined.length) return [];
  const inClass = new Set(joined);
  return openedQuestions(responses, questionIds)
    .map((slideId) => {
      const ok = new Set(responses.filter((r) => r.slideId === slideId && r.correct && inClass.has(r.uid)).map((r) => r.uid));
      return { slideId, wrongPct: (joined.length - ok.size) / joined.length };
    })
    .filter((x) => x.wrongPct >= min)
    .sort((a, b) => b.wrongPct - a.wrongPct);
}

export interface RemedialGroup {
  uids: string[];
  slideIds: string[];
}

/** Riêng từng em: câu em sai hoặc bỏ trống; em giống nhau gộp một bài (ít bài hơn). Em đúng hết không nhận. */
export function eachRemedial(responses: Resp[], joined: string[], questionIds: string[]): RemedialGroup[] {
  const qs = openedQuestions(responses, questionIds);
  const groups = new Map<string, RemedialGroup>();
  for (const uid of joined) {
    const ok = new Set(responses.filter((r) => r.uid === uid && r.correct).map((r) => r.slideId));
    const miss = qs.filter((id) => !ok.has(id));
    if (!miss.length) continue;
    const k = miss.join("|");
    const g = groups.get(k) ?? { uids: [], slideIds: miss };
    g.uids.push(uid);
    groups.set(k, g);
  }
  return [...groups.values()].sort((a, b) => b.uids.length - a.uids.length);
}
