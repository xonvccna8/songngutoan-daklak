"use client";

// Quản trị: mật khẩu mở khoá AI. GV / HS dùng hết lượt AI sẽ được hỏi mật khẩu này — chỉ quản trị xem và đổi được.
import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { INPUT } from "@/components/lessons/fields";
import { api, errorMessage } from "@/lib/api-client";

export function AiPasswordCard() {
  const [data, setData] = useState<{ password: string | null; limit: number } | null>(null);
  const [show, setShow] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ password: string | null; limit: number }>("/api/admin/ai-password")
      .then(setData)
      .catch((e) => toast.error(errorMessage(e)));
  }, []);

  async function save(password?: string) {
    setBusy(true);
    try {
      const r = await api<{ password: string; limit: number }>("/api/admin/ai-password", { body: { password: password ?? "" } });
      setData(r);
      setShow(true);
      setTyped("");
      toast.success("Đã lưu mật khẩu mở khoá AI mới.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const copy = async () => {
    if (!data?.password) return;
    try {
      await navigator.clipboard.writeText(data.password);
      toast.success("Đã chép mật khẩu.");
    } catch {
      toast.error("Không chép được.");
    }
  };

  return (
    <section className="card-lsn relative mt-8 overflow-hidden p-5 sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#DB2777]" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#FCD34D] to-[#D97706] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,.35)]">
            <KeyRound className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold">Mật khẩu mở khoá AI</h2>
            <p className="text-sm text-ink-2">
              Mỗi giáo viên, học sinh được dùng AI <b className="text-ink">{data?.limit ?? 5} lượt</b>. Hết lượt, máy hiện hộp nhập mật khẩu — chỉ quản trị thấy mật khẩu này. Tài khoản quản
              trị không bị giới hạn.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex h-11 min-w-56 items-center gap-2 rounded-xl border border-line-2 bg-paper px-3 font-mono text-base font-bold tracking-wider">
            {data === null ? (
              <Loader2 className="size-4 animate-spin text-ink-2" />
            ) : data.password ? (
              <span className="flex-1">{show ? data.password : "••••••••••••"}</span>
            ) : (
              <span className="flex-1 font-sans text-sm font-semibold tracking-normal text-coral-dk">Chưa đặt mật khẩu</span>
            )}
            {data?.password && (
              <>
                <button type="button" onClick={() => setShow((s) => !s)} className="rounded-md p-1 text-ink-2 hover:text-ink" aria-label={show ? "Ẩn" : "Hiện"}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                <button type="button" onClick={copy} className="rounded-md p-1 text-ink-2 hover:text-ink" aria-label="Chép mật khẩu">
                  <Copy className="size-4" />
                </button>
              </>
            )}
          </div>
          <Button variant="sun" onClick={() => save()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Tạo mật khẩu mới
          </Button>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.trim()) save(typed);
        }}
      >
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Hoặc tự đặt mật khẩu (6–40 kí tự, không khoảng trắng)" maxLength={40} autoComplete="off" className={`${INPUT} h-11 flex-1`} />
        <Button type="submit" variant="outline" disabled={busy || !typed.trim()}>
          <Save /> Lưu mật khẩu này
        </Button>
      </form>
    </section>
  );
}
