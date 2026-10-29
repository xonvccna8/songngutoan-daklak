// Xoá lớp trên Emulator: chặn khi đang dạy, GV lớp khác không xoá được, xoá sạch dữ liệu của lớp (kể cả tính năng mới)
//   npx firebase-tools emulators:exec --only firestore --project demo-lsn "npx vitest run tests/class-delete.emulator.test.ts"
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AuthedUser } from "@/lib/server/api";

const USERS = vi.hoisted(
  () =>
    ({
      tA: { uid: "tA", role: "teacher", schoolId: "s1", classIds: [], emailVerified: true },
      tB: { uid: "tB", role: "teacher", schoolId: "s1", classIds: [], emailVerified: true },
    }) as Record<string, AuthedUser>
);
vi.mock("@/lib/server/api", async (orig) => {
  const a = await orig<typeof import("@/lib/server/api")>();
  return {
    ...a,
    requireAuth: async (req: Request) => {
      const u = USERS[(req.headers.get("authorization") ?? "").replace("Bearer ", "")];
      if (!u) throw new a.HttpError(401, "Bạn cần đăng nhập.");
      return u;
    },
  };
});
vi.mock("firebase-admin/auth", async (orig) => {
  const a = await orig<typeof import("firebase-admin/auth")>();
  // Emulator không chạy Auth → bỏ qua xoá tài khoản HS
  return { ...a, getAuth: () => ({ deleteUsers: async () => ({}), revokeRefreshTokens: async () => undefined }) };
});

import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import * as route from "@/app/api/classes/[classId]/route";

const on = !!process.env.FIRESTORE_EMULATOR_HOST;
const db = () => adminDb();
const del = async (uid: string, classId: string) => {
  const res = await route.DELETE(new Request("http://localhost/api", { method: "DELETE", headers: { authorization: `Bearer ${uid}` } }), { params: Promise.resolve({ classId }) } as never);
  return { status: res.status, json: (await res.json()) as { error?: string } };
};
const exists = async (path: string) => (await db().doc(path).get()).exists;

describe.skipIf(!on)("xoá lớp", () => {
  beforeAll(async () => {
    const b = db().batch();
    b.set(db().doc(`${COL.classes}/dc1`), { name: "8X", grade: 8, schoolId: "s1", teacherIds: ["tA"], studentCount: 1, settings: {} });
    b.set(db().doc(`${COL.classes}/dc1/students/st_x`), { fullName: "Em X", number: 1, team: 1 });
    b.set(db().doc(`${COL.sessions}/SX`), { classId: "dc1", status: "live" });
    b.set(db().doc(`${COL.projects}/PX`), { classId: "dc1" });
    b.set(db().doc(`${COL.projects}/PX/teams/1`), { team: 1 });
    b.set(db().doc(`${COL.posts}/BX`), { classId: "dc1" });
    b.set(db().doc(`${COL.posts}/BX/replies/r1`), { text: "x" });
    b.set(db().doc(`${COL.tutor}/st_x_20261023`), { classId: "dc1", uid: "st_x" });
    b.set(db().doc(`${COL.events}/EX`), { classId: "dc1", uid: "st_x" });
    b.set(db().doc(`${COL.weekly}/dc1_2026-W43`), { classId: "dc1" });
    b.set(db().doc(`${COL.stats}/dc1_st_x`), { classId: "dc1", uid: "st_x" });
    b.set(db().doc(`${COL.projects}/PKHAC`), { classId: "lop-khac" }); // của lớp khác — phải giữ
    await b.commit();
  });

  it("GV không dạy lớp không xoá được", async () => {
    expect((await del("tB", "dc1")).status).toBe(403);
  });

  it("đang có tiết học → không cho xoá", async () => {
    const r = await del("tA", "dc1");
    expect(r.status).toBe(409);
    expect(r.json.error).toMatch(/kết thúc tiết học/);
    expect(await exists(`${COL.classes}/dc1`)).toBe(true);
  });

  it("hết tiết → xoá sạch lớp và mọi dữ liệu của lớp, giữ dữ liệu lớp khác", async () => {
    await db().doc(`${COL.sessions}/SX`).update({ status: "ended" });
    expect((await del("tA", "dc1")).status).toBe(200);
    for (const p of [`${COL.classes}/dc1`, `${COL.classes}/dc1/students/st_x`, `${COL.sessions}/SX`, `${COL.projects}/PX`, `${COL.projects}/PX/teams/1`, `${COL.posts}/BX`, `${COL.posts}/BX/replies/r1`, `${COL.tutor}/st_x_20261023`, `${COL.events}/EX`, `${COL.weekly}/dc1_2026-W43`, `${COL.stats}/dc1_st_x`]) {
      expect(await exists(p), p).toBe(false);
    }
    expect(await exists(`${COL.projects}/PKHAC`)).toBe(true);
  });
});
