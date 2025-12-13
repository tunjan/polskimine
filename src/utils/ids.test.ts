import { describe, it, expect, vi, afterEach } from "vitest";
import { generateId } from "./ids";

describe("generateId", () => {
  it("should generate a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
  });

  it("should generate a valid UUID format", () => {
    const id = generateId();
    // Simple regex for UUID v4 structure
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("should be unique across multiple calls", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
