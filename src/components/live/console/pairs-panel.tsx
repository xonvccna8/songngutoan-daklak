"use client";

// Đợt B — Ghép cặp hỗ trợ (laptop GV): em vững tiếng Anh ↔ em vững kiến thức. GV bấm hai tên để đổi chỗ.
// Lý do ghép (tỉ lệ đúng) chỉ hiện ở đây; tivi và điện thoại chỉ hiện tên bạn cùng cặp.
import { useState } from "react";
import { Shuffle, Users } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { makePairs, swapInPairs, type PairInput } from "@/lib/live/pairing";
import type { Pair } from "@/lib/live/types";

export function PairsPanel({
  pairs,
  showPairs,
  inputs,
  name,
  onSet,
  onToggleTv,
}: {
  pairs: Pair[] | undefined;
  showPairs: boolean | undefined;
  inputs: PairInput[];
  name: (uid: string) => string;
  onSet: (p: Pair[] | null) => void;
  onToggleTv: () => void;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const byUid = new Map(inputs.map((x) => [x.uid, x]));
  const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);
  const tip = (uid: string) => {
    const x = byUid.get(uid);
    return x ? `Ngôn ngữ ${pct(x.lang)} · Toán ${pct(x.sci)}` : "";
  };

  function tap(uid: string) {
    if (!pairs) return;
    if (!pick) return setPick(uid);
    if (pick !== uid) onSet(swapInPairs(pairs, pick, uid));
    setPick(null);
  }

  const chip = (uid: string) => (
    <button
      key={uid}
      onClick={() => tap(uid)}
      title={tip(uid)}
      aria-pressed={pick === uid}
      className={cn("rounded-full border-2 px-2 py-0.5 text-xs font-semibold", pick === uid ? "border-blue bg-blue-soft text-blue-dk" : "border-line bg-white")}
    >
      {name(uid)}
    </button>
  );

  return (
    <section className="card-lsn min-w-0 p-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink-2 uppercase">
        <Users className="size-4" /> Ghép cặp hỗ trợ
      </h3>
      <div className="mb-2 flex flex-wrap gap-2">
        <Button size="xs" onClick={() => onSet(makePairs(inputs))} disabled={inputs.length < 2}>
          <Shuffle /> {pairs?.length ? "Ghép lại" : "Ghép cặp"}
        </Button>
        {!!pairs?.length && (
          <>
            <Button size="xs" variant={showPairs ? "default" : "outline"} onClick={onToggleTv}>
              {showPairs ? "Đang hiện trên tivi" : "Hiện lên tivi"}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => onSet(null)}>
              Xoá cặp
            </Button>
          </>
        )}
      </div>
      {pairs?.length ? (
        <>
          <ol className="space-y-1.5">
            {pairs.map((p, i) => (
              <li key={i} className="flex flex-wrap items-center gap-1.5">
                <b className="w-5 text-xs text-ink-2 tabular-nums">{i + 1}.</b>
                {chip(p.a)}
                {p.b && chip(p.b)}
                {p.c && chip(p.c)}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-ink-2">{pick ? `Bấm một tên nữa để đổi chỗ với ${name(pick)}.` : "Bấm hai tên để đổi chỗ. Rê chuột vào tên để xem lý do ghép."}</p>
        </>
      ) : (
        <p className="text-sm text-ink-2">Ghép em vững tiếng Anh với em vững kiến thức (theo tỉ lệ đúng trong tiết này và các tiết trước). Em chưa có dữ liệu sẽ ghép ngẫu nhiên.</p>
      )}
    </section>
  );
}
