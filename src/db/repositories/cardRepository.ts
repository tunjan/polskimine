import {
  Card,
  CardStatus,
  mapFsrsStateToStatus,
  Language,
  LanguageId,
} from "@/types";
import { State as FSRSState } from "ts-fsrs";
import { getSRSDate } from "@/core/srs";
import { db, generateId } from "@/db/dexie";
import { SRS_CONFIG } from "@/constants";
import { z } from "zod";

const SESSION_KEY = "linguaflow_current_user";

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

// Helper to handle NaN values from corrupted DB entries
const SafeNumber = z.preprocess((val) => {
  if (typeof val === "number" && isNaN(val)) return 0;
  return val;
}, z.number());

const DBRawCardSchema = z.object({
  id: z.string(),
  targetSentence: z.string(),
  targetWord: z.string().optional().nullable(),
  targetWordTranslation: z.string().optional().nullable(),
  targetWordPartOfSpeech: z.string().optional().nullable(),
  nativeTranslation: z.string(),
  furigana: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  grammaticalCase: z.string().optional().nullable(),
  notes: z.string().optional().nullable().default(""),
  tags: z.array(z.string()).optional().nullable(),
  language: z.string().default("polish"),
  status: z
    .union([z.nativeEnum(CardStatus), z.string()])
    .transform((val) => val as CardStatus),

  interval: SafeNumber.default(0),
  easeFactor: SafeNumber.default(2.5),
  dueDate: z.string(),

  stability: SafeNumber.optional().nullable(),
  difficulty: SafeNumber.optional().nullable(),
  elapsed_days: SafeNumber.optional().nullable(),
  scheduled_days: SafeNumber.optional().nullable(),
  reps: SafeNumber.optional().nullable(),
  lapses: SafeNumber.optional().nullable(),
  state: SafeNumber.optional().nullable(),
  due: z.string().optional().nullable(),
  last_review: z.string().optional().nullable(),
  first_review: z.string().optional().nullable(),

  learningStep: SafeNumber.optional().nullable(),
  leechCount: SafeNumber.optional().nullable(),
  isLeech: z.boolean().optional().default(false),
  isBookmarked: z.boolean().optional().default(false),
  precise_interval: SafeNumber.optional().nullable(),

  user_id: z.string().optional().nullable(),
});

export type DBRawCard = z.infer<typeof DBRawCardSchema>;

export const mapToCard = (data: unknown): Card => {
  const result = DBRawCardSchema.safeParse(data);

  if (!result.success) {
    console.error("Card validation failed:", result.error, data);
    throw new Error(`Card validation failed: ${result.error.message}`);
  }

  const validData = result.data;

  return {
    id: validData.id,
    targetSentence: validData.targetSentence,
    targetWord: validData.targetWord || undefined,
    targetWordTranslation: validData.targetWordTranslation || undefined,
    targetWordPartOfSpeech: validData.targetWordPartOfSpeech || undefined,
    nativeTranslation: validData.nativeTranslation,
    furigana: validData.furigana || undefined,
    gender: validData.gender || undefined,
    grammaticalCase: validData.grammaticalCase || undefined,
    notes: validData.notes || "",
    tags: validData.tags || undefined,
    language: validData.language as Language,
    status: validData.status,
    interval: validData.interval,
    easeFactor: validData.easeFactor,
    dueDate: validData.dueDate,

    stability: validData.stability ?? undefined,
    difficulty: validData.difficulty ?? undefined,
    elapsed_days: validData.elapsed_days ?? undefined,
    scheduled_days: validData.scheduled_days ?? undefined,
    reps: validData.reps ?? undefined,
    lapses: validData.lapses ?? undefined,
    state: validData.state ?? undefined,
    due: validData.due ?? undefined,
    last_review: validData.last_review ?? undefined,
    first_review: validData.first_review ?? undefined,

    learningStep: validData.learningStep ?? undefined,
    leechCount: validData.leechCount ?? undefined,
    isLeech: validData.isLeech,
    isBookmarked: validData.isBookmarked,
    precise_interval: validData.precise_interval ?? undefined,

    user_id: validData.user_id ?? undefined,
  } as Card;
};

export const getCards = async (): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards.where("user_id").equals(userId).toArray();
  return rawCards.map(mapToCard);
};

export const getAllCardsByLanguage = async (
  language: Language,
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();
  return rawCards.map(mapToCard);
};

export const getCardsForRetention = async (
  language: Language,
): Promise<Partial<Card>[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return rawCards.map(mapToCard).map((c) => ({
    id: c.id,
    dueDate: c.dueDate,
    status: c.status,
    stability: c.stability,
    state: c.state,
  }));
};

export const getDashboardCounts = async (
  language: Language,
): Promise<{
  total: number;
  new: number;
  learned: number;
  hueDue: number;
}> => {
  const userId = getCurrentUserId();
  if (!userId) return { total: 0, new: 0, learned: 0, hueDue: 0 };

  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(4);
  const cutoffISO = cutoffDate.toISOString();

  const [total, newCards, learned, due] = await Promise.all([
    db.cards.where("[user_id+language]").equals([userId, language]).count(),
    db.cards
      .where("[user_id+language+status]")
      .equals([userId, language, "new"])
      .count(),
    db.cards
      .where("[user_id+language+status]")
      .equals([userId, language, "known"])
      .count(),
    db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .filter((c) => c.status !== "known" && c.dueDate <= cutoffISO)
      .count(),
  ]);

  return {
    total,
    new: newCards,
    learned,
    hueDue: due,
  };
};

export const getCardsForDashboard = async (
  language: Language,
): Promise<
  Array<{
    id: string;
    dueDate: string | null;
    status: string;
    stability: number | null;
    state: number | null;
  }>
> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return rawCards.map(mapToCard).map((card) => ({
    id: card.id,
    dueDate: card.dueDate,
    status: card.status,
    stability: card.stability ?? null,
    state: card.state ?? null,
  }));
};

export const saveCard = async (card: Card) => {
  const userId = getCurrentUserId();

  // Normalize card: ensure all required FSRS fields have defaults
  // This handles backward compatibility with old cards missing fields
  const normalizedCard: Card = {
    ...card,
    id: card.id || generateId(),
    user_id: card.user_id || userId || undefined,
    reps: card.reps ?? 0,
    lapses: card.lapses ?? 0,
    state: card.state ?? FSRSState.New,
    notes: card.notes ?? "",
    isLeech: card.isLeech ?? false,
    isBookmarked: card.isBookmarked ?? false,
  };

  // Sync status with FSRS state (except for KNOWN cards)
  if (normalizedCard.status !== CardStatus.KNOWN) {
    if (normalizedCard.state !== undefined) {
      normalizedCard.status = mapFsrsStateToStatus(normalizedCard.state);
    }
  }

  await db.cards.put(normalizedCard);
};

export const deleteCard = async (id: string) => {
  await db.transaction("rw", [db.cards, db.revlog], async () => {
    await db.cards.delete(id);
  });
};

export const deleteCardsBatch = async (ids: string[]) => {
  if (!ids.length) return;
  await db.transaction("rw", [db.cards, db.revlog], async () => {
    await db.cards.bulkDelete(ids);
  });
};

export const saveAllCards = async (cards: Card[]) => {
  if (!cards.length) return;
  const userId = getCurrentUserId();

  const cardsWithIds = cards.map((card) => ({
    ...card,
    id: card.id || generateId(),
    user_id: card.user_id || userId || undefined,
  }));

  await db.cards.bulkPut(cardsWithIds);
};

export const clearAllCards = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  await db.cards.where("user_id").equals(userId).delete();
};

export const getDueCards = async (
  now: Date,
  language: Language,
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const cutoffISO = cutoffDate.toISOString();

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .filter((card) => card.status !== "known" && card.dueDate <= cutoffISO)
    .toArray();

  return rawCards
    .map(mapToCard)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getCramCards = async (
  limit: number,
  tag?: string,
  language?: Language,
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language || LanguageId.Polish])
    .toArray();

  let cards = rawCards.map(mapToCard);

  if (tag) {
    cards = cards.filter((c) => c.tags?.includes(tag));
  }

  const shuffled = cards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const deleteCardsByLanguage = async (language: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const cardsToDelete = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  const ids = cardsToDelete.map((c) => c.id);
  if (ids.length > 0) {
    await db.cards.bulkDelete(ids);
  }
};

export const getCardSignatures = async (
  language: Language,
): Promise<Array<{ target_sentence: string; language: string }>> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return rawCards.map(mapToCard).map((c) => ({
    target_sentence: c.targetSentence,
    language: c.language as string,
  }));
};

export const getTags = async (language?: Language): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let rawCards: Card[];

  if (language) {
    rawCards = await db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .toArray();
  } else {
    rawCards = await db.cards.where("user_id").equals(userId).toArray();
  }

  const cards = rawCards.map(mapToCard);

  const uniqueTags = new Set<string>();
  cards.forEach((card) => {
    if (card.tags) {
      card.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });

  return Array.from(uniqueTags).sort();
};

export const getLearnedWords = async (
  language: Language,
): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .filter((card) => card.status !== "new" && card.targetWord != null)
    .toArray();

  const words = rawCards
    .map(mapToCard)
    .map((card) => card.targetWord)
    .filter((word): word is string => word !== null && word !== undefined);

  return [...new Set(words)];
};

export const getAllTargetWords = async (
  language: Language,
): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const words: string[] = [];

  // Use each() for memory efficiency instead of loading all objects
  await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .filter((card) => card.targetWord != null)
    .each((card) => {
      if (card.targetWord) words.push(card.targetWord);
    });

  return [...new Set(words)];
};

export const getCardByTargetWord = async (
  targetWord: string,
  language: Language,
): Promise<Card | undefined> => {
  const userId = getCurrentUserId();
  if (!userId) return undefined;

  const lowerWord = targetWord.toLowerCase();
  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .filter((card) => card.targetWord?.toLowerCase() === lowerWord)
    .toArray();

  if (rawCards.length === 0) return undefined;

  return mapToCard(rawCards[0]);
};
