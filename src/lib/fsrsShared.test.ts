import { describe, it, expect } from 'vitest';
import {
  getRetrievability,
  nextStability,
  nextDifficulty,
  computeCardLoss,
  clampWeight,
  runOptimizerIteration,
  WEIGHT_BOUNDS,
  OPTIMIZER_CONFIG
} from './fsrsShared';
import { ReviewLog } from '@/types';



const DEFAULT_W = [
  0.40255, 1.18385, 3.173, 15.69105, 
  7.19605, 0.5345, 1.4604, 0.00405, 1.5491, 0.10865, 
  1.1009, 2.7667, 0.08985, 0.32355, 1.36395, 0.0965, 2.7061
];

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
  });

  describe('computeCardLoss', () => {
      it('should return a number', () => {
          const logs: ReviewLog[] = [
              { state: 0, elapsed_days: 0, scheduled_days: 0, grade: 1, card_id: '1' },
              { state: 1, elapsed_days: 1, scheduled_days: 1, grade: 3, card_id: '1' }
          ];
          const loss = computeCardLoss(logs, DEFAULT_W);
          expect(typeof loss).toBe('number');
          expect(isNaN(loss)).toBe(false);
      });
  });
  
  describe('clampWeight', () => {
      it('should clamp values', () => {
          expect(clampWeight(WEIGHT_BOUNDS.min - 1)).toBe(WEIGHT_BOUNDS.min);
          expect(clampWeight(WEIGHT_BOUNDS.max + 1)).toBe(WEIGHT_BOUNDS.max);
          expect(clampWeight(1.0)).toBe(1.0);
      });
  });

  describe('runOptimizerIteration', () => {
      it('should return updated weights', () => {
          const logs: ReviewLog[] = [
               { state: 0, elapsed_days: 0, scheduled_days: 0, grade: 1, card_id: '1' },
               { state: 2, elapsed_days: 1, scheduled_days: 1, grade: 3, card_id: '1' }
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
  });
});
