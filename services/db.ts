import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card, ReviewHistory } from '../types';

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

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<PolskiMineDB>> | null = null;

  private getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB<PolskiMineDB>(DB_NAME, DB_VERSION, {
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
    return this.dbPromise;
  }

  async getCards(): Promise<Card[]> {
    const db = await this.getDB();
    return db.getAll('cards');
  }

  async saveCard(card: Card) {
    const db = await this.getDB();
    await db.put('cards', card);
  }

  async deleteCard(id: string) {
    const db = await this.getDB();
    await db.delete('cards', id);
  }

  async getHistory(): Promise<ReviewHistory> {
    const db = await this.getDB();
    const entries = await db.getAll('history');
    return entries.reduce((acc, entry) => {
      acc[entry.date] = entry.count;
      return acc;
    }, {} as ReviewHistory);
  }

  async incrementHistory(date: string, delta: number = 1) {
    const db = await this.getDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    
    const existing = await store.get(date);
    const currentCount = existing ? existing.count : 0;
    const count = Math.max(0, currentCount + delta);
    
    await store.put({ date, count });
    await tx.done;
  }
  
  async saveAllCards(cards: Card[]) {
    const db = await this.getDB();
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    await Promise.all(cards.map(card => store.put(card)));
    await tx.done;
  }

  async saveFullHistory(history: ReviewHistory) {
    const db = await this.getDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    await Promise.all(
      Object.entries(history).map(([date, count]) => store.put({ date, count }))
    );
    await tx.done;
  }

  async getDueCards(now: Date = new Date()): Promise<Card[]> {
    const db = await this.getDB();
    const allCards = await db.getAll('cards');
    // Note: For very large decks, we should use an index on 'dueDate'.
    // However, since 'isCardDue' involves complex logic (cutoff hours),
    // a simple index scan might not be enough without storing the computed 'srsDate'.
    // For < 10k cards, filtering in JS is fine.
    const { isCardDue } = await import('./srs'); // Dynamic import to avoid circular dependency if any
    return allCards.filter(card => isCardDue(card, now));
  }
}

export const db = new DatabaseService();
