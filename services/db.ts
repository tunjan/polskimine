import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card, ReviewHistory } from '../types';
import { MOCK_CARDS, MOCK_HISTORY } from '../constants';

interface PolskiMineDB extends DBSchema {
  cards: {
    key: string;
    value: Card;
  };
  history: {
    key: string; // Date string 'YYYY-MM-DD'
    value: { date: string; count: number };
  };
}

const DB_NAME = 'polskimine-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PolskiMineDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PolskiMineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'date' });
        }
      },
    });
  }
  return dbPromise;
};

export const db = {
  async getCards(): Promise<Card[]> {
    const db = await initDB();
    const cards = await db.getAll('cards');
    if (cards.length === 0) {
      // Seed with mock data if empty (first run)
      // In a real app, you might not want this, but for this transition it helps
      // Check if we have migrated data or if it's truly a fresh start
      // For now, let's return empty array or MOCK_CARDS if strictly needed
      // But the Context handles the fallback. Let's just return what we find.
      return [];
    }
    return cards;
  },

  async saveCard(card: Card) {
    const db = await initDB();
    await db.put('cards', card);
  },

  async deleteCard(id: string) {
    const db = await initDB();
    await db.delete('cards', id);
  },

  async getHistory(): Promise<ReviewHistory> {
    const db = await initDB();
    const entries = await db.getAll('history');
    // Convert back to Record<string, number>
    return entries.reduce((acc, entry) => {
      acc[entry.date] = entry.count;
      return acc;
    }, {} as ReviewHistory);
  },

  async incrementHistory(date: string, delta: number = 1) {
    const db = await initDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    
    const existing = await store.get(date);
    const currentCount = existing ? existing.count : 0;
    const count = Math.max(0, currentCount + delta);
    
    await store.put({ date, count });
    await tx.done;
  },
  
  // Bulk operations for initial migration or restore
  async saveAllCards(cards: Card[]) {
    const db = await initDB();
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    await Promise.all(cards.map(card => store.put(card)));
    await tx.done;
  },

  async saveFullHistory(history: ReviewHistory) {
    const db = await initDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    await Promise.all(
      Object.entries(history).map(([date, count]) => store.put({ date, count }))
    );
    await tx.done;
  }
};
