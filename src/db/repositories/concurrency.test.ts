import { incrementHistory } from "./historyRepository";
import { incrementStat } from "./aggregatedStatsRepository";
import { db } from "@/db/dexie";
import { LanguageId } from "@/types";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock Dexie
vi.mock("@/db/dexie", async () => {
  return {
    db: {
      transaction: vi.fn((mode, tables, callback) => callback()),
      history: {
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        first: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        put: vi.fn(),
        modify: vi.fn(),
      },
      aggregated_stats: {
        get: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        put: vi.fn(),
        modify: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
      },
    },
  };
});

// Mock ids utils
vi.mock("@/utils/ids", () => ({
  generateId: vi.fn().mockReturnValue("mock-id"),
}));

// Mock cardRepository for user ID
vi.mock("./cardRepository", () => ({
  getCurrentUserId: vi.fn().mockReturnValue("test-user-id"),
}));

describe("Concurrency Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("incrementHistory should handle concurrent calls safely", async () => {
    const date = "2023-01-01";
    const language = LanguageId.Polish;

    // Mock 'modify' to return 0 initially (mimicking "row doesn't exist yet")
    // Then subsequent calls might return 1 if we wanted to simulate that,
    // but for the race condition "add" path, we specifically want 'modify' -> 0
    (db.history.where as any).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        // first attempt at modify returns 0 (not found)
        modify: vi
          .fn()
          .mockResolvedValueOnce(0) // 1st call: not found -> try add
          .mockResolvedValueOnce(0) // 2nd call: not found -> try add (race)
          .mockResolvedValue(1), // fallback modify in catch block returns 1 (success)
      }),
    });

    // Mock 'add' to succeed once, then throw ConstraintError
    let addCallCount = 0;
    (db.history.add as any).mockImplementation(async () => {
      addCallCount++;
      if (addCallCount > 1) {
        const error = new Error("ConstraintError: Key already exists");
        error.name = "ConstraintError";
        throw error;
      }
      return Promise.resolve();
    });

    // Call incrementHistory multiple times concurrently
    const promises = Array(5)
      .fill(0)
      .map(() => incrementHistory(date, 1, language));

    // This should pass now (resolve successfully)
    await expect(Promise.all(promises)).resolves.toBeDefined();

    // Verified that we hit the "race condition" path at least once
    expect(addCallCount).toBeGreaterThan(1);
  });

  it("incrementStat should handle concurrent calls safely", async () => {
    const language = LanguageId.Polish;
    const metric = "total_xp";

    // Mock 'modify' to return 0 initially, then simulate success on fallback
    (db.aggregated_stats.where as any).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        modify: vi
          .fn()
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValue(1),
      }),
    });

    // Mock 'add' to succeed once, then throw ConstraintError
    let addCallCount = 0;
    (db.aggregated_stats.add as any).mockImplementation(async () => {
      addCallCount++;
      if (addCallCount > 1) {
        const error = new Error("ConstraintError: Key already exists");
        error.name = "ConstraintError";
        throw error;
      }
      return Promise.resolve();
    });

    const promises = Array(5)
      .fill(0)
      .map(() => incrementStat(language, metric, 10));

    await expect(Promise.all(promises)).resolves.toBeDefined();
    expect(addCallCount).toBeGreaterThan(1);
  });
});
