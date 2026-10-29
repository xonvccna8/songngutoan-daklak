// Đợt B — Ghép cặp hỗ trợ: em vững tiếng Anh ↔ em vững kiến thức (hàm thuần, test trong tests/assistant.test.ts).
// Chỉ GV thấy lý do ghép; tivi và điện thoại chỉ hiện tên bạn cùng cặp.
import type { Pair } from "@/lib/live/types";

export interface PairInput {
  uid: string;
  /** Tỉ lệ đúng phần Ngôn ngữ / Toán (0–1), null = chưa có dữ liệu */
  lang: number | null;
  sci: number | null;
}

/** Xáo trộn có hạt giống (Fisher–Yates) */
function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sắp em có dữ liệu theo "lệch tiếng Anh" = lang − sci (giảm dần) rồi ghép hai đầu:
 * em mạnh tiếng Anh nhất (yếu kiến thức hơn) với em mạnh kiến thức nhất (yếu tiếng Anh hơn).
 * Em chưa có dữ liệu ghép ngẫu nhiên với nhau. Số lẻ → nhóm cuối có 3 em.
 */
export function makePairs(students: PairInput[], rnd: () => number = Math.random): Pair[] {
  const known = students.filter((s) => s.lang != null && s.sci != null).sort((a, b) => b.lang! - b.sci! - (a.lang! - a.sci!) || a.uid.localeCompare(b.uid));
  const unknown = shuffle(
    students.filter((s) => s.lang == null || s.sci == null),
    rnd
  );
  const order: string[] = [];
  for (let i = 0, j = known.length - 1; i <= j; i++, j--) {
    order.push(known[i].uid);
    if (i !== j) order.push(known[j].uid);
  }
  order.push(...unknown.map((s) => s.uid));
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < order.length; i += 2) pairs.push({ a: order[i], b: order[i + 1] });
  if (order.length % 2 === 1) {
    const last = order[order.length - 1];
    if (pairs.length) pairs[pairs.length - 1].c = last;
    else pairs.push({ a: last, b: "" });
  }
  return pairs;
}

/** Bạn cùng cặp/nhóm của một em */
export function partnersOf(pairs: Pair[] | undefined, uid: string): string[] {
  const p = pairs?.find((x) => x.a === uid || x.b === uid || x.c === uid);
  return p ? [p.a, p.b, p.c].filter((u): u is string => !!u && u !== uid) : [];
}

/** GV đổi chỗ hai em giữa các cặp */
export function swapInPairs(pairs: Pair[], u1: string, u2: string): Pair[] {
  const sw = (u: string | undefined) => (u === u1 ? u2 : u === u2 ? u1 : u);
  return pairs.map((p) => ({ a: sw(p.a)!, b: sw(p.b)!, ...(p.c ? { c: sw(p.c) } : {}) }));
}
