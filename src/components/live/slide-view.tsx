// Hiển thị một trang bài học — dùng chung cho tivi (variant="tv", cỡ chữ theo cqw) và điện thoại.
// Song ngữ: tiếng Anh chữ thẳng sáng, tiếng Việt nghiêng mờ; chế độ "vi" thì tiếng Việt thành chữ chính.
import { cn } from "cn";
import { Figure } from "@/components/live/figures";
import type { Bi, Block, Lang, Slide } from "@/lib/live/types";

export type Variant = "tv" | "phone";

/** Biến màu cho bảng (dùng trong SVG và chữ) */
export const BOARD_VARS = {
  "--chalk": "#F1FBF5",
  "--chalk-dim": "#9CC7B3",
  "--hi": "#FFC93C",
  "--board-2": "#163F33",
} as React.CSSProperties;

export function BiText({ text, lang, keep, className, viClass }: { text: Bi; lang: Lang; keep?: boolean; className?: string; viClass?: string }) {
  const showEn = lang !== "vi" || keep;
  const showVi = lang !== "en";
  return (
    <span className={cn("block", className)}>
      {showEn && <span className="block">{text.en}</span>}
      {showVi && (
        <span className={cn("block", lang === "vi" && !keep ? "not-italic text-[var(--chalk)]" : "text-[0.74em] leading-snug italic text-[var(--chalk-dim)]", viClass)}>
          {text.vi}
        </span>
      )}
    </span>
  );
}

interface Ctx {
  step: number;
  lang: Lang;
  v: Variant;
  /** Phone: bỏ hẳn khối chưa tới bước (tivi thì mờ dần) */
  join?: { code: string; host: string };
}

/** Khối hiện dần theo bước */
function Reveal({ s, c, children, className }: { s: number; c: Ctx; children: React.ReactNode; className?: string }) {
  const on = c.step >= s;
  if (c.v === "phone" && !on) return null;
  return (
    <div className={cn("transition-all duration-500 motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-[0.5em] opacity-0", className)}>
      {children}
    </div>
  );
}

const T = (c: Ctx, tv: string, phone: string) => (c.v === "tv" ? tv : phone);

function BlockView({ b, c }: { b: Block; c: Ctx }) {
  switch (b.kind) {
    case "cols":
      return (
        <div className={cn("grid items-center", T(c, "grid-cols-2 gap-[2cqw]", "grid-cols-1 gap-3"))}>
          <div className="flex min-w-0 flex-col gap-[1cqw]">
            {b.left.map((x, i) => (
              <BlockView key={i} b={x} c={c} />
            ))}
          </div>
          <div className={cn("flex min-w-0 flex-col", T(c, "gap-[1cqw]", "gap-3"))}>
            {b.right.map((x, i) => (
              <BlockView key={i} b={x} c={c} />
            ))}
          </div>
        </div>
      );
    case "hero":
      return (
        <Reveal s={b.step} c={c}>
          <BiText text={b.text} lang={c.lang} className={cn("font-bold tracking-tight", T(c, "text-[5.4cqw] leading-[1.05]", "text-[28px] leading-tight"))} viClass={T(c, "text-[2.4cqw]!", "text-[15px]!")} />
        </Reveal>
      );
    case "join":
      return (
        <Reveal s={b.step} c={c}>
          {c.v === "tv" ? (
            <div className="flex items-center gap-[2cqw]">
              <div>
                <small className="block font-sans text-[1.25cqw] text-[var(--chalk-dim)]">Mã lớp · Class code</small>
                <div className="text-[4.4cqw] font-bold tracking-[0.12em] text-[var(--hi)]">{c.join?.code ?? "——"}</div>
              </div>
              <small className="block font-sans text-[1.3cqw] leading-snug text-[var(--chalk-dim)]">
                Vào <b className="text-[var(--chalk)]">{c.join?.host ?? ""}/s/login</b>, nhập mã lớp và PIN.
                <br />
                Open the class page on your phone and log in.
              </small>
            </div>
          ) : (
            <p className="rounded-xl border border-white/15 px-3 py-2 font-sans text-[13px] text-[var(--chalk-dim)]">Em đã vào lớp. Cùng nhìn lên tivi nhé!</p>
          )}
        </Reveal>
      );
    case "goals":
      return (
        <Reveal s={b.step} c={c}>
          <ul className={cn("flex flex-col", T(c, "gap-[0.9cqw]", "gap-2"))}>
            {b.items.map((it, i) => (
              <li key={i} className={cn("grid items-start", T(c, "grid-cols-[2.2cqw_1fr] gap-[1cqw]", "grid-cols-[16px_1fr] gap-2"))}>
                <span className={cn("rounded-[0.3em] border-[var(--hi)]", T(c, "mt-[0.45cqw] size-[1.3cqw] border-[0.22cqw]", "mt-1 size-3 border-2"))} />
                <BiText text={it} lang={c.lang} />
              </li>
            ))}
          </ul>
        </Reveal>
      );
    case "steps":
      return (
        <ol className={cn("flex flex-col", T(c, "gap-[1cqw]", "gap-2"))}>
          {b.items.map((it, i) => (
            <li key={i}>
              <Reveal s={it.step} c={c} className={cn("grid", T(c, "grid-cols-[2.6cqw_1fr] gap-[1cqw]", "grid-cols-[24px_1fr] gap-2"))}>
                <span className={cn("grid place-items-center rounded-full bg-[var(--hi)] font-semibold text-ink", T(c, "mt-[0.2cqw] size-[2.3cqw] text-[1.3cqw]", "size-[22px] text-xs"))}>{i + 1}</span>
                <BiText text={it.text} lang={c.lang} />
              </Reveal>
            </li>
          ))}
        </ol>
      );
    case "text":
      return (
        <Reveal s={b.step} c={c}>
          <BiText text={b.text} lang={c.lang} keep={b.keep} className={b.text.en.length > 120 ? "text-[0.82em] leading-[1.45]" : undefined} />
        </Reveal>
      );
    case "say":
      return (
        <Reveal s={b.step} c={c}>
          <BiText text={b.text} lang={c.lang} keep className={cn("font-semibold", T(c, "text-[2.9cqw] leading-tight", "text-lg leading-snug"))} />
        </Reveal>
      );
    case "ipa":
      return (
        <Reveal s={b.step} c={c}>
          <div>
            {b.items.map((it, i) => (
              <span key={i}>
                {i > 0 && " · "}
                {it.word} <span className="font-sans text-[0.7em] text-[var(--hi)]">{it.ipa}</span>
              </span>
            ))}
          </div>
        </Reveal>
      );
    case "box":
      return (
        <Reveal s={b.step} c={c}>
          <div
            className={cn(
              "border",
              T(c, "rounded-[1cqw] px-[1.4cqw] py-[1cqw]", "rounded-xl px-3 py-2.5"),
              b.highlight ? "border-[var(--hi)] bg-[rgba(255,201,60,.08)]" : "border-white/15 bg-white/[.04]"
            )}
          >
            {b.tag && <span className="mb-[0.2em] block font-sans text-[0.55em] font-semibold tracking-[0.12em] text-[var(--hi)] uppercase">{b.tag}</span>}
            <BiText text={b.text} lang={c.lang} />
          </div>
        </Reveal>
      );
    case "figure":
      return (
        <Reveal s={b.step} c={c}>
          <Figure id={b.figure} step={c.step} lang={c.lang} labels={b.labels} className={cn("block w-full", T(c, "max-h-[21cqw]", "max-h-56"))} />
        </Reveal>
      );
  }
}

export function SlideView({ slide, step, lang, variant, join, className }: { slide: Slide; step: number; lang: Lang; variant: Variant; join?: Ctx["join"]; className?: string }) {
  const c: Ctx = { step, lang, v: variant, join };
  return (
    <div className={cn("flex min-h-0 flex-col", T(c, "gap-[1.1cqw]", "gap-3"), className)}>
      <BiText
        text={slide.title}
        lang={lang}
        className={cn("font-semibold text-balance", T(c, "text-[2.9cqw] leading-[1.15]", "text-[19px] leading-tight"))}
        viClass={T(c, "text-[1.6cqw]!", "text-[13px]!")}
      />
      <div className={cn("flex min-h-0 flex-col", T(c, "gap-[1cqw] text-[2.05cqw] leading-[1.35]", "gap-2.5 text-[15px] leading-snug"))}>
        {slide.blocks.map((b, i) => (
          <BlockView key={i} b={b} c={c} />
        ))}
        {/* Trang câu hỏi GV soạn không có khối nội dung → hiện đề bài */}
        {slide.blocks.length === 0 && (slide.question || slide.speak) && (
          <BiText text={slide.question?.prompt ?? { en: slide.speak!.target, vi: "" }} lang={lang} keep={!slide.question} className="font-semibold" />
        )}
      </div>
    </div>
  );
}
