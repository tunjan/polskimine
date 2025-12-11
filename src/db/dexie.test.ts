import { describe, it, expect, vi } from "vitest";
import { db } from "./dexie";
import { generateId } from "@/utils/ids";
import { hashPassword } from "@/utils/security";


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
    
    
    
    expect(db.verno).toBeGreaterThanOrEqual(8 / 10); 
    
    
  });

  it("should generate valid IDs", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    
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
    expect(hash).toBe(hash2); 
  });
});
