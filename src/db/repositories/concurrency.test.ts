import { incrementHistory } from "./historyRepository";
import { incrementStat } from "./aggregatedStatsRepository";
import { db } from "@/db/dexie";
import { LanguageId } from "@/types";
import { vi, describe, it, expect, beforeEach } from "vitest";

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

vi.mock("@/utils/ids", () => ({
  generateId: vi.fn().mockReturnValue("mock-id"),
}));

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

    (db.history.where as any).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        modify: vi
          .fn()
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValue(1),
      }),
    });

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

    const promises = Array(5)
      .fill(0)
      .map(() => incrementHistory(date, 1, language));

    await expect(Promise.all(promises)).resolves.toBeDefined();

    expect(addCallCount).toBeGreaterThan(1);
  });

  it("incrementStat should handle concurrent calls safely", async () => {
    const language = LanguageId.Polish;
    const metric = "total_xp";

    (db.aggregated_stats.where as any).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        modify: vi
          .fn()
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValue(1),
      }),
    });

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
