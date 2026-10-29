"use client";

import { RequireRole } from "@/components/require-role";
import { StaffShell } from "@/components/shell/staff-shell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["teacher", "admin"]}>
      <StaffShell>{children}</StaffShell>
    </RequireRole>
  );
}
