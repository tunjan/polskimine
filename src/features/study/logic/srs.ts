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
  const f = getFSRS(settings);
  const now = new Date();

  // --- CUSTOM LEARNING STEPS LOGIC ---
  const isLearningPhase = card.status === 'new' || card.status === 'learning';

  if (isLearningPhase) {
    const currentStep = card.learningStep ?? 0;

    // Calculate new step index based on grade
    let nextStep = currentStep;
    let newStatus: CardStatus = card.status;
    let intervalMinutes = 0;
    let graduation = false;

    switch (grade) {
      case 'Again':
        nextStep = 0;
        newStatus = 'learning';
        intervalMinutes = learningSteps[0];
        break;
      case 'Hard':
        // Repeat current step
        nextStep = currentStep;
        newStatus = 'learning';
        intervalMinutes = learningSteps[currentStep] || learningSteps[0];
        break;
      case 'Good':
        nextStep = currentStep + 1;
        if (nextStep >= learningSteps.length) {
          graduation = true;
        } else {
          newStatus = 'learning';
          intervalMinutes = learningSteps[nextStep];
        }
        break;
      case 'Easy':
        graduation = true;
        break;
    }

    if (!graduation) {
      // Keep in learning phase
      // We still run FSRS to update memory state (D/S) for tracking, but override schedule
      // Note: we treat it as 'No change' or 'Again' to FSRS if strict implementation, 
      // but here we just want to update D/S. 

      // Issue: ts-fsrs assumes state transitions.
      // Minimal impact approach: Just calculate D/S for the *future* Review state, 
      // but strictly set due date.

      // Actually, we should probably initialize FSRS state if it's new
      let state = card.state ?? State.New;
      if (card.status === 'new') state = State.New;

      const rating = mapGradeToRating(grade);

      // Create dummy FSRS card to get next D/S if possible, 
      // but FSRS might be aggressive. 
      // Let's rely on manual scheduling for learning and ONLY verify D/S on graduation.
      // However, we want 'elapsed_days' etc to be correct.

      const scheduledDate = addMinutes(now, intervalMinutes);

      return {
        ...card,
        status: 'learning',
        state: state === State.New ? State.Learning : state, // Transition New -> Learning
        learningStep: nextStep,
        dueDate: scheduledDate.toISOString(),
        interval: 0, // Interval in days is 0 for intraday
        scheduled_days: 0,
        // We don't update stability/difficulty heavily during learning steps in this simple implementation
        // or we could let FSRS run but ignore dates.
        last_review: now.toISOString(),
        reps: (card.reps || 0) + 1,
        lapses: grade === 'Again' ? (card.lapses || 0) + 1 : (card.lapses || 0),
      };
    }
    // If graduation, fall through to FSRS logic below...
    // But we need to ensure FSRS sees it as a transition from Learning -> Review
  }

  // --- FSRS LOGIC (Regular Review or Graduation) ---

  let currentState = card.state;
  if (currentState === undefined) {
    if (card.status === 'new') currentState = State.New;
    else if (card.status === 'learning') currentState = State.Learning;
    else currentState = State.Review;
  }

  const lastReviewDate = card.last_review ? new Date(card.last_review) : undefined;


  if (currentState === State.Review && !lastReviewDate) {
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

  const rating = mapGradeToRating(grade);

  const schedulingCards = f.repeat(fsrsCard, now);
  const log = schedulingCards[rating].card;

  const isNew = currentState === State.New || (card.reps || 0) === 0;
  const tentativeStatus = mapStateToStatus(log.state);

  const status = card.status === 'graduated' && tentativeStatus === 'learning' && grade !== 'Again'
    ? 'graduated'
    : tentativeStatus;

  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  if (totalLapses > 8) {
    isLeech = true;
  }

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
    first_review: card.first_review || (isNew ? now.toISOString() : undefined),
    status,
    interval: log.scheduled_days,
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

  // For learning cards (intraday), use strict timing
  if (card.status === 'learning' || card.state === State.Learning || card.state === State.Relearning) {
    return due <= now;
  }

  const srsToday = getSRSDate(now);
  const nextSRSDay = addDays(srsToday, 1);

  // For Review cards (interday), they are due if they fall within the current SRS day (before tomorrow's cutoff)
  // This allows "Review First" to pick them up even if they are technically due later in the day.
  return isBefore(due, nextSRSDay);
};
