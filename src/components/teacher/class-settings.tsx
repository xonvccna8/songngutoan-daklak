"use client";

// Cài đặt lớp: tên, khối, số tổ, ngưỡng trạng thái, giờ yên lặng, giới hạn tin "Chú ý"; xoá lớp
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, Gauge, Loader2, Save, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/confirm-dialog";
import { FIELD } from "@/components/teacher/create-class-dialog";
import { api, errorMessage } from "@/lib/api-client";
import { DEFAULT_CLASS_SETTINGS, type ClassDoc, type ClassSettings } from "@/lib/types";
import { GRADES } from "@/lib/curriculum";

export function ClassSettingsForm({ cls }: { cls: ClassDoc }) {
  const router = useRouter();
  const [confirmEl, confirm] = useConfirm();
  const [name, setName] = useState(cls.name);
  const [grade, setGrade] = useState(cls.grade);
  const [s, setS] = useState<ClassSettings>({ ...DEFAULT_CLASS_SETTINGS, ...cls.settings });
  const [busy, setBusy] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (s.teams < (cls.settings?.teams ?? 4)) {
      const ok = await confirm({
        title: `Giảm còn ${s.teams} tổ?`,
        description: "Các em ở tổ bị bỏ sẽ được chuyển sang các tổ còn lại.",
        confirmText: "Lưu",
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await api(`/api/classes/${cls.id}`, { method: "PATCH", body: { name, grade, settings: s } });
      toast.success("Đã lưu cài đặt lớp.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeClass() {
    const ok = await confirm({
      title: `Xoá lớp ${cls.name}?`,
      description: `Toàn bộ ${cls.studentCount ?? 0} học sinh và mã PIN của lớp sẽ bị xoá vĩnh viễn.`,
      confirmText: "Xoá vĩnh viễn",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/classes/${cls.id}`, { method: "DELETE" });
      toast.success(`Đã xoá lớp ${cls.name}.`);
      router.replace("/teacher");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
      <Section icon={Users} title="Thông tin lớp">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tên lớp">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={FIELD} />
          </Field>
          <Field label="Khối">
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className={`${FIELD} w-full`}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Khối {g}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Số tổ" hint="Dùng cho thi đua theo tổ và gửi tin theo tổ.">
          <select value={s.teams} onChange={(e) => setS({ ...s, teams: Number(e.target.value) })} className={`${FIELD} w-full`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} tổ
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section icon={Gauge} title="Ngưỡng trạng thái học (7 ngày)">
        <Field label="Tích cực khi học ít nhất" hint="và không trễ bài nào.">
          <NumberWithUnit value={s.thresholds.activeDays} min={1} max={7} unit="ngày" onChange={(v) => setS({ ...s, thresholds: { ...s.thresholds, activeDays: v } })} />
        </Field>
        <Field label="Chưa học khi trễ từ" hint="hoặc không học ngày nào. Ở giữa là “Cần nhắc”.">
          <NumberWithUnit value={s.thresholds.inactiveLate} min={1} max={10} unit="bài" onChange={(v) => setS({ ...s, thresholds: { ...s.thresholds, inactiveLate: v } })} />
        </Field>
      </Section>

      <Section icon={BellOff} title="Thông báo">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Giờ yên lặng từ">
            <Input type="time" value={s.quietHours.start} onChange={(e) => setS({ ...s, quietHours: { ...s.quietHours, start: e.target.value } })} className={FIELD} />
          </Field>
          <Field label="đến">
            <Input type="time" value={s.quietHours.end} onChange={(e) => setS({ ...s, quietHours: { ...s.quietHours, end: e.target.value } })} className={FIELD} />
          </Field>
        </div>
        <Field label="Tin “Chú ý” tối đa cho mỗi em / tiết">
          <NumberWithUnit value={s.maxAttention} min={1} max={10} unit="tin" onChange={(v) => setS({ ...s, maxAttention: v })} />
        </Field>
      </Section>

      <Section icon={Sparkles} title="Trợ lý học tập AI">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 size-5" checked={s.aiTutor !== false} onChange={(e) => setS({ ...s, aiTutor: e.target.checked })} />
          <span>
            <b>Cho học sinh lớp này hỏi Trợ lý AI</b>
            <span className="block text-ink-2">
              Trợ lý chỉ gợi mở, không làm bài hộ; có lọc nội dung; tối đa 30 câu hỏi/em/ngày. Thầy cô xem nhật kí trò chuyện ở mục “Trợ lý AI”.
            </span>
          </span>
        </label>
      </Section>

      <section className="card-lsn flex flex-col justify-between gap-4 border-coral/30 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-coral-dk">
            <Trash2 className="size-5" /> Xoá lớp
          </h3>
          <p className="mt-1 text-sm text-ink-2">
            Gõ <b className="text-ink">{cls.name}</b> để xác nhận xoá lớp và toàn bộ học sinh.
          </p>
          <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={cls.name} className={`${FIELD} mt-3`} />
        </div>
        <Button type="button" variant="destructive" disabled={confirmName.trim() !== cls.name} onClick={removeClass}>
          <Trash2 /> Xoá lớp
        </Button>
      </section>

      <div className="sticky bottom-4 lg:col-span-2">
        <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
          {busy ? <Loader2 className="animate-spin" /> : <Save />} Lưu cài đặt
        </Button>
      </div>
      {confirmEl}
    </form>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="card-lsn space-y-4 p-5">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <Icon className="size-5 text-blue" /> {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

function NumberWithUnit({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Giảm">
        −
      </Button>
      <span className="w-20 text-center font-display text-xl font-extrabold">
        {value} <span className="text-sm font-semibold text-ink-2">{unit}</span>
      </span>
      <Button type="button" variant="outline" size="icon" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Tăng">
        +
      </Button>
    </div>
  );
}
