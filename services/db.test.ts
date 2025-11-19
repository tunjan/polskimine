import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { Card } from '../types';

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? `card-${Math.random().toString(16).slice(2)}`,
  targetSentence: overrides.targetSentence ?? 'To jest zdanie.',
  nativeTranslation: overrides.nativeTranslation ?? 'This is a sentence.',
  notes: overrides.notes ?? '',
  status: overrides.status ?? 'learning',
  interval: overrides.interval ?? 0,
  easeFactor: overrides.easeFactor ?? 2.5,
  dueDate: overrides.dueDate ?? new Date().toISOString(),
  ...overrides,
});

beforeEach(async () => {
  await db.clearAllCards();
  await db.clearHistory();
});

describe('DatabaseService', () => {
  it('persists cards and retrieves them intact', async () => {
    const card = createCard({ id: 'alpha', targetSentence: 'Cześć!' });
    await db.saveCard(card);
    const cards = await db.getCards();
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ id: 'alpha', targetSentence: 'Cześć!' });
  });

  it('calculates stats for due and learned cards', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000 * 2).toISOString();

    await db.saveAllCards([
      createCard({ id: 'new-due', status: 'new', dueDate: past }),
      createCard({ id: 'learning-due', status: 'learning', dueDate: past }),
      createCard({ id: 'known', status: 'known', dueDate: past }),
      createCard({ id: 'graduated-a', status: 'graduated', dueDate: future }),
      createCard({ id: 'graduated-b', status: 'graduated', dueDate: future }),
    ]);

    const stats = await db.getStats();
    expect(stats.total).toBe(5);
    expect(stats.due).toBe(2); // only non-known cards with past due dates
    expect(stats.learned).toBe(3); // graduated (interval > 90) + known
  });

  it('returns only actionable due cards', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000 * 2).toISOString();

    await db.saveAllCards([
      createCard({ id: 'due-learning', status: 'learning', dueDate: past }),
      createCard({ id: 'future-learning', status: 'learning', dueDate: future }),
      createCard({ id: 'known-card', status: 'known', dueDate: past }),
    ]);

    const dueCards = await db.getDueCards();
    expect(dueCards).toHaveLength(1);
    expect(dueCards[0].id).toBe('due-learning');
  });

  it('tracks review history increments and decrements safely', async () => {
    const today = new Date().toISOString().split('T')[0];
    await db.incrementHistory(today, 1);
    await db.incrementHistory(today, 5);
    await db.incrementHistory(today, -3);

    const history = await db.getHistory();
    expect(history[today]).toBe(3);
  });
});
