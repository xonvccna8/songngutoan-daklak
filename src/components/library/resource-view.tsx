"use client";

// Hiển thị một học liệu: GeoGebra / YouTube nhúng ngay trên trang; loại khác mở tab mới
import { Box, ExternalLink, FileText, FlaskConical, Globe, PlayCircle, Shapes } from "lucide-react";
import { RESOURCE_KINDS, embedUrl, type ResourceDoc, type ResourceKind } from "@/lib/library/resources";

export const RESOURCE_ICON: Record<ResourceKind, React.ComponentType<{ className?: string }>> = {
  geogebra: Shapes,
  video: PlayCircle,
  simulation: FlaskConical,
  model3d: Box,
  worksheet: FileText,
  web: Globe,
};

export function ResourceView({ r, embed = true }: { r: ResourceDoc; embed?: boolean }) {
  const src = embed ? embedUrl(r) : null;
  const I = RESOURCE_ICON[r.kind];
  return (
    <div className="card-lsn overflow-hidden">
      {src && (
        <div className="relative aspect-video w-full bg-paper">
          <iframe src={src} title={r.title.vi} className="absolute inset-0 size-full" allow="fullscreen; encrypted-media" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      )}
      <div className="flex items-center gap-3 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue-dk">
          <I className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate">{r.title.vi}</b>
          {r.title.en && <span className="text-en block truncate text-sm">{r.title.en}</span>}
          <span className="block text-xs text-ink-2">{RESOURCE_KINDS[r.kind].vi}{r.note ? ` · ${r.note}` : ""}</span>
        </span>
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-line text-ink-2 hover:text-blue" aria-label="Mở trong tab mới" title="Mở trong tab mới">
          <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}
