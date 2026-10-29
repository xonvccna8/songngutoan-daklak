"use client";

// Hình học động · mô phỏng Toán: PhET + GeoGebra dựng sẵn (src/lib/lab/sims.ts) + mô phỏng / mô hình 3D do GV thêm (đã duyệt).
// Dùng chung cho GV (trang Học liệu số, chiếu lên tivi) và HS (trang /s/lab trên điện thoại).
import { useRef, useState } from "react";
import { ArrowLeft, Box, ExternalLink, Maximize2, Search, Shapes } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { INPUT } from "@/components/lessons/fields";
import { SayButtons } from "@/components/library/say";
import { LAB_SIMS, LAB_TOPICS, SIM_SOURCE, isBuiltInSim, searchSims, simLaunchUrl, type LabSim, type LabTopic } from "@/lib/lab/sims";
import { RESOURCE_KINDS, embedUrl, phetSlug, simSource, type ResourceDoc } from "@/lib/library/resources";
import { curLesson } from "@/lib/curriculum";

type Open = { sim: LabSim } | { res: ResourceDoc };

const chip = (on: boolean) => cn("h-8 rounded-full border-2 px-3 text-xs font-bold whitespace-nowrap", on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink/30");

export function LabBrowser({ grade, resources, compact = false }: { grade: number | null; resources: ResourceDoc[]; compact?: boolean }) {
  const [topic, setTopic] = useState<LabTopic | "">("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Open | null>(null);
  const sims = searchSims({ grade, topic, q });
  // Chỉ hiện các mạch có mô phỏng cho khối đang chọn
  const topics = (Object.keys(LAB_TOPICS) as LabTopic[]).filter((t) => LAB_SIMS.some((s) => s.topic === t && (!grade || s.grades.includes(grade))));
  // Học liệu thầy cô / kho thêm (bỏ cái trùng với mô phỏng dựng sẵn bên dưới)
  const extra = resources.filter((r) => (r.kind === "simulation" || r.kind === "model3d") && !isBuiltInSim(r.url) && (!grade || r.grade === grade));

  if (open) return <LabViewer open={open} onBack={() => setOpen(null)} compact={compact} />;

  return (
    <div className="flex flex-col gap-4">
      <label className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mô phỏng: phân số, đồ thị, tam giác, xác suất…" className={`${INPUT} h-11 pl-9`} />
      </label>
      <div className="flex flex-wrap gap-1.5">
        <button className={chip(!topic)} onClick={() => setTopic("")}>
          Tất cả
        </button>
        {topics.map((t) => (
          <button key={t} className={chip(topic === t)} onClick={() => setTopic(t)}>
            {LAB_TOPICS[t].vi}
          </button>
        ))}
      </div>

      {extra.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-extrabold text-ink-2">Thầy cô thêm cho lớp</h3>
          <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {extra.map((r) => {
              const I = r.kind === "model3d" ? Box : Shapes;
              const l = curLesson(r.curLessonId);
              return (
                <button key={r.id} onClick={() => setOpen({ res: r })} className="card-lsn hover-glow flex items-start gap-3 p-4 text-left">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk">
                    <I className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <b className="block">{r.title.vi}</b>
                    {r.title.en && <span className="text-en block text-sm">{r.title.en}</span>}
                    <span className="block text-xs text-ink-2">
                      {RESOURCE_KINDS[r.kind].vi} · Lớp {r.grade}
                      {l ? ` · Bài ${l.no}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {sims.length === 0 ? (
        <EmptyState title="Chưa có mô phỏng phù hợp">Thử bỏ bộ lọc hoặc đổi từ khoá tìm.</EmptyState>
      ) : (
        <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3")}>
          {sims.map((s) => {
            const t = LAB_TOPICS[s.topic];
            return (
              <button key={s.slug} onClick={() => setOpen({ sim: s })} className="card-lsn hover-glow flex items-start gap-3 p-4 text-left">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: t.soft, color: t.color }}>
                  <Shapes className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: t.color }}>
                    {t.vi}
                    {s.source === "geogebra" ? " · GeoGebra" : ""}
                  </span>
                  <b className="block leading-snug">{s.title.vi}</b>
                  <span className="text-en block text-sm">{s.title.en}</span>
                  <span className="mt-1 block text-xs text-ink-2">{s.about.vi}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <p className="text-xs text-ink-2">
        Nguồn: PhET Interactive Simulations (ĐH Colorado Boulder, CC-BY 4.0) · GeoGebra · mô hình 3D trên Sketchfab (ghi tên tác giả ở từng mô hình). Cần có mạng Internet.
      </p>
    </div>
  );
}

function LabViewer({ open, onBack, compact }: { open: Open; onBack: () => void; compact: boolean }) {
  const [locale, setLocale] = useState<"en" | "vi">("en");
  const box = useRef<HTMLDivElement>(null);
  const sim = "sim" in open ? open.sim : null;
  const res = "res" in open ? open.res : null;
  const src = sim ? simLaunchUrl(sim, locale) : embedUrl(res!, locale);
  // PhET và GeoGebra đổi được giao diện Anh / Việt
  const canSwitch = (!!sim && (!sim.url || sim.source === "geogebra")) || (res?.kind === "simulation" && !!phetSlug(res.url));
  const netlogo = res?.kind === "simulation" && simSource(res.url) === "netlogo";
  const title = sim?.title ?? res!.title;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft /> Danh sách
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-extrabold">{title.vi}</h2>
          {title.en && <p className="text-en truncate text-sm font-semibold">{title.en}</p>}
        </div>
        {canSwitch && (
          <div className="inline-flex rounded-xl bg-white p-1 ring-2 ring-line" role="tablist" aria-label="Ngôn ngữ mô phỏng">
            {(["en", "vi"] as const).map((l) => (
              <button key={l} role="tab" aria-selected={locale === l} onClick={() => setLocale(l)} className={cn("h-8 rounded-lg px-3 text-xs font-bold", locale === l ? "bg-ink text-white" : "text-ink-2")}>
                {l === "en" ? "English" : "Tiếng Việt"}
              </button>
            ))}
          </div>
        )}
        <Button variant="ghost" size="icon-sm" aria-label="Toàn màn hình" title="Toàn màn hình (chiếu lên tivi)" onClick={() => box.current?.requestFullscreen?.().catch(() => undefined)}>
          <Maximize2 />
        </Button>
        {src && (
          <a href={src} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-xl text-ink-2 hover:bg-ink/5" aria-label="Mở trong tab mới" title="Mở trong tab mới">
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>

      <div ref={box} className={cn("relative w-full overflow-hidden rounded-2xl bg-ink-tv ring-2 ring-line", compact ? "aspect-[4/3]" : "aspect-video")}>
        {src ? (
          <iframe key={src} src={src} title={title.vi} className="absolute inset-0 size-full bg-white" allow="fullscreen; xr-spatial-tracking" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/70">Không nhúng được học liệu này — bấm “Mở trong tab mới”.</p>
        )}
      </div>
      {canSwitch && <p className="-mt-2 text-xs text-ink-2">Mẹo song ngữ: làm bằng giao diện tiếng Anh, khi chưa hiểu thì đổi sang tiếng Việt. Mô phỏng chưa được dịch sẽ tự hiện tiếng Anh.</p>}
      {netlogo && (
        <p className="-mt-2 text-xs text-ink-2">
          Mô hình NetLogo (giao diện tiếng Anh): bấm <b>setup</b> rồi <b>go</b> để chạy; kéo thanh trượt để đổi điều kiện; xem đồ thị bên dưới mô hình. Trên điện thoại nên xoay ngang.
        </p>
      )}
      {sim?.source && sim.source !== "phet" && <p className="-mt-2 text-xs text-ink-2">Nguồn: {SIM_SOURCE[sim.source]}</p>}

      {sim && (
        <div className={cn("grid gap-4", !compact && "lg:grid-cols-[1.4fr_1fr]")}>
          <section className="card-lsn p-4">
            <h3 className="font-extrabold">
              Nhiệm vụ <span className="text-en text-sm font-semibold">· Tasks</span>
            </h3>
            <ol className="mt-2 space-y-3">
              {sim.tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-soft font-display text-sm font-extrabold text-blue-dk">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="text-en block font-semibold">{t.en}</span>
                    <span className="text-vi block text-sm">{t.vi}</span>
                  </span>
                  <SayButtons text={t.en} />
                </li>
              ))}
            </ol>
          </section>
          <section className="card-lsn p-4">
            <h3 className="font-extrabold">
              Từ vựng <span className="text-en text-sm font-semibold">· Key words</span>
            </h3>
            <ul className="mt-2 divide-y divide-line">
              {sim.vocab.map((v) => (
                <li key={v.en} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="text-en block font-semibold">{v.en}</span>
                    <span className="text-vi block text-sm">{v.vi}</span>
                  </span>
                  <SayButtons text={v.en} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {res?.note && <p className="card-lsn p-4 text-sm text-ink-2">{res.note}</p>}
    </div>
  );
}
