import { describe, expect, it } from "vitest";
import {
  assignTeams,
  initials,
  isValidJoinCode,
  isValidPin,
  nextFailState,
  normalizeJoinCode,
  normalizeName,
  parseStudentPaste,
  sanitizeSettings,
  shortName,
} from "@/lib/class-utils";
import { DEFAULT_CLASS_SETTINGS } from "@/lib/types";

describe("parseStudentPaste", () => {
  it("đọc mỗi dòng một tên", () => {
    expect(parseStudentPaste("nguyễn văn an\nTRẦN THỊ BÌNH\n\n", 4)).toEqual([
      { fullName: "Nguyễn Văn An", team: null },
      { fullName: "Trần Thị Bình", team: null },
    ]);
  });
  it("đọc bảng dán từ Excel: STT, Họ tên, Tổ — bỏ dòng tiêu đề", () => {
    const text = "STT\tHọ và tên\tTổ\n1\tLê Minh Châu\t2\n2\tPhạm Gia Huy\tTổ 3";
    expect(parseStudentPaste(text, 4)).toEqual([
      { fullName: "Lê Minh Châu", team: 2 },
      { fullName: "Phạm Gia Huy", team: 3 },
    ]);
  });
  it("tổ ngoài phạm vi bị bỏ qua", () => {
    expect(parseStudentPaste("An Bình; 9", 4)).toEqual([{ fullName: "An Bình", team: null }]);
  });
});

describe("assignTeams", () => {
  it("chia đều các em chưa có tổ, ưu tiên tổ ít người", () => {
    const r = assignTeams(
      [
        { fullName: "A", team: null },
        { fullName: "B", team: null },
        { fullName: "C", team: null },
      ],
      3,
      [2, 0, 1]
    );
    expect(r.map((x) => x.team)).toEqual([2, 2, 3]);
  });
});

describe("mã lớp & PIN", () => {
  it("chuẩn hoá mã lớp", () => {
    expect(normalizeJoinCode(" ab-c d2x9q ")).toBe("ABCD2X");
  });
  it("không chấp nhận kí tự dễ nhầm", () => {
    expect(isValidJoinCode("ABCDE2")).toBe(true);
    expect(isValidJoinCode("ABCDE0")).toBe(false);
    expect(isValidJoinCode("ABC")).toBe(false);
  });
  it("PIN đúng 6 chữ số", () => {
    expect(isValidPin("012345")).toBe(true);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("12a456")).toBe(false);
  });
});

describe("khoá khi nhập sai PIN", () => {
  it("sai lần 1–4 chỉ tăng bộ đếm", () => {
    expect(nextFailState(0, 1000)).toEqual({ failedCount: 1, lockedUntil: null });
    expect(nextFailState(3, 1000)).toEqual({ failedCount: 4, lockedUntil: null });
  });
  it("sai lần thứ 5 khoá 15 phút", () => {
    expect(nextFailState(4, 1000)).toEqual({ failedCount: 0, lockedUntil: 1000 + 15 * 60_000 });
  });
});

describe("tên", () => {
  it("normalizeName", () => expect(normalizeName("  đỗ   thị  hà ")).toBe("Đỗ Thị Hà"));
  it("shortName", () => expect(shortName("Nguyễn Văn An")).toBe("An"));
  it("initials", () => expect(initials("Nguyễn Văn An")).toBe("VA"));
});

describe("sanitizeSettings", () => {
  it("giới hạn giá trị và giữ giá trị cũ khi sai định dạng", () => {
    const s = sanitizeSettings(
      { teams: 99, thresholds: { activeDays: 0, inactiveLate: 3 }, quietHours: { start: "25:00", end: "07:00" }, maxAttention: 2 },
      DEFAULT_CLASS_SETTINGS
    );
    expect(s).toEqual({
      teams: 8,
      thresholds: { activeDays: 1, inactiveLate: 3 },
      quietHours: { start: "21:00", end: "07:00" },
      maxAttention: 2,
      aiTutor: true,
    });
  });
  it("công tắc Trợ lý AI: chỉ nhận true/false, mặc định bật", () => {
    expect(sanitizeSettings({ aiTutor: false }, DEFAULT_CLASS_SETTINGS).aiTutor).toBe(false);
    expect(sanitizeSettings({ aiTutor: "no" }, DEFAULT_CLASS_SETTINGS).aiTutor).toBe(true);
    expect(sanitizeSettings({}, { ...DEFAULT_CLASS_SETTINGS, aiTutor: false }).aiTutor).toBe(false);
  });
});
