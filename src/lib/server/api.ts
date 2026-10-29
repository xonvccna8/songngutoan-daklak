// Tiện ích cho API route: xác thực token, kiểm quyền, trả lỗi tiếng Việt
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COL, readClaims } from "@/lib/namespace";
import type { ClassDoc, Claims, Role } from "@/lib/types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Mã máy đọc được, vd "AI_LOCKED" (trang hiện hộp nhập mật khẩu) */
    public code?: string
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

/** Bọc handler: mọi lỗi đều trả JSON { error } thay vì làm sập trang */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message, ...(e.code ? { code: e.code } : {}) }, { status: e.status });
      console.error(e);
      const msg = e instanceof Error && e.message.startsWith("Thiếu") ? e.message : "Lỗi máy chủ, thử lại sau.";
      return Response.json({ error: msg }, { status: 500 });
    }
  };
}

/** Người gọi API: thông tin token + quyền Lớp Song Ngữ (đọc từ claims "lsn*") */
export interface AuthedUser extends Claims {
  uid: string;
  email?: string;
  name?: string;
  emailVerified: boolean;
  signInProvider?: string;
}

/** Đọc "Authorization: Bearer <idToken>" và kiểm vai trò */
export async function requireAuth(req: Request, roles?: Role[]): Promise<AuthedUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Bạn cần đăng nhập.");
  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch (e) {
    // Ghi mã lỗi (không ghi token) để chẩn đoán trên Vercel Logs
    const err = e as { code?: string; message?: string };
    console.error("verifyIdToken:", err.code, err.message?.split("\n")[0]);
    if (err.message?.startsWith("Thiếu")) throw e;
    throw new HttpError(401, "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.");
  }
  const user: AuthedUser = {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name as string | undefined,
    emailVerified: decoded.email_verified === true,
    signInProvider: decoded.firebase?.sign_in_provider,
    ...readClaims(decoded),
  };
  if (roles && !roles.includes(user.role as Role)) {
    throw new HttpError(403, "Bạn không có quyền làm việc này.");
  }
  return user;
}

/** Lấy lớp và kiểm: GV phải có tên trong teacherIds; quản trị phải cùng trường */
export async function getClassForStaff(classId: string, user: AuthedUser) {
  const ref = adminDb().collection(COL.classes).doc(classId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Không tìm thấy lớp.");
  const cls = { id: snap.id, ...snap.data() } as ClassDoc;
  const allowed =
    (user.role === "teacher" && cls.teacherIds?.includes(user.uid)) ||
    (user.role === "admin" && cls.schoolId === user.schoolId);
  if (!allowed) throw new HttpError(403, "Bạn không dạy lớp này.");
  return { ref, cls };
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Dữ liệu gửi lên không hợp lệ.");
  }
}
