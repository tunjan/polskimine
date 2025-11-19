import { addDays, startOfDay, subHours, isBefore, isSameDay } from 'date-fns';
import { Card, Grade, UserSettings, CardStatus } from '../types';
import { SRS_CONFIG, FSRS_DEFAULTS } from '../constants';
import { FSRS, Card as FSRSCard, Rating, State, generatorParameters } from 'ts-fsrs';

export const getSRSDate = (date: Date = new Date()): Date => {
  // Shift time back by CUTOFF_HOUR so that "today" starts at 4 AM
  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

const mapGradeToRating = (grade: Grade): Rating => {
  switch (grade) {
    case 'Again': return Rating.Again;
    case 'Hard': return Rating.Hard;
    case 'Good': return Rating.Good;
    case 'Easy': return Rating.Easy;
  }
};

const mapStateToStatus = (state: State): CardStatus => {
  switch (state) {
    case State.New: return 'learning';
    case State.Learning: return 'learning';
    case State.Relearning: return 'learning';
    case State.Review: return 'review';
    default: return 'learning';
  }
};

/**
 * Calculates the next interval and scheduling info using FSRS.
 */
export const calculateNextReview = (card: Card, grade: Grade, settings?: UserSettings['fsrs']): Card => {
  const params = generatorParameters({
    request_retention: settings?.request_retention || FSRS_DEFAULTS.request_retention,
    maximum_interval: settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
    w: settings?.w || FSRS_DEFAULTS.w,
    enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
  });

  const f = new FSRS(params);

  // Convert our Card to FSRSCard
  // If FSRS fields are missing, we treat it as a New card or try to migrate
  // For simplicity, if state is missing, we treat as New.
  const now = new Date();
  
  const fsrsCard: FSRSCard = {
    due: new Date(card.dueDate),
    stability: card.stability || 0,
    difficulty: card.difficulty || 0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: card.state ?? State.New,
    last_review: card.last_review ? new Date(card.last_review) : undefined
  } as FSRSCard;

  // If it's a legacy card (no state) but has been reviewed (interval > 0), 
  // we might want to initialize it better, but for now let's just let FSRS handle it from 'New' 
  // or if we want to be smarter, we could create a card with some initial stability.
  // However, the safest path for migration without complex logic is to start FSRS tracking from now.
  // If the card was "graduated" in SM-2, it might be annoying to reset to "New".
  // A simple hack: if status is 'graduated' or 'review', set state to Review and guess stability?
  // Let's stick to the basics: if it's the first time FSRS sees it, it treats it as a fresh interaction 
  // unless we manually construct the object.
  // BUT, `f.repeat` takes a card and a rating.
  
  // Fix: If we pass a "New" card with a past due date, FSRS handles it.
  
  const rating = mapGradeToRating(grade);
  const schedulingCards = f.repeat(fsrsCard, now);
  
  // schedulingCards[rating] gives us the Log object which contains the new card state
  const log = schedulingCards[rating].card;

  return {
    ...card,
    dueDate: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: log.scheduled_days,
    reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review: log.last_review ? log.last_review.toISOString() : now.toISOString(),
    status: mapStateToStatus(log.state),
    // Update legacy fields for backward compatibility if needed, or just sync them
    interval: log.scheduled_days,
  };
};

/**
 * Checks if a card is due for review.
 */
export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  const due = new Date(card.dueDate);
  const srsToday = getSRSDate(now);
  // FSRS uses exact timestamps, but for UI "Due Today" logic, we usually stick to the cutoff.
  // However, FSRS 'due' is a specific point in time.
  // If we want to show cards that are due *now* (minutes/hours level), we check due <= now.
  // If we want "Due Today" style (Anki), we check if due < tomorrow_cutoff.
  
  // Let's stick to the "Due by cutoff" logic for consistency with the rest of the app.
  return isBefore(due, srsToday) || isSameDay(due, srsToday) || due <= now;
};
