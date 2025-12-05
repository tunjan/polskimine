import { db } from '@/services/db/dexie';
import { ReviewHistory } from '@/types';
import { format } from 'date-fns';

type Language = keyof ReviewHistory | string;

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  // Get review logs
  let logs = await db.revlog.toArray();

  // If language specified, filter by cards in that language
  if (language) {
    const cards = await db.cards.where('language').equals(language).toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  // Build history object
  return logs.reduce<ReviewHistory>((acc, entry) => {
    const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = 'polish'
) => {
  // Get existing history entry
  const existing = await db.history.get({ date, language });

  if (existing) {
    await db.history.update([date, language], {
      count: existing.count + delta
    });
  } else {
    await db.history.add({
      date,
      language,
      count: delta
    });
  }
};

export const saveFullHistory = async (history: ReviewHistory, language: Language = 'polish') => {
  const entries = Object.entries(history).map(([date, count]) => ({
    date,
    language,
    count
  }));

  if (entries.length === 0) return;

  await db.history.bulkPut(entries);
};

export const clearHistory = async (language?: Language) => {
  if (language) {
    await db.history.where('language').equals(language).delete();
  } else {
    await db.history.clear();
  }
};
