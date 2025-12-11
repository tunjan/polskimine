import { describe, it, expect } from 'vitest';
import {
  getRetrievability,
  nextStability,
  nextDifficulty,
  computeCardLoss,
  clampWeight,
  runOptimizerIteration,
  WEIGHT_BOUNDS,
  OPTIMIZER_CONFIG,
  DECAY,
  FACTOR
} from './fsrsShared';
import { ReviewLog } from '@/types';



const DEFAULT_W = [
  0.40255, 1.18385, 3.173, 15.69105, 
  7.19605, 0.5345, 1.4604, 0.00405, 1.5491, 0.10865, 
  1.1009, 2.7667, 0.08985, 0.32355, 1.36395, 0.0965, 2.7061
];

// Helper to create valid ReviewLog objects with required fields
let logCounter = 0;
const createLog = (overrides: Partial<ReviewLog> & Pick<ReviewLog, 'state' | 'elapsed_days' | 'scheduled_days' | 'grade' | 'card_id'>): ReviewLog => ({
  id: `log-${++logCounter}`,
  stability: 5,
  difficulty: 5,
  created_at: new Date().toISOString(),
  ...overrides,
});


describe('fsrsShared', () => {
  describe('getRetrievability', () => {
    it('should return 0 if stability is <= 0', () => {
      expect(getRetrievability(1, 0)).toBe(0);
      expect(getRetrievability(1, -1)).toBe(0);
    });

    it('should calculate retrievability correctly', () => {
      const elapsed = 0;
      const stability = 1;
      
      expect(getRetrievability(elapsed, stability)).toBeCloseTo(1);
    });

    it('should decrease as elapsed time increases', () => {
      const s = 10;
      const r1 = getRetrievability(1, s);
      const r10 = getRetrievability(10, s);
      expect(r10).toBeLessThan(r1);
    });

    // New edge case tests
    it('should return ~0.9 at stability equals elapsed days (FSRS default)', () => {
      const s = 10;
      const r = getRetrievability(s, s);
      // At elapsed = stability, R should be around 0.9 based on FSRS formula
      expect(r).toBeCloseTo(0.9, 1);
    });

    it('should handle very small stability', () => {
      const r = getRetrievability(1, 0.001);
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    });

    it('should handle very large stability', () => {
      const r = getRetrievability(1, 10000);
      expect(r).toBeCloseTo(1, 2);
    });

    it('should handle very large elapsed days', () => {
      const r = getRetrievability(10000, 10);
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    });

    it('should return 1 when elapsed days is 0', () => {
      expect(getRetrievability(0, 10)).toBeCloseTo(1);
      expect(getRetrievability(0, 1)).toBeCloseTo(1);
      expect(getRetrievability(0, 100)).toBeCloseTo(1);
    });

    it('should approach 0 for very large elapsed/stability ratios', () => {
      const r = getRetrievability(1000, 1);
      expect(r).toBeLessThan(0.1);
    });

    it('should handle fractional days', () => {
      const r1 = getRetrievability(0.5, 10);
      const r2 = getRetrievability(1, 10);
      expect(r1).toBeGreaterThan(r2);
    });

    it('should be monotonically decreasing with elapsed time', () => {
      const s = 10;
      let prevR = 1;
      for (let t = 0; t <= 100; t += 10) {
        const r = getRetrievability(t, s);
        expect(r).toBeLessThanOrEqual(prevR);
        prevR = r;
      }
    });

    // Specific retention target tests
    it('should achieve 90% retention at specific stability/elapsed ratio', () => {
      // Find what elapsed days gives 90% retention for stability=10
      // R = (1 + F * (t/s))^D where F and D are FSRS constants
      const s = 10;
      const r = getRetrievability(s, s);
      expect(r).toBeCloseTo(0.9, 1);
    });

    it('should achieve ~70% retention at appropriate elapsed time', () => {
      // For stability=10, find where R≈0.7
      const s = 10;
      // Approximate: larger elapsed time
      const r = getRetrievability(s * 3, s);
      expect(r).toBeLessThan(0.9);
    });
  });

  describe('nextStability', () => {
    it('should calculate next stability for rating 1 (Again)', () => {
      const s = 10;
      const d = 5;
      const r = 0.9;
      const rating = 1;
      const newS = nextStability(s, d, r, rating, DEFAULT_W);
      
      
      expect(newS).toBeGreaterThan(0);
    });

    it('should calculate next stability for rating 3 (Good)', () => {
      const s = 10;
      const d = 5;
      const r = 0.9;
      const rating = 3;
      const newS = nextStability(s, d, r, rating, DEFAULT_W);
      expect(newS).toBeGreaterThan(s); 
    });

    it('should verify bonus for Easy (rating 4)', () => {
        const s = 10;
        const d = 5;
        const r = 0.9;
        const sGood = nextStability(s, d, r, 3, DEFAULT_W);
        const sEasy = nextStability(s, d, r, 4, DEFAULT_W);
        
        
        if (DEFAULT_W[16] > 1) {
            expect(sEasy).toBeGreaterThan(sGood);
        }
    });

    it('should verify penalty for Hard (rating 2)', () => {
        const s = 10;
        const d = 5;
        const r = 0.9;
        const sGood = nextStability(s, d, r, 3, DEFAULT_W);
        const sHard = nextStability(s, d, r, 2, DEFAULT_W);
        
        
        
        
        
        if (DEFAULT_W[15] < 1) {
             expect(sHard).toBeLessThan(sGood);
        }
    });

    // New edge case tests
    it('should handle stability = 0', () => {
      const newS = nextStability(0, 5, 0.9, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
    });

    it('should handle stability near 0', () => {
      const newS = nextStability(0.001, 5, 0.9, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
      expect(newS).toBeGreaterThanOrEqual(0);
    });

    it('should handle difficulty = 1 (minimum)', () => {
      const newS = nextStability(10, 1, 0.9, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
      expect(newS).toBeGreaterThan(0);
    });

    it('should handle difficulty = 10 (maximum)', () => {
      const newS = nextStability(10, 10, 0.9, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
      expect(newS).toBeGreaterThan(0);
    });

    it('should handle retrievability = 0', () => {
      const newS = nextStability(10, 5, 0, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
    });

    it('should handle retrievability = 1', () => {
      const newS = nextStability(10, 5, 1, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
    });

    it('should handle very low retrievability', () => {
      const newS = nextStability(10, 5, 0.01, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
    });

    it('should handle very high stability', () => {
      const newS = nextStability(1000, 5, 0.9, 3, DEFAULT_W);
      expect(Number.isFinite(newS)).toBe(true);
      expect(newS).toBeGreaterThan(0);
    });

    it('should always return positive stability for Again', () => {
      for (let s = 0.1; s <= 100; s *= 2) {
        for (let d = 1; d <= 10; d += 2) {
          const newS = nextStability(s, d, 0.5, 1, DEFAULT_W);
          expect(newS).toBeGreaterThan(0);
        }
      }
    });

    it('should increase stability for Good/Easy on review cards', () => {
      const s = 10;
      const d = 5;
      const r = 0.9;
      const sGood = nextStability(s, d, r, 3, DEFAULT_W);
      const sEasy = nextStability(s, d, r, 4, DEFAULT_W);
      expect(sGood).toBeGreaterThan(s);
      expect(sEasy).toBeGreaterThan(s);
    });

    it('should decrease stability on Again', () => {
      const s = 10;
      const d = 5;
      const r = 0.9;
      const sAgain = nextStability(s, d, r, 1, DEFAULT_W);
      expect(sAgain).toBeLessThan(s);
    });
  });

  describe('nextDifficulty', () => {
    it('should decrease difficulty for Easy (4)', () => {
      const d = 5.0;
      const newD = nextDifficulty(d, 4, DEFAULT_W);
      expect(newD).toBeLessThan(d);
    });

    it('should increase difficulty for Hard (2)', () => {
      const d = 5.0;
      const newD = nextDifficulty(d, 2, DEFAULT_W);
      expect(newD).toBeGreaterThan(d);
    });

    it('should clamp difficulty between 1 and 10', () => {
      
        expect(nextDifficulty(10, 1, DEFAULT_W)).toBeLessThanOrEqual(10);
      
        expect(nextDifficulty(1, 4, DEFAULT_W)).toBeGreaterThanOrEqual(1);
    });

    // New edge case tests
    it('should handle difficulty = 0', () => {
      const newD = nextDifficulty(0, 3, DEFAULT_W);
      expect(newD).toBeGreaterThanOrEqual(1);
      expect(newD).toBeLessThanOrEqual(10);
    });

    it('should handle difficulty = 1 with Easy', () => {
      const newD = nextDifficulty(1, 4, DEFAULT_W);
      expect(newD).toBeGreaterThanOrEqual(1);
    });

    it('should handle difficulty = 10 with Again', () => {
      const newD = nextDifficulty(10, 1, DEFAULT_W);
      expect(newD).toBeLessThanOrEqual(10);
    });

    it('should handle extreme difficulty values', () => {
      const newD1 = nextDifficulty(-100, 3, DEFAULT_W);
      const newD2 = nextDifficulty(100, 3, DEFAULT_W);
      expect(newD1).toBeGreaterThanOrEqual(1);
      expect(newD2).toBeLessThanOrEqual(10);
    });

    it('should keep difficulty stable for Good (3)', () => {
      const d = 5;
      const newD = nextDifficulty(d, 3, DEFAULT_W);
      // Rating 3 should have minimal effect
      expect(Math.abs(newD - d)).toBeLessThan(2);
    });

    it('should handle all ratings 1-4', () => {
      for (let rating = 1; rating <= 4; rating++) {
        const newD = nextDifficulty(5, rating, DEFAULT_W);
        expect(newD).toBeGreaterThanOrEqual(1);
        expect(newD).toBeLessThanOrEqual(10);
      }
    });

    it('should monotonically decrease with higher ratings', () => {
      const d = 5;
      const d1 = nextDifficulty(d, 1, DEFAULT_W);
      const d2 = nextDifficulty(d, 2, DEFAULT_W);
      const d3 = nextDifficulty(d, 3, DEFAULT_W);
      const d4 = nextDifficulty(d, 4, DEFAULT_W);
      expect(d1).toBeGreaterThanOrEqual(d2);
      expect(d2).toBeGreaterThanOrEqual(d3);
      expect(d3).toBeGreaterThanOrEqual(d4);
    });
  });

  describe('computeCardLoss', () => {
      it('should return a number', () => {
          const logs: ReviewLog[] = [
              createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 1, card_id: '1' }),
              createLog({ state: 1, elapsed_days: 1, scheduled_days: 1, grade: 3, card_id: '1' })
          ];
          const loss = computeCardLoss(logs, DEFAULT_W);
          expect(typeof loss).toBe('number');
          expect(isNaN(loss)).toBe(false);
      });

      // New edge case tests
      it('should return 0 for empty logs', () => {
        const loss = computeCardLoss([], DEFAULT_W);
        expect(loss).toBe(0);
      });

      it('should handle single log entry', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' })
        ];
        const loss = computeCardLoss(logs, DEFAULT_W);
        expect(Number.isFinite(loss)).toBe(true);
      });

      it('should handle only state 0 and 1 logs (learning)', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 1, card_id: '1' }),
          createLog({ state: 1, elapsed_days: 1, scheduled_days: 0, grade: 2, card_id: '1' }),
          createLog({ state: 1, elapsed_days: 1, scheduled_days: 0, grade: 3, card_id: '1' })
        ];
        const loss = computeCardLoss(logs, DEFAULT_W);
        expect(loss).toBe(0); // No Review state logs means no loss calculated
      });

      it('should handle review state logs (state >= 2)', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 1, scheduled_days: 1, grade: 3, card_id: '1' })
        ];
        const loss = computeCardLoss(logs, DEFAULT_W);
        expect(Number.isFinite(loss)).toBe(true);
        expect(loss).toBeGreaterThanOrEqual(0);
      });

      it('should return higher loss for incorrect answers', () => {
        const correctLogs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 10, scheduled_days: 10, grade: 3, card_id: '1' })
        ];
        const incorrectLogs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 10, scheduled_days: 10, grade: 1, card_id: '1' })
        ];
        const correctLoss = computeCardLoss(correctLogs, DEFAULT_W);
        const incorrectLoss = computeCardLoss(incorrectLogs, DEFAULT_W);
        // Incorrect answers at high retrievability should have higher loss
        expect(incorrectLoss).toBeGreaterThan(correctLoss);
      });

      it('should handle very large elapsed days', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 1000, scheduled_days: 10, grade: 3, card_id: '1' })
        ];
        const loss = computeCardLoss(logs, DEFAULT_W);
        expect(Number.isFinite(loss)).toBe(true);
      });

      it('should handle all grades 1-4', () => {
        for (let grade = 1; grade <= 4; grade++) {
          const logs: ReviewLog[] = [
            createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: grade as 1|2|3|4, card_id: '1' }),
            createLog({ state: 2, elapsed_days: 5, scheduled_days: 5, grade: grade as 1|2|3|4, card_id: '1' })
          ];
          const loss = computeCardLoss(logs, DEFAULT_W);
          expect(Number.isFinite(loss)).toBe(true);
        }
      });

      it('should handle long review history', () => {
        const logs: ReviewLog[] = [];
        let elapsed = 0;
        for (let i = 0; i < 100; i++) {
          logs.push(createLog({
            state: i < 2 ? i as 0 | 1 : 2,
            elapsed_days: elapsed,
            scheduled_days: 1,
            grade: (i % 4 + 1) as 1|2|3|4,
            card_id: '1'
          }));
          elapsed += 1;
        }
        const loss = computeCardLoss(logs, DEFAULT_W);
        expect(Number.isFinite(loss)).toBe(true);
      });
  });
  
  describe('clampWeight', () => {
      it('should clamp values', () => {
          expect(clampWeight(WEIGHT_BOUNDS.min - 1)).toBe(WEIGHT_BOUNDS.min);
          expect(clampWeight(WEIGHT_BOUNDS.max + 1)).toBe(WEIGHT_BOUNDS.max);
          expect(clampWeight(1.0)).toBe(1.0);
      });

      // New edge case tests
      it('should handle 0', () => {
        expect(clampWeight(0)).toBe(WEIGHT_BOUNDS.min);
      });

      it('should handle negative values', () => {
        expect(clampWeight(-100)).toBe(WEIGHT_BOUNDS.min);
      });

      it('should handle very large values', () => {
        expect(clampWeight(1000)).toBe(WEIGHT_BOUNDS.max);
      });

      it('should handle exact boundaries', () => {
        expect(clampWeight(WEIGHT_BOUNDS.min)).toBe(WEIGHT_BOUNDS.min);
        expect(clampWeight(WEIGHT_BOUNDS.max)).toBe(WEIGHT_BOUNDS.max);
      });

      it('should handle values just inside boundaries', () => {
        expect(clampWeight(WEIGHT_BOUNDS.min + 0.001)).toBe(WEIGHT_BOUNDS.min + 0.001);
        expect(clampWeight(WEIGHT_BOUNDS.max - 0.001)).toBe(WEIGHT_BOUNDS.max - 0.001);
      });

      it('should handle NaN', () => {
        // NaN comparison behavior
        const result = clampWeight(NaN);
        // Math.max/min with NaN returns NaN
        expect(Number.isNaN(result)).toBe(true);
      });

      it('should handle Infinity', () => {
        expect(clampWeight(Infinity)).toBe(WEIGHT_BOUNDS.max);
        expect(clampWeight(-Infinity)).toBe(WEIGHT_BOUNDS.min);
      });
  });

  describe('runOptimizerIteration', () => {
      it('should return updated weights', () => {
          const logs: ReviewLog[] = [
               createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 1, card_id: '1' }),
               createLog({ state: 2, elapsed_days: 1, scheduled_days: 1, grade: 3, card_id: '1' })
          ];
          const batch = [logs];
          const newW = runOptimizerIteration(
              DEFAULT_W,
              batch,
              OPTIMIZER_CONFIG.targetIndices,
              OPTIMIZER_CONFIG.learningRate,
              OPTIMIZER_CONFIG.finiteDiffH
          );
          
          expect(newW).toHaveLength(DEFAULT_W.length);
          
          expect(newW).not.toEqual(DEFAULT_W);
      });

      // New edge case tests
      it('should handle empty batch', () => {
        const newW = runOptimizerIteration(
          DEFAULT_W,
          [],
          OPTIMIZER_CONFIG.targetIndices,
          OPTIMIZER_CONFIG.learningRate,
          OPTIMIZER_CONFIG.finiteDiffH
        );
        // With empty batch, gradients should be 0, weights unchanged
        expect(newW).toHaveLength(DEFAULT_W.length);
      });

      it('should handle single card batch', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 5, scheduled_days: 5, grade: 3, card_id: '1' })
        ];
        const newW = runOptimizerIteration(
          DEFAULT_W,
          [logs],
          OPTIMIZER_CONFIG.targetIndices,
          OPTIMIZER_CONFIG.learningRate,
          OPTIMIZER_CONFIG.finiteDiffH
        );
        expect(newW).toHaveLength(DEFAULT_W.length);
      });

      it('should handle large batch', () => {
        const batch: ReviewLog[][] = [];
        for (let i = 0; i < 100; i++) {
          batch.push([
            createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: `${i}` }),
            createLog({ state: 2, elapsed_days: 5, scheduled_days: 5, grade: (i % 4 + 1) as 1|2|3|4, card_id: `${i}` })
          ]);
        }
        const newW = runOptimizerIteration(
          DEFAULT_W,
          batch,
          OPTIMIZER_CONFIG.targetIndices,
          OPTIMIZER_CONFIG.learningRate,
          OPTIMIZER_CONFIG.finiteDiffH
        );
        expect(newW).toHaveLength(DEFAULT_W.length);
        // Weights should change
        expect(newW).not.toEqual(DEFAULT_W);
      });

      it('should respect target indices', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 5, scheduled_days: 5, grade: 3, card_id: '1' })
        ];
        const targetIndices = [0, 1]; // Only update first two weights
        const newW = runOptimizerIteration(
          DEFAULT_W,
          [logs],
          targetIndices,
          OPTIMIZER_CONFIG.learningRate,
          OPTIMIZER_CONFIG.finiteDiffH
        );
        // Indices not in targetIndices should remain unchanged
        for (let i = 2; i < DEFAULT_W.length; i++) {
          expect(newW[i]).toBe(DEFAULT_W[i]);
        }
      });

      it('should handle empty target indices', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 5, scheduled_days: 5, grade: 3, card_id: '1' })
        ];
        const newW = runOptimizerIteration(
          DEFAULT_W,
          [logs],
          [], // No indices to update
          OPTIMIZER_CONFIG.learningRate,
          OPTIMIZER_CONFIG.finiteDiffH
        );
        expect(newW).toEqual(DEFAULT_W);
      });

      it('should handle zero learning rate', () => {
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 3, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 5, scheduled_days: 5, grade: 3, card_id: '1' })
        ];
        const newW = runOptimizerIteration(
          DEFAULT_W,
          [logs],
          OPTIMIZER_CONFIG.targetIndices,
          0, // Zero learning rate
          OPTIMIZER_CONFIG.finiteDiffH
        );
        expect(newW).toEqual(DEFAULT_W);
      });

      it('should clamp weights to valid bounds', () => {
        const extremeW = DEFAULT_W.map(() => 0.001); // Very low weights
        const logs: ReviewLog[] = [
          createLog({ state: 0, elapsed_days: 0, scheduled_days: 0, grade: 1, card_id: '1' }),
          createLog({ state: 2, elapsed_days: 100, scheduled_days: 5, grade: 1, card_id: '1' })
        ];
        const newW = runOptimizerIteration(
          extremeW,
          [logs],
          OPTIMIZER_CONFIG.targetIndices,
          OPTIMIZER_CONFIG.learningRate,
          OPTIMIZER_CONFIG.finiteDiffH
        );
        for (const w of newW) {
          expect(w).toBeGreaterThanOrEqual(WEIGHT_BOUNDS.min);
          expect(w).toBeLessThanOrEqual(WEIGHT_BOUNDS.max);
        }
      });
  });

  describe('Constants', () => {
    it('should have correct DECAY value', () => {
      expect(DECAY).toBe(-0.6);
    });

    it('should have correct FACTOR value', () => {
      // FACTOR = 0.9^(1/DECAY) - 1
      const expectedFactor = Math.pow(0.9, 1 / DECAY) - 1;
      expect(FACTOR).toBeCloseTo(expectedFactor, 10);
    });

    it('should have valid WEIGHT_BOUNDS', () => {
      expect(WEIGHT_BOUNDS.min).toBeLessThan(WEIGHT_BOUNDS.max);
      expect(WEIGHT_BOUNDS.min).toBeGreaterThan(0);
    });

    it('should have valid OPTIMIZER_CONFIG', () => {
      expect(OPTIMIZER_CONFIG.learningRate).toBeGreaterThan(0);
      expect(OPTIMIZER_CONFIG.iterations).toBeGreaterThan(0);
      expect(OPTIMIZER_CONFIG.maxBatchSize).toBeGreaterThan(0);
      expect(OPTIMIZER_CONFIG.finiteDiffH).toBeGreaterThan(0);
      expect(Array.isArray(OPTIMIZER_CONFIG.targetIndices)).toBe(true);
    });
  });
});

