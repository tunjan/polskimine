import { Card, UserSettings } from "@/types";
import { isNewCard } from "@/services/studyLimits";
import { State } from "ts-fsrs";

export type CardOrder = "newFirst" | "reviewFirst" | "mixed";

export interface DisplayOrderSettings {
  newCardGatherOrder?: UserSettings["newCardGatherOrder"];
  newCardSortOrder?: UserSettings["newCardSortOrder"];
  newReviewOrder?: UserSettings["newReviewOrder"];
  interdayLearningOrder?: UserSettings["interdayLearningOrder"];
  reviewSortOrder?: UserSettings["reviewSortOrder"];
}

const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const isLearningCard = (card: Card): boolean => {
  return (
    card.state === State.Learning ||
    card.state === State.Relearning
  );
};

const isReviewCard = (card: Card): boolean => {
  return (
    !isNewCard(card) &&
    !isLearningCard(card) &&
    card.state === State.Review
  );
};

const sortByDue = (a: Card, b: Card): number => {
  const dateComparison = (a.due || 0) - (b.due || 0);
  if (dateComparison !== 0) return dateComparison;
  return (a.id || "").localeCompare(b.id || "");
};

const getDueTimestamp = (card: Card): number => {
  if (card.queue === 1) {
    return card.due * 1000; // Seconds to ms
  } else if (card.queue === 2 || card.queue === 3) {
    return card.due * 24 * 60 * 60 * 1000; // Days to ms
  }
  return card.due || 0; // Fallback or New cards
};

const sortByOverdueness = (a: Card, b: Card, now: Date): number => {
  const aInterval = Math.max(0.001, a.interval || 0);
  const bInterval = Math.max(0.001, b.interval || 0);
  
  const aDueMs = getDueTimestamp(a) || now.getTime();
  const bDueMs = getDueTimestamp(b) || now.getTime();

  const aDaysOverdue = (now.getTime() - aDueMs) / (1000 * 60 * 60 * 24);
  const bDaysOverdue = (now.getTime() - bDueMs) / (1000 * 60 * 60 * 24);

  const aOverdueness = aDaysOverdue / aInterval;
  const bOverdueness = bDaysOverdue / bInterval;

  return bOverdueness - aOverdueness;
};

const sortNewCards = (
  cards: Card[],
  gatherOrder: DisplayOrderSettings["newCardGatherOrder"] = "added",
  sortOrder: DisplayOrderSettings["newCardSortOrder"] = "due",
): Card[] => {
  let result = [...cards];

  if (gatherOrder === "random") {
    result = shuffle(result);
  }

  switch (sortOrder) {
    case "random":
      return shuffle(result);
    case "cardType":
      return result.sort((a, b) => {
        const typeA = a.targetWordPartOfSpeech || "";
        const typeB = b.targetWordPartOfSpeech || "";
        return typeA.localeCompare(typeB);
      });
    case "due":
    default:
      return result.sort(sortByDue);
  }
};

const sortReviewCards = (
  cards: Card[],
  sortOrder: DisplayOrderSettings["reviewSortOrder"] = "due",
): Card[] => {
  const now = new Date();

  switch (sortOrder) {
    case "random":
      return shuffle(cards);
    case "dueRandom":
      const grouped = new Map<string, Card[]>();
      cards.forEach((card) => {
        const date = new Date(card.due || 0);
        const dateKey = date.toISOString().split("T")[0];
        if (!grouped.has(dateKey)) grouped.set(dateKey, []);
        grouped.get(dateKey)!.push(card);
      });
      const result: Card[] = [];
      [...grouped.keys()].sort().forEach((key) => {
        result.push(...shuffle(grouped.get(key)!));
      });
      return result;
    case "overdueness":
      return [...cards].sort((a, b) => sortByOverdueness(a, b, now));
    case "due":
    default:
      return [...cards].sort(sortByDue);
  }
};

const interleaveLearningCards = (
  newCards: Card[],
  learningCards: Card[],
  reviewCards: Card[],
  order: DisplayOrderSettings["interdayLearningOrder"] = "mixed",
): Card[] => {
  switch (order) {
    case "before":
      return [...learningCards, ...reviewCards, ...newCards];
    case "after":
      return [...newCards, ...reviewCards, ...learningCards];
    case "mixed":
    default:
      const combined = [...reviewCards];

      if (combined.length === 0) {
        return [...newCards, ...learningCards];
      }

      const step = Math.max(
        1,
        Math.floor(combined.length / (learningCards.length + 1)),
      );
      learningCards.forEach((card, i) => {
        const insertAt = Math.min((i + 1) * step, combined.length);
        combined.splice(insertAt, 0, card);
      });
      return [...newCards, ...combined];
  }
};

export const sortCards = (
  cards: Card[],
  order: CardOrder,
  displaySettings?: DisplayOrderSettings,
): Card[] => {
  if (cards.length === 0) return [];

  const newCards = cards.filter((c) => isNewCard(c));

  // Queue 1: Intraday Learning (Due = Timestamp)
  // Queue 3: Interday Learning (Due = Day Count) - Acts like Review
  // Note: We check queue explicitly. Fallback to standard isLearningCard if queue is missing but state is Learning.
  const intradayLearning = cards.filter(
    (c) => isLearningCard(c) && (c.queue === 1 || c.queue === 0 || c.queue === undefined), // Treat 0/undefined as potential intraday for safety, mostly 1
  );
  
  const interdayLearning = cards.filter(
    (c) => isLearningCard(c) && c.queue === 3,
  );

  const reviewCards = cards.filter((c) => isReviewCard(c));
  
  const otherCards = cards.filter(
    (c) => !isNewCard(c) && !isLearningCard(c) && !isReviewCard(c),
  );

  if (!displaySettings) {
    // Legacy behavior: Sort everything by due.
    // WARNING: This is flawed for mixed queues (Day vs Timestamp) but keeping for consistent legacy behavior unless we want to fix it there too.
    // If we want to fix legacy too:
    // Sort reviews+interday by due (day). Sort intraday by due (timestamp). Put intraday first?
    // For now, preserving exact previous behavior for "no settings" might be safer, or apply the same fix.
    // Let's apply the fix because the logic violation is fundamental.
    
    // Combined "Day based" cards
    const combinedReviews = [...reviewCards, ...interdayLearning, ...otherCards].sort(sortByDue);
    
    // Intraday (Timestamp)
    const sortedIntraday = [...intradayLearning].sort(sortByDue);

    if (order === "mixed") {
      return shuffle(cards);
    }

    const legacyNew = [...newCards].sort(sortByDue); // New cards rank

    if (order === "reviewFirst") {
       // Intraday (urgent) -> Reviews (including Interday) -> New
       // Or Reviews -> New?
       // Legacy code: return [...legacyReview, ...legacyNew];
       // Simply placing sorted Intraday at start or merge with reviews?
       // Let's put Intraday first as it's most urgent.
       return [...sortedIntraday, ...combinedReviews, ...legacyNew];
    }

    // newFirst
    return [...sortedIntraday, ...legacyNew, ...combinedReviews];
  }

  const sortedNew = sortNewCards(
    newCards,
    displaySettings.newCardGatherOrder,
    displaySettings.newCardSortOrder,
  );

  // Treat Interday cards as Reviews for sorting (Day Count)
  const sortedReviews = sortReviewCards(
    [...reviewCards, ...interdayLearning, ...otherCards],
    displaySettings.reviewSortOrder,
  );

  const sortedIntraday = [...intradayLearning].sort(sortByDue);

  const newReviewOrder = displaySettings.newReviewOrder || order || "newFirst";

  let result: Card[];
  switch (newReviewOrder) {
    case "mixed": {
      const combined = [...sortedReviews];
      const step = Math.max(
        1,
        Math.floor(combined.length / (sortedNew.length + 1)),
      );
      sortedNew.forEach((card, i) => {
        const insertAt = Math.min((i + 1) * step, combined.length);
        combined.splice(insertAt, 0, card);
      });
      // Interleave Intraday cards into the combined Review+New stream
      result = interleaveLearningCards(
        [],
        sortedIntraday,
        combined,
        displaySettings.interdayLearningOrder, // Applies to how "Learning" (now Intraday) is mixed
      );
      break;
    }
    case "reviewFirst": {
       // Reviews (including Interday) first
       // But where do Intraday go?
       // interleaveLearningCards(new, learn, review, ...) 
       // If we treat Intraday as the "Learning" input:
      const reviewWithLearning = interleaveLearningCards(
        [],
        sortedIntraday,
        sortedReviews,
        displaySettings.interdayLearningOrder,
      );
      result = [...reviewWithLearning, ...sortedNew];
      break;
    }
    case "newFirst":
    default: {
      const reviewWithLearning = interleaveLearningCards(
        [],
        sortedIntraday,
        sortedReviews,
        displaySettings.interdayLearningOrder,
      );
      result = [...sortedNew, ...reviewWithLearning];
      break;
    }
  }

  return result;
};
