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
    card.state === State.Relearning ||
    card.status === "learning"
  );
};

const isReviewCard = (card: Card): boolean => {
  return (
    !isNewCard(card) &&
    !isLearningCard(card) &&
    (card.state === State.Review || card.status === "review")
  );
};

const sortByDue = (a: Card, b: Card): number => {
  const dateComparison = (a.dueDate || "").localeCompare(b.dueDate || "");
  if (dateComparison !== 0) return dateComparison;
  return (a.id || "").localeCompare(b.id || "");
};

const sortByOverdueness = (a: Card, b: Card, now: Date): number => {
  const aInterval = a.interval || 1;
  const bInterval = b.interval || 1;
  const aDue = new Date(a.dueDate || now);
  const bDue = new Date(b.dueDate || now);

  const aDaysOverdue = (now.getTime() - aDue.getTime()) / (1000 * 60 * 60 * 24);
  const bDaysOverdue = (now.getTime() - bDue.getTime()) / (1000 * 60 * 60 * 24);

  const aOverdueness = aDaysOverdue / aInterval;
  const bOverdueness = bDaysOverdue / bInterval;

  return bOverdueness - aOverdueness; // Higher overdueness first
};

const sortNewCards = (
  cards: Card[],
  gatherOrder: DisplayOrderSettings["newCardGatherOrder"] = "added",
  sortOrder: DisplayOrderSettings["newCardSortOrder"] = "due",
): Card[] => {
  let result = [...cards];

  // First apply gather order (how we collect cards)
  if (gatherOrder === "random") {
    result = shuffle(result);
  }

  // Then apply sort order (how we present them)
  switch (sortOrder) {
    case "random":
      return shuffle(result);
    case "cardType":
      // Sort by card type (word type) if available
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
      // Group by due date, then shuffle within groups
      const grouped = new Map<string, Card[]>();
      cards.forEach((card) => {
        const dateKey = (card.dueDate || "").split("T")[0];
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
      // Interleave learning cards with reviews
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

/**
 * Sort cards based on display order settings.
 * Falls back to legacy CardOrder for backwards compatibility.
 */
export const sortCards = (
  cards: Card[],
  order: CardOrder,
  displaySettings?: DisplayOrderSettings,
): Card[] => {
  if (cards.length === 0) return [];

  // Separate cards by type
  const newCards = cards.filter((c) => isNewCard(c));
  const learningCards = cards.filter((c) => isLearningCard(c));
  const reviewCards = cards.filter((c) => isReviewCard(c));
  // Cards that don't fit other categories go with reviews
  const otherCards = cards.filter(
    (c) => !isNewCard(c) && !isLearningCard(c) && !isReviewCard(c),
  );

  // If no display settings, use legacy behavior
  if (!displaySettings) {
    const dateSorted = [...cards].sort(sortByDue);

    if (order === "mixed") {
      return shuffle(cards);
    }

    const legacyNew = dateSorted.filter((c) => isNewCard(c));
    const legacyReview = dateSorted.filter((c) => !isNewCard(c));

    if (order === "reviewFirst") {
      return [...legacyReview, ...legacyNew];
    }

    return [...legacyNew, ...legacyReview];
  }

  // Apply new sorting logic
  const sortedNew = sortNewCards(
    newCards,
    displaySettings.newCardGatherOrder,
    displaySettings.newCardSortOrder,
  );

  const sortedReview = sortReviewCards(
    [...reviewCards, ...otherCards],
    displaySettings.reviewSortOrder,
  );

  const sortedLearning = [...learningCards].sort(sortByDue);

  // Determine new/review order
  const newReviewOrder = displaySettings.newReviewOrder || order || "newFirst";

  let result: Card[];
  switch (newReviewOrder) {
    case "mixed": {
      // Interleave new with reviews
      const combined = [...sortedReview];
      const step = Math.max(
        1,
        Math.floor(combined.length / (sortedNew.length + 1)),
      );
      sortedNew.forEach((card, i) => {
        const insertAt = Math.min((i + 1) * step, combined.length);
        combined.splice(insertAt, 0, card);
      });
      result = interleaveLearningCards(
        [],
        sortedLearning,
        combined,
        displaySettings.interdayLearningOrder,
      );
      break;
    }
    case "reviewFirst": {
      // Interleave learning cards with reviews based on interdayLearningOrder
      const reviewWithLearning = interleaveLearningCards(
        [],
        sortedLearning,
        sortedReview,
        displaySettings.interdayLearningOrder,
      );
      // Put reviews (with learning) first, then new cards
      result = [...reviewWithLearning, ...sortedNew];
      break;
    }
    case "newFirst":
    default: {
      // Interleave learning cards with reviews based on interdayLearningOrder
      const reviewWithLearning = interleaveLearningCards(
        [],
        sortedLearning,
        sortedReview,
        displaySettings.interdayLearningOrder,
      );
      // Put new cards first, then reviews with learning interleaved
      result = [...sortedNew, ...reviewWithLearning];
      break;
    }
  }

  return result;
};
