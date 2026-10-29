// Gọi sau khi GV/quản trị đăng nhập: tạo hồ sơ lsn_users/{uid}.
// Email trong ADMIN_EMAILS được cấp quyền quản trị lần đầu (Google/đã xác minh; hoặc khi trường chưa có quản trị).
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { handle, ok, requireAuth } from "@/lib/server/api";
import { setLsnClaims } from "@/lib/server/claims";

export const POST = handle(async (req: Request) => {
  const user = await requireAuth(req);
  if (user.role === "student") return ok({ role: "student", changed: false });

  const db = adminDb();
  const ref = db.collection(COL.users).doc(user.uid);
  const snap = await ref.get();
  const displayName = user.name || user.email?.split("@")[0] || "Giáo viên";

  if (!snap.exists) {
    await ref.set({
      role: user.role ?? "pending",
      displayName,
      email: user.email ?? null,
      schoolId: user.schoolId ?? null,
      classIds: [],
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const schoolId = process.env.DEFAULT_SCHOOL_ID || "thcs-mau";
  const listed = !!user.email && adminEmails.includes(user.email.toLowerCase());
  const verified = user.emailVerified || user.signInProvider === "google.com";
  // Email chưa xác minh (đăng ký bằng mật khẩu) chỉ được lên quản trị khi trường CHƯA có quản trị nào
  const noAdminYet =
    listed && !verified
      ? (await db.collection(COL.users).where("schoolId", "==", schoolId).where("role", "==", "admin").limit(1).get()).empty
      : false;
  const isBootstrapAdmin = listed && (verified || noAdminYet);

  if (!user.role && isBootstrapAdmin) {
    await db
      .collection(COL.schools)
      .doc(schoolId)
      .set({ name: process.env.DEFAULT_SCHOOL_NAME || "THCS Mẫu" }, { merge: true });
    await setLsnClaims(user.uid, { role: "admin", schoolId, classIds: [] });
    await ref.set({ role: "admin", schoolId }, { merge: true });
    return ok({ role: "admin", changed: true });
  }

  return ok({ role: user.role ?? "pending", changed: false });
});
