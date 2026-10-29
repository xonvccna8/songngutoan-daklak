// Tạo chỉ mục Firestore của Lớp Song Ngữ theo kiểu CHỈ THÊM (không xoá chỉ mục của app khác).
//   npm run indexes
// KHÔNG dùng "firebase deploy --only firestore:indexes" — project dùng chung, lệnh đó có thể xoá chỉ mục app khác.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

try {
  process.loadEnvFile(".env.local");
} catch {}
const PROJECT = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const cfg = JSON.parse(readFileSync(join(homedir(), ".config", "configstore", "firebase-tools.json"), "utf8"));
const tok = await (
  await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: cfg.tokens.refresh_token,
      client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
    }),
  })
).json();
if (!tok.access_token) throw new Error("Chưa đăng nhập Firebase CLI: chạy npx firebase login");
const H = { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT };

const { indexes } = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
const sig = (fields) => fields.map((f) => `${f.fieldPath}:${f.order ?? f.arrayConfig}`).join(",");

for (const ix of indexes) {
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/collectionGroups/${ix.collectionGroup}/indexes`;
  // API có thể trả lẫn chỉ mục của bộ sưu tập khác → lọc theo tên chỉ mục
  const existing = ((await (await fetch(base, { headers: H })).json()).indexes ?? []).filter((e) => e.name?.includes(`/collectionGroups/${ix.collectionGroup}/`));
  const want = sig(ix.fields);
  const found = existing.find((e) => e.queryScope === ix.queryScope && sig(e.fields.filter((f) => f.fieldPath !== "__name__")) === want);
  if (found) {
    console.log(`✔ Đã có: ${ix.collectionGroup} (${want}) — trạng thái ${found.state}`);
    continue;
  }
  const r = await fetch(base, { method: "POST", headers: H, body: JSON.stringify({ queryScope: ix.queryScope, fields: ix.fields }) });
  const j = await r.json();
  console.log(r.ok ? `✔ Đang tạo: ${ix.collectionGroup} (${want}) — mất vài phút` : `✘ ${ix.collectionGroup}: ${j.error?.message}`);
}
