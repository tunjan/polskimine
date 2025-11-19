import { describe, it, expect } from 'vitest';
import { calculateNextReview, isCardDue } from './srs';
import { Card } from '../types';
import { State } from 'ts-fsrs';
import { FSRS_DEFAULTS } from '../constants';

const deterministicFsrs = { ...FSRS_DEFAULTS, enable_fuzzing: false };

const createMockCard = (): Card => ({
  id: '1',
  targetSentence: 'Test',
  nativeTranslation: 'Test',
  notes: '',
  status: 'learning',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  state: State.New,
});

describe('calculateNextReview (FSRS)', () => {
  it('keeps cards in the learning state for Again grades', () => {
    const result = calculateNextReview(createMockCard(), 'Again', deterministicFsrs);
    expect(result.status).toBe('learning');
    expect(result.state).not.toBe(State.Review);
    expect(result.interval).toBeGreaterThanOrEqual(0);
    expect(() => new Date(result.dueDate).toISOString()).not.toThrow();
  });

  it('promotes mature cards to graduated after successful reviews', () => {
    const matureCard: Card = {
      ...createMockCard(),
      status: 'graduated',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      state: State.Review,
      stability: 25,
      difficulty: 1.2,
      elapsed_days: 120,
      scheduled_days: 120,
      interval: 120,
      reps: 50,
    };

    const result = calculateNextReview(matureCard, 'Good', deterministicFsrs);
    expect(result.status).toBe('graduated');
    expect(result.state).toBe(State.Review);
    expect(result.stability ?? 0).toBeGreaterThan(0);
    expect(result.reps ?? 0).toBeGreaterThan(matureCard.reps ?? 0);
    expect(new Date(result.dueDate).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('isCardDue', () => {
  it('returns true for past due dates', () => {
    const pastCard = { ...createMockCard(), dueDate: new Date(Date.now() - 86400000).toISOString() };
    expect(isCardDue(pastCard)).toBe(true);
  });

  it('returns false for future due dates', () => {
    const futureCard = { ...createMockCard(), dueDate: new Date(Date.now() + 86400000).toISOString() };
    expect(isCardDue(futureCard)).toBe(false);
  });
});
