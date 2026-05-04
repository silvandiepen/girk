import { describe, it, expect } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  // Use a fixed date so tests are deterministic
  const date = new Date(2026, 4, 4, 14, 5, 9); // May 4, 2026 14:05:09

  it("formats yy-MM-dd", () => {
    expect(formatDate(date, "yy-MM-dd")).toBe("26-05-04");
  });

  it("formats dd MMM yyyy", () => {
    expect(formatDate(date, "dd MMM yyyy")).toBe("04 May 2026");
  });

  it("formats yyyy-MM-dd", () => {
    expect(formatDate(date, "yyyy-MM-dd")).toBe("2026-05-04");
  });

  it("formats single d (unpadded day)", () => {
    const first = new Date(2026, 0, 1);
    expect(formatDate(first, "d")).toBe("1");
  });

  it("formats HH:mm:ss", () => {
    expect(formatDate(date, "HH:mm:ss")).toBe("14:05:09");
  });

  it("handles all month abbreviations", () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    months.forEach((expected, idx) => {
      const d = new Date(2026, idx, 15);
      expect(formatDate(d, "MMM")).toBe(expected);
    });
  });

  it("handles string input", () => {
    expect(formatDate("2026-05-04", "dd MMM yyyy")).toBe("04 May 2026");
  });

  it("handles timestamp input", () => {
    expect(formatDate(date.getTime(), "yyyy-MM-dd")).toBe("2026-05-04");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate("not-a-date", "yyyy")).toBe("");
  });

  it("returns empty string for Invalid Date object", () => {
    expect(formatDate(new Date("invalid"), "yyyy")).toBe("");
  });

  it("passes through literal characters", () => {
    expect(formatDate(date, "yyyy/MM/dd")).toBe("2026/05/04");
  });

  it("handles edge case: single digit day and month", () => {
    const d = new Date(2026, 0, 9);
    expect(formatDate(d, "d/M/yyyy")).toBe("9/1/2026");
  });

  it("handles end-of-month dates", () => {
    const d = new Date(2026, 11, 31);
    expect(formatDate(d, "dd MMM yyyy")).toBe("31 Dec 2026");
  });

  it("handles leap year date", () => {
    const d = new Date(2024, 1, 29);
    expect(formatDate(d, "dd MMM yyyy")).toBe("29 Feb 2024");
  });

  it("handles year-only format", () => {
    expect(formatDate(date, "yyyy")).toBe("2026");
  });
});
