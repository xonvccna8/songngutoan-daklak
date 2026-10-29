"use client";

// Trạng thái đăng nhập toàn ứng dụng: người dùng Firebase + custom claims (vai trò)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { readClaims } from "@/lib/namespace";
import type { Claims, Role } from "@/lib/types";

type Status = "loading" | "signed-out" | "signed-in" | "unconfigured";

interface AuthValue {
  status: Status;
  user: User | null;
  claims: Claims;
  /** Vai trò hiện tại; "pending" = GV đã đăng nhập nhưng chưa được duyệt */
  role: Role | "pending" | null;
  refreshClaims: () => Promise<Claims>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>(() => (isFirebaseConfigured() ? "loading" : "unconfigured"));
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claims>({});

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return onIdTokenChanged(auth(), async (u) => {
      if (!u) {
        setUser(null);
        setClaims({});
        setStatus("signed-out");
        return;
      }
      const res = await u.getIdTokenResult();
      setUser(u);
      setClaims(readClaims(res.claims));
      setStatus("signed-in");
    });
  }, []);

  const refreshClaims = useCallback(async (): Promise<Claims> => {
    const u = auth().currentUser;
    if (!u) return {};
    const res = await u.getIdTokenResult(true);
    const c = readClaims(res.claims);
    setClaims(c);
    return c;
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth());
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      claims,
      role: status === "signed-in" ? (claims.role ?? "pending") : null,
      refreshClaims,
      signOut,
    }),
    [status, user, claims, refreshClaims, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return v;
}

/** Trang chủ tương ứng với từng vai trò */
export function homeFor(role: AuthValue["role"]): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
      return "/s";
    case "pending":
      return "/pending";
    default:
      return "/";
  }
}
