import { describe, it, expect } from 'vitest';
import { applyStudyLimits } from './studyLimits';
import { Card } from '../types';

const buildCard = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? `card-${Math.random().toString(16).slice(2)}`,
  targetSentence: 'To jest zdanie.',
  nativeTranslation: 'This is a sentence.',
  notes: '',
  status: overrides.status ?? 'learning',
  interval: overrides.interval ?? 0,
  easeFactor: overrides.easeFactor ?? 2.5,
  dueDate: overrides.dueDate ?? new Date().toISOString(),
  reps: overrides.reps ?? 0,
  ...overrides,
});

describe('applyStudyLimits', () => {
  it('limits the number of new cards while allowing unlimited reviews', () => {
    const cards = [
      buildCard({ id: 'new-1', status: 'new' }),
      buildCard({ id: 'new-2', status: 'new' }),
      buildCard({ id: 'grad-1', status: 'graduated', reps: 10 }),
      buildCard({ id: 'new-3', status: 'new' }),
    ];

    const result = applyStudyLimits(cards, { dailyNewLimit: 2, dailyReviewLimit: 0 });
    expect(result.map(card => card.id)).toEqual(['new-1', 'new-2', 'grad-1']);
  });

  it('caps total reviews even if more cards are available', () => {
    const cards = [
      buildCard({ id: 'grad-1', status: 'graduated', reps: 5 }),
      buildCard({ id: 'grad-2', status: 'graduated', reps: 5 }),
      buildCard({ id: 'grad-3', status: 'graduated', reps: 5 }),
    ];

    const result = applyStudyLimits(cards, { dailyNewLimit: 0, dailyReviewLimit: 2 });
    expect(result.map(card => card.id)).toEqual(['grad-1', 'grad-2']);
  });

  it('applies both limits simultaneously', () => {
    const cards = [
      buildCard({ id: 'new-1', status: 'new' }),
      buildCard({ id: 'grad-1', status: 'graduated', reps: 5 }),
      buildCard({ id: 'new-2', status: 'new' }),
      buildCard({ id: 'grad-2', status: 'graduated', reps: 5 }),
      buildCard({ id: 'new-3', status: 'new' }),
    ];

    const result = applyStudyLimits(cards, { dailyNewLimit: 1, dailyReviewLimit: 3 });
    expect(result.map(card => card.id)).toEqual(['new-1', 'grad-1', 'grad-2']);
  });

  it('returns all cards when no limits are configured', () => {
    const cards = [buildCard({ id: 'a', status: 'new' }), buildCard({ id: 'b', status: 'graduated', reps: 3 })];
    expect(applyStudyLimits(cards, { dailyNewLimit: 0, dailyReviewLimit: 0 })).toEqual(cards);
  });
});
