import { db } from '@/services/db/dexie';
import { ReviewHistory, Language, LanguageId } from '@/types';
import { format } from 'date-fns';
import { getCurrentUserId } from './cardRepository';

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  const userId = getCurrentUserId();
  if (!userId) return {};

  let logs = await db.revlog
    .where('user_id')
    .equals(userId)
    .toArray();

  if (language) {
    const cards = await db.cards
      .where('language')
      .equals(language)
      .filter(c => c.user_id === userId)
      .toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  return logs.reduce<ReviewHistory>((acc, entry) => {
    const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = LanguageId.Polish
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  // Query by the original composite key [date+language]
  const existing = await db.history
    .where('[date+language]')
    .equals([date, language])
    .filter(h => h.user_id === userId)
    .first();

  if (existing) {
    // Update using the composite primary key
    await db.history.update([date, language], {
      count: existing.count + delta
    });
  } else {
    await db.history.add({
      date,
      language,
      user_id: userId,
      count: delta
    });
  }
};

export const saveFullHistory = async (history: ReviewHistory, language: Language = LanguageId.Polish) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const entries = Object.entries(history).map(([date, count]) => ({
    date,
    language,
    user_id: userId,
    count: typeof count === 'number' ? count : 0
  }));

  if (entries.length === 0) return;

  await db.history.bulkPut(entries);
};

export const clearHistory = async (language?: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  if (language) {
    const historyToDelete = await db.history
      .where('language')
      .equals(language)
      .filter(h => h.user_id === userId)
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  } else {
    const historyToDelete = await db.history
      .where('user_id')
      .equals(userId)
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  }
};
