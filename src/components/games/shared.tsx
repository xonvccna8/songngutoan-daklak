"use client";

// Thành phần dùng chung của trò chơi: đề bài theo mức tiếng Anh, tên hiển thị (ẩn tên → tên nhà toán học),
// bảng xếp hạng có hiệu ứng đổi chỗ (Framer Motion), màu phương án.
import { motion, LayoutGroup } from "motion/react";
import { cn } from "cn";
import type { ShapeKind } from "@/components/brand/shapes";
import { teamColor } from "@/components/common";
import { alias } from "@/lib/games/scoring";
import type { BoardRow, GameLevel, GameQ } from "@/lib/games/types";
import type { RosterEntry } from "@/components/live/tv-screen";

/** 4 màu phương án kiểu game show (kèm hình tam giác / thoi / tròn / vuông để không chỉ dựa vào màu) */
export const OPTION_STYLE: { bg: string; shadow: string; kind: ShapeKind }[] = [
  { bg: "#2F5BEA", shadow: "#1E40B8", kind: "triangle" },
  { bg: "#0E9F8A", shadow: "#0A7565", kind: "diamond" },
  { bg: "#D98E04", shadow: "#9A6500", kind: "circle" },
  { bg: "#E8492E", shadow: "#B4321B", kind: "square" },
];

/**
 * Chữ của đề theo mức: E1 tiếng Việt to + tiếng Anh nhỏ · E2 tiếng Anh + tiếng Việt · E3 chỉ tiếng Anh.
 * flipped = em dùng "Lật đề" → hiện tiếng Việt.
 */
export function promptLines(q: GameQ, level: GameLevel, flipped = false): { main: string; sub?: string } {
  const en = q.listen ? "🎧 " + q.prompt.en : q.prompt.en;
  const vi = q.prompt.vi;
  if (flipped) return { main: vi || en, sub: en };
  if (level === "e1") return { main: vi || en, sub: vi ? en : undefined };
  if (level === "e3") return { main: en };
  return { main: en, sub: vi };
}

/** Tên hiển thị: tên ngắn thật, hoặc tên nhà toán học khi GV bật "Ẩn tên" */
export function nameOf(uid: string, roster: Map<string, RosterEntry>, hide: boolean, order: string[]) {
  if (hide) return alias(Math.max(0, order.indexOf(uid)));
  return (roster.get(uid)?.name ?? "Bạn").split(" ").slice(-2).join(" ");
}

/** Thứ tự cố định để gán tên nhà toán học (theo thứ tự vào trận) */
export const aliasOrder = (rows: Record<string, BoardRow>) => Object.keys(rows).sort();

export function sortedRows(rows: Record<string, BoardRow>) {
  return Object.entries(rows).sort((a, b) => b[1].s - a[1].s || b[1].c - a[1].c || a[0].localeCompare(b[0]));
}

/** Bảng xếp hạng có hiệu ứng trượt khi đổi chỗ (tivi) */
export function LiveBoard({ rows, roster, hide, top = 10 }: { rows: Record<string, BoardRow>; roster: Map<string, RosterEntry>; hide: boolean; top?: number }) {
  const list = sortedRows(rows).slice(0, top);
  const max = Math.max(1, ...list.map(([, r]) => r.s));
  const order = aliasOrder(rows);
  return (
    <LayoutGroup>
      <ol className="flex flex-col gap-[0.55cqw]">
        {list.map(([uid, r], i) => (
          <motion.li
            key={uid}
            layout
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn("relative flex items-center gap-[1cqw] overflow-hidden rounded-[0.8cqw] px-[1cqw] py-[0.55cqw]", i < 3 ? "bg-white/12" : "bg-white/6", r.out && "opacity-40")}
          >
            <motion.span
              layout
              className="absolute inset-y-0 left-0 rounded-[0.8cqw]"
              style={{ background: `${teamColor(r.team)}55` }}
              initial={false}
              animate={{ width: `${(r.s / max) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
            <span className="relative w-[2.4cqw] text-center font-display text-[1.6cqw] font-extrabold">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
            <span className="relative min-w-0 flex-1 truncate font-sans text-[1.5cqw] font-bold">{nameOf(uid, roster, hide, order)}</span>
            {r.st >= 3 && <span className="relative font-sans text-[1.2cqw] font-bold text-[var(--hi)]">🔥{r.st}</span>}
            <span className="relative font-display text-[1.6cqw] font-extrabold tabular-nums">{r.s.toLocaleString("vi-VN")}</span>
          </motion.li>
        ))}
      </ol>
    </LayoutGroup>
  );
}

/** Điểm trung bình mỗi bạn của từng tổ */
export function teamAverages(rows: Record<string, BoardRow>) {
  const m = new Map<number, { s: number; c: number; n: number }>();
  Object.values(rows).forEach((r) => {
    const x = m.get(r.team) ?? { s: 0, c: 0, n: 0 };
    x.s += r.s;
    x.c += r.c;
    x.n++;
    m.set(r.team, x);
  });
  return [...m.entries()].map(([team, x]) => ({ team, avg: Math.round(x.s / x.n), correctAvg: x.c / x.n, members: x.n })).sort((a, b) => b.avg - a.avg);
}
