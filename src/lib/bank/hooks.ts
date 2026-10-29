"use client";

// GV / quản trị: toàn bộ ngân hàng câu hỏi (theo dõi thời gian thực). HS không đọc được (có đáp án).
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";
import type { BankDoc } from "@/lib/bank/questions";
import { isScienceCurId } from "@/lib/subject";

export function useBankQuestions() {
  const [state, setState] = useState<{
    data: BankDoc[];
    loading: boolean;
    error: string | null;
  }>({ data: [], loading: true, error: null });
  useEffect(
    () =>
      onSnapshot(
        collection(db(), COL.questions),
        (s) =>
          setState({
            // Ẩn câu hỏi của trang KHTN (Firebase dùng chung — không xoá)
            data: s.docs
              .map((d) => ({ id: d.id, ...d.data() }) as BankDoc)
              .filter((q) => !isScienceCurId(q.curLessonId))
              .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)),
            loading: false,
            error: null,
          }),
        (e) => setState({ data: [], loading: false, error: e.message })
      ),
    []
  );
  return state;
}
