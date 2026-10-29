"use client";

// GV đã đăng nhập nhưng chưa được quản trị duyệt
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Tam } from "@/components/brand/tam";
import { FullScreenLoader } from "@/components/common";
import { api, errorMessage } from "@/lib/api-client";
import { homeFor, useAuth } from "@/lib/auth/auth-context";

export default function PendingPage() {
  const router = useRouter();
  const { status, role, user, refreshClaims, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
    else if (status === "signed-in" && role !== "pending") router.replace(homeFor(role));
  }, [status, role, router]);

  if (status !== "signed-in" || role !== "pending") return <FullScreenLoader />;

  async function check() {
    setBusy(true);
    try {
      await api("/api/auth/register", { method: "POST" });
      const c = await refreshClaims();
      if (!c.role) toast.info("Tài khoản vẫn đang chờ duyệt.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center bg-paper p-6">
      <Logo className="absolute top-6 left-6" />
      <div className="card-lsn w-full max-w-md p-8 text-center">
        <Tam mood="calm" className="mx-auto size-24" />
        <h1 className="mt-4 text-2xl font-extrabold">Tài khoản đang chờ duyệt</h1>
        <p className="mt-2 text-ink-2">
          Quản trị nhà trường cần cấp quyền giáo viên cho <b className="text-ink">{user?.email}</b>. Khi được duyệt, bấm
          “Kiểm tra lại”.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button size="lg" onClick={check} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Kiểm tra lại
          </Button>
          <Button variant="ghost" onClick={() => signOut().then(() => router.replace("/login"))}>
            <LogOut /> Đăng xuất
          </Button>
        </div>
      </div>
    </main>
  );
}
