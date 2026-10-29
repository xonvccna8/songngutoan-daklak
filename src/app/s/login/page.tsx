"use client";

// Học sinh đăng nhập: 1) mã lớp  2) chọn tên  3) PIN 6 số — không cần email
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { ArrowLeft, ArrowRight, Delete, Loader2, Search } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tam } from "@/components/brand/tam";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/common";
import { SetupNotice } from "@/components/setup-notice";
import { api, errorMessage } from "@/lib/api-client";
import { homeFor, useAuth } from "@/lib/auth/auth-context";
import { auth } from "@/lib/firebase/client";
import { JOIN_CODE_LENGTH, normalizeJoinCode, shortName } from "@/lib/class-utils";

interface RosterStudent {
  uid: string;
  fullName: string;
  number: number;
  team: number;
}
interface Roster {
  classId: string;
  className: string;
  students: RosterStudent[];
}

const LAST_CODE_KEY = "lsn:lastCode";

export default function StudentLoginPage() {
  const router = useRouter();
  const { status, role } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [code, setCode] = useState("");
  const [roster, setRoster] = useState<Roster | null>(null);
  const [student, setStudent] = useState<RosterStudent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signingIn = useRef(false);

  const loadRoster = useCallback(async (c: string) => {
    setBusy(true);
    setError("");
    try {
      const r = await api<Roster>(`/api/auth/roster?code=${c}`, { auth: false });
      setRoster(r);
      setStep(1);
      try {
        localStorage.setItem(LAST_CODE_KEY, c);
      } catch {}
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  // Mã lớp từ QR (?code=XXXXXX) hoặc lần đăng nhập trước
  useEffect(() => {
    const fromUrl = normalizeJoinCode(new URLSearchParams(window.location.search).get("code") ?? "");
    let last = "";
    try {
      last = localStorage.getItem(LAST_CODE_KEY) ?? "";
    } catch {}
    const initial = fromUrl || last;
    // Đọc URL/localStorage chỉ có sau khi hydrate → đặt state một lần khi mở trang
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initial) setCode(initial);
    if (fromUrl.length === JOIN_CODE_LENGTH) loadRoster(fromUrl);
  }, [loadRoster]);

  useEffect(() => {
    if (status === "signed-in" && !signingIn.current) router.replace(homeFor(role));
  }, [status, role, router]);

  // Không chặn bằng màn chờ: mạng yếu vẫn nhập mã lớp được ngay
  if (status === "unconfigured") return <SetupNotice />;

  async function login(pin: string) {
    if (!student) return;
    setBusy(true);
    setError("");
    signingIn.current = true;
    try {
      const { token } = await api<{ token: string }>("/api/auth/student", {
        auth: false,
        body: { code, uid: student.uid, pin },
      });
      await signInWithCustomToken(auth(), token);
      router.replace("/s");
    } catch (e) {
      signingIn.current = false;
      setError(errorMessage(e));
      setBusy(false);
      throw e;
    }
  }

  const back = () => {
    setError("");
    if (step === 2) setStep(1);
    else if (step === 1) setStep(0);
  };

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col bg-paper">
      {/* Đầu trang */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-5">
        {step === 0 ? (
          <Link href="/" className="inline-flex size-11 items-center justify-center rounded-xl text-ink-2 hover:bg-ink/5" aria-label="Về trang chủ">
            <ArrowLeft />
          </Link>
        ) : (
          <button onClick={back} className="inline-flex size-11 items-center justify-center rounded-xl text-ink-2 hover:bg-ink/5" aria-label="Quay lại">
            <ArrowLeft />
          </button>
        )}
        <div className="flex gap-1.5" aria-label={`Bước ${step + 1} / 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-8 bg-blue" : i < step ? "w-2 bg-teal" : "w-2 bg-line-2")} />
          ))}
        </div>
        <LogoMark className="size-9" />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-8">
        {step === 0 && <CodeStep code={code} setCode={setCode} busy={busy} error={error} onSubmit={() => loadRoster(code)} />}
        {step === 1 && roster && (
          <NameStep
            roster={roster}
            onPick={(s) => {
              setStudent(s);
              setError("");
              setStep(2);
            }}
          />
        )}
        {step === 2 && student && roster && (
          <PinStep student={student} className={roster.className} busy={busy} error={error} onSubmit={login} />
        )}
      </div>
    </main>
  );
}

/* ---------- Bước 1: mã lớp ---------- */
function CodeStep({
  code,
  setCode,
  busy,
  error,
  onSubmit,
}: {
  code: string;
  setCode: (c: string) => void;
  busy: boolean;
  error: string;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = code.length === JOIN_CODE_LENGTH;
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit();
      }}
    >
      <Tam mood="happy" className="mx-auto size-24" />
      <h1 className="mt-4 text-center text-3xl font-extrabold">Vào lớp nào!</h1>
      <p className="mt-1 text-center">
        <span className="text-en font-semibold">Enter your class code</span> · <span className="text-vi">Nhập mã lớp trên phiếu</span>
      </p>

      {/* 6 ô hiển thị, một ô nhập ẩn phía sau để bàn phím điện thoại hoạt động tự nhiên */}
      <label className="relative mt-8 block cursor-text" onClick={() => inputRef.current?.focus()}>
        <span className="sr-only">Mã lớp</span>
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(normalizeJoinCode(e.target.value))}
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          maxLength={JOIN_CODE_LENGTH}
          className="peer absolute inset-0 opacity-0"
        />
        <span className="grid grid-cols-6 gap-2">
          {Array.from({ length: JOIN_CODE_LENGTH }).map((_, i) => {
            const ch = code[i];
            const active = i === Math.min(code.length, JOIN_CODE_LENGTH - 1);
            return (
              <span
                key={i}
                className={cn(
                  "flex aspect-[4/5] items-center justify-center rounded-2xl border-2 bg-white font-display text-3xl font-extrabold transition-all",
                  ch ? "border-ink text-ink shadow-[0_4px_0_var(--color-ink)]" : "border-line-2 text-ink-2/30",
                  active && !ch && "peer-focus:border-blue peer-focus:shadow-[0_4px_0_var(--color-blue)]"
                )}
              >
                {ch ?? "•"}
              </span>
            );
          })}
        </span>
      </label>

      {error && <p role="alert" className="animate-shake mt-4 rounded-xl bg-coral-soft px-4 py-3 text-center text-sm font-semibold text-[#A3301B]">{error}</p>}

      <div className="mt-auto pt-8">
        <Button type="submit" variant="sun" size="xl" className="w-full" disabled={!ready || busy}>
          {busy ? <Loader2 className="animate-spin" /> : null} Tiếp tục <ArrowRight />
        </Button>
        <p className="mt-4 text-center text-xs text-ink-2">Mẹo: quét mã QR trên phiếu để khỏi phải gõ.</p>
      </div>
    </form>
  );
}

/* ---------- Bước 2: chọn tên ---------- */
function NameStep({ roster, onPick }: { roster: Roster; onPick: (s: RosterStudent) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/\p{M}/gu, "");
    if (!k) return roster.students;
    return roster.students.filter((s) =>
      s.fullName.toLocaleLowerCase("vi").normalize("NFD").replace(/\p{M}/gu, "").includes(k) || String(s.number) === k
    );
  }, [q, roster.students]);

  return (
    <div className="flex flex-1 flex-col">
      <span className="mx-auto rounded-full bg-ink px-3 py-1 font-display text-sm font-bold text-white">Lớp {roster.className}</span>
      <h1 className="mt-3 text-center text-3xl font-extrabold">Em là ai?</h1>
      <p className="mt-1 text-center">
        <span className="text-en font-semibold">Find your name</span> · <span className="text-vi">Chọn tên của em</span>
      </p>

      <div className="relative mt-6">
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Gõ tên hoặc số thứ tự…"
          className="h-13 w-full rounded-2xl border-2 border-line-2 bg-white pr-4 pl-12 text-base outline-none focus:border-blue"
        />
      </div>

      <ul className="mt-4 grid gap-2">
        {list.map((s) => (
          <li key={s.uid}>
            <button
              onClick={() => onPick(s)}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-white px-3 py-2.5 text-left transition-all hover:border-blue hover:shadow-[0_3px_0_var(--color-blue)] active:translate-y-0.5"
            >
              <span className="w-7 text-center font-display text-sm font-bold text-ink-2">{s.number}</span>
              <Avatar name={s.fullName} team={s.team} />
              <span className="flex-1 font-semibold">{s.fullName}</span>
              <span className="text-xs font-semibold text-ink-2">Tổ {s.team}</span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="py-8 text-center text-sm text-ink-2">Không thấy tên? Em báo thầy cô nhé.</li>}
      </ul>
    </div>
  );
}

/* ---------- Bước 3: PIN ---------- */
function PinStep({
  student,
  className,
  busy,
  error,
  onSubmit,
}: {
  student: RosterStudent;
  className: string;
  busy: boolean;
  error: string;
  onSubmit: (pin: string) => Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(0);

  const press = useCallback(
    (d: string) => {
      if (!busy) setPin((p) => (p + d).slice(0, 6));
    },
    [busy]
  );
  const del = useCallback(() => setPin((p) => p.slice(0, -1)), []);

  // Đủ 6 số → tự gửi; sai thì rung và xoá để nhập lại
  const submitted = useRef("");
  useEffect(() => {
    if (pin.length !== 6 || submitted.current === pin) return;
    submitted.current = pin;
    onSubmit(pin).catch(() => {
      submitted.current = "";
      setShake((n) => n + 1);
      setPin("");
    });
  }, [pin, onSubmit]);

  // Bàn phím máy tính cũng gõ được
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") del();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, del]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col items-center">
        <Avatar name={student.fullName} team={student.team} className="size-16 text-xl" />
        <h1 className="mt-3 text-center text-2xl font-extrabold">Chào {shortName(student.fullName)}!</h1>
        <p className="text-sm text-ink-2">
          {student.fullName} · Lớp {className} · Tổ {student.team}
        </p>
        <p className="mt-3">
          <span className="text-en font-semibold">Enter your PIN</span> · <span className="text-vi">Nhập mã PIN 6 số</span>
        </p>
      </div>

      <div key={shake} className={cn("mt-6 flex justify-center gap-3", shake > 0 && "animate-shake")} aria-live="polite" aria-label={`Đã nhập ${pin.length} trên 6 số`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-4 rounded-full border-2 transition-all",
              i < pin.length ? "scale-110 border-blue bg-blue" : "border-line-2 bg-white"
            )}
          />
        ))}
      </div>

      <div className="mt-4 min-h-12">
        {busy ? (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-2">
            <Loader2 className="size-4 animate-spin" /> Đang kiểm tra…
          </p>
        ) : (
          error && <p role="alert" className="rounded-xl bg-coral-soft px-4 py-2.5 text-center text-sm font-semibold text-[#A3301B]">{error}</p>
        )}
      </div>

      <div className="mt-auto grid grid-cols-3 gap-3 pt-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Key key={d} onClick={() => press(d)} disabled={busy}>
            {d}
          </Key>
        ))}
        <span />
        <Key onClick={() => press("0")} disabled={busy}>
          0
        </Key>
        <Key onClick={del} disabled={busy || !pin} aria-label="Xoá" tone="soft">
          <Delete className="size-7" />
        </Key>
      </div>
      <p className="mt-5 text-center text-xs text-ink-2">Quên PIN? Em nhờ thầy cô đặt lại nhé.</p>
    </div>
  );
}

function Key({ tone = "white", className, ...props }: React.ComponentProps<"button"> & { tone?: "white" | "soft" }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-16 items-center justify-center rounded-2xl border-2 font-display text-3xl font-bold transition-all select-none active:translate-y-[3px] active:shadow-none disabled:opacity-40",
        tone === "white" ? "border-line-2 bg-white text-ink shadow-[0_4px_0_var(--color-line-2)]" : "border-transparent bg-transparent text-ink-2",
        className
      )}
      {...props}
    />
  );
}
