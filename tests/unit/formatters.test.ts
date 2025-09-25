import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, formatDateTime, formatSeatCapacity } from "@/lib/formatters";

describe("formatters", () => {
  it("formats currency from cents", () => {
    expect(formatCurrency(12345)).toBe("$123.45");
  });

  it("pluralizes seats correctly", () => {
    expect(formatSeatCapacity(1)).toBe("1 seat");
    expect(formatSeatCapacity(5)).toBe("5 seats");
  });

  it("formats dates", () => {
    const date = new Date("2024-01-01T12:34:56Z");
    expect(formatDate(date)).toMatch(/Jan\s1,\s2024/);
  });

  it("formats date times", () => {
    const date = new Date("2024-01-01T12:34:56Z");
    expect(formatDateTime(date)).toMatch(/Jan\s1,\s2024/);
  });
});
