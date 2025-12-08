import { Card, CardStatus, Language, LanguageId } from '@/types';
import { getSRSDate } from '@/core/srs';
import { db, generateId } from '@/db/dexie';
import { SRS_CONFIG } from '@/constants';

const SESSION_KEY = 'linguaflow_current_user';

// Get current user ID from session storage
export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

export const mapToCard = (data: any): Card => ({
  id: data.id,
  targetSentence: data.targetSentence,
  targetWord: data.targetWord || undefined,
  targetWordTranslation: data.targetWordTranslation || undefined,
  targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
  nativeTranslation: data.nativeTranslation,
  furigana: data.furigana || undefined,
  notes: data.notes ?? '',
  tags: data.tags ?? undefined,
  language: data.language,
  status: data.status,
  interval: data.interval ?? 0,
  easeFactor: data.easeFactor ?? 2.5,
  dueDate: data.dueDate,
  stability: data.stability ?? undefined,
  difficulty: data.difficulty ?? undefined,
  elapsed_days: data.elapsed_days ?? undefined,
  scheduled_days: data.scheduled_days ?? undefined,
  reps: data.reps ?? undefined,
  lapses: data.lapses ?? undefined,
  state: data.state ?? undefined,
  last_review: data.last_review ?? undefined,
  first_review: data.first_review ?? undefined,
  learningStep: data.learningStep ?? undefined,
  leechCount: data.leechCount ?? undefined,
  isLeech: data.isLeech ?? false,
  user_id: data.user_id ?? undefined,
});

export const getCards = async (): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards.where('user_id').equals(userId).toArray();
  return cards;
};

export const getAllCardsByLanguage = async (language: Language): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();
  return cards;
};

export const getCardsForRetention = async (language: Language): Promise<Partial<Card>[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  return cards.map(c => ({
    id: c.id,
    dueDate: c.dueDate,
    status: c.status,
    stability: c.stability,
    state: c.state
  }));
};

export const getDashboardCounts = async (language: Language): Promise<{
  total: number;
  new: number;
  learned: number;
  hueDue: number;
}> => {
  const userId = getCurrentUserId();
  if (!userId) return { total: 0, new: 0, learned: 0, hueDue: 0 };

  const now = new Date();
  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(4);
  const cutoffISO = cutoffDate.toISOString();

  const allCards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  const total = allCards.length;
  const newCards = allCards.filter(c => c.status === 'new').length;
  const learned = allCards.filter(c => c.status === 'known').length;
  const due = allCards.filter(c => c.status !== 'known' && c.dueDate <= cutoffISO).length;

  return {
    total,
    new: newCards,
    learned,
    hueDue: due
  };
};

export const getCardsForDashboard = async (language: Language): Promise<Array<{
  id: string;
  dueDate: string | null;
  status: string;
  stability: number | null;
  state: number | null
}>> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  return cards.map(card => ({
    id: card.id,
    dueDate: card.dueDate,
    status: card.status,
    stability: card.stability ?? null,
    state: card.state ?? null
  }));
};

export const saveCard = async (card: Card) => {
  const userId = getCurrentUserId();
  if (!card.id) {
    card.id = generateId();
  }
  // Ensure user_id is set
  if (!card.user_id && userId) {
    card.user_id = userId;
  }
  await db.cards.put(card);
};

export const deleteCard = async (id: string) => {
  await db.transaction('rw', [db.cards, db.revlog], async () => {
    await db.cards.delete(id);
  });
};

export const deleteCardsBatch = async (ids: string[]) => {
  if (!ids.length) return;
  await db.transaction('rw', [db.cards, db.revlog], async () => {
    await db.cards.bulkDelete(ids);
  });
};

export const saveAllCards = async (cards: Card[]) => {
  if (!cards.length) return;
  const userId = getCurrentUserId();

  const cardsWithIds = cards.map(card => ({
    ...card,
    id: card.id || generateId(),
    user_id: card.user_id || userId || undefined
  }));

  await db.cards.bulkPut(cardsWithIds);
};

export const clearAllCards = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  // Only clear cards for current user
  await db.cards.where('user_id').equals(userId).delete();
};

export const getDueCards = async (now: Date, language: Language): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const cutoffISO = cutoffDate.toISOString();

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .filter(card => card.status !== 'known' && card.dueDate <= cutoffISO)
    .toArray();

  return cards.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language || LanguageId.Polish])
    .toArray();

  if (tag) {
    cards = cards.filter(c => c.tags?.includes(tag));
  }

  const shuffled = cards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const deleteCardsByLanguage = async (language: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const cardsToDelete = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  const ids = cardsToDelete.map(c => c.id);
  if (ids.length > 0) {
    await db.cards.bulkDelete(ids);
  }
};

export const getCardSignatures = async (language: Language): Promise<Array<{ target_sentence: string; language: string }>> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  return cards.map(c => ({
    target_sentence: c.targetSentence,
    language: c.language
  }));
};

export const getTags = async (language?: Language): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let cards: Card[];

  if (language) {
    cards = await db.cards
      .where('[user_id+language]')
      .equals([userId, language])
      .toArray();
  } else {
    cards = await db.cards
      .where('user_id')
      .equals(userId)
      .toArray();
  }

  const uniqueTags = new Set<string>();
  cards.forEach((card) => {
    if (card.tags) {
      card.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });

  return Array.from(uniqueTags).sort();
};

export const getLearnedWords = async (language: Language): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .filter(card => card.status !== 'new' && card.targetWord != null)
    .toArray();

  const words = cards
    .map(card => card.targetWord)
    .filter((word): word is string => word !== null && word !== undefined);

  return [...new Set(words)];
};

export const getCardByTargetWord = async (targetWord: string, language: Language): Promise<Card | undefined> => {
  const userId = getCurrentUserId();
  if (!userId) return undefined;

  const lowerWord = targetWord.toLowerCase();
  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .filter(card => card.targetWord?.toLowerCase() === lowerWord)
    .toArray();

  return cards[0];
};
