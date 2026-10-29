// Sinh câu hỏi trò chơi TỰ ĐỘNG từ tiết đang dạy (GV không phải soạn thêm) — hàm thuần, có test.
// Nguồn: câu hỏi trong tiết (trắc nghiệm, đúng/sai, nhập số, gõ chữ) + câu từ thuật ngữ (Anh→Việt, Việt→Anh, nghe→chọn)
// + Ghép bộ ba (thuật ngữ – nghĩa – phiên âm, kí hiệu toán học theo khối).
import type { Bi, Slide, TeacherKey, Term } from "@/lib/live/types";
import { SYMBOLS, sayOf } from "@/lib/library/symbols";
import { MODE_META, type GameKey, type GameMode, type GameQ, type GameSettings, type MatchCard } from "@/lib/games/types";

/** Số ngẫu nhiên có hạt giống (mulberry32) — cùng hạt giống cho cùng kết quả (dễ test) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Built {
  q: GameQ;
  key: GameKey;
}

/** Thuật ngữ xuất hiện trong đề → gợi ý nghĩa tiếng Việt (power-up "Gợi ý thuật ngữ") */
function hintFor(text: string, terms: Term[]): string | undefined {
  const t = text.toLowerCase();
  const hit = [...terms].sort((a, b) => b.en.length - a.en.length).find((x) => t.includes(x.en.toLowerCase()));
  return hit ? `${hit.en} = ${hit.vi}` : undefined;
}

/** Câu hỏi lấy từ các trang của tiết */
export function fromSlides(slides: Slide[], keys: Record<string, TeacherKey>, terms: Term[]): Built[] {
  const out: Built[] = [];
  for (const s of slides) {
    const q = s.question;
    const k = keys[s.id];
    if (!q || !k) continue;
    const base = { id: `s_${s.id}`, prompt: q.prompt, skill: q.skill, say: q.prompt.en, hint: hintFor(q.prompt.en, terms), ...(s.outcomeIds?.length ? { outcomeIds: s.outcomeIds } : {}) };
    const explain = k.explain && (k.explain.en || k.explain.vi) ? k.explain : undefined;
    if (q.type === "mcq" && q.options?.length && k.answer != null) {
      out.push({ q: { ...base, kind: "mcq", options: q.options }, key: { answer: k.answer, show: q.options[k.answer]?.en ?? "", explain } });
    } else if (q.type === "number" && Number.isFinite(Number(k.answer))) {
      out.push({ q: { ...base, kind: "number", ...(q.unit ? { unit: q.unit } : {}) }, key: { num: Number(k.answer), show: `${k.answer}${q.unit ?? ""}`, explain } });
    } else if (q.type === "text" && k.accept?.length) {
      out.push({ q: { ...base, kind: "text" }, key: { accept: k.accept, show: k.accept[0], explain } });
    }
    // Kéo nhãn: không đưa vào trò chơi (thao tác lâu, không hợp nhịp nhanh)
  }
  return out;
}

const opt = (en: string): Bi => ({ en, vi: "" });

/** Câu hỏi từ thuật ngữ của tiết (cần ít nhất 2 thuật ngữ để có phương án nhiễu) */
export function fromTerms(terms: Term[], rnd: () => number): Built[] {
  const list = terms.filter((t) => t.en && t.vi);
  if (list.length < 2) return [];
  const n = Math.min(4, list.length);
  const out: Built[] = [];
  list.forEach((t, idx) => {
    const others = shuffle(list.filter((x) => x !== t), rnd).slice(0, n - 1);
    const pool = shuffle([t, ...others], rnd);
    const answer = pool.indexOf(t);
    const explain = { en: `${t.en} ${t.ipa} = ${t.vi}`, vi: "" };
    // Xoay vòng 3 dạng để không lặp nhàm
    const kind = idx % 3;
    if (kind === 0)
      out.push({
        q: { id: `t_${idx}_ev`, kind: "mcq", prompt: { en: `What does “${t.en}” mean?`, vi: `“${t.en}” nghĩa là gì?` }, options: pool.map((x) => opt(x.vi)), say: t.en, skill: "Ngôn ngữ" },
        key: { answer, show: t.vi, explain },
      });
    else if (kind === 1)
      out.push({
        q: { id: `t_${idx}_ve`, kind: "mcq", prompt: { en: `Which English term means “${t.vi}”?`, vi: `Thuật ngữ tiếng Anh của “${t.vi}” là gì?` }, options: pool.map((x) => opt(x.en)), skill: "Ngôn ngữ", hint: t.ipa },
        key: { answer, show: t.en, explain },
      });
    else
      out.push({
        q: { id: `t_${idx}_ls`, kind: "mcq", prompt: { en: "Listen and choose the word you hear.", vi: "Nghe và chọn từ em nghe được." }, options: pool.map((x) => opt(x.en)), say: t.en, listen: true, skill: "Ngôn ngữ", hint: t.vi },
        key: { answer, show: t.en, explain },
      });
  });
  return out;
}

/** Các bộ ba để ghép: thuật ngữ của tiết (Anh – Việt – phiên âm) + kí hiệu toán học đến khối này (kí hiệu – cách đọc – nghĩa) */
function triples(terms: Term[], grade: number): [string, string, string][] {
  const fromT = terms.filter((t) => t.en && t.vi && t.ipa).map((t): [string, string, string] => [t.en, t.vi, t.ipa]);
  const fromS = SYMBOLS.filter((s) => s.grade <= grade).map((s): [string, string, string] => [sayOf(s), s.vi, s.sym]);
  return [...fromT, ...fromS];
}

/** Ghép bộ ba: mỗi vòng 4 bộ (12 thẻ) */
export function matchRounds(terms: Term[], grade: number, rounds: number, rnd: () => number): Built[] {
  const pool = shuffle(triples(terms, grade), rnd);
  const out: Built[] = [];
  for (let r = 0; r < rounds && pool.length >= (r + 1) * 4; r++) {
    const set = pool.slice(r * 4, r * 4 + 4);
    const groups: string[][] = [];
    const cards: MatchCard[] = [];
    set.forEach(([en, vi, sym], i) => {
      const ids = [`r${r}g${i}e`, `r${r}g${i}v`, `r${r}g${i}s`];
      groups.push(ids);
      cards.push({ id: ids[0], text: en, side: "en" }, { id: ids[1], text: vi, side: "vi" }, { id: ids[2], text: sym, side: "sym" });
    });
    out.push({
      q: {
        id: `m_${r}`,
        kind: "match",
        prompt: { en: "Match each term with its meaning and its symbol or pronunciation.", vi: "Ghép thuật ngữ với nghĩa và kí hiệu / phiên âm của nó." },
        cards: shuffle(cards, rnd),
        skill: "Ngôn ngữ",
      },
      key: { groups, show: set.map(([en, vi, sym]) => `${en} – ${vi} – ${sym}`).join(" · ") },
    });
  }
  return out;
}

/** Làm sạch cài đặt GV gửi lên (giá trị lạ → mặc định an toàn) */
export function cleanSettings(mode: GameMode, x: Partial<GameSettings> | undefined): GameSettings {
  const s = x ?? {};
  const meta = MODE_META[mode];
  const qTime = [0, 10, 20, 30, 45, 60, 90].includes(Number(s.qTime)) ? Number(s.qTime) : mode === "match" ? 60 : 20;
  return {
    // Ghép bộ ba luôn tính giờ (để có thưởng tốc độ)
    qTime: mode === "match" && qTime === 0 ? 60 : qTime,
    count: Math.max(1, Math.min(mode === "match" ? 5 : 30, Math.round(Number(s.count) || (mode === "match" ? 3 : 10)))),
    level: s.level === "e1" || s.level === "e3" ? s.level : "e2",
    powerups: mode === "arena" ? s.powerups !== false : false,
    stickers: s.stickers !== false,
    music: !!s.music,
    hideNames: !!s.hideNames,
    team: meta.team === "either" ? !!s.team : meta.team,
  };
}

/** Bộ câu hỏi của một trận: tách phần công khai và đáp án */
export function buildGame(opts: { mode: GameMode; slides: Slide[]; keys: Record<string, TeacherKey>; terms: Term[]; grade: number; count: number; seed: number }) {
  const rnd = rng(opts.seed);
  let items: Built[];
  if (opts.mode === "match") items = matchRounds(opts.terms, opts.grade, Math.max(1, Math.min(5, opts.count)), rnd);
  else {
    // Câu của tiết trước (bám bài học), xen câu thuật ngữ; đảo thứ tự
    const a = shuffle(fromSlides(opts.slides, opts.keys, opts.terms), rnd);
    const b = shuffle(fromTerms(opts.terms, rnd), rnd);
    const mixed: Built[] = [];
    while (a.length || b.length) {
      if (a.length) mixed.push(a.shift()!);
      if (b.length) mixed.push(b.shift()!);
    }
    items = mixed.slice(0, Math.max(1, opts.count));
  }
  return { questions: items.map((x) => x.q), keys: items.map((x) => x.key) };
}
