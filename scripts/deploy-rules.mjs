// Đưa rules của Lớp Song Ngữ lên Firestore DÙNG CHUNG mà không đụng rules của app khác.
//   npm run deploy:rules            → ghép & đăng
//   npm run deploy:rules -- --dry   → chỉ kiểm tra biên dịch, không đăng
// Cách làm: tải rules đang chạy → thay (hoặc chèn) đoạn giữa ">>> LOP SONG NGU" và "<<< LOP SONG NGU"
// → Firebase biên dịch thử → đăng. Bản cũ được lưu ở rules-backup/ để khôi phục khi cần.
// Cần đã đăng nhập Firebase CLI (npx firebase login) bằng tài khoản có quyền trên project.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

if (process.env.NODE_ENV !== "test") {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}
const PROJECT = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DRY = process.argv.includes("--dry");
const START = "// >>> LOP SONG NGU";
const END = "// <<< LOP SONG NGU";

const local = readFileSync("firestore.rules", "utf8");
const block = local.slice(local.indexOf(START), local.indexOf(END) + END.length);
if (!block.startsWith(START)) throw new Error("firestore.rules thiếu dấu >>> / <<< LOP SONG NGU");

// Token từ phiên Firebase CLI
const cfg = JSON.parse(readFileSync(join(homedir(), ".config", "configstore", "firebase-tools.json"), "utf8"));
const tok = await (
  await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: cfg.tokens.refresh_token,
      // client công khai của Firebase CLI
      client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
    }),
  })
).json();
if (!tok.access_token) throw new Error("Chưa đăng nhập Firebase CLI: chạy npx firebase login");
const H = { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT };
async function call(method, url, body) {
  const r = await fetch(url, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${j.error?.message ?? ""}`);
  return j;
}

const API = "https://firebaserules.googleapis.com/v1";
const rel = await call("GET", `${API}/projects/${PROJECT}/releases/cloud.firestore`);
const rs = await call("GET", `${API}/${rel.rulesetName}`);
const file = rs.source.files[0];
const live = file.content;

mkdirSync("rules-backup", { recursive: true });
const backup = `rules-backup/firestore-${new Date().toISOString().replace(/[:.]/g, "-")}.rules`;
writeFileSync(backup, live, "utf8");

let merged;
if (live.includes(START) && live.includes(END)) {
  merged = live.slice(0, live.indexOf(START)) + block + live.slice(live.indexOf(END) + END.length);
} else {
  const anchor = live.match(/match\s+\/databases\/\{database\}\/documents\s*\{\s*\n/);
  if (!anchor) throw new Error("Không tìm thấy 'match /databases/{database}/documents {' trong rules đang chạy");
  const at = anchor.index + anchor[0].length;
  merged = live.slice(0, at) + "\n    " + block + "\n\n" + live.slice(at);
}
if (merged === live) {
  console.log("✔ Rules đã là bản mới nhất, không cần đăng.");
  process.exit(0);
}

// Biên dịch thử (lỗi cú pháp → dừng, không đăng)
const test = await call("POST", `${API}/projects/${PROJECT}:test`, { source: { files: [{ name: file.name, content: merged }] } });
const errors = (test.issues ?? []).filter((i) => i.severity === "ERROR");
if (errors.length) {
  errors.forEach((i) => console.log(`✘ dòng ${i.sourcePosition?.line}: ${i.description}`));
  process.exit(1);
}
console.log(`✔ Biên dịch OK (${live.split("\n").length} → ${merged.split("\n").length} dòng). Bản cũ: ${backup}`);
if (DRY) process.exit(0);

const created = await call("POST", `${API}/projects/${PROJECT}/rulesets`, { source: { files: [{ name: file.name, content: merged }] } });
await call("PATCH", `${API}/projects/${PROJECT}/releases/cloud.firestore`, {
  release: { name: `projects/${PROJECT}/releases/cloud.firestore`, rulesetName: created.name },
});
console.log("✔ Đã đăng rules mới (rules của các app khác giữ nguyên).");
