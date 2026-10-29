"use client";

import { RequireRole } from "@/components/require-role";
import { StaffShell } from "@/components/shell/staff-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["admin"]}>
      <StaffShell>{children}</StaffShell>
    </RequireRole>
  );
}
