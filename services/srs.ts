import { addDays, startOfDay, subHours, isBefore, isSameDay } from 'date-fns';
import { Card, Grade } from '../types';
import { SRS_CONFIG, SM2_CONSTANTS } from '../constants';

const getSRSDate = (date: Date = new Date()): Date => {
  // Shift time back by CUTOFF_HOUR so that "today" starts at 4 AM
  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

/**
 * Adds a small random fuzz to the interval to prevent review avalanches.
 * Fuzz is only applied to intervals > 2 days.
 */
const applyFuzz = (interval: number): number => {
  if (interval <= SRS_CONFIG.MIN_INTERVAL_FUZZ) return interval;
  
  const fuzz = Math.round(interval * SRS_CONFIG.FUZZ_FACTOR * (Math.random() - 0.5) * 2);
  return Math.max(3, interval + fuzz);
};

/**
 * Calculates the next interval, ease factor, and due date for a card based on the user's rating.
 * Modified SM-2 Algorithm with Fuzzing and Timezone handling.
 */
export const calculateNextReview = (card: Card, grade: Grade): Card => {
  let { interval, easeFactor, status } = card;
  
  let quality = 0;
  switch (grade) {
    case 'Again': quality = 0; break;
    case 'Hard': quality = 3; break;
    case 'Good': quality = 4; break;
    case 'Easy': quality = 5; break;
  }

  if (grade === 'Again') {
    interval = 1; 
    easeFactor = Math.max(SM2_CONSTANTS.MIN_EASE, easeFactor - SM2_CONSTANTS.PENALTY_AGAIN);
    status = 'learning';
  } else {
    if (status === 'learning') {
        status = 'review';
        interval = 1;
    }
    
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = grade === 'Easy' ? 4 : 3; 
    } else {
        const { EF_C1, EF_C2, EF_C3 } = SM2_CONSTANTS;
        const newEF = easeFactor + (EF_C1 - (5 - quality) * (EF_C2 + (5 - quality) * EF_C3));
        easeFactor = Math.max(SM2_CONSTANTS.MIN_EASE, newEF); 
        
        let nextInterval = Math.ceil(interval * easeFactor * (grade === 'Hard' ? 0.5 : 1));
        interval = applyFuzz(nextInterval);
    }
    
    if (interval >= SRS_CONFIG.GRADUATING_INTERVAL) status = 'graduated';
  }

  const srsToday = getSRSDate();
  const dueDate = addDays(srsToday, interval);

  return {
    ...card,
    interval,
    easeFactor,
    dueDate: dueDate.toISOString(),
    status
  };
};

/**
 * Checks if a card is due for review.
 * A card is due if its due date is before or equal to the current "SRS day".
 * Optional 'now' parameter allows for optimization in loops.
 */
export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  const due = new Date(card.dueDate);
  const srsToday = getSRSDate(now);
  return isBefore(due, srsToday) || isSameDay(due, srsToday);
};