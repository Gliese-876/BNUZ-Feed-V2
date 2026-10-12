import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("preserves the precision of dates without a year", () => {
    expect(formatDate("12-30")).toBe("12月30日（年份未标注）");
    expect(formatDate("--01-05")).toBe("1月5日（年份未标注）");
  });

  it("formats complete dates and preserves unrecognized source text", () => {
    expect(formatDate("2026-10-12")).toBe("2026年10月12日");
    expect(formatDate("日期待定")).toBe("日期待定");
  });
});
