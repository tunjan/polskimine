import {
  Card,
  Language,
  LanguageId,
} from "@/types";
import Dexie from "dexie";
import { State as FSRSState } from "ts-fsrs";
import { db } from "@/db/dexie";
import { generateId } from "@/utils/ids";
import { AnkiCard, Note } from "@/db/types";
import { joinFields, DEFAULT_MODEL_ID, DEFAULT_DECK_ID } from "@/db/models";

const SESSION_KEY = "linguaflow_current_user";

let lastGeneratedId = 0;

const generateUniqueTimestampId = (): number => {
    let id = Date.now();
    if (id <= lastGeneratedId) {
        id = lastGeneratedId + 1;
    }
    lastGeneratedId = id;
    return id;
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

const mapToAppCard = (card: AnkiCard): Card => {
  return {
    id: card.id.toString(),
    targetSentence: card.target_sentence || "",
    nativeTranslation: card.native_translation || "",
    targetWord: card.target_word || "",
    targetWordTranslation: card.target_word_translation || "",
    notes: card.notes || "",
    
    language: (card.language as Language) || LanguageId.Polish,
    
    type: card.type,
    queue: card.queue,
    due: card.due,        
    last_modified: card.mod,
    left: card.left,

    interval: card.ivl,
    easeFactor: card.factor,

    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as FSRSState,
    
    isLeech: card.isLeech,
    isBookmarked: card.isBookmarked,
    
    user_id: card.user_id,
    created_at: card.created_at || card.id, // Fallback to ID if created_at missing
  };
};

export const getCards = async (): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const ankiCards = await db.cards.where("user_id").equals(userId).toArray();
  return ankiCards.map(mapToAppCard);
};

export const getAllCardsByLanguage = async (
  language: Language,
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const ankiCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return ankiCards.map(mapToAppCard);
};


export const getCardsForDashboard = async (
  language: Language,
): Promise<
  Array<{
    id: string;
    type: number;
    queue: number;
    due: number;
    stability: number | null;
    state: number | null;
  }>
> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const ankiCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return ankiCards.map((card) => ({
    id: card.id.toString(),
    type: card.type,
    queue: card.queue,
    due: card.due,
    stability: card.stability ?? null,
    state: card.state ?? null,
  }));
};

export const saveCard = async (card: Card) => {
  const userId = getCurrentUserId();
  
  const last_modified = Math.floor(Date.now() / 1000);   
            
  let cid: number;
  let nid: number;

  const existingId = parseInt(card.id);
  if (!isNaN(existingId)) {
      cid = existingId;
      const existingCard = await db.cards.get(cid);
      if (existingCard) {
          nid = existingCard.nid;
      } else {
          cid = generateUniqueTimestampId();
          nid = cid; 
      }
  } else {
      cid = generateUniqueTimestampId();
      nid = cid;
  }
  
    const flds = joinFields([
      card.targetSentence,
      card.nativeTranslation,
      card.notes,
      "", 
      ""
  ]);
  
  // Note: We still save the note for backward compatibility/backup
  const note: Note = {
      id: nid,
      guid: generateId().slice(0, 10),
      mid: DEFAULT_MODEL_ID,
      mod: last_modified,
      usn: -1,
      tags: (card.tags || []).join(" "),
      flds,
      sfld: card.targetSentence,
      csum: 0,
      language: card.language,
      user_id: card.user_id || userId || "local_user",
  };
  
  const ankiCard: AnkiCard = {
      id: cid,
      nid: nid,
      did: DEFAULT_DECK_ID,
      ord: 0,
      mod: last_modified,
      usn: -1,
      type: card.type,
      queue: card.queue,
      due: card.due,
      ivl: card.interval,
      factor: card.easeFactor,
      reps: card.reps || 0,
      lapses: card.lapses || 0,
      left: card.left,
      odue: 0,
      odid: 0,
      
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      state: card.state as number,
      
      language: card.language,
      isBookmarked: card.isBookmarked,
      isLeech: card.isLeech,
      user_id: card.user_id || userId || "local_user",
      
      // New Fields
      target_sentence: card.targetSentence,
      native_translation: card.nativeTranslation,
      notes: card.notes,
      target_word: card.targetWord, 
      target_word_translation: card.targetWordTranslation,
      tags: (card.tags || []).join(" "),
      created_at: nid,
  };

  await db.transaction("rw", [db.notes, db.cards], async () => {
      await db.notes.put(note);
      await db.cards.put(ankiCard);
  });
};


export const deleteCard = async (id: string) => {
    const cid = parseInt(id);
    if (isNaN(cid)) return; 
    await db.transaction("rw", [db.cards, db.revlog, db.notes], async () => {
        const card = await db.cards.get(cid);
        if (card) {
            const otherCards = await db.cards.where("nid").equals(card.nid).count();
             if (otherCards <= 1) {
                 await db.notes.delete(card.nid);
             }
             await db.cards.delete(cid);
        }
    });
};

export const deleteCardsBatch = async (ids: string[]) => {
  if (!ids.length) return;
  const cids = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
  
  await db.transaction("rw", [db.cards, db.revlog, db.notes], async () => {
      for (const cid of cids) {
          const card = await db.cards.get(cid);
          if (card) {
             const otherCards = await db.cards.where("nid").equals(card.nid).count();
             if (otherCards <= 1) {
                 await db.notes.delete(card.nid);
             }
             await db.cards.delete(cid);
          }
      }
  });
};

export const saveAllCards = async (cards: Card[]) => {
    for (const card of cards) {
      await saveCard(card);
  }
};

export const clearAllCards = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  await db.transaction("rw", [db.cards, db.notes], async () => {
      await db.cards.where("user_id").equals(userId).delete();
      await db.notes.where("user_id").equals(userId).delete(); 
  });
};

export const getDueCards = async (
  now: Date,
  language: Language,
  ignoreLearningSteps: boolean = false,
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const nowDays = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));

  const learningDueLimit = ignoreLearningSteps ? Dexie.maxKey : nowSeconds;

  const [learningCards, reviewCards, dayLearnCards] = await Promise.all([
      db.cards
      .where("[user_id+language+queue+due]")
      .between(
        [userId, language, 1, 0],
        [userId, language, 1, learningDueLimit],
        true,
        true
      )
      .limit(200) // Limit Intraday
      .toArray(),

        db.cards
      .where("[user_id+language+queue+due]")
      .between(
        [userId, language, 2, 0],
        [userId, language, 2, nowDays],
        true,
        true
      )
      .limit(500) // Limit Reviews to prevent OOM
      .toArray(),

        db.cards
      .where("[user_id+language+queue+due]")
      .between(
        [userId, language, 3, 0],
        [userId, language, 3, nowDays],
        true,
        true
      )
      .limit(200) // Limit Interday
      .toArray(),
  ]);

  const allDueAnkiCards = [...learningCards, ...reviewCards, ...dayLearnCards];
  return allDueAnkiCards.map(mapToAppCard);
};

export const getNewCards = async (
  language: Language,
  limit: number = 20,
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language+queue+due]")     .between(
      [userId, language, 0, Dexie.minKey],
      [userId, language, 0, Dexie.maxKey],
      true,
      true,
    )
    .limit(limit)
    .toArray();
    
  return rawCards.map(mapToAppCard);
};


export const getDashboardCounts = async (
  language: Language,
  ignoreLearningSteps: boolean = false,
): Promise<{
  total: number;
  new: number;
  learning: number;
  relearning: number;
  review: number;
  known: number;
  hueDue: number;
  reviewDue: number;
}> => {
  const userId = getCurrentUserId();
  if (!userId)
    return {
      total: 0,
      new: 0,
      learning: 0,
      relearning: 0,
      review: 0,
      known: 0,
      hueDue: 0,
      reviewDue: 0,
    };

  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const nowDays = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));

  const checkLearningDue = (due: number) => {
      if (ignoreLearningSteps) return true;
      return due <= nowSeconds;
  };

  let total = 0;
  let newCount = 0;
  let learningCount = 0;
  let relearningCount = 0;
  let reviewCount = 0;
  let knownCount = 0;
  let learnDue = 0;
  let reviewDue = 0;
  let dayLearnDue = 0;

  // Single-pass aggregation
  // We iterate over all cards for this user/language.
  await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .each((card) => {
        total++;
        
        // Type Counts
        if (card.type === 0) newCount++;
        else if (card.type === 1) learningCount++;
        else if (card.type === 2) {
            reviewCount++;
            if ((card.ivl || 0) > 21) knownCount++;
        }
        else if (card.type === 3) relearningCount++;
        
        // Due Counts
        if (card.queue === 1 && checkLearningDue(card.due)) {
            learnDue++;
        } else if (card.queue === 2 && card.due <= nowDays) {
            reviewDue++;
        } else if (card.queue === 3 && card.due <= nowDays) {
            dayLearnDue++;
        }
    });

  return {
    total,
    new: newCount,
    learning: learningCount,
    relearning: relearningCount,
    review: reviewCount,
    reviewDue: reviewDue,
    known: knownCount,
    hueDue: learnDue + reviewDue + dayLearnDue,
  };
};

export const getCramCards = async (
  limit: number,
  language?: Language,
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let ankiCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language || LanguageId.Polish])
    .toArray();

  const shuffled = ankiCards.sort(() => Math.random() - 0.5).slice(0, limit);
  return shuffled.map(mapToAppCard);
};


export const deleteCardsByLanguage = async (language: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const cardsToDelete = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  const ids = cardsToDelete.map((c) => c.id);
  const nids = [...new Set(cardsToDelete.map(c => c.nid))];
  
  await db.transaction("rw", [db.cards, db.notes], async () => {
       if (ids.length > 0) await db.cards.bulkDelete(ids);
       if (nids.length > 0) await db.notes.bulkDelete(nids); 
  });
};

export const getLearnedWords = async (
  language: Language,
): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const learnedCards = await db.cards
     .where("[user_id+language]")
     .equals([userId, language])
     .filter(c => c.type !== 0)
     .toArray();

  return learnedCards.map(c => c.target_word || c.target_sentence || "");
};

export const getCardSignatures = async (
  language: Language,
): Promise<Array<{ target_sentence: string; language: string }>> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const ankiCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();
    
  return ankiCards.map(c => ({
      target_sentence: c.target_sentence || "",
      language: c.language as string,
  }));
};

export const getAllTargetWords = async (
  language: Language,
): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  const cards = await db.cards.where("[user_id+language]").equals([userId, language]).toArray();
  return cards.map(c => c.target_word || c.target_sentence || "");
};

export const getCardByTargetWord = async (
  targetWord: string,
  language: Language,
): Promise<Card | undefined> => {
  const userId = getCurrentUserId();
  if (!userId) return undefined;

  const lowerWord = targetWord.toLowerCase();
  
  // Note: This is still a scan without an index on target_word, but it avoids joins.
  // Optimization: Add index on target_word in future if frequent.
  const cards = await db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .filter(c => (c.target_word || c.target_sentence || "").toLowerCase() === lowerWord)
      .toArray();
      
  if (cards.length === 0) return undefined;
  return mapToAppCard(cards[0]);
};

export const searchCards = async (
  language: Language,
  page: number = 0,
  pageSize: number = 50,
  searchTerm: string = "",
  filters: { type?: number; bookmarked?: boolean; leech?: boolean } = {},
): Promise<{ data: Card[]; count: number }> => {
  const userId = getCurrentUserId();
  if (!userId) return { data: [], count: 0 };

    if (searchTerm) {
    const term = searchTerm.toLowerCase();
    
    // 1. Scan Cards directly (Denormalized)
    let collection = db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .filter(c => {
           const content = (c.target_sentence || "") + (c.native_translation || "") + (c.notes || "");
           return content.toLowerCase().includes(term);
      });
      
    // Apply filters
    if (filters.type !== undefined) {
        collection = collection.filter(c => c.type === filters.type);
    }
    if (filters.bookmarked) {
        collection = collection.filter(c => c.isBookmarked ?? false);
    }
    if (filters.leech) {
        collection = collection.filter(c => c.isLeech ?? false);
    }
    
    // Count and Paginating a filtered collection in Dexie requires iterating or getting keys.
    // For now, let's just fetch all matches (assuming reasonable result set size < 1000) or limit.
    // Ideally we limit.
    const LIMIT = 200;
    const matches = await collection.limit(LIMIT).toArray();
    
    const count = matches.length; 
    
    // Sort by ID desc (newest first)
    matches.sort((a, b) => b.id - a.id);
    
    const paginated = matches.slice(page * pageSize, (page + 1) * pageSize);
    const data = paginated.map(mapToAppCard);
    
    return { data, count };
  }

  // No search term
    let collection: Dexie.Collection<AnkiCard, number>;

    if (filters.type !== undefined) {
       collection = db.cards
         .where("[user_id+language+type+due]")
         .between(
           [userId, language, filters.type, Dexie.minKey],
           [userId, language, filters.type, Dexie.maxKey],
           true, true
         );
  } else {
       collection = db.cards
         .where("[user_id+language]")
         .equals([userId, language]);
  }
  
  if ((filters.bookmarked ?? false) || (filters.leech ?? false)) {
      collection = collection.filter(c => {
          if ((filters.bookmarked ?? false) && !c.isBookmarked) return false;
          if ((filters.leech ?? false) && !c.isLeech) return false;
          return true;
      });
  }
  
  const count = await collection.count();
  
  const paginatedAnkiCards = await collection
    .reverse()
    .offset(page * pageSize)
    .limit(pageSize)
    .toArray();
    
  return { data: paginatedAnkiCards.map(mapToAppCard), count };
};

export const unburyCards = async (): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  await db.transaction("rw", [db.cards], async () => {
    // Find all buried cards (queue < -1) for the current user
    const buriedCards = await db.cards
      .where("user_id")
      .equals(userId)
      .filter((c) => c.queue < -1)
      .toArray();

    if (buriedCards.length === 0) return;

    // Reset queue to type
    for (const card of buriedCards) {
      await db.cards.update(card.id, {
        queue: card.type,
        mod: Math.floor(Date.now() / 1000),
        usn: -1,
      });
    }
  });
};

export const repairCorruptedCards = async (): Promise<number> => {
        return 0; 
};
