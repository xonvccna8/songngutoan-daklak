// Kiểm tra lại mọi link trong kho học liệu Toán 6–9: npx tsx scripts/check-kho-links.mts
// Video YouTube: hỏi oEmbed (còn tồn tại + tên kênh). Trang web: mở được (mã 2xx).
const { KHO_COMMON, KHO_TOAN } = await import("../src/lib/library/kho-toan");

const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36" };
const list = [...KHO_COMMON.map((r) => ({ l: "chung", r })), ...KHO_TOAN.flatMap((l) => l.resources.map((r) => ({ l: l.curLessonId, r })))];
let bad = 0;
await Promise.all(
  list.map(async ({ l, r }) => {
    let line = "";
    try {
      if (r.kind === "video") {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(r.url)}&format=json`, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(String(res.status));
        const j = (await res.json()) as { author_name: string; title: string };
        line = `OK  ${l}  [${j.author_name}] ${j.title}`;
      } else {
        const res = await fetch(r.url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(25_000) });
        if (!res.ok) throw new Error(String(res.status));
        line = `OK  ${l}  ${r.url}`;
      }
    } catch (e) {
      bad++;
      line = `LỖI ${l}  ${r.url}  (${(e as Error).message})`;
    }
    console.log(line);
  })
);
console.log(`\n${list.length - bad}/${list.length} link hoạt động`);
process.exit(bad ? 1 : 0);
