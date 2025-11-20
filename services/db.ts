import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card, ReviewHistory } from '../types';

interface PolskiMineDB extends DBSchema {
  cards: {
    key: string;
    value: Card;
    indexes: { 'dueDate': string; 'status': string };
  };
  history: {
    key: string; // Date string 'YYYY-MM-DD'
    value: { date: string; count: number };
  };
}

const DB_NAME = 'polskimine-db';
const DB_VERSION = 2;

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<PolskiMineDB>> | null = null;

  private getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB<PolskiMineDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          let cardStore;
          if (!db.objectStoreNames.contains('cards')) {
            cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          } else {
            cardStore = transaction.objectStore('cards');
          }

          if (!cardStore.indexNames.contains('dueDate')) {
            cardStore.createIndex('dueDate', 'dueDate');
          }
          if (!cardStore.indexNames.contains('status')) {
            cardStore.createIndex('status', 'status');
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

  async clearAllCards() {
    const db = await this.getDB();
    await db.clear('cards');
  }

  async clearHistory() {
    const db = await this.getDB();
    await db.clear('history');
  }

  async getDueCards(now: Date = new Date()): Promise<Card[]> {
    const db = await this.getDB();
    const { getSRSDate } = await import('./srs');
    
    const srsToday = getSRSDate(now);
    // We want cards due on or before "today".
    // Since isCardDue checks isBefore(due, srsToday) || isSameDay(due, srsToday),
    // and srsToday is the start of the day (00:00:00),
    // we effectively want any card with dueDate < (srsToday + 1 day).
    // const cutoffDate = new Date(srsToday);
    // cutoffDate.setDate(cutoffDate.getDate() + 1);
    
    // Fix: Use 'now' as cutoff to allow intraday scheduling
    const cutoffDate = new Date();
    
    const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
    const dueCandidates = await db.getAllFromIndex('cards', 'dueDate', range);
    
    return dueCandidates.filter(card => card.status !== 'known');
  }

  async getStats(): Promise<{ total: number; due: number; learned: number }> {
    const db = await this.getDB();
    const { getSRSDate } = await import('./srs');
    
    const total = await db.count('cards');
    
    const srsToday = getSRSDate(new Date());
    const cutoffDate = new Date(srsToday);
    cutoffDate.setDate(cutoffDate.getDate() + 1);
    const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
    
    // We fetch candidates to filter out 'known' cards from the due count
    const dueCandidates = await db.getAllFromIndex('cards', 'dueDate', range);
    const due = dueCandidates.filter(c => c.status !== 'known').length;
    
    const graduatedCount = await db.countFromIndex('cards', 'status', 'graduated');
    const knownCount = await db.countFromIndex('cards', 'status', 'known');
    const learned = graduatedCount + knownCount;
    
    return { total, due, learned };
  }

  async getTodayReviewStats(): Promise<{ newCards: number; reviewCards: number }> {
    const db = await this.getDB();
    const allCards = await db.getAll('cards');
    const { getSRSDate } = await import('./srs');
    
    const srsToday = getSRSDate(new Date());
    const nextDay = new Date(srsToday);
    nextDay.setDate(nextDay.getDate() + 1);
    
    let newCards = 0;
    let reviewCards = 0;

    for (const card of allCards) {
      if (card.last_review) {
        const reviewDate = new Date(card.last_review);
        if (reviewDate >= srsToday && reviewDate < nextDay) {
          if ((card.reps || 0) === 1) {
            newCards++;
          } else if ((card.reps || 0) > 1) {
            reviewCards++;
          }
        }
      }
    }
    return { newCards, reviewCards };
  }

  async getCramCards(limit: number, tag?: string): Promise<Card[]> {
    const db = await this.getDB();
    let cards = await db.getAll('cards');
    
    // Filter by tag if provided
    if (tag) {
      cards = cards.filter(card => card.tags && card.tags.includes(tag));
    }
    
    // Exclude 'known' cards unless specifically requested? 
    // For now, we exclude them to be consistent with study mode, 
    // but cramming usually implies reviewing everything.
    // Let's include everything except maybe suspended cards if we had that status.
    // Actually, 'known' in this app seems to mean "I know this perfectly, don't show it again".
    // But for cramming, maybe I want to review even those?
    // Let's stick to active cards (new, learning, graduated).
    cards = cards.filter(card => card.status !== 'known');

    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    return cards.slice(0, limit);
  }
}

export const db = new DatabaseService();
