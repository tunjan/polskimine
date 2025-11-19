import { Card, UserSettings } from '../types';
import { State } from 'ts-fsrs';

interface LimitOptions {
  dailyNewLimit?: number;
  dailyReviewLimit?: number;
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

export const applyStudyLimits = (cards: Card[], settings: Pick<UserSettings, 'dailyNewLimit' | 'dailyReviewLimit'>): Card[] => {
  const { dailyNewLimit, dailyReviewLimit } = settings;
  const limitedCards: Card[] = [];
  let newCount = 0;

  for (const card of cards) {
    if (hasLimit(dailyReviewLimit) && limitedCards.length >= (dailyReviewLimit as number)) {
      break;
    }

    if (isNewCard(card) && hasLimit(dailyNewLimit)) {
      if (newCount >= (dailyNewLimit as number)) {
        continue;
      }
      newCount += 1;
    }

    limitedCards.push(card);
  }

  return limitedCards;
};
