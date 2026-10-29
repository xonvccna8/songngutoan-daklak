// Quản trị: xem danh sách GV của trường + tài khoản đang chờ duyệt
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { handle, ok, requireAuth } from "@/lib/server/api";

export const GET = handle(async (req: Request) => {
  const user = await requireAuth(req, ["admin"]);
  const db = adminDb();
  const [school, pending] = await Promise.all([
    db.collection(COL.users).where("schoolId", "==", user.schoolId).get(),
    db.collection(COL.users).where("role", "==", "pending").limit(100).get(),
  ]);
  const docs = [...new Map([...school.docs, ...pending.docs].map((d) => [d.id, d])).values()];

  // Hồ sơ "mồ côi": tài khoản đăng nhập đã bị xóa nhưng hồ sơ còn → gỡ hồ sơ, không hiển thị
  const missing = new Set<string>();
  for (let i = 0; i < docs.length; i += 100) {
    const r = await adminAuth().getUsers(docs.slice(i, i + 100).map((d) => ({ uid: d.id })));
    r.notFound.forEach((id) => "uid" in id && missing.add(id.uid));
  }
  await Promise.all(docs.filter((d) => missing.has(d.id)).map((d) => d.ref.delete()));

  const map = new Map<string, Record<string, unknown>>();
  docs.filter((d) => !missing.has(d.id)).forEach((d) => {
    const data = d.data();
    map.set(d.id, {
      uid: d.id,
      role: data.role,
      displayName: data.displayName,
      email: data.email ?? null,
      schoolId: data.schoolId ?? null,
      classIds: data.classIds ?? [],
    });
  });
  return ok({ users: [...map.values()] });
});
