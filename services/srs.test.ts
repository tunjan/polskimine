import { describe, it, expect } from 'vitest';
import { calculateNextReview, isCardDue } from './srs';
import { Card } from '../types';

const mockCard: Card = {
  id: '1',
  targetSentence: 'Test',
  nativeTranslation: 'Test',
  notes: '',
  status: 'learning',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
};

describe('SRS Algorithm', () => {
  it('should schedule "Again" reviews for tomorrow (or same day learning step)', () => {
    const result = calculateNextReview(mockCard, 'Again');
    expect(result.interval).toBe(1);
    expect(result.status).toBe('learning');
    // Ease factor should decrease
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it('should increase interval for "Good" reviews', () => {
    const reviewCard = { ...mockCard, status: 'review' as const, interval: 1 };
    const result = calculateNextReview(reviewCard, 'Good');
    expect(result.interval).toBeGreaterThan(1);
    expect(result.status).toBe('review');
  });

  it('should graduate card when interval is high enough', () => {
    const reviewCard = { ...mockCard, status: 'review' as const, interval: 10, easeFactor: 2.5 };
    // 10 * 2.5 = 25, which is > 21
    const result = calculateNextReview(reviewCard, 'Good');
    expect(result.status).toBe('graduated');
  });
});

describe('isCardDue', () => {
  it('should return true for past due dates', () => {
    const pastCard = { ...mockCard, dueDate: new Date(Date.now() - 86400000).toISOString() };
    expect(isCardDue(pastCard)).toBe(true);
  });

  it('should return false for future due dates', () => {
    const futureCard = { ...mockCard, dueDate: new Date(Date.now() + 86400000).toISOString() };
    expect(isCardDue(futureCard)).toBe(false);
  });
});
