// Lượt AI dùng thử + mật khẩu mở khoá (phần không cần Firestore)
import { afterEach, describe, expect, it } from "vitest";
import { AI_LOCKED, aiFreeLimit, cleanUnlockPassword, generateUnlockPassword, lockedError, passwordMatches } from "@/lib/server/ai-gate";
import { handle } from "@/lib/server/api";

describe("lượt AI dùng thử", () => {
  afterEach(() => {
    delete process.env.AI_FREE_LIMIT;
  });
  it("mặc định 5 lượt, đổi được bằng AI_FREE_LIMIT", () => {
    expect(aiFreeLimit()).toBe(5);
    process.env.AI_FREE_LIMIT = "25";
    expect(aiFreeLimit()).toBe(25);
    process.env.AI_FREE_LIMIT = "abc";
    expect(aiFreeLimit()).toBe(5);
  });
  it("mật khẩu quản trị: tạo ngẫu nhiên dễ đọc, kiểm độ dài và khoảng trắng", () => {
    const p = generateUnlockPassword();
    expect(p).toMatch(/^TOAN-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(generateUnlockPassword()).not.toBe(p);
    expect(cleanUnlockPassword("  abc123  ")).toBe("abc123");
    expect(cleanUnlockPassword("12345")).toMatchObject({ error: expect.any(String) });
    expect(cleanUnlockPassword("abc 123")).toMatchObject({ error: expect.any(String) });
  });
  it("so mật khẩu: đúng từng kí tự, bỏ khoảng trắng 2 đầu, chưa đặt thì luôn sai", () => {
    expect(passwordMatches(" SN-ABCD-1234 ", "SN-ABCD-1234")).toBe(true);
    expect(passwordMatches("sn-abcd-1234", "SN-ABCD-1234")).toBe(false);
    expect(passwordMatches("SN-ABCD-123", "SN-ABCD-1234")).toBe(false);
    expect(passwordMatches("", undefined)).toBe(false);
  });
  it("hết lượt → máy chủ trả mã AI_LOCKED để trang hiện hộp nhập mật khẩu", async () => {
    const res = await handle(async () => {
      throw lockedError();
    })();
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ code: AI_LOCKED, error: expect.stringContaining("5 lượt") });
  });
});
