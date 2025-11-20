import { Card, UserSettings } from '../types';
import { State } from 'ts-fsrs';

interface LimitOptions {
  dailyNewLimit?: number;
  dailyReviewLimit?: number;
  reviewsToday?: {
    newCards: number;
    reviewCards: number;
  };
}

const isNewCard = (card: Card) => {
  // First consider explicit status tagging
  if (card.status === 'new') return true;

  // Check if card is truly new (never reviewed)
  // State.New is 0 in ts-fsrs
  if (card.state !== undefined) {
    return card.state === State.New;
  }
  // Fallback for legacy cards or missing state
  return (card.reps || 0) === 0;
};

const hasLimit = (value?: number) => typeof value === 'number' && value > 0;

export const applyStudyLimits = (cards: Card[], settings: LimitOptions): Card[] => {
  const { dailyNewLimit, dailyReviewLimit, reviewsToday } = settings;
  const limitedCards: Card[] = [];
  
  let newCount = reviewsToday?.newCards || 0;
  let reviewCount = reviewsToday?.reviewCards || 0;

  for (const card of cards) {
    const isNew = isNewCard(card);

    if (isNew) {
      if (hasLimit(dailyNewLimit)) {
        if (newCount >= (dailyNewLimit as number)) {
          continue;
        }
        newCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    } else {
      // Review card
      if (hasLimit(dailyReviewLimit)) {
        if (reviewCount >= (dailyReviewLimit as number)) {
          continue;
        }
        reviewCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    }
  }

  return limitedCards;
};
