"use client";

// Hộp nhập mật khẩu khi hết lượt AI dùng thử. Gắn một lần ở layout gốc; mọi trang gọi AI (GV hay HS)
// nhận lỗi "AI_LOCKED" từ máy chủ → api-client phát sự kiện → hộp này bật lên.
import { useEffect, useState } from "react";
import { KeyRound, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { INPUT } from "@/components/lessons/fields";
import { AI_LOCKED_EVENT, api, errorMessage } from "@/lib/api-client";

export function AiUnlockDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onLocked = (e: Event) => {
      setMessage((e as CustomEvent<string | undefined>).detail ?? "");
      setError("");
      setPw("");
      setOpen(true);
    };
    window.addEventListener(AI_LOCKED_EVENT, onLocked);
    return () => window.removeEventListener(AI_LOCKED_EVENT, onLocked);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/ai/unlock", { body: { password: pw } });
      setOpen(false);
      toast.success("Đã mở khoá AI. Bấm lại để dùng tiếp nhé!");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <DialogContent className="rounded-3xl p-6 sm:max-w-md">
        <DialogHeader>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-sun-soft text-[#8A5A00]">
            <LockKeyhole className="size-7" />
          </span>
          <DialogTitle className="text-center font-display text-2xl font-extrabold">Đã hết lượt dùng AI</DialogTitle>
          <DialogDescription className="text-center">{message || "Bạn đã dùng hết lượt AI."} Mật khẩu chỉ quản trị nhà trường có — hãy liên hệ quản trị để nhận.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="relative block">
            <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nhập mật khẩu mở khoá"
              autoComplete="off"
              autoFocus
              maxLength={100}
              aria-label="Mật khẩu mở khoá AI"
              className={`${INPUT} h-12 pl-9 text-base`}
            />
          </label>
          {error && <p className="text-sm font-semibold text-coral-dk">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy || !pw.trim()}>
            {busy && <Loader2 className="animate-spin" />} Mở khoá AI
          </Button>
          <button type="button" onClick={() => setOpen(false)} disabled={busy} className="w-full text-sm font-semibold text-ink-2 hover:text-ink">
            Để sau
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
