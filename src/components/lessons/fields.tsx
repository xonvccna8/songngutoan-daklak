"use client";

// Ô nhập dùng trong trình soạn bài: song ngữ hai cột (Anh thẳng màu nhấn | Việt nghiêng xám)
import { cn } from "cn";
import type { Bi, LessonStatus } from "@/lib/live/types";

export const INPUT = "w-full rounded-xl border-2 border-line-2 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue disabled:bg-paper disabled:text-ink-2";
export const SELECT = cn(INPUT, "h-10 py-0");

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1 block text-xs font-bold text-ink-2">
      {children}
      {hint && <span className="ml-1 font-normal text-ink-2/70">· {hint}</span>}
    </span>
  );
}

export function TextField({ label, hint, value, onChange, area, rows = 2, className, ...rest }: { label?: string; hint?: string; value: string; onChange: (v: string) => void; area?: boolean; rows?: number; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className={cn("block", className)}>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      {area ? (
        <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} placeholder={rest.placeholder} maxLength={rest.maxLength} className={cn(INPUT, "resize-y")} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} {...rest} />
      )}
    </label>
  );
}

/** Hai cột Anh | Việt. Không dịch máy: GV tự nhập cả hai. */
export function BiField({
  label,
  hint,
  value,
  onChange,
  area,
  rows = 2,
  placeholder,
  className,
}: {
  label?: string;
  hint?: string;
  value: Bi;
  onChange: (v: Bi) => void;
  area?: boolean;
  rows?: number;
  placeholder?: Partial<Bi>;
  className?: string;
}) {
  const field = (lang: keyof Bi) => {
    const props = {
      value: value[lang],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [lang]: e.target.value }),
      placeholder: placeholder?.[lang] ?? (lang === "en" ? "English" : "Tiếng Việt"),
      "aria-label": `${label ?? ""} (${lang === "en" ? "tiếng Anh" : "tiếng Việt"})`,
      lang,
      className: cn(INPUT, lang === "en" ? "font-semibold text-blue-dk" : "text-ink-2 italic", area && "resize-y"),
    };
    return area ? <textarea rows={rows} {...props} /> : <input {...props} />;
  };
  return (
    <div className={className}>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <div className="grid gap-2 sm:grid-cols-2">
        {field("en")}
        {field("vi")}
      </div>
    </div>
  );
}

export function Section({ title, action, children, className }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card-lsn p-4 sm:p-5", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-extrabold">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export const STATUS_META: Record<LessonStatus, { label: string; cls: string }> = {
  draft: { label: "Nháp", cls: "bg-paper text-ink-2 ring-line-2" },
  pending: { label: "Chờ duyệt", cls: "bg-sun-soft text-[#8A5A00] ring-sun/40" },
  approved: { label: "Đã duyệt", cls: "bg-teal-soft text-[#0A6F5F] ring-teal/30" },
};

export function StatusBadge({ status, className }: { status: LessonStatus; className?: string }) {
  const m = STATUS_META[status] ?? STATUS_META.draft;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1", m.cls, className)}>{m.label}</span>;
}
