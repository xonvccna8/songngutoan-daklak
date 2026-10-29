import { describe, expect, it } from "vitest";
import { cleanPoints, cleanText, inQuietHours, isKind, overAttentionLimit } from "@/lib/messages/rules";

// 21:00–06:30 giờ VN = 14:00–23:30 UTC
const vn = (h: number, m = 0) => Date.UTC(2026, 9, 11, h - 7, m);
const Q = { start: "21:00", end: "06:30" };

describe("giờ yên lặng (giờ Việt Nam)", () => {
  it("trong khoảng qua nửa đêm", () => {
    expect(inQuietHours(Q, vn(22))).toBe(true);
    expect(inQuietHours(Q, vn(23, 59))).toBe(true);
    expect(inQuietHours(Q, Date.UTC(2026, 9, 11, 22, 0))).toBe(true); // 05:00 sáng hôm sau
    expect(inQuietHours(Q, vn(6, 29))).toBe(true);
  });
  it("ngoài khoảng", () => {
    expect(inQuietHours(Q, vn(6, 30))).toBe(false);
    expect(inQuietHours(Q, vn(10))).toBe(false);
    expect(inQuietHours(Q, vn(20, 59))).toBe(false);
  });
  it("khoảng trong ngày", () => {
    expect(inQuietHours({ start: "12:00", end: "13:30" }, vn(12, 45))).toBe(true);
    expect(inQuietHours({ start: "12:00", end: "13:30" }, vn(14))).toBe(false);
  });
});

describe("giới hạn tin Chú ý mỗi tiết", () => {
  it("em đã nhận đủ 3 tin bị bỏ qua", () => {
    const sent = [["a", "b"], ["a"], ["a", "c"]];
    expect(overAttentionLimit(sent, ["a", "b", "c", "d"], 3)).toEqual(["a"]);
    expect(overAttentionLimit(sent, ["a", "b"], 1)).toEqual(["a", "b"]);
  });
});

describe("nội dung tin", () => {
  it("cần ít nhất một ngôn ngữ, cắt 500 kí tự", () => {
    expect(cleanText({ en: "  Hi  ", vi: "" })).toEqual({ en: "Hi", vi: "" });
    expect(cleanText({ en: " ", vi: " " })).toBeNull();
    expect(cleanText({ vi: "x".repeat(600) })!.vi.length).toBe(500);
  });
  it("điểm thưởng chỉ cho tin Khen, tối đa 100", () => {
    expect(cleanPoints("praise", 20)).toBe(20);
    expect(cleanPoints("praise", 999)).toBe(20);
    expect(cleanPoints("attention", 50)).toBe(0);
  });
  it("loại tin hợp lệ", () => {
    expect(isKind("attention")).toBe(true);
    expect(isKind("spam")).toBe(false);
  });
});
