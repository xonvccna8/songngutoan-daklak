"use client";

// Đăng nhập GV / quản trị: Google hoặc email + mật khẩu
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import { Tam } from "@/components/brand/tam";
import { FloatingShapes } from "@/components/brand/shapes";
import { SetupNotice } from "@/components/setup-notice";
import { api } from "@/lib/api-client";
import { homeFor, useAuth } from "@/lib/auth/auth-context";
import { auth } from "@/lib/firebase/client";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Email hoặc mật khẩu chưa đúng.",
  "auth/wrong-password": "Email hoặc mật khẩu chưa đúng.",
  "auth/user-not-found": "Chưa có tài khoản với email này.",
  "auth/email-already-in-use": "Email này đã có tài khoản — hãy đăng nhập.",
  "auth/weak-password": "Mật khẩu cần ít nhất 6 kí tự.",
  "auth/invalid-email": "Email không hợp lệ.",
  "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập Google.",
  "auth/too-many-requests": "Thử quá nhiều lần, hãy đợi một lát.",
  "auth/operation-not-allowed": "Phương thức đăng nhập này chưa được bật trong Firebase.",
  "auth/unauthorized-domain": "Tên miền này chưa được thêm vào Firebase Authentication → Settings → Authorized domains.",
};
const fbError = (e: unknown) => {
  const code = (e as { code?: string }).code ?? "";
  if (code.startsWith("auth/api-key-not-valid")) return "Khoá Firebase (API key) không hợp lệ — cần dùng cấu hình của Web app.";
  return FIREBASE_ERRORS[code] ?? `Không đăng nhập được (${code || "lỗi mạng"}), thử lại nhé.`;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.3 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { status, role, refreshClaims } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Đã đăng nhập sẵn → chuyển thẳng về trang của vai trò
  useEffect(() => {
    if (status === "signed-in" && !busy) router.replace(homeFor(role));
  }, [status, role, busy, router]);

  if (status === "unconfigured") return <SetupNotice />;

  /** Sau khi Firebase đăng nhập xong: đăng kí hồ sơ, làm mới quyền, chuyển trang */
  async function afterSignIn() {
    await api("/api/auth/register", { method: "POST" });
    const claims = await refreshClaims();
    if (claims.role === "student") {
      router.replace("/s");
      return;
    }
    router.replace(homeFor(claims.role ?? "pending"));
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await afterSignIn();
    } catch (e) {
      setError((e as { code?: string }).code ? fbError(e) : (e as Error).message);
      setBusy(false);
    }
  }

  const google = () =>
    run(async () => {
      await signInWithPopup(auth(), new GoogleAuthProvider());
    });

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    run(async () => {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth(), email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        await cred.user.getIdToken(true);
      } else {
        await signInWithEmailAndPassword(auth(), email.trim(), password);
      }
    });
  };

  async function forgot() {
    if (!email.trim()) {
      setError("Nhập email trước, rồi bấm “Quên mật khẩu”.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth(), email.trim());
      toast.success("Đã gửi email đặt lại mật khẩu.");
    } catch (e) {
      setError(fbError(e));
    }
  }

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Cột trái: thương hiệu */}
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col">
        <FloatingShapes tone="dark" />
        <Logo tone="light" />
        <div className="relative my-auto max-w-md">
          <Tam mood="happy" className="size-32" />
          <h1 className="mt-6 text-4xl leading-tight font-extrabold">
            Chào thầy cô! <span className="text-sun">Hôm nay mình dạy gì?</span>
          </h1>
          <p className="mt-4 text-white/70">
            Quản lý lớp, in phiếu đăng nhập cho học sinh và chuẩn bị tiết dạy song ngữ — tất cả ở một nơi.
          </p>
          <div className="mt-8 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="font-display font-semibold text-[#A7F3C8]">“Let’s check the answer together.”</p>
            <p className="mt-1 text-sm text-white/55 italic">Cùng kiểm tra đáp án nào.</p>
          </div>
        </div>
        <p className="relative text-sm text-white/40">Dữ liệu học sinh chỉ gồm họ tên, lớp, tổ.</p>
      </aside>

      {/* Cột phải: biểu mẫu */}
      <section className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
            <ArrowLeft className="size-4" /> Trang chủ
          </Link>
          <Logo className="lg:hidden" sub={false} />
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-10">
          <h2 className="text-3xl font-extrabold">{mode === "signin" ? "Đăng nhập giáo viên" : "Tạo tài khoản giáo viên"}</h2>
          <p className="mt-1.5 text-ink-2">
            {mode === "signin"
              ? "Dành cho giáo viên và quản trị nhà trường."
              : "Sau khi tạo, quản trị nhà trường sẽ duyệt tài khoản của bạn."}
          </p>

          <Button variant="outline" size="lg" className="mt-7 w-full" onClick={google} disabled={busy}>
            <GoogleIcon /> Tiếp tục với Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs font-bold tracking-wider text-ink-2/70 uppercase">
            <span className="h-0.5 flex-1 bg-line" /> hoặc dùng email <span className="h-0.5 flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Họ tên</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Thị Lan" className="h-12 rounded-xl border-2 bg-white text-base" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@truong.edu.vn" className="h-12 rounded-xl border-2 bg-white text-base" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                {mode === "signin" && (
                  <button type="button" onClick={forgot} className="text-xs font-semibold text-blue hover:underline">
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <Input id="password" type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-2 bg-white text-base" />
            </div>

            {error && (
              <p role="alert" className="animate-shake rounded-xl bg-coral-soft px-3.5 py-2.5 text-sm font-semibold text-[#A3301B]">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Mail />}
              {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-2">
            {mode === "signin" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button type="button" className="font-bold text-blue hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
              {mode === "signin" ? "Tạo tài khoản" : "Đăng nhập"}
            </button>
          </p>

          <Link href="/s/login" className="mt-8 flex items-center justify-between rounded-2xl border-2 border-dashed border-line-2 bg-white/60 px-4 py-3 text-sm font-semibold hover:border-sun hover:bg-sun-soft">
            <span>Em là học sinh? Vào lớp bằng mã lớp + PIN</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
