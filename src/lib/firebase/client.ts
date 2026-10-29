"use client";

// Firebase phía trình duyệt. Khởi tạo lười (chỉ khi gọi) để không chạy lúc render trên máy chủ.
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.authDomain);
}

let _db: Firestore | null = null;

export function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Chưa cấu hình Firebase: hãy điền .env.local (xem .env.example).");
  }
  return getApps()[0] ?? initializeApp(config);
}

export function auth(): Auth {
  return getAuth(firebaseApp());
}

export function db(): Firestore {
  if (_db) return _db;
  const app = firebaseApp();
  try {
    // Bộ nhớ đệm trên máy: Wi-Fi yếu vẫn xem được dữ liệu đã tải
    _db = initializeFirestore(app, {
      // Bỏ qua trường undefined thay vì báo lỗi (vd. đáp án không có ở câu gõ chữ)
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    _db = getFirestore(app);
  }
  return _db;
}
