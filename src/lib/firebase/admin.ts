// Firebase Admin — chỉ chạy trong API route trên Vercel (gói Spark, không cần Cloud Functions)
// và trong script seed. KHÔNG import file này từ component phía trình duyệt.
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel/.env lưu xuống dòng dạng "\n" — đổi lại thành xuống dòng thật
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: projectId || "demo-lsn" });
  }
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Thiếu khoá Firebase Admin (FIREBASE_ADMIN_*) trong .env.local hoặc biến môi trường Vercel.");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
