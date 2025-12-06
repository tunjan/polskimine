import { addDays, startOfDay, subHours, isBefore, isSameDay, addMinutes } from 'date-fns';
import { Card, Grade, UserSettings, CardStatus } from '@/types';
import { SRS_CONFIG, FSRS_DEFAULTS } from '@/constants';
import { FSRS, Card as FSRSCard, Rating, State, generatorParameters } from 'ts-fsrs';

let cachedFSRS: FSRS | null = null;
let lastConfig: UserSettings['fsrs'] | null = null;

export const getSRSDate = (date: Date = new Date()): Date => {

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
  if (state === State.New) return 'new';
  if (state === State.Learning || state === State.Relearning) return 'learning';
  return 'graduated';
};

function getFSRS(settings?: UserSettings['fsrs']) {
  if (!cachedFSRS ||
    lastConfig?.request_retention !== settings?.request_retention ||
    lastConfig?.maximum_interval !== settings?.maximum_interval ||
    lastConfig?.w !== settings?.w ||
    lastConfig?.enable_fuzzing !== settings?.enable_fuzzing) {

    const paramsConfig = {
      request_retention: settings?.request_retention || FSRS_DEFAULTS.request_retention,
      maximum_interval: settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
      w: settings?.w || FSRS_DEFAULTS.w,
      enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
      // Disable FSRS internal learning steps because we handle them manually.
      // This ensures that when we 'fallthrough' to FSRS, it treats the card as graduating to Review.
      learning_steps: []
    };
    const params = generatorParameters(paramsConfig);
    cachedFSRS = new FSRS(params);
    lastConfig = settings || null;
  }
  return cachedFSRS;
}

export const calculateNextReview = (
  card: Card,
  grade: Grade,
  settings?: UserSettings['fsrs'],
  learningSteps: number[] = [1, 10] // Default to 1m, 10m
): Card => {
  const now = new Date();
  // --- MANUAL LEARNING STEP HANDLING ---
  const learningStepsMinutes = learningSteps.length > 0 ? learningSteps : [1, 10]; // Default if empty
  const currentStep = card.learningStep ?? 0;

  // Check if we are in the manual learning phase
  // We apply this for New cards or Learning cards that haven't exhausted steps.
  // We assume 'learning' status implies we are in this phase if step < length.
  const isLearningPhase = (card.status === 'new' || card.status === 'learning') && currentStep < learningStepsMinutes.length;

  if (isLearningPhase) {
    // If graduating (Easy or Good on last step), we fall through to FSRS.
    // Otherwise, we handle intervals manually.

    let nextStep = currentStep;
    let nextIntervalMinutes = 0;

    // Logic for Learning Phase
    if (grade === 'Again') {
      nextStep = 0;
      nextIntervalMinutes = learningStepsMinutes[0];
    } else if (grade === 'Hard') {
      // Repeat current step
      nextIntervalMinutes = learningStepsMinutes[currentStep];
    } else if (grade === 'Good') {
      nextStep = currentStep + 1;
      if (nextStep >= learningStepsMinutes.length) {
        // GRADUATE -> Fallthrough to FSRS
      } else {
        nextIntervalMinutes = learningStepsMinutes[nextStep];
      }
    } else if (grade === 'Easy') {
      // GRADUATE -> Fallthrough to FSRS
    }

    // If we calculated a manual interval (didn't graduate)
    if ((grade === 'Again' || grade === 'Hard') || (grade === 'Good' && nextStep < learningStepsMinutes.length)) {
      const nextDue = addMinutes(now, nextIntervalMinutes);
      const intervalDays = nextIntervalMinutes / (24 * 60);

      return {
        ...card,
        dueDate: nextDue.toISOString(),
        status: 'learning',
        state: State.Learning, // Keep as Learning for FSRS compatibility
        learningStep: nextStep,
        interval: intervalDays,
        precise_interval: intervalDays,
        scheduled_days: 0, // Learning steps are 0 days in FSRS/Anki terms usually
        last_review: now.toISOString(),
        reps: (card.reps || 0) + 1,
        lapses: grade === 'Again' ? (card.lapses || 0) + 1 : (card.lapses || 0),
        // We do NOT update stability/difficulty yet, waiting for graduation
      };
    }
  }

  // --- STANDARD FSRS LOGIC (Review / Graduation) ---

  const f = getFSRS(settings);

  let currentState = card.state;
  if (currentState === undefined) {
    if (card.status === 'new') currentState = State.New;
    else if (card.status === 'learning') currentState = State.Learning;
    else if (card.status === 'graduated') currentState = State.Review;
    else currentState = State.Review;
  }

  const lastReviewDate = card.last_review ? new Date(card.last_review) : undefined;


  if ((currentState === State.Review || currentState === State.Learning || currentState === State.Relearning) && !lastReviewDate) {
    // If missing last_review but in active state, fallback to New to avoid FSRS errors,
    // or set last_review to now (but that implies a review just happened).
    // Safest is to treat as New if data is corrupted.
    currentState = State.New;
  }

  const fsrsCard: FSRSCard = {
    due: new Date(card.dueDate),
    stability: card.stability || 0,
    difficulty: card.difficulty || 0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: currentState,
    last_review: lastReviewDate
  } as FSRSCard;


  const schedulingCards = f.repeat(fsrsCard, now);

  // Rating: Again=0, Hard=1, Good=2, Easy=3
  const rating = mapGradeToRating(grade);
  const log = schedulingCards[rating].card;

  // Determine App Status based on FSRS State
  const tentativeStatus = mapStateToStatus(log.state);

  // Check for Leech
  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  // Simple Leech threshold
  if (totalLapses > 8 && !isLeech) {
    isLeech = true;
  }

  // CRITICAL: FSRS returns integer scheduled_days for learning steps (0), 
  // so we must calculate the precise fractional interval from due date for accurate optimization data.
  const nowMs = now.getTime();
  const dueMs = log.due.getTime();
  const diffMs = dueMs - nowMs;
  // Ensure non-negative interval (if due is in past, it's 0)
  const preciseInterval = Math.max(0, diffMs / (24 * 60 * 60 * 1000));

  let scheduledDaysInt = Math.round(preciseInterval);
  // Enforce minimum 1 day for non-learning/graduated cards to prevent 0-day reviews in DB
  if (tentativeStatus !== 'learning' && tentativeStatus !== 'new') {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }

  // Use precise interval if scheduled_days is 0 (intraday) or mismatch is significant?
  // Actually, let's always use precise interval for consistency in data analysis,
  // BUT FSRS optimizer might expect integers for 'scheduled_days' if it strictly follows Anki format?
  // Anki's RevLog uses 'ivl' which is integer days (positive) or negative seconds (learning).
  // But ts-fsrs optimizer example often uses float days.
  // We will store precise float days in scheduled_days and interval.

  return {
    ...card,
    dueDate: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: scheduledDaysInt, // Store INT days for FSRS optimizer compatibility
    precise_interval: preciseInterval, // Store fractional days for internal precision
    reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review: log.last_review ? log.last_review.toISOString() : now.toISOString(),
    first_review: card.first_review || ((card.reps || 0) === 0 ? now.toISOString() : undefined),
    status: tentativeStatus,
    interval: preciseInterval, // Keep legacy interval precise for isCardDue logic
    learningStep: undefined, // Clear learning step on graduation/review
    leechCount: totalLapses,
    isLeech
  };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  // New cards are always considered due
  if (card.status === 'new' || card.state === State.New || (card.state === undefined && (card.reps || 0) === 0)) {
    return true;
  }

  const due = new Date(card.dueDate);

  // For short intervals (< 1 day), use STRICT timing. 
  // This covers Learning, Relearning, and intraday reviews.
  // We use 0.9 days as cutoff to be safe.
  if (card.interval < 0.9) {
    return due <= now;
  }

  // For truly long-term cards (>= 1 day), we allow the "Next Day" leniency
  // so users can review cards scheduled for 11pm at 9am the next valid "SRS Day".
  const srsToday = getSRSDate(now);
  const nextSRSDay = addDays(srsToday, 1);

  return isBefore(due, nextSRSDay);
};
