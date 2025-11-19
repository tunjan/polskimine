import { Card, Grade } from '../types';

// Constants
const CUTOFF_HOUR = 4; // 4 AM is the start of the new day

/**
 * Returns the start of the current "SRS day" (4 AM today or yesterday depending on current time).
 * This ensures that reviews done at 1 AM count for the "previous" day.
 */
const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  if (d.getHours() < CUTOFF_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(CUTOFF_HOUR, 0, 0, 0);
  return d;
};

/**
 * Adds a small random fuzz to the interval to prevent review avalanches.
 * Fuzz is only applied to intervals > 2 days.
 */
const applyFuzz = (interval: number): number => {
  if (interval <= 2) return interval;
  
  const fuzzFactor = 0.05; // +/- 5%
  const fuzz = Math.round(interval * fuzzFactor * (Math.random() - 0.5) * 2);
  return Math.max(3, interval + fuzz);
};

/**
 * Calculates the next interval, ease factor, and due date for a card based on the user's rating.
 * Modified SM-2 Algorithm with Fuzzing and Timezone handling.
 */
export const calculateNextReview = (card: Card, grade: Grade): Card => {
  let { interval, easeFactor, status } = card;
  
  // Map grades to quality response (0-5 scale roughly)
  // 0: Again (Complete blackout)
  // 3: Hard (Correct response with serious difficulty)
  // 4: Good (Correct response after a hesitation)
  // 5: Easy (Perfect response)
  
  let quality = 0;
  switch (grade) {
    case 'Again': quality = 0; break;
    case 'Hard': quality = 3; break;
    case 'Good': quality = 4; break;
    case 'Easy': quality = 5; break;
  }

  if (grade === 'Again') {
    // Reset logic
    interval = 1; // Reset to 1 day
    // We punish the ease factor slightly on failure to prevent loops on hard cards
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    status = 'learning';
  } else {
    // Success logic
    if (status === 'learning') {
        status = 'review';
        interval = 1;
    }
    
    // Recalculate Interval
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = grade === 'Easy' ? 4 : 3; // Jumpstart easy cards
    } else {
        // Standard SM-2 interval calculation
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        const newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        easeFactor = Math.max(1.3, newEF); // Floor at 1.3
        
        let nextInterval = Math.ceil(interval * easeFactor * (grade === 'Hard' ? 0.5 : 1));
        interval = applyFuzz(nextInterval);
    }
    
    if (interval >= 21) status = 'graduated';
  }

  // Calculate new Due Date based on Start of Day
  const startOfToday = getStartOfDay();
  const dueDate = new Date(startOfToday);
  dueDate.setDate(dueDate.getDate() + interval);

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
 */
export const isCardDue = (card: Card): boolean => {
  const due = new Date(card.dueDate);
  const todayStart = getStartOfDay();
  // We compare timestamps to be safe
  return due.getTime() <= todayStart.getTime();
};