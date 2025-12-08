import { addDays, startOfDay, subHours, isBefore, addMinutes } from "date-fns";
import {
  Card,
  Grade,
  UserSettings,
  CardStatus,
  mapFsrsStateToStatus,
} from "@/types";
import { SRS_CONFIG, FSRS_DEFAULTS } from "@/constants";
import {
  FSRS,
  Card as FSRSCard,
  Rating,
  State,
  generatorParameters,
} from "ts-fsrs";
import { inferCardState } from "./stateUtils";

let cachedFSRS: FSRS | null = null;
let lastConfig: UserSettings["fsrs"] | null = null;
let lastWHash: string | null = null;

export const getSRSDate = (date: Date = new Date()): Date => {
  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

const mapGradeToRating = (grade: Grade): Rating => {
  switch (grade) {
    case "Again":
      return Rating.Again;
    case "Hard":
      return Rating.Hard;
    case "Good":
      return Rating.Good;
    case "Easy":
      return Rating.Easy;
  }
};

const mapStateToStatus = (state: State): CardStatus => {
  return mapFsrsStateToStatus(state);
};

function getFSRS(settings?: UserSettings["fsrs"]) {
  // Defensive copy of w array to ensure consistent hashing
  const wArray = settings?.w ? [...settings.w] : null;
  const currentWHash = wArray ? JSON.stringify(wArray) : null;

  if (
    !cachedFSRS ||
    lastConfig?.request_retention !== settings?.request_retention ||
    lastConfig?.maximum_interval !== settings?.maximum_interval ||
    lastWHash !== currentWHash ||
    lastConfig?.enable_fuzzing !== settings?.enable_fuzzing
  ) {
    lastWHash = currentWHash;

    const paramsConfig = {
      request_retention:
        settings?.request_retention || FSRS_DEFAULTS.request_retention,
      maximum_interval:
        settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
      w: wArray || FSRS_DEFAULTS.w,
      enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
    };
    const params = generatorParameters(paramsConfig);
    cachedFSRS = new FSRS(params);
    lastConfig = settings ? { ...settings, w: wArray ?? undefined } : null;
  }
  return cachedFSRS;
}

export interface LapsesSettings {
  leechThreshold?: number;
  leechAction?: "tag" | "suspend";
  relearnSteps?: number[];
}

/**
 * Handle learning phase logic for new cards going through initial learning steps.
 */
const handleLearningPhase = (
  card: Card,
  grade: Grade,
  now: Date,
  learningStepsMinutes: number[],
  currentStep: number,
  leechThreshold: number,
): Card | null => {
  let nextStep = currentStep;
  let nextIntervalMinutes = 0;
  let shouldStayInLearning = false;
  let lapsesToAdd = 0;

  if (grade === "Again") {
    nextStep = 0;
    nextIntervalMinutes = learningStepsMinutes[0] ?? 1;
    shouldStayInLearning = true;
    // Note: We count learning failures as "lapses" for leech detection purposes.
    // This differs from FSRS's strict definition (lapses = Review→Relearning),
    // but provides better UX by detecting problematic cards early.
    lapsesToAdd = 1;
  } else if (grade === "Hard") {
    // Stay at current step with current interval
    nextIntervalMinutes =
      learningStepsMinutes[currentStep] ??
      learningStepsMinutes[learningStepsMinutes.length - 1] ??
      1;
    shouldStayInLearning = true;
  } else if (grade === "Good") {
    nextStep = currentStep + 1;
    if (nextStep >= learningStepsMinutes.length) {
      // Graduate to FSRS
      shouldStayInLearning = false;
    } else {
      nextIntervalMinutes = learningStepsMinutes[nextStep] ?? 1;
      shouldStayInLearning = true;
    }
  }
  // "Easy" grade falls through to FSRS for immediate graduation

  if (!shouldStayInLearning) {
    return null; // Signal to use FSRS
  }

  let nextDue = addMinutes(now, nextIntervalMinutes);
  if (isNaN(nextDue.getTime())) {
    console.error("[SRS] Invalid learning step interval", {
      nextIntervalMinutes,
      grade,
      card,
    });
    nextDue = addMinutes(now, 1);
  }

  let intervalDays = nextIntervalMinutes / (24 * 60);
  if (!Number.isFinite(intervalDays) || intervalDays < 0) {
    intervalDays = 1 / (24 * 60); // Default to 1 minute
  }
  const newLapses = (card.lapses || 0) + lapsesToAdd;

  // Leech detection for learning phase
  let isLeech = card.isLeech || false;
  if (newLapses >= leechThreshold && !isLeech) {
    isLeech = true;
  }

  return {
    ...card,
    dueDate: nextDue.toISOString(),
    status: CardStatus.LEARNING,
    state: State.Learning,
    learningStep: nextStep,
    interval: intervalDays,
    precise_interval: intervalDays,
    scheduled_days: 0,
    last_review: now.toISOString(),
    reps: (card.reps || 0) + 1,
    lapses: newLapses,
    leechCount: newLapses,
    isLeech,
  };
};

/**
 * Handle relearning phase logic for cards that lapsed.
 */
const handleRelearningPhase = (
  card: Card,
  grade: Grade,
  now: Date,
  relearnStepsMinutes: number[],
  currentStep: number,
  leechThreshold: number,
  currentLapses: number,
): Card | null => {
  if (relearnStepsMinutes.length === 0) {
    return null; // No relearn steps configured, use FSRS
  }

  let nextStep = currentStep;
  let nextIntervalMinutes = 0;
  let shouldStayInRelearning = false;

  if (grade === "Again") {
    nextStep = 0;
    nextIntervalMinutes = relearnStepsMinutes[0] ?? 1;
    shouldStayInRelearning = true;
  } else if (grade === "Hard") {
    nextIntervalMinutes =
      relearnStepsMinutes[currentStep] ??
      relearnStepsMinutes[relearnStepsMinutes.length - 1] ??
      1;
    shouldStayInRelearning = true;
  } else if (grade === "Good") {
    nextStep = currentStep + 1;
    if (nextStep >= relearnStepsMinutes.length) {
      // Graduate back to Review
      shouldStayInRelearning = false;
    } else {
      nextIntervalMinutes = relearnStepsMinutes[nextStep] ?? 1;
      shouldStayInRelearning = true;
    }
  }
  // "Easy" exits relearning immediately

  if (!shouldStayInRelearning) {
    return null; // Exit relearning, use FSRS
  }

  let nextDue = addMinutes(now, nextIntervalMinutes);
  if (isNaN(nextDue.getTime())) {
    nextDue = addMinutes(now, 1);
  }

  let intervalDays = nextIntervalMinutes / (24 * 60);
  if (!Number.isFinite(intervalDays) || intervalDays < 0) {
    intervalDays = 1 / (24 * 60); // Default to 1 minute
  }

  // Leech detection
  let isLeech = card.isLeech || false;
  if (currentLapses >= leechThreshold && !isLeech) {
    isLeech = true;
  }

  return {
    ...card,
    dueDate: nextDue.toISOString(),
    status: CardStatus.LEARNING,
    state: State.Relearning,
    learningStep: nextStep,
    interval: intervalDays,
    precise_interval: intervalDays,
    scheduled_days: 0,
    last_review: now.toISOString(),
    reps: (card.reps || 0) + 1,
    lapses: currentLapses,
    leechCount: currentLapses,
    isLeech,
  };
};

/**
 * Apply leech action if card is marked as leech.
 */
const applyLeechAction = (
  card: Card,
  leechAction: "tag" | "suspend" | undefined,
  isLeech: boolean,
): Partial<Card> => {
  if (!isLeech) {
    return {};
  }

  if (leechAction === "suspend") {
    // Suspend the card by marking it as KNOWN (removes from study queue)
    return { status: CardStatus.KNOWN };
  }

  if (leechAction === "tag") {
    // Add "leech" tag if not already present
    const existingTags = card.tags || [];
    if (!existingTags.includes("leech")) {
      return { tags: [...existingTags, "leech"] };
    }
  }

  return {};
};

export const calculateNextReview = (
  card: Card,
  grade: Grade,
  settings?: UserSettings["fsrs"],
  learningSteps: number[] = [1, 10],
  lapsesSettings?: LapsesSettings,
): Card => {
  const now = new Date();
  // Validate learning steps: filter out non-positive values and use defaults if empty
  const validLearningSteps = learningSteps.filter((s) => s > 0);
  const learningStepsMinutes =
    validLearningSteps.length > 0 ? validLearningSteps : [1, 10];
  const validRelearnSteps = (lapsesSettings?.relearnSteps ?? []).filter(
    (s) => s > 0,
  );
  const relearnStepsMinutes = validRelearnSteps;
  const leechThreshold = lapsesSettings?.leechThreshold ?? 8;
  const leechAction = lapsesSettings?.leechAction;

  const rawStep = card.learningStep ?? 0;

  // Check if card is in initial learning phase
  // Use clamped step for phase detection to handle mid-session config changes
  const learningStep = Math.max(
    0,
    Math.min(rawStep, learningStepsMinutes.length - 1),
  );
  const isLearningPhase =
    (card.status === CardStatus.NEW || card.status === CardStatus.LEARNING) &&
    card.state !== State.Relearning &&
    learningStep < learningStepsMinutes.length;

  // Check if card is in relearning phase (lapsed from Review)
  // Simplified: just check state, which is the reliable source of truth
  const isRelearningPhase = card.state === State.Relearning;

  // Handle initial learning phase
  if (isLearningPhase) {
    const learningResult = handleLearningPhase(
      card,
      grade,
      now,
      learningStepsMinutes,
      learningStep,
      leechThreshold,
    );
    if (learningResult) {
      const leechOverrides = applyLeechAction(
        learningResult,
        leechAction,
        learningResult.isLeech || false,
      );
      return { ...learningResult, ...leechOverrides };
    }
  }

  // Handle relearning phase
  if (isRelearningPhase && relearnStepsMinutes.length > 0) {
    const relearnStep = Math.min(rawStep, relearnStepsMinutes.length - 1);
    const relearnResult = handleRelearningPhase(
      card,
      grade,
      now,
      relearnStepsMinutes,
      relearnStep,
      leechThreshold,
      card.lapses || 0,
    );
    if (relearnResult) {
      const leechOverrides = applyLeechAction(
        relearnResult,
        leechAction,
        relearnResult.isLeech || false,
      );
      return { ...relearnResult, ...leechOverrides };
    }
  }

  // FSRS scheduling
  const f = getFSRS(settings);

  // Determine the correct state for FSRS
  // For cards graduating from learning, we should let FSRS know they've been reviewed
  const lastReviewDate = card.last_review
    ? new Date(card.last_review)
    : undefined;
  let currentState = inferCardState(card, !!lastReviewDate);

  // For cards that graduated from learning/relearning (passed all steps),
  // we should tell FSRS they are in Learning state so it can graduate them to Review.
  // Do NOT reset to State.New as that would lose all the learning progress.
  if (!isLearningPhase && !isRelearningPhase) {
    if (card.status === CardStatus.LEARNING || card.status === CardStatus.NEW) {
      // Card is graduating - use Learning state so FSRS can promote to Review
      // Only reset to New if it truly never had a review
      currentState = lastReviewDate ? State.Learning : State.New;
    }
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
    last_review: lastReviewDate,
  } as FSRSCard;

  const schedulingCards = f.repeat(fsrsCard, now);

  const rating = mapGradeToRating(grade);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schedulingResult = (schedulingCards as any)[rating] as {
    card: FSRSCard;
  };
  const log = schedulingResult.card;

  // Check if this is a lapse (Again on a Review/Relearning card)
  const isLapse =
    grade === "Again" &&
    (currentState === State.Review || currentState === State.Relearning);

  // If lapsing and relearn steps are configured, enter relearning
  if (isLapse && relearnStepsMinutes.length > 0) {
    const newLapses = log.lapses;
    let isLeech = card.isLeech || false;
    if (newLapses >= leechThreshold && !isLeech) {
      isLeech = true;
    }

    const nextDue = addMinutes(now, relearnStepsMinutes[0] ?? 1);
    const intervalDays = (relearnStepsMinutes[0] ?? 1) / (24 * 60);

    const result: Card = {
      ...card,
      dueDate: nextDue.toISOString(),
      status: CardStatus.LEARNING,
      state: State.Relearning,
      learningStep: 0,
      stability: log.stability,
      difficulty: log.difficulty,
      elapsed_days: log.elapsed_days,
      interval: intervalDays,
      precise_interval: intervalDays,
      scheduled_days: 0,
      last_review: now.toISOString(),
      first_review: card.first_review || now.toISOString(),
      reps: log.reps,
      lapses: newLapses,
      leechCount: newLapses,
      isLeech,
    };

    const leechOverrides = applyLeechAction(result, leechAction, isLeech);
    return { ...result, ...leechOverrides };
  }

  // Standard FSRS result
  const tentativeStatus = mapStateToStatus(log.state);
  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  if (totalLapses >= leechThreshold && !isLeech) {
    isLeech = true;
  }

  const nowMs = now.getTime();
  const dueMs = log.due.getTime();
  const diffMs = dueMs - nowMs;
  const preciseInterval = Math.max(0, diffMs / (24 * 60 * 60 * 1000));

  let scheduledDaysInt = Math.round(preciseInterval);
  if (
    tentativeStatus !== CardStatus.LEARNING &&
    tentativeStatus !== CardStatus.NEW
  ) {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }

  const result: Card = {
    ...card,
    dueDate: !isNaN(log.due.getTime())
      ? log.due.toISOString()
      : addMinutes(now, 10).toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: scheduledDaysInt,
    precise_interval: preciseInterval,
    reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review:
      log.last_review && !isNaN(log.last_review.getTime())
        ? log.last_review.toISOString()
        : now.toISOString(),
    first_review: card.first_review || now.toISOString(),
    status: tentativeStatus,
    interval: preciseInterval,
    learningStep: undefined,
    leechCount: totalLapses,
    isLeech,
  };

  const leechOverrides = applyLeechAction(result, leechAction, isLeech);
  return { ...result, ...leechOverrides };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  if (
    card.status === CardStatus.NEW ||
    card.state === State.New ||
    (card.state === undefined && (card.reps || 0) === 0)
  ) {
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
