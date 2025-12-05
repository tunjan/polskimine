import { db } from '@/services/db/dexie';
import { ReviewHistory, Language, LanguageId } from '@/types';
import { format } from 'date-fns';

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  let logs = await db.revlog.toArray();

  if (language) {
    const cards = await db.cards.where('language').equals(language).toArray();
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

export const saveFullHistory = async (history: ReviewHistory, language: Language = LanguageId.Polish) => {
  const entries = Object.entries(history).map(([date, count]) => ({
    date,
    language,
    count: typeof count === 'number' ? count : 0
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
