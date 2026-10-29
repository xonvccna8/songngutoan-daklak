"use client";

// Bộ điều khiển tiết học cho laptop GV và cửa sổ tivi (cả hai đều đăng nhập bằng tài khoản GV):
// ghi state lên Firestore, phím tắt (→ Space PageDown / ← PageUp / L / N), tự khoá khi hết giờ.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import { api } from "@/lib/api-client";
import * as C from "@/lib/live/controller";
import { useCountdown } from "@/lib/live/hooks";
import type { Lang, LiveState, Pair, SessionDoc } from "@/lib/live/types";
import { markPhase } from "@/lib/live/timeline";
import { tickLang } from "@/lib/live/english";

type Roster = { uid: string; name: string }[];

export function useLiveControls(opts: { session: SessionDoc | null; receivedAt: number; ctx: C.Ctx | null; roster: Roster; keyboard?: boolean }) {
  const { session, receivedAt, ctx, roster, keyboard = true } = opts;
  const live = session?.status === "live";

  // Giá trị mới nhất cho callback (phím tắt) mà không phải gắn lại sự kiện
  const ref = useRef({ session, receivedAt, ctx, roster });
  useLayoutEffect(() => {
    ref.current = { session, receivedAt, ctx, roster };
  });

  // Lần ghi gần nhất: bấm Tiếp liên tục nhanh thì lần sau dựa trên lần trước (không bị "nuốt" phím)
  const lastWrite = useRef<{ sid: string; state: LiveState } | null>(null);

  const write = useCallback(async (fn: (s: LiveState, c: C.Ctx, roster: Roster) => LiveState) => {
    const { session: s, receivedAt: r, ctx: c, roster: ro } = ref.current;
    if (!s || !c || s.status !== "live") return;
    const last = lastWrite.current;
    const base = last && last.sid === s.id && last.state.writtenAt > s.state.writtenAt ? last.state : s.state;
    const raw = fn(base, c, ro);
    if (raw === base) return;
    // Đợt B — ghi mốc bắt đầu chặng (4 hoạt động + tổng kết) lần đầu chiếu tới
    // Đợt D — cộng thời gian tivi ở ngôn ngữ vừa dùng (đo tỉ lệ tiếng Anh thực tế)
    const now = Date.now();
    const nextS = tickLang(base, markPhase(raw, c.slides, now), now);
    // Đồng hồ tính từ lúc nhận bản ghi (hoặc lúc chính máy này vừa ghi)
    const stamped = C.stamp(nextS, base, base === s.state ? r : base.writtenAt);
    lastWrite.current = { sid: s.id, state: stamped };
    try {
      await updateDoc(doc(db(), COL.sessions, s.id), { state: stamped, updatedAt: serverTimestamp() });
    } catch {
      lastWrite.current = null;
      toast.error("Không lưu được thao tác — kiểm tra mạng.");
      return;
    }
    // Vừa công bố một câu → máy chủ chép đúng/sai + điểm vào phiếu từng em (thử lại 1 lần nếu mạng chập chờn)
    if (stamped.reveal && stamped.reveal.slideId !== base.reveal?.slideId) {
      const path = `/api/live/sessions/${s.id}/reveal`;
      api(path, { body: {} })
        .catch(() => new Promise((r) => setTimeout(r, 1500)).then(() => api(path, { body: {} })))
        .catch(() => toast.error("Chưa gửi được kết quả câu này xuống điện thoại (mạng). HS vẫn xem được khi kết thúc tiết."));
    }
  }, []);

  const actions = useMemo(
    () => ({
      next: () => write(C.next),
      prev: () => write(C.prev),
      go: (i: number) => write((s, c) => C.goSlide(s, i, c)),
      open: () => write(C.openQ),
      lock: () => write((s) => C.lockQ(s)),
      reveal: () => write(C.revealQ),
      lang: (l: Lang) => write((s) => ({ ...s, lang: l })),
      cycleLang: () => write((s) => ({ ...s, lang: C.cycleLang(s.lang) })),
      timer: (sec: number) => write((s) => ({ ...s, timerMs: sec ? sec * 1000 : null })),
      // Đợt A — bật/tắt hiện tổng đèn hiểu bài (ẩn danh) trên tivi
      toggleLights: () => write((s) => ({ ...s, showLights: !s.showLights })),
      // Đợt B — gọi đúng em trợ lý gợi ý; đặt / xoá cặp hỗ trợ; hiện cặp lên tivi
      callUid: (uid: string) =>
        write((s, _c, ro) => {
          const p = ro.find((x) => x.uid === uid);
          return p ? { ...s, called: { uid, name: p.name, at: Date.now() }, calledUids: s.calledUids.includes(uid) ? s.calledUids : [...s.calledUids, uid] } : s;
        }),
      // Kèm tên ngắn của các em trong cặp: điện thoại HS không đọc được danh sách lớp nên cần tên để hiện "Bạn cùng cặp"
      setPairs: (pairs: Pair[] | null) =>
        write((s, _c, ro) => {
          const names = new Map(ro.map((x) => [x.uid, x.name]));
          const pairNames = Object.fromEntries((pairs ?? []).flatMap((p) => [p.a, p.b, p.c]).filter((u): u is string => !!u && names.has(u)).map((u) => [u, names.get(u)!]));
          return { ...s, pairs: pairs ?? [], pairNames, showPairs: pairs ? s.showPairs : false };
        }),
      togglePairs: () => write((s) => ({ ...s, showPairs: !s.showPairs })),
      callName: () =>
        write((s, _c, ro) => {
          const r = C.pickName(ro, s.calledUids);
          if (!r) {
            toast.info("Chưa có học sinh nào vào lớp.");
            return s;
          }
          return { ...s, called: { uid: r.pick.uid, name: r.pick.name, at: Date.now() }, calledUids: r.calledUids };
        }),
      pin: (slideId: string, uid: string) =>
        write((s) => {
          const cur = s.pinned[slideId] ?? [];
          return { ...s, pinned: { ...s.pinned, [slideId]: cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid] } };
        }),
    }),
    [write]
  );

  // Hết giờ → tự khoá câu hỏi (hoặc tắt đồng hồ)
  const left = useCountdown(session?.state.timerMs ?? null, receivedAt);
  useEffect(() => {
    if (!live || left == null || left > 0) return;
    write((s) => (s.phase === "open" ? C.lockQ(s) : { ...s, timerMs: null }));
  }, [left, live, write]);

  // Tên được gọi tự tắt sau 4 giây
  const calledAt = session?.state.called?.at;
  useEffect(() => {
    if (!calledAt) return;
    const t = setTimeout(() => write((s) => (s.called?.at === calledAt ? { ...s, called: null } : s)), 4000);
    return () => clearTimeout(t);
  }, [calledAt, write]);

  // Phím tắt + bút trình chiếu (thường gửi PageDown/PageUp)
  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        actions.next();
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        actions.prev();
      } else if (e.key === "l" || e.key === "L") actions.cycleLang();
      else if (e.key === "n" || e.key === "N") actions.callName();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, actions]);

  return { actions, left, nextLabel: session && ctx ? C.nextLabel(session.state, ctx) : "" };
}
