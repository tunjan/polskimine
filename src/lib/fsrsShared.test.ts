import { describe, it, expect } from "vitest";
import { ReviewLog } from "@/types";
import {
  DECAY,
  FACTOR,
  WEIGHT_BOUNDS,
  getRetrievability,
  nextStability,
  nextDifficulty,
  computeCardLoss,
  clampWeight,
  runOptimizerIteration,
  OPTIMIZER_CONFIG,
} from "./fsrsShared";

// Default FSRS-5 weights for testing
const DEFAULT_W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616,
  0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034,
  0.6567,
];

const createReviewLog = (overrides: Partial<ReviewLog> = {}): ReviewLog => ({
  id: "log-1",
  card_id: "card-1",
  grade: 3,
  state: 2,
  elapsed_days: 1,
  scheduled_days: 1,
  stability: 1,
  difficulty: 5,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("fsrsShared", () => {
  describe("constants", () => {
    it("should have correct DECAY value", () => {
      expect(DECAY).toBe(-0.6);
    });

    it("should have correct FACTOR derived from DECAY", () => {
      const expectedFactor = Math.pow(0.9, 1 / DECAY) - 1;
      expect(FACTOR).toBeCloseTo(expectedFactor);
    });

    it("should have correct WEIGHT_BOUNDS", () => {
      expect(WEIGHT_BOUNDS.min).toBe(0.001);
      expect(WEIGHT_BOUNDS.max).toBe(20.0);
    });

    it("should have correct OPTIMIZER_CONFIG", () => {
      expect(OPTIMIZER_CONFIG.learningRate).toBe(0.002);
      expect(OPTIMIZER_CONFIG.iterations).toBe(500);
      expect(OPTIMIZER_CONFIG.maxBatchSize).toBe(64);
      expect(OPTIMIZER_CONFIG.finiteDiffH).toBe(0.0001);
    });
  });

  describe("getRetrievability", () => {
    it("should return 0 if stability is 0", () => {
      expect(getRetrievability(1, 0)).toBe(0);
    });

    it("should return 0 if stability is negative", () => {
      expect(getRetrievability(1, -1)).toBe(0);
    });

    it("should return 1 for newly reviewed card (0 elapsed days)", () => {
      expect(getRetrievability(0, 10)).toBeCloseTo(1);
    });

    it("should return ~0.9 when elapsed days equals stability", () => {
      const result = getRetrievability(10, 10);
      // Formula: (1 + FACTOR * 1)^DECAY = 0.9^1 = 0.9
      expect(result).toBeCloseTo(0.9, 2);
    });

    it("should decrease as elapsed days increase", () => {
      const r1 = getRetrievability(1, 10);
      const r2 = getRetrievability(5, 10);
      const r3 = getRetrievability(10, 10);
      expect(r1).toBeGreaterThan(r2);
      expect(r2).toBeGreaterThan(r3);
    });

    it("should return higher values for higher stability", () => {
      const lowStability = getRetrievability(5, 2);
      const highStability = getRetrievability(5, 20);
      expect(highStability).toBeGreaterThan(lowStability);
    });
  });

  describe("nextStability", () => {
    it("should calculate stability for Again rating (1)", () => {
      const result = nextStability(10, 5, 0.9, 1, DEFAULT_W);
      // For rating 1: w[11] * d^(-w[12]) * ((s+1)^w[13] - 1) * exp(w[14] * (1-r))
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10); // Should decrease stability for lapse
    });

    it("should apply hard penalty for rating 2", () => {
      const resultGood = nextStability(10, 5, 0.9, 3, DEFAULT_W);
      const resultHard = nextStability(10, 5, 0.9, 2, DEFAULT_W);
      // Hard should have a penalty applied
      expect(resultHard).toBeLessThan(resultGood);
    });

    it("should apply easy bonus for rating 4", () => {
      const resultGood = nextStability(10, 5, 0.9, 3, DEFAULT_W);
      const resultEasy = nextStability(10, 5, 0.9, 4, DEFAULT_W);
      expect(resultEasy).toBeGreaterThan(resultGood);
    });

    it("should clamp minimum stability to 0.1", () => {
      const result = nextStability(0, 5, 0.9, 3, DEFAULT_W);
      // Input stability is clamped to 0.1
      expect(result).toBeGreaterThan(0);
    });

    it("should increase stability for successful reviews", () => {
      const result = nextStability(10, 5, 0.9, 3, DEFAULT_W);
      expect(result).toBeGreaterThan(10);
    });

    it("should be affected by difficulty", () => {
      const lowDiff = nextStability(10, 2, 0.9, 3, DEFAULT_W);
      const highDiff = nextStability(10, 9, 0.9, 3, DEFAULT_W);
      // Lower difficulty should result in higher stability gain
      expect(lowDiff).toBeGreaterThan(highDiff);
    });
  });

  describe("nextDifficulty", () => {
    it("should decrease difficulty for rating > 3", () => {
      const result = nextDifficulty(5, 4, DEFAULT_W);
      expect(result).toBeLessThan(5);
    });

    it("should increase difficulty for rating < 3", () => {
      const result = nextDifficulty(5, 1, DEFAULT_W);
      expect(result).toBeGreaterThan(5);
    });

    it("should keep difficulty stable for rating = 3", () => {
      const result = nextDifficulty(5, 3, DEFAULT_W);
      // Should only apply mean reversion, not directional change
      expect(result).toBeCloseTo(5, 0);
    });

    it("should clamp minimum difficulty to 1", () => {
      const result = nextDifficulty(1, 4, DEFAULT_W);
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it("should clamp maximum difficulty to 10", () => {
      const result = nextDifficulty(10, 1, DEFAULT_W);
      expect(result).toBeLessThanOrEqual(10);
    });

    it("should apply mean reversion toward w[4]", () => {
      // Mean reversion: nextD * (1 - w[7]) + w[4] * w[7]
      const result = nextDifficulty(2, 3, DEFAULT_W);
      // Should move slightly toward w[4] (7.2102)
      expect(result).toBeGreaterThan(2);
    });
  });

  describe("computeCardLoss", () => {
    it("should return 0 for empty logs array", () => {
      const result = computeCardLoss([], DEFAULT_W);
      expect(result).toBe(0);
    });

    it("should initialize from first review (state 0 or 1)", () => {
      const logs = [
        createReviewLog({ grade: 3, state: 0, elapsed_days: 0 }),
        createReviewLog({ grade: 3, state: 2, elapsed_days: 1 }),
      ];
      const result = computeCardLoss(logs, DEFAULT_W);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("should skip loss calculation for learning states (0, 1)", () => {
      const logs = [createReviewLog({ grade: 3, state: 0, elapsed_days: 0 })];
      const result = computeCardLoss(logs, DEFAULT_W);
      expect(result).toBe(0); // No loss for first step
    });

    it("should calculate loss for review states", () => {
      const logs = [
        createReviewLog({ grade: 3, state: 0, elapsed_days: 0 }),
        createReviewLog({ grade: 3, state: 2, elapsed_days: 1 }),
      ];
      const result = computeCardLoss(logs, DEFAULT_W);
      // Should have some loss from review
      expect(result).toBeGreaterThan(0);
    });

    it("should handle lapse (grade 1) correctly", () => {
      const logs = [
        createReviewLog({ grade: 3, state: 0, elapsed_days: 0 }),
        createReviewLog({ grade: 1, state: 2, elapsed_days: 10 }),
      ];
      const result = computeCardLoss(logs, DEFAULT_W);
      expect(result).toBeGreaterThan(0);
    });

    it("should accumulate loss across multiple reviews", () => {
      const singleLog = [
        createReviewLog({ grade: 3, state: 0, elapsed_days: 0 }),
        createReviewLog({ grade: 3, state: 2, elapsed_days: 1 }),
      ];
      const multipleLogs = [
        ...singleLog,
        createReviewLog({ grade: 3, state: 2, elapsed_days: 2 }),
        createReviewLog({ grade: 3, state: 2, elapsed_days: 4 }),
      ];
      const singleLoss = computeCardLoss(singleLog, DEFAULT_W);
      const multipleLoss = computeCardLoss(multipleLogs, DEFAULT_W);
      expect(multipleLoss).toBeGreaterThan(singleLoss);
    });
  });

  describe("clampWeight", () => {
    it("should return value if within bounds", () => {
      expect(clampWeight(5)).toBe(5);
      expect(clampWeight(0.5)).toBe(0.5);
    });

    it("should clamp values below minimum", () => {
      expect(clampWeight(0.0001)).toBe(WEIGHT_BOUNDS.min);
      expect(clampWeight(-5)).toBe(WEIGHT_BOUNDS.min);
    });

    it("should clamp values above maximum", () => {
      expect(clampWeight(25)).toBe(WEIGHT_BOUNDS.max);
      expect(clampWeight(100)).toBe(WEIGHT_BOUNDS.max);
    });

    it("should handle edge cases", () => {
      expect(clampWeight(0.001)).toBe(0.001);
      expect(clampWeight(20.0)).toBe(20.0);
    });
  });

  describe("runOptimizerIteration", () => {
    it("should return array of same length", () => {
      const batch = [[createReviewLog()]];
      const result = runOptimizerIteration(
        DEFAULT_W,
        batch,
        [0, 1],
        0.002,
        0.0001
      );
      expect(result).toHaveLength(DEFAULT_W.length);
    });

    it("should only modify target indices", () => {
      const batch = [
        [
          createReviewLog({ grade: 3, state: 0 }),
          createReviewLog({ grade: 3, state: 2, elapsed_days: 1 }),
        ],
      ];
      const targetIndices = [0, 1];
      const result = runOptimizerIteration(
        DEFAULT_W,
        batch,
        targetIndices,
        0.002,
        0.0001
      );

      // Non-target indices should be unchanged
      for (let i = 0; i < DEFAULT_W.length; i++) {
        if (!targetIndices.includes(i)) {
          expect(result[i]).toBe(DEFAULT_W[i]);
        }
      }
    });

    it("should clamp weights to valid bounds", () => {
      const batch = [[createReviewLog()]];
      const result = runOptimizerIteration(
        DEFAULT_W,
        batch,
        [0, 1, 2, 3],
        10, // Very high learning rate
        0.0001
      );

      result.forEach((w) => {
        expect(w).toBeGreaterThanOrEqual(WEIGHT_BOUNDS.min);
        expect(w).toBeLessThanOrEqual(WEIGHT_BOUNDS.max);
      });
    });

    it("should compute gradients via finite differences", () => {
      const logs = [
        createReviewLog({ grade: 3, state: 0 }),
        createReviewLog({ grade: 3, state: 2, elapsed_days: 1 }),
      ];
      const batch = [logs];
      const result = runOptimizerIteration(
        DEFAULT_W,
        batch,
        OPTIMIZER_CONFIG.targetIndices,
        OPTIMIZER_CONFIG.learningRate,
        OPTIMIZER_CONFIG.finiteDiffH
      );

      // Result should be different from input (gradients should be non-zero)
      let anyDifferent = false;
      for (let i = 0; i < result.length; i++) {
        if (Math.abs(result[i] - DEFAULT_W[i]) > 1e-10) {
          anyDifferent = true;
          break;
        }
      }
      expect(anyDifferent).toBe(true);
    });

    it("should handle multiple card histories in batch", () => {
      const batch = [
        [
          createReviewLog({ card_id: "a", grade: 3, state: 0 }),
          createReviewLog({ card_id: "a", grade: 3, state: 2, elapsed_days: 1 }),
        ],
        [
          createReviewLog({ card_id: "b", grade: 4, state: 0 }),
          createReviewLog({ card_id: "b", grade: 4, state: 2, elapsed_days: 2 }),
        ],
      ];
      const result = runOptimizerIteration(
        DEFAULT_W,
        batch,
        [0, 1, 2, 3],
        0.002,
        0.0001
      );
      expect(result).toHaveLength(DEFAULT_W.length);
    });
  });
});
