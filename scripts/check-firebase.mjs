// Kiểm tra kết nối Firebase Admin: npm run check
//   npm run check -- --email=ten@gmail.com   → xem tài khoản này đã có chưa, vai trò gì
import { existsSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const ok = (m) => console.log("✔ " + m);
const bad = (m, e) => console.log("✘ " + m + ": " + String(e?.message ?? e).split("\n")[0]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

// Quyền IAM mới cấp có thể mất ~1 phút để có hiệu lực → thử lại vài lần
async function retry(label, fn) {
  for (let i = 0; i < 6; i++) {
    try {
      return ok(label + (await fn()));
    } catch (e) {
      if (i === 5) return bad(label, e);
      await sleep(10_000);
    }
  }
}

await retry("Firebase Auth (quản trị)", async () => (await getAuth(app).listUsers(1), ""));
await retry("Tạo token đăng nhập học sinh", async () => (await getAuth(app).createCustomToken("st_check", { lsnRole: "student" }), ""));
await retry("Firestore", async () => ` (${(await getFirestore(app).listCollections()).length} bộ sưu tập)`);

const email = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1];
if (email) {
  try {
    const u = await getAuth(app).getUserByEmail(email);
    ok(`${email}: vai trò Lớp Song Ngữ ${u.customClaims?.lsnRole ?? "chưa có"}, đăng nhập bằng ${u.providerData.map((p) => p.providerId).join(", ")}`);
  } catch {
    console.log(`  ${email}: chưa có tài khoản`);
  }
}
process.exit(0);
