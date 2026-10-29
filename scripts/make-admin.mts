// Cấp quyền cho một tài khoản đã đăng nhập ít nhất 1 lần (chỉ quyền Lớp Song Ngữ, giữ claims app khác)
//   npm run make-admin -- --email=ten@gmail.com              → quản trị
//   npm run make-admin -- --email=ten@gmail.com --role=teacher → giáo viên
import { existsSync } from "node:fs";
import { FieldValue } from "firebase-admin/firestore";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { adminAuth, adminDb } = await import("../src/lib/firebase/admin");
const { COL } = await import("../src/lib/namespace");
const { setLsnClaims } = await import("../src/lib/server/claims");

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const email = arg("email");
const role = (arg("role") ?? "admin") as "admin" | "teacher";
const schoolId = process.env.DEFAULT_SCHOOL_ID || "thcs-mau";

try {
  if (!email || !["admin", "teacher"].includes(role)) throw new Error("Cách dùng: npm run make-admin -- --email=ten@gmail.com [--role=teacher]");
  const u = await adminAuth().getUserByEmail(email).catch(() => {
    throw new Error(`${email} chưa có tài khoản — hãy đăng nhập/tạo tài khoản trên web trước.`);
  });
  const db = adminDb();
  await db.collection(COL.schools).doc(schoolId).set({ name: process.env.DEFAULT_SCHOOL_NAME || "THCS Mẫu" }, { merge: true });
  await setLsnClaims(u.uid, { role, schoolId, classIds: [] });
  await db.collection(COL.users).doc(u.uid).set(
    {
      role,
      schoolId,
      displayName: u.displayName || email.split("@")[0],
      email,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await adminAuth().revokeRefreshTokens(u.uid);
  console.log(`✔ ${email} → ${role === "admin" ? "Quản trị" : "Giáo viên"} (trường ${schoolId}). Đăng xuất rồi đăng nhập lại để có hiệu lực.`);
  process.exit(0);
} catch (e) {
  console.error("✘ " + (e instanceof Error ? e.message : e));
  process.exit(1);
}
