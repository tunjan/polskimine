import { Card, Grade } from '../types';

/**
 * Calculates the next interval, ease factor, and due date for a card based on the user's rating.
 * Modified SM-2 Algorithm.
 */
export const calculateNextReview = (card: Card, grade: Grade): Card => {
  let { interval, easeFactor, status } = card;
  const now = new Date();

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
        let modifier = 1;
        if (grade === 'Hard') modifier = 1.2;
        if (grade === 'Good') modifier = 2.5;
        if (grade === 'Easy') modifier = 3.5; // Boost easy cards
        
        // Actually, strictly following SM-2 for EF updates:
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        const newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        easeFactor = Math.max(1.3, newEF); // Floor at 1.3
        
        interval = Math.ceil(interval * easeFactor * (grade === 'Hard' ? 0.5 : 1));
    }
    
    if (interval >= 21) status = 'graduated';
  }

  // Calculate new Due Date
  const dueDate = new Date(now);
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
 */
export const isCardDue = (card: Card): boolean => {
  const due = new Date(card.dueDate);
  const today = new Date();
  return due <= today;
};