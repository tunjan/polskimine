import { addDays, startOfDay, subHours, isBefore, isSameDay, addMinutes } from 'date-fns';
import { Card, Grade, UserSettings, CardStatus, mapFsrsStateToStatus } from '@/types';
import { SRS_CONFIG, FSRS_DEFAULTS } from '@/constants';
import { FSRS, Card as FSRSCard, Rating, State, generatorParameters } from 'ts-fsrs';

let cachedFSRS: FSRS | null = null;
let lastConfig: UserSettings['fsrs'] | null = null;
let lastWHash: string | null = null;

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
  return mapFsrsStateToStatus(state);
};

function getFSRS(settings?: UserSettings['fsrs']) {
  const currentWHash = settings?.w ? JSON.stringify(settings.w) : null;

  if (!cachedFSRS ||
    lastConfig?.request_retention !== settings?.request_retention ||
    lastConfig?.maximum_interval !== settings?.maximum_interval ||
    lastWHash !== currentWHash ||
    lastConfig?.enable_fuzzing !== settings?.enable_fuzzing) {

    lastWHash = currentWHash;

    const paramsConfig = {
      request_retention: settings?.request_retention || FSRS_DEFAULTS.request_retention,
      maximum_interval: settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
      w: settings?.w || FSRS_DEFAULTS.w,
      enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
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
  learningSteps: number[] = [1, 10]): Card => {
  const now = new Date();
  const learningStepsMinutes = learningSteps.length > 0 ? learningSteps : [1, 10];
    const rawStep = card.learningStep ?? 0;
    const currentStep = Math.max(0, Math.min(rawStep, learningStepsMinutes.length - 1));

      const isLearningPhase = (card.status === CardStatus.NEW || card.status === CardStatus.LEARNING) && rawStep < learningStepsMinutes.length;

  if (isLearningPhase) {

    let nextStep = currentStep;
    let nextIntervalMinutes = 0;

    if (grade === 'Again') {
      nextStep = 0;
      nextIntervalMinutes = learningStepsMinutes[0] ?? 1;
    } else if (grade === 'Hard') {
            nextIntervalMinutes = learningStepsMinutes[currentStep]
        ?? learningStepsMinutes[learningStepsMinutes.length - 1]
        ?? 1;
    } else if (grade === 'Good') {
      nextStep = currentStep + 1;
      if (nextStep > learningStepsMinutes.length) {
              } else {
                        nextIntervalMinutes = learningStepsMinutes[currentStep] ?? 1;
      }
    }
        
            if ((grade === 'Again' || grade === 'Hard') || (grade === 'Good' && nextStep <= learningStepsMinutes.length)) {
      let nextDue = addMinutes(now, nextIntervalMinutes);

            if (isNaN(nextDue.getTime())) {
        console.error('[SRS] Invalid learning step interval', { nextIntervalMinutes, grade, card });
        nextDue = addMinutes(now, 1);       }

      const intervalDays = nextIntervalMinutes / (24 * 60);

      return {
        ...card,
        dueDate: nextDue.toISOString(),
        status: CardStatus.LEARNING,
        state: State.Learning, learningStep: nextStep,
        interval: intervalDays,
        precise_interval: intervalDays,
        scheduled_days: 0, last_review: now.toISOString(),
        reps: (card.reps || 0) + 1,
        lapses: grade === 'Again' ? (card.lapses || 0) + 1 : (card.lapses || 0),
      };
    }
  }


  const f = getFSRS(settings);

  let currentState = card.state;
  if (currentState === undefined) {
    if (card.status === CardStatus.NEW) currentState = State.New;
    else if (card.status === CardStatus.LEARNING) currentState = State.Learning;
    else if (card.status === CardStatus.REVIEW) currentState = State.Review;     else currentState = State.Review;
  }

      if (!isLearningPhase && (card.status === CardStatus.LEARNING || card.status === CardStatus.NEW)) {
    currentState = State.New;
  }

  const lastReviewDate = card.last_review ? new Date(card.last_review) : undefined;


  if ((currentState === State.Review || currentState === State.Learning || currentState === State.Relearning) && !lastReviewDate) {
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

  const rating = mapGradeToRating(grade);
  const log = schedulingCards[rating].card;

  const tentativeStatus = mapStateToStatus(log.state);

  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  if (totalLapses > 8 && !isLeech) {
    isLeech = true;
  }

  const nowMs = now.getTime();
  const dueMs = log.due.getTime();
  const diffMs = dueMs - nowMs;
  const preciseInterval = Math.max(0, diffMs / (24 * 60 * 60 * 1000));

  let scheduledDaysInt = Math.round(preciseInterval);
  if (tentativeStatus !== CardStatus.LEARNING && tentativeStatus !== CardStatus.NEW) {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }


  return {
    ...card,
    dueDate: !isNaN(log.due.getTime()) ? log.due.toISOString() : addMinutes(now, 10).toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: scheduledDaysInt, precise_interval: preciseInterval, reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review: (log.last_review && !isNaN(log.last_review.getTime())) ? log.last_review.toISOString() : now.toISOString(),
    first_review: card.first_review || ((card.reps || 0) === 0 ? now.toISOString() : undefined),
    status: tentativeStatus,
    interval: preciseInterval, learningStep: undefined, leechCount: totalLapses,
    isLeech
  };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  if (card.status === CardStatus.NEW || card.state === State.New || (card.state === undefined && (card.reps || 0) === 0)) {
    return true;
  }

  const due = new Date(card.dueDate);

      const ONE_HOUR_IN_DAYS = 1 / 24;
  if (card.interval < ONE_HOUR_IN_DAYS) {
    return due <= now;
  }

  const srsToday = getSRSDate(now);
  const nextSRSDay = addDays(srsToday, 1);

  return isBefore(due, nextSRSDay);
};
