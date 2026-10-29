// Chạy thử script nạp kho (scripts/seed-kho.mts) trên Firestore Emulator: nạp 2 lần, không ghi đè thuật ngữ có sẵn,
// KHÔNG đụng thuật ngữ của trang KHTN (Firebase dùng chung), gỡ sạch.
//   npx firebase-tools emulators:exec --only firestore --project demo-lsn "npx vitest run tests/kho.emulator.test.ts"
import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import { GRADES } from "@/lib/curriculum";
import { KHO_COMMON, KHO_TOAN, KHO_SEED } from "@/lib/library/kho-toan";

const on = !!process.env.FIRESTORE_EMULATOR_HOST;
const run = (...args: string[]) => execFileSync(process.execPath, ["--import", "tsx", "scripts/seed-kho.mts", ...args], { encoding: "utf8", env: process.env });
const total = KHO_COMMON.length * GRADES.length + KHO_TOAN.reduce((s, l) => s + l.resources.length, 0);

describe.skipIf(!on)("nạp kho học liệu Toán 6–9", () => {
  const db = () => adminDb();
  beforeAll(async () => {
    await db().recursiveDelete(db().collection(COL.resources));
    await db().recursiveDelete(db().collection(COL.terms));
    // Thuật ngữ GV Toán đã soạn từ trước — không được ghi đè
    await db().doc(`${COL.terms}/hypotenuse`).set({ en: "hypotenuse", ipa: "/haɪˈpɒtənjuːz/", vi: "cạnh huyền (GV soạn)", grade: 8, status: "approved", lessonIds: ["L9"] });
    // Thuật ngữ của trang KHTN trùng tên — không được sửa gì
    await db().doc(`${COL.terms}/volume`).set({ en: "volume", ipa: "/ˈvɒljuːm/", vi: "thể tích (KHTN)", grade: 8, status: "approved", lessonIds: [], curLessonIds: ["n8-12"] });
    // Học liệu GV tự thêm — không bị đụng tới
    await db().doc(`${COL.resources}/R-gv`).set({ kind: "video", title: { vi: "GV" }, url: "https://youtu.be/abcdefgh", status: "approved", grade: 8, curLessonId: "k8-35" });
  });

  it("--dry-run không ghi gì", async () => {
    expect(run("--dry-run")).toMatch(/không ghi/);
    expect((await db().collection(COL.resources).where("seed", "==", KHO_SEED).get()).size).toBe(0);
  });

  it("nạp: đủ học liệu Đã duyệt, gắn đúng bài và khối; thuật ngữ mới + gắn bài", async () => {
    expect(run()).toMatch(/Đã nạp/);
    expect((await db().collection(COL.resources).where("seed", "==", KHO_SEED).get()).size).toBe(total);
    const r = (await db().doc(`${COL.resources}/kho-k8-35-01`).get()).data()!;
    expect(r).toMatchObject({ kind: "web", status: "approved", grade: 8, curLessonId: "k8-35", createdBy: "kho" });
    expect((await db().doc(`${COL.resources}/kho-k6-chung-01`).get()).get("grade")).toBe(6);
    // Truy vấn giống trang "Xem trước bài" của HS (kho + 1 học liệu GV)
    const prep = await db().collection(COL.resources).where("status", "==", "approved").where("curLessonId", "==", "k8-35").get();
    expect(prep.size).toBe(KHO_TOAN.find((l) => l.curLessonId === "k8-35")!.resources.length + 1);
    const t = (await db().doc(`${COL.terms}/slant-height`).get()).data()!;
    expect(t).toMatchObject({ grade: 8, status: "approved", curLessonIds: ["k8-38"], lessonIds: [] });
  });

  it("thuật ngữ có sẵn: giữ nguyên nội dung GV, chỉ gắn thêm bài; thuật ngữ KHTN để nguyên", async () => {
    const h = (await db().doc(`${COL.terms}/hypotenuse`).get()).data()!;
    expect(h.vi).toBe("cạnh huyền (GV soạn)");
    expect(h.lessonIds).toEqual(["L9"]);
    expect(h.curLessonIds).toEqual(["k7-15", "k8-35"]);
    expect(h.seed).toBeUndefined();
    const v = (await db().doc(`${COL.terms}/volume`).get()).data()!;
    expect(v).toMatchObject({ vi: "thể tích (KHTN)", curLessonIds: ["n8-12"] });
  });

  it("chạy lại không tạo trùng", async () => {
    run();
    expect((await db().collection(COL.resources).where("seed", "==", KHO_SEED).get()).size).toBe(total);
    expect((await db().doc(`${COL.terms}/hypotenuse`).get()).get("curLessonIds")).toEqual(["k7-15", "k8-35"]);
  });

  it("--remove gỡ sạch phần của kho, giữ dữ liệu của GV và của KHTN", async () => {
    run("--remove");
    expect((await db().collection(COL.resources).where("seed", "==", KHO_SEED).get()).size).toBe(0);
    expect((await db().collection(COL.terms).where("seed", "==", KHO_SEED).get()).size).toBe(0);
    expect((await db().doc(`${COL.resources}/R-gv`).get()).exists).toBe(true);
    const h = (await db().doc(`${COL.terms}/hypotenuse`).get()).data()!;
    expect(h.vi).toBe("cạnh huyền (GV soạn)");
    expect(h.curLessonIds).toEqual([]);
    expect((await db().doc(`${COL.terms}/volume`).get()).get("curLessonIds")).toEqual(["n8-12"]);
  });
});
