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
  const learningStepsMinutes = learningSteps.length > 0 ? learningSteps : [1, 10]; const currentStep = card.learningStep ?? 0;

  const isLearningPhase = (card.status === 'new' || card.status === 'learning') && currentStep < learningStepsMinutes.length;

  if (isLearningPhase) {

    let nextStep = currentStep;
    let nextIntervalMinutes = 0;

    if (grade === 'Again') {
      nextStep = 0;
      nextIntervalMinutes = learningStepsMinutes[0];
    } else if (grade === 'Hard') {
      nextIntervalMinutes = learningStepsMinutes[currentStep];
    } else if (grade === 'Good') {
      nextStep = currentStep + 1;
      if (nextStep >= learningStepsMinutes.length) {
      } else {
        nextIntervalMinutes = learningStepsMinutes[nextStep];
      }
    } else if (grade === 'Easy') {
    }

    if ((grade === 'Again' || grade === 'Hard') || (grade === 'Good' && nextStep < learningStepsMinutes.length)) {
      const nextDue = addMinutes(now, nextIntervalMinutes);
      const intervalDays = nextIntervalMinutes / (24 * 60);

      return {
        ...card,
        dueDate: nextDue.toISOString(),
        status: 'learning',
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
    if (card.status === 'new') currentState = State.New;
    else if (card.status === 'learning') currentState = State.Learning;
    else if (card.status === 'graduated') currentState = State.Review;
    else currentState = State.Review;
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
  if (tentativeStatus !== 'learning' && tentativeStatus !== 'new') {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }


  return {
    ...card,
    dueDate: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: scheduledDaysInt, precise_interval: preciseInterval, reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review: log.last_review ? log.last_review.toISOString() : now.toISOString(),
    first_review: card.first_review || ((card.reps || 0) === 0 ? now.toISOString() : undefined),
    status: tentativeStatus,
    interval: preciseInterval, learningStep: undefined, leechCount: totalLapses,
    isLeech
  };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  if (card.status === 'new' || card.state === State.New || (card.state === undefined && (card.reps || 0) === 0)) {
    return true;
  }

  const due = new Date(card.dueDate);

  if (card.interval < 0.9) {
    return due <= now;
  }

  const srsToday = getSRSDate(now);
  const nextSRSDay = addDays(srsToday, 1);

  return isBefore(due, nextSRSDay);
};
