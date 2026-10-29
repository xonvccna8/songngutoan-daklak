"use client";

// Đọc tin nhắn theo thời gian thực (GV: tin của lớp + biên nhận; HS: hộp tin của mình; quản trị: nhật ký)
import { useEffect, useState } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, where, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { MessageDoc, ReceiptDoc } from "@/lib/messages/types";

function useMessageQuery(make: () => Query | null, deps: unknown[]) {
  const [state, setState] = useState<{ data: MessageDoc[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null });
  useEffect(() => {
    const q = make();
    if (!q) return;
    return onSnapshot(
      q,
      (s) => setState({ data: s.docs.map((d) => ({ id: d.id, ...d.data() }) as MessageDoc), loading: false, error: null }),
      (e) => setState({ data: [], loading: false, error: e.message })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

/** Biên nhận của các tin (mỗi tin một listener; dùng cho vài tin gần nhất) */
function useReceipts(mids: string[]) {
  const [map, setMap] = useState<Record<string, ReceiptDoc[]>>({});
  const key = mids.join(",");
  useEffect(() => {
    if (!key) return;
    const unsubs = key.split(",").map((mid) =>
      onSnapshot(collection(db(), COL.messages, mid, COL.receipts), (s) =>
        setMap((old) => ({ ...old, [mid]: s.docs.map((d) => d.data() as ReceiptDoc) }))
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [key]);
  return map;
}

/** GV: tin gần nhất của lớp (chỉ mục: classId + createdAt) */
export function useClassMessages(classId: string | undefined, max = 10) {
  const msgs = useMessageQuery(
    () => (classId ? query(collection(db(), COL.messages), where("classId", "==", classId), orderBy("createdAt", "desc"), limit(max)) : null),
    [classId, max]
  );
  const receipts = useReceipts(msgs.data.map((m) => m.id));
  return { ...msgs, receipts };
}

/** GV: lịch sử tin gửi một em (chỉ mục: classId + toUids + createdAt) */
export function useMessagesTo(classId: string | undefined, uid: string | undefined) {
  const msgs = useMessageQuery(
    () =>
      classId && uid
        ? query(collection(db(), COL.messages), where("classId", "==", classId), where("toUids", "array-contains", uid), orderBy("createdAt", "desc"), limit(30))
        : null,
    [classId, uid]
  );
  const [mine, setMine] = useState<Record<string, ReceiptDoc>>({});
  const key = msgs.data.map((m) => m.id).join(",");
  useEffect(() => {
    if (!key || !uid) return;
    const unsubs = key.split(",").map((mid) => onSnapshot(doc(db(), COL.messages, mid, COL.receipts, uid), (s) => s.exists() && setMine((o) => ({ ...o, [mid]: s.data() as ReceiptDoc }))));
    return () => unsubs.forEach((u) => u());
  }, [key, uid]);
  return { ...msgs, mine };
}

/** HS: hộp tin của mình (chỉ mục: toUids + createdAt) */
export function useStudentInbox(uid: string | undefined) {
  return useMessageQuery(() => (uid ? query(collection(db(), COL.messages), where("toUids", "array-contains", uid), orderBy("createdAt", "desc"), limit(20)) : null), [uid]);
}

/** Quản trị: nhật ký tin toàn trường (chỉ mục: schoolId + createdAt) */
export function useSchoolMessages(schoolId: string | undefined) {
  return useMessageQuery(() => (schoolId ? query(collection(db(), COL.messages), where("schoolId", "==", schoolId), orderBy("createdAt", "desc"), limit(100)) : null), [schoolId]);
}
