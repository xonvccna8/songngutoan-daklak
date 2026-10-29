// Đợt B — Trợ lý gợi ý cho GV trong tiết: luật rõ ràng, GV bấm làm theo hoặc bỏ qua; app KHÔNG tự làm gì.
// Hàm thuần, test trong tests/assistant.test.ts.
import { diagnoseQuestion, lightKey, tallyLights } from "@/lib/live/diagnose";
import { isInteractive } from "@/lib/live/grading";
import type { PhaseView } from "@/lib/live/timeline";
import type { LiveState, ParticipantDoc, ResponseDoc, Slide } from "@/lib/live/types";

export type SuggestAction =
  | { kind: "lock" }
  | { kind: "addTime"; sec: number }
  | { kind: "langEn" }
  | { kind: "call"; uid: string }
  | { kind: "bell"; uid: string }
  | { kind: "next" };

export interface Suggestion {
  /** Khoá ổn định để GV bỏ qua (không hiện lại) */
  id: string;
  tone: "warn" | "info" | "good";
  text: string;
  action?: SuggestAction;
  actionLabel?: string;
}

export interface AssistInput {
  state: LiveState;
  slides: Slide[];
  responses: ResponseDoc[];
  participants: ParticipantDoc[];
  name: (uid: string) => string;
  /** ms còn lại của đồng hồ (null = không hẹn giờ) */
  left: number | null;
  now: number;
  timeline?: PhaseView[];
}

/** Ngưỡng — đổi ở đây (docs/QUY-TRINH-TIET-SONG-NGU.md mục 5) */
export const RULES = {
  lockWhenAnswered: 0.8,
  extendWhenLeftMs: 10_000,
  extendWhenAnsweredBelow: 0.5,
  reteachBelow: 0.5,
  harderAbove: 0.85,
  silentQuestions: 3,
  leftCountBell: 2,
  handWaitMs: 60_000,
};

const MAX = 5;

export function suggest(x: AssistInput): Suggestion[] {
  const { state: st, slides, responses, participants, name, left, now } = x;
  const slide = slides[st.slideIndex];
  if (!slide) return [];
  const out: Suggestion[] = [];
  const joined = participants.length;
  const R = responses.filter((r) => r.slideId === slide.id);

  // 1. Đèn hiểu bài đỏ nhiều (Đợt A)
  if (!isInteractive(slide)) {
    const t = tallyLights(participants, lightKey(slide.id, st.step));
    if (t.alert)
      out.push({ id: `light:${slide.id}:${st.step}`, tone: "warn", text: `${Math.round(t.redPct * 100)}% chưa hiểu ý này → giảng lại bằng tiếng Việt khoảng 1 phút, rồi nói lại câu then chốt tiếng Anh.` });
  }

  // 2. Câu hỏi đang mở
  if (slide.question && st.phase === "open" && joined > 0) {
    const ans = R.length / joined;
    if (ans >= RULES.lockWhenAnswered)
      out.push({ id: `lock:${slide.id}`, tone: "info", text: `${R.length}/${joined} em đã trả lời → có thể khoá sớm để tiết kiệm thời gian.`, action: { kind: "lock" }, actionLabel: "Khoá" });
    else if (left != null && left <= RULES.extendWhenLeftMs && ans < RULES.extendWhenAnsweredBelow)
      out.push({ id: `time:${slide.id}`, tone: "warn", text: `Sắp hết giờ mà mới ${R.length}/${joined} em trả lời → thêm 30 giây?`, action: { kind: "addTime", sec: 30 }, actionLabel: "+30 giây" });
  }

  // 3. Sau khi khoá / công bố: lớp sai nhiều → giảng lại theo chẩn đoán
  if (slide.question && (st.phase === "locked" || st.phase === "reveal") && R.length >= 3) {
    const d = diagnoseQuestion(R, slide.question.skill);
    if (1 - d.wrongPct < RULES.reteachBelow)
      out.push({
        id: `reteach:${slide.id}`,
        tone: "warn",
        text:
          d.verdict === "language"
            ? `Chỉ ${Math.round((1 - d.wrongPct) * 100)}% đúng, nhiều em sai khi chỉ đọc tiếng Anh → đọc lại đề bằng tiếng Việt, chỉ vào thuật ngữ trên bảng từ.`
            : `Chỉ ${Math.round((1 - d.wrongPct) * 100)}% đúng, sai cả khi có tiếng Việt → giảng lại kiến thức bằng tiếng Việt trước khi sang trang.`,
      });
  }

  // Các câu hỏi đã qua (theo thứ tự trang), có câu trả lời
  const asked = slides.slice(0, st.slideIndex + (st.phase === "reveal" || st.phase === "locked" ? 1 : 0)).filter((s) => s.question && responses.some((r) => r.slideId === s.id));

  // 4. Lớp làm tốt 2 câu liền → tăng tiếng Anh
  const last2 = asked.slice(-2);
  if (st.lang !== "en" && last2.length === 2) {
    const ok = last2.every((s) => {
      const rs = responses.filter((r) => r.slideId === s.id);
      return rs.length >= 3 && rs.filter((r) => r.correct).length / rs.length >= RULES.harderAbove;
    });
    if (ok) out.push({ id: `harder:${last2.map((s) => s.id).join(",")}`, tone: "good", text: "Lớp đúng từ 85% hai câu liền → thử chuyển tivi sang Chỉ tiếng Anh.", action: { kind: "langEn" }, actionLabel: "Chỉ tiếng Anh" });
  }

  // 5. Từng em: im lặng nhiều câu, rời trang, giơ tay lâu
  const lastN = asked.slice(-RULES.silentQuestions);
  for (const p of participants) {
    if (lastN.length === RULES.silentQuestions && lastN.every((s) => !responses.some((r) => r.slideId === s.id && r.uid === p.uid)))
      out.push({ id: `silent:${p.uid}:${lastN.at(-1)!.id}`, tone: "warn", text: `${name(p.uid)} chưa trả lời ${RULES.silentQuestions} câu gần nhất → gọi tên hoặc nhắc chú ý.`, action: { kind: "call", uid: p.uid }, actionLabel: "Gọi tên" });
    if ((p.leftCount ?? 0) >= RULES.leftCountBell && p.visible === false)
      out.push({ id: `away:${p.uid}:${p.leftCount}`, tone: "warn", text: `${name(p.uid)} đang rời trang (lần ${p.leftCount}).`, action: { kind: "bell", uid: p.uid }, actionLabel: "Nhắc chú ý" });
    if (p.raisedHandAt && now - p.raisedHandAt >= RULES.handWaitMs)
      out.push({ id: `hand:${p.uid}:${p.raisedHandAt}`, tone: "info", text: `${name(p.uid)} giơ tay đã ${Math.round((now - p.raisedHandAt) / 60_000)} phút.`, action: { kind: "call", uid: p.uid }, actionLabel: "Mời trả lời" });
  }

  // 6. Vượt thời gian của chặng đang dạy
  const cur = x.timeline?.find((t) => t.status === "current");
  if (cur?.over)
    out.push({ id: `over:${cur.id}`, tone: "info", text: `"${cur.vi}" đã quá kế hoạch ${Math.round((cur.usedMs - cur.plannedMs) / 60_000)} phút → cân nhắc chuyển hoạt động.`, action: { kind: "next" }, actionLabel: "Tiếp" });

  // Cảnh báo trước, tối đa 5 gợi ý để GV không bị rối
  const rank = { warn: 0, info: 1, good: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, MAX);
}
