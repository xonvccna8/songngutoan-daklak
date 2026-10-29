"use client";

// Phiếu PIN chỉ giữ tạm trong tab hiện tại (sessionStorage) để in — không lưu PIN rõ lên máy chủ
import type { PinSlip } from "@/lib/types";

const key = (classId: string) => `lsn:slips:${classId}`;

export function saveSlips(classId: string, slips: PinSlip[]) {
  try {
    sessionStorage.setItem(key(classId), JSON.stringify({ at: Date.now(), slips }));
  } catch {}
}

export function loadSlips(classId: string): { at: number; slips: PinSlip[] } | null {
  try {
    const raw = sessionStorage.getItem(key(classId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSlips(classId: string) {
  try {
    sessionStorage.removeItem(key(classId));
  } catch {}
}
