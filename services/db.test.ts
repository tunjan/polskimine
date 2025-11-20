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

  it('saves multiple cards at once', async () => {
    const cards = [
      createCard({ id: '1', targetSentence: 'Card 1' }),
      createCard({ id: '2', targetSentence: 'Card 2' }),
      createCard({ id: '3', targetSentence: 'Card 3' }),
    ];

    await db.saveAllCards(cards);
    const saved = await db.getCards();
    expect(saved).toHaveLength(3);
  });

  it('updates existing card', async () => {
    const card = createCard({ id: 'update-test', targetSentence: 'Original' });
    await db.saveCard(card);

    const updated = { ...card, targetSentence: 'Updated' };
    await db.saveCard(updated);

    const cards = await db.getCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].targetSentence).toBe('Updated');
  });

  it('deletes a card', async () => {
    const card = createCard({ id: 'delete-me' });
    await db.saveCard(card);
    
    await db.deleteCard('delete-me');
    
    const cards = await db.getCards();
    expect(cards).toHaveLength(0);
  });

  it('clears all cards', async () => {
    await db.saveAllCards([
      createCard({ id: '1' }),
      createCard({ id: '2' }),
      createCard({ id: '3' }),
    ]);

    await db.clearAllCards();
    
    const cards = await db.getCards();
    expect(cards).toHaveLength(0);
  });

  it('saves full history object', async () => {
    const history = {
      '2024-01-01': 10,
      '2024-01-02': 5,
      '2024-01-03': 8,
    };

    await db.saveFullHistory(history);
    const saved = await db.getHistory();
    
    expect(saved).toEqual(history);
  });

  it('clears history', async () => {
    await db.incrementHistory('2024-01-01', 10);
    await db.clearHistory();
    
    const history = await db.getHistory();
    expect(Object.keys(history)).toHaveLength(0);
  });

  it('prevents negative review counts', async () => {
    const today = new Date().toISOString().split('T')[0];
    await db.incrementHistory(today, 5);
    await db.incrementHistory(today, -10);
    
    const history = await db.getHistory();
    expect(history[today]).toBe(0);
  });

  it('handles cards with all statuses', async () => {
    await db.saveAllCards([
      createCard({ id: '1', status: 'new' }),
      createCard({ id: '2', status: 'learning' }),
      createCard({ id: '3', status: 'graduated' }),
      createCard({ id: '4', status: 'known' }),
    ]);

    const cards = await db.getCards();
    expect(cards).toHaveLength(4);
    expect(cards.map(c => c.status).sort()).toEqual(['graduated', 'known', 'learning', 'new']);
  });

  it('retrieves cards in correct order by due date', async () => {
    const date1 = new Date('2024-01-01').toISOString();
    const date2 = new Date('2024-01-02').toISOString();
    const date3 = new Date('2024-01-03').toISOString();

    await db.saveAllCards([
      createCard({ id: 'c', dueDate: date3 }),
      createCard({ id: 'a', dueDate: date1 }),
      createCard({ id: 'b', dueDate: date2 }),
    ]);

    const dueCards = await db.getDueCards(new Date('2024-01-05'));
    expect(dueCards.map(c => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('handles empty database gracefully', async () => {
    const cards = await db.getCards();
    const history = await db.getHistory();
    const stats = await db.getStats();
    const dueCards = await db.getDueCards();

    expect(cards).toEqual([]);
    expect(history).toEqual({});
    expect(stats).toEqual({ total: 0, due: 0, learned: 0 });
    expect(dueCards).toEqual([]);
  });

  it('saves and retrieves all card properties', async () => {
    const card: Card = {
      id: 'full-card',
      targetSentence: 'Test sentence',
      targetWord: 'Test',
      nativeTranslation: 'Translation',
      notes: 'Notes here',
      status: 'learning',
      interval: 5,
      easeFactor: 2.6,
      dueDate: new Date().toISOString(),
      stability: 10,
      difficulty: 5,
      elapsed_days: 3,
      scheduled_days: 5,
      reps: 10,
      lapses: 2,
      state: 1,
      last_review: new Date().toISOString(),
    };

    await db.saveCard(card);
    const saved = await db.getCards();
    
    expect(saved[0]).toMatchObject(card);
  });
});

