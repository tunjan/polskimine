import { describe, it, expect } from "vitest";
import { formatInterval } from "./formatInterval";

describe("formatInterval", () => {
  it("should format seconds (< 60s)", () => {
    expect(formatInterval(59 * 1000)).toBe("<1m");
    expect(formatInterval(1000)).toBe("<1m");
  });

  it("should format minutes (>= 60s, < 60m)", () => {
    expect(formatInterval(60 * 1000)).toBe("1m");
    expect(formatInterval(59 * 60 * 1000)).toBe("59m");
  });

  it("should format hours (>= 60m, < 24h)", () => {
    expect(formatInterval(60 * 60 * 1000)).toBe("1h");
    expect(formatInterval(23 * 60 * 60 * 1000)).toBe("23h");
  });

  it("should format days (>= 24h, < 30d)", () => {
    expect(formatInterval(24 * 60 * 60 * 1000)).toBe("1d");
    expect(formatInterval(29 * 24 * 60 * 60 * 1000)).toBe("29d");
  });

  it("should format months (>= 30d, < 12mo)", () => {
    expect(formatInterval(30 * 24 * 60 * 60 * 1000)).toBe("1mo");
    expect(formatInterval(11 * 30 * 24 * 60 * 60 * 1000)).toBe("11mo");
  });

  it("should format years (>= 365d)", () => {
    expect(formatInterval(365 * 24 * 60 * 60 * 1000)).toBe("1y");
    expect(formatInterval(2 * 365 * 24 * 60 * 60 * 1000)).toBe("2y");
  });
});
