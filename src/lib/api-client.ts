"use client";

// Gọi API route kèm ID token của người đang đăng nhập
import { auth } from "@/lib/firebase/client";

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false) {
    const token = await auth().currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new Error("Mất kết nối mạng, thử lại nhé.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, code } = data as { error?: string; code?: string };
    if (code === AI_LOCKED) notifyAiLocked(error);
    throw new Error(error ?? "Có lỗi xảy ra.");
  }
  return data as T;
}

/** Hết lượt AI dùng thử: máy chủ trả mã này → hiện hộp nhập mật khẩu (AiUnlockDialog) */
export const AI_LOCKED = "AI_LOCKED";
export const AI_LOCKED_EVENT = "lsn:ai-locked";
export const notifyAiLocked = (message?: string) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(AI_LOCKED_EVENT, { detail: message }));
};

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Có lỗi xảy ra.");
