import { describe, expect, it } from "vitest";

import { normalizeDateToken, normalizeDateTokenWithDayNumber, normalizeText } from "./html";

describe("HTML normalization", () => {
  it("collapses whitespace without removing spaces inside titles", () => {
    expect(normalizeText(" \n北京师范大学\u00a0  珠海校区\t ")).toBe("北京师范大学 珠海校区");
    expect(normalizeText("\t \n")).toBeUndefined();
    expect(normalizeText(null)).toBeUndefined();
    expect(normalizeText(undefined)).toBeUndefined();
  });

  it.each([
    "2026-1-2",
    "2026/01/02",
    "2026.1.2",
    "2026年1月2日",
    "2026年1月2",
    " 2026 年\n1 月\t2 日 ",
  ])("normalizes a full date: %s", (value) => {
    expect(normalizeDateToken(value)).toBe("2026-01-02");
  });

  it.each([null, undefined, "", " \n ", "1-2", "发布于2026-1-2", "2026-1-2 12:00", "2026年1-2日", "2026年1月2号"])(
    "keeps nonstandard and partial dates out of the strict normalizer: %s",
    (value) => {
      expect(normalizeDateToken(value)).toBeUndefined();
    },
  );

  it("only accepts the number suffix for sites that opt in", () => {
    expect(normalizeDateTokenWithDayNumber("2026年1月2号")).toBe("2026-01-02");
    expect(normalizeDateTokenWithDayNumber("2026年1月2日")).toBe("2026-01-02");
    expect(normalizeDateTokenWithDayNumber("2026-1-2")).toBe("2026-01-02");
    expect(normalizeDateTokenWithDayNumber("2026年1-2号")).toBeUndefined();
    expect(normalizeDateTokenWithDayNumber(null)).toBeUndefined();
  });
});
