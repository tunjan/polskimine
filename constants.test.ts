import { describe, it, expect } from 'vitest';
import { MOCK_CARDS, MOCK_HISTORY, STORAGE_KEY, HISTORY_KEY, SRS_CONFIG, FSRS_DEFAULTS } from '@/constants';

describe('Constants', () => {
  describe('MOCK_CARDS', () => {
    it('contains array of cards', () => {
      expect(Array.isArray(MOCK_CARDS)).toBe(true);
      expect(MOCK_CARDS.length).toBeGreaterThan(0);
    });

    it('has cards with required properties', () => {
      MOCK_CARDS.forEach(card => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('targetSentence');
        expect(card).toHaveProperty('nativeTranslation');
        expect(card).toHaveProperty('status');
        expect(card).toHaveProperty('interval');
        expect(card).toHaveProperty('easeFactor');
        expect(card).toHaveProperty('dueDate');
      });
    });

    it('includes cards with different statuses', () => {
      const statuses = MOCK_CARDS.map(c => c.status);
      const uniqueStatuses = new Set(statuses);
      expect(uniqueStatuses.size).toBeGreaterThan(1);
    });

    it('includes cards with and without target words', () => {
      const withTarget = MOCK_CARDS.filter(c => c.targetWord);
      const withoutTarget = MOCK_CARDS.filter(c => !c.targetWord);
      
      expect(withTarget.length).toBeGreaterThan(0);
      expect(withoutTarget.length).toBeGreaterThan(0);
    });

    it('has cards with valid due dates', () => {
      MOCK_CARDS.forEach(card => {
        const date = new Date(card.dueDate);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('MOCK_HISTORY', () => {
    it('is an object with date keys', () => {
      expect(typeof MOCK_HISTORY).toBe('object');
      expect(MOCK_HISTORY).not.toBeNull();
    });

    it('has date string keys in YYYY-MM-DD format', () => {
      Object.keys(MOCK_HISTORY).forEach(key => {
        expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('has numeric review counts as values', () => {
      Object.values(MOCK_HISTORY).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });

    it('generates history for past year', () => {
      const dates = Object.keys(MOCK_HISTORY);
      expect(dates.length).toBeGreaterThan(0);
      
      // Check that dates are in the past
      dates.forEach(dateStr => {
        const date = new Date(dateStr);
        expect(date.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });
  });

  describe('Storage keys', () => {
    it('defines STORAGE_KEY', () => {
      expect(STORAGE_KEY).toBe('polski_mining_deck_v1');
    });

    it('defines HISTORY_KEY', () => {
      expect(HISTORY_KEY).toBe('polski_mining_history_v1');
    });
  });

  describe('SRS_CONFIG', () => {
    it('defines CUTOFF_HOUR', () => {
      expect(SRS_CONFIG.CUTOFF_HOUR).toBe(4);
    });

    it('has numeric cutoff hour', () => {
      expect(typeof SRS_CONFIG.CUTOFF_HOUR).toBe('number');
      expect(SRS_CONFIG.CUTOFF_HOUR).toBeGreaterThanOrEqual(0);
      expect(SRS_CONFIG.CUTOFF_HOUR).toBeLessThan(24);
    });
  });

  describe('FSRS_DEFAULTS', () => {
    it('has request_retention between 0 and 1', () => {
      expect(FSRS_DEFAULTS.request_retention).toBeGreaterThan(0);
      expect(FSRS_DEFAULTS.request_retention).toBeLessThan(1);
    });

    it('has positive maximum_interval', () => {
      expect(FSRS_DEFAULTS.maximum_interval).toBeGreaterThan(0);
    });

    it('defines enable_fuzzing', () => {
      expect(typeof FSRS_DEFAULTS.enable_fuzzing).toBe('boolean');
    });

    it('has array of weights', () => {
      expect(Array.isArray(FSRS_DEFAULTS.w)).toBe(true);
      expect(FSRS_DEFAULTS.w.length).toBe(19);
    });

    it('has numeric weight values', () => {
      FSRS_DEFAULTS.w.forEach(weight => {
        expect(typeof weight).toBe('number');
      });
    });
  });
});
