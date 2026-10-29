// Bảng xếp hạng tuần: Trên lớp · Ở nhà · Tiến bộ nhất · Tổ — hàm thuần, có test trong tests/progress.test.ts
// Nguyên tắc (nghiên cứu về bảng xếp hạng): chỉ top 5 + hạng của em + khoảng cách tới bạn ngay trên,
// không trả về danh sách người đứng cuối; bảng làm mới mỗi thứ Hai.

/** Điểm tuần của một em trong lsn_weekly/{classId}_{tuần}.rows[uid]: c = trên lớp, h = ở nhà */
export interface WeekCell {
  c?: number;
  h?: number;
}

export interface WeeklyDoc {
  classId: string;
  week: string;
  rows?: Record<string, WeekCell>;
}

export interface Person {
  uid: string;
  name: string;
  team: number;
}

export interface BoardRow {
  rank: number;
  name: string;
  team: number;
  points: number;
  isMe: boolean;
}

export interface Board {
  top: BoardRow[];
  me: { rank: number; points: number; total: number; above: { name: string; gap: number } | null } | null;
}

export interface TeamRow {
  team: number;
  members: number;
  points: number;
  /** Điểm trung bình mỗi bạn (công bằng khi tổ đông/ít khác nhau) */
  avg: number;
}

interface Entry extends Person {
  points: number;
}

/** Xếp hạng kiểu thi đấu (bằng điểm thì cùng hạng). Chỉ em có điểm > 0 mới vào top. */
export function rankBoard(entries: Entry[], me: string, top = 5): Board {
  const sorted = [...entries].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "vi"));
  const ranks: number[] = [];
  sorted.forEach((r, i) => ranks.push(i > 0 && sorted[i - 1].points === r.points ? ranks[i - 1] : i + 1));
  const at = sorted.findIndex((r) => r.uid === me);
  const mine = at >= 0 ? sorted[at] : null;
  // Bạn ngay trên em (điểm cao hơn gần nhất) — để em biết còn bao nhiêu điểm là vượt
  const above = mine ? [...sorted.slice(0, at)].reverse().find((r) => r.points > mine.points) : undefined;
  return {
    top: sorted
      .map((r, i) => ({ rank: ranks[i], name: r.name, team: r.team, points: r.points, isMe: r.uid === me }))
      .filter((r) => r.points > 0)
      .slice(0, top),
    me: mine ? { rank: ranks[at], points: mine.points, total: sorted.length, above: above ? { name: above.name, gap: above.points - mine.points } : null } : null,
  };
}

export function teamBoard(entries: Entry[]): TeamRow[] {
  const m = new Map<number, TeamRow>();
  entries.forEach((r) => {
    const t = m.get(r.team) ?? { team: r.team, members: 0, points: 0, avg: 0 };
    t.members++;
    t.points += r.points;
    m.set(r.team, t);
  });
  return [...m.values()].map((t) => ({ ...t, avg: Math.round(t.points / t.members) })).sort((a, b) => b.avg - a.avg || a.team - b.team);
}

const cellTotal = (c: WeekCell | undefined) => (c?.c ?? 0) + (c?.h ?? 0);

export type BoardKind = "class" | "home" | "improve";

/** Điểm của từng em theo loại bảng */
export function boardEntries(people: Person[], kind: BoardKind, thisWeek: WeeklyDoc | null, lastWeek: WeeklyDoc | null): Entry[] {
  return people.map((p) => {
    const cur = thisWeek?.rows?.[p.uid];
    let points: number;
    if (kind === "class") points = cur?.c ?? 0;
    else if (kind === "home") points = cur?.h ?? 0;
    else points = Math.max(0, cellTotal(cur) - cellTotal(lastWeek?.rows?.[p.uid]));
    return { ...p, points };
  });
}

/** Toàn bộ bảng tuần cho một em */
export function weeklyBoards(people: Person[], me: string, thisWeek: WeeklyDoc | null, lastWeek: WeeklyDoc | null) {
  return {
    class: rankBoard(boardEntries(people, "class", thisWeek, lastWeek), me),
    home: rankBoard(boardEntries(people, "home", thisWeek, lastWeek), me),
    improve: rankBoard(boardEntries(people, "improve", thisWeek, lastWeek), me),
    teams: teamBoard(people.map((p) => ({ ...p, points: cellTotal(thisWeek?.rows?.[p.uid]) }))),
  };
}
