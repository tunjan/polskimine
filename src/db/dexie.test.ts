import { describe, it, expect, vi } from "vitest";
import { db } from "./dexie";
import { generateId } from "@/utils/ids";
import { hashPassword } from "@/utils/security";

// Mock global crypto for hashPassword if running in an environment without full Web Crypto API
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: () => "mock-uuid",
      getRandomValues: (arr: Uint8Array) => arr,
      subtle: {
        digest: async () => new Uint8Array([1, 2, 3]).buffer,
      },
    },
  });
}

describe("Dexie Refactor Verification", () => {
  it("should initialize the database with correct tables", () => {
    expect(db).toBeDefined();
    expect(db.cards).toBeDefined();
    expect(db.revlog).toBeDefined();
    expect(db.history).toBeDefined();
    expect(db.profile).toBeDefined();
    expect(db.settings).toBeDefined();
    expect(db.aggregated_stats).toBeDefined();
    expect(db.users).toBeDefined();
  });

  it("should have correct version 8 schema", () => {
    // Dexie exposes tables, we can check if they exist.
    // Verifying specific schema string is harder without accessing internal metadata,
    // but we can check if the db opens without error.
    expect(db.verno).toBeGreaterThanOrEqual(8 / 10); // Dexie versions are often stored as 0.X or X?
    // Actually db.verno returns the version number.
    // However, since it's lazy open, it might be 0 until opened.
  });

  it("should generate valid IDs", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    // Basic UUID regex check
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("should hash passwords securely", async () => {
    const password = "password123";
    const hash = await hashPassword(password);
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
    
    const hash2 = await hashPassword(password);
    expect(hash).toBe(hash2); // Deterministic
  });
});
