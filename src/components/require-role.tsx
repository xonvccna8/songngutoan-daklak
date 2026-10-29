"use client";

// Chặn trang theo vai trò ở phía giao diện (quyền dữ liệu thật do security rules + API kiểm)
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FullScreenLoader } from "@/components/common";
import { SetupNotice } from "@/components/setup-notice";
import { homeFor, useAuth } from "@/lib/auth/auth-context";
import type { Role } from "@/lib/types";

export function RequireRole({
  roles,
  loginPath = "/login",
  children,
}: {
  roles: Role[];
  loginPath?: string;
  children: React.ReactNode;
}) {
  const { status, role } = useAuth();
  const router = useRouter();
  const allowed = role !== null && role !== "pending" && roles.includes(role);

  useEffect(() => {
    if (status === "signed-out") router.replace(loginPath);
    else if (status === "signed-in" && !allowed) router.replace(homeFor(role));
  }, [status, allowed, role, router, loginPath]);

  if (status === "unconfigured") return <SetupNotice />;
  if (!allowed) return <FullScreenLoader />;
  return <>{children}</>;
}
