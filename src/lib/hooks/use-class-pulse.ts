"use client";

// Số liệu nhanh của một lớp cho thẻ lớp ở trang chủ: đang trực tuyến, điểm TB tuần, số em cần chú ý
import { studentRow, weeklyAvgPoints } from "@/lib/analytics";
import { useStudents } from "@/lib/hooks/use-firestore";
import { useClassSessions, useClassStats } from "@/lib/hooks/use-class-history";
import { useLiveSessionForClass, useParticipants } from "@/lib/live/hooks";
import { isStale } from "@/lib/live/status";
import { shortName } from "@/lib/class-utils";
import { DEFAULT_CLASS_SETTINGS, type ClassDoc } from "@/lib/types";

export interface Pulse {
  online: number | null;
  weekly: number | null;
  attention: number;
  live: boolean;
}

export function useClassPulse(cls: ClassDoc, now: number): Pulse & { liveId: string | null; levelUps: string[] } {
  const { data: live } = useLiveSessionForClass(cls.id);
  const participants = useParticipants(live?.id);
  const { data: sessions } = useClassSessions(cls.id, 20);
  const stats = useClassStats(cls.id);
  const { data: students } = useStudents(cls.id);

  const t = { ...DEFAULT_CLASS_SETTINGS.thresholds, ...cls.settings?.thresholds };
  const newest = Math.max(0, ...participants.map((p) => p.lastSeenAt?.toMillis?.() ?? 0));
  const online = live ? participants.filter((p) => p.visible !== false && !(now > 0 && isStale(p.lastSeenAt?.toMillis?.(), newest, now))).length : null;
  const attention = now ? students.filter((s) => studentRow(s.uid, stats.get(s.uid), now, t).status !== "active").length : 0;
  // Các em vừa lên cấp trong 7 ngày (tên ngắn, mới nhất trước)
  const levelUps = now
    ? students
        .map((s) => ({ name: shortName(s.fullName), at: stats.get(s.uid)?.levelUpAt ?? 0 }))
        .filter((x) => x.at && now - x.at < 7 * 86_400_000)
        .sort((a, b) => b.at - a.at)
        .map((x) => x.name)
    : [];
  return { online, weekly: weeklyAvgPoints(sessions, now), attention, live: !!live, liveId: live?.id ?? null, levelUps };
}
