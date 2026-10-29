"use client";

// In phiếu đăng nhập: tên, mã lớp, PIN, QR (chứa sẵn mã lớp). 12 phiếu / trang A4.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, Printer, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { EmptyState, teamColor } from "@/components/common";
import { useClass } from "@/lib/hooks/use-firestore";
import { loadSlips } from "@/lib/slips";
import type { PinSlip } from "@/lib/types";

export default function PrintSlipsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data: cls } = useClass(classId);
  const [slips, setSlips] = useState<PinSlip[] | null>(null);
  const [qr, setQr] = useState("");
  const [origin, setOrigin] = useState("");

  // sessionStorage chỉ đọc được trên trình duyệt (sau khi hydrate)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlips(loadSlips(classId)?.slips ?? []);
    setOrigin(window.location.origin);
  }, [classId]);

  useEffect(() => {
    if (!cls || !origin) return;
    QRCode.toDataURL(`${origin}/s/login?code=${cls.joinCode}`, { margin: 1, width: 240, color: { dark: "#14213D" } }).then(setQr);
  }, [cls, origin]);

  if (slips === null || !cls) return null;

  if (slips.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <EmptyState
          title="Không có phiếu để in"
          mood="calm"
          action={
            <Link href={`/teacher/classes/${classId}`} className="font-bold text-blue">
              ← Về trang lớp
            </Link>
          }
        >
          Phiếu chỉ hiện ngay sau khi thêm học sinh hoặc đặt lại PIN (PIN không được lưu dạng đọc được). Hãy dùng nút “In phiếu”
          ở trang lớp.
        </EmptyState>
      </div>
    );
  }

  const host = origin.replace(/^https?:\/\//, "");

  return (
    <div className="mx-auto max-w-[210mm] px-4 py-6 print:max-w-none print:p-0">
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/teacher/classes/${classId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
            <ArrowLeft className="size-4" /> Lớp {cls.name}
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold">Phiếu đăng nhập · {slips.length} em</h1>
        </div>
        <Button size="lg" onClick={() => window.print()}>
          <Printer /> In ngay
        </Button>
      </div>

      <div className="no-print mb-6 flex items-start gap-3 rounded-2xl bg-sun-soft p-4 text-sm text-[#8A5A00]">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" />
        <p>
          PIN chỉ hiển thị trên trang này và sẽ mất khi đóng thẻ trình duyệt. Hãy in (hoặc lưu PDF) ngay, cắt theo đường kẻ và
          phát cho từng em.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-0">
        {slips.map((s) => (
          <article
            key={s.uid}
            className="flex break-inside-avoid flex-col rounded-2xl border-2 border-dashed border-line-2 bg-white p-3.5 print:h-[66mm] print:rounded-none print:border-[#bbb]"
          >
            <header className="flex items-center gap-2">
              <LogoMark className="size-6" />
              <span className="font-display text-xs font-extrabold">Lớp Song Ngữ</span>
              <span className="ml-auto rounded-md bg-ink px-1.5 py-0.5 font-display text-[11px] font-bold text-white">Lớp {cls.name}</span>
            </header>
            <p className="mt-2.5 truncate font-display text-base leading-tight font-extrabold">{s.fullName}</p>
            <p className="text-[11px] font-semibold text-ink-2">
              STT {s.number} · <span style={{ color: teamColor(s.team) }}>Tổ {s.team}</span>
            </p>
            <div className="mt-2 flex flex-1 items-end gap-2.5">
              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="text-[9px] font-bold tracking-wider text-ink-2 uppercase">Mã lớp</p>
                  <p className="font-mono text-base leading-none font-extrabold tracking-[0.18em]">{cls.joinCode}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-wider text-ink-2 uppercase">PIN</p>
                  <p className="font-mono text-xl leading-none font-extrabold tracking-[0.2em] text-blue-dk">{s.pin}</p>
                </div>
              </div>
              {/* QR là ảnh data: URL tạo tại chỗ, không cần next/image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qr && <img src={qr} alt="" className="size-[22mm] shrink-0" />}
            </div>
            <p className="mt-2 truncate text-[9px] text-ink-2">Quét QR hoặc vào {host}/s/login · Giữ kín PIN của em!</p>
          </article>
        ))}
      </div>
    </div>
  );
}
