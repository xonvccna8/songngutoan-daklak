"use client";

// Mã các tiết Toán (Firebase dùng chung với trang KHTN) để chỉ hiện tiết học, bài tập, thuật ngữ Toán — chỉ đọc, không xoá.
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COL } from "@/lib/namespace";

let cache: Promise<Set<string>> | null = null;

/** Đọc một lần mỗi lần mở trang: GV đọc được cả nháp; HS chỉ đọc được tiết đã duyệt nên thử lại với status = approved */
function loadMathLessonIds(): Promise<Set<string>> {
  cache ??= getDocs(query(collection(db(), COL.lessons), where("subject", "==", "Toán")))
    .catch(() => getDocs(query(collection(db(), COL.lessons), where("subject", "==", "Toán"), where("status", "==", "approved"))))
    .then((s) => new Set(s.docs.map((d) => d.id)))
    .catch(() => {
      cache = null; // lỗi mạng → lần sau thử lại
      return new Set<string>();
    });
  return cache;
}

/** null = đang tải (danh sách nên chờ để không nháy dữ liệu Toán) */
export function useMathLessonIds(): Set<string> | null {
  const [ids, setIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    let alive = true;
    loadMathLessonIds().then((s) => alive && setIds(s));
    return () => {
      alive = false;
    };
  }, []);
  return ids;
}
