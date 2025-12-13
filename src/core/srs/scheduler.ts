import { startOfDay, subHours, addMinutes } from "date-fns";
import {
  Card,
  Grade,
  UserSettings,
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

const FALLBACK_DUE_DATE_MINUTES = 10;

let cachedFSRS: FSRS | null = null;
let lastConfig: UserSettings["fsrs"] | null = null;
let lastWHash: string | null = null;

export const getSRSDate = (date: Date = new Date()): Date => {
  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

// Helper to convert timestamp to "Scheduler Days" respecting cutoff and local time
const toSchedulerDays = (date: Date): number => {
  const cutoffHour = SRS_CONFIG.CUTOFF_HOUR || 4;
  const adjustedDate = new Date(date);
  // Shift time so that the cutoff hour becomes the new "midnight"
  adjustedDate.setHours(adjustedDate.getHours() - cutoffHour);
  
  const oneDay = 24 * 60 * 60 * 1000;
  // Use timezone offset to align with local days
  const timezoneOffset = adjustedDate.getTimezoneOffset() * 60 * 1000;
  return Math.floor((adjustedDate.getTime() - timezoneOffset) / oneDay);
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


function getFSRS(settings?: UserSettings["fsrs"]) {
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
  leechAction?: "suspend";
  relearnSteps?: number[];
}

interface AnkiMetadata {
  type: number;
  queue: number;
  due: number;
}

const calculateAnkiMetadata = (
  state: State,
  dueDate: Date,
  intervalDays: number,
  currentDue: number = 0
): AnkiMetadata => {
  const dueTimestamp = dueDate.getTime();
  let type = 0;
  let queue = 0;
  let due = 0;

  if (state === State.New) {
    type = 0;
    queue = 0;
    due = currentDue; // Preserve the sort order
  } else if (state === State.Learning) {
    type = 1;
    // Intraday Learning
    if (intervalDays < 1) {
      queue = 1;
      due = Math.floor(dueTimestamp / 1000); // Unix Timestamp
    } else {
      // Interday Learning
      queue = 3;
      due = toSchedulerDays(dueDate); // Day Count
    }
  } else if (state === State.Review) {
    type = 2;
    queue = 2;
    due = toSchedulerDays(dueDate); // Day Count
  } else if (state === State.Relearning) {
    type = 3;
    if (intervalDays < 1) {
      queue = 1;
      due = Math.floor(dueTimestamp / 1000);
    } else {
      queue = 3;
      due = toSchedulerDays(dueDate);
    }
  }

  return { type, queue, due };
};

const handleLearningPhase = (
  card: Card,
  grade: Grade,
  now: Date,
  learningStepsMinutes: number[],
  currentStep: number,
  leechThreshold: number
): Card | null => {
  let nextStep = currentStep;
  let nextIntervalMinutes = 0;
  let shouldStayInLearning = false;
  let lapsesToAdd = 0;

  if (grade === "Again") {
    nextStep = 0;
    nextIntervalMinutes = learningStepsMinutes[0] ?? 1;
    shouldStayInLearning = true;
    lapsesToAdd = 0;
  } else if (grade === "Hard") {
    nextIntervalMinutes =
      learningStepsMinutes[currentStep] ??
      learningStepsMinutes[learningStepsMinutes.length - 1] ??
      1;
    shouldStayInLearning = true;
  } else if (grade === "Good") {
        if (card.type === 0 || (card.reps === 0 && card.state !== State.Review)) {
      nextStep = 0;
    } else {
      nextStep = currentStep + 1;
    }

    if (nextStep >= learningStepsMinutes.length) {
      shouldStayInLearning = false;
    } else {
      nextIntervalMinutes = learningStepsMinutes[nextStep] ?? 1;
      shouldStayInLearning = true;
    }
  }

  if (!shouldStayInLearning) {
    return null;
  }

  const nextIntervalMs = nextIntervalMinutes * 60 * 1000;
  let nextDue = new Date(now.getTime() + nextIntervalMs);
  if (isNaN(nextDue.getTime())) {
    console.error("[SRS] Invalid learning step interval", {
      nextIntervalMinutes,
      grade,
      card,
    });
    nextDue = new Date(now.getTime() + 60 * 1000);
  }

  let intervalDays = nextIntervalMinutes / (24 * 60);
  if (!Number.isFinite(intervalDays) || intervalDays < 0) {
    intervalDays = 1 / (24 * 60);
  }
  const newLapses = (card.lapses || 0) + lapsesToAdd;

  let isLeech = card.isLeech || false;
  if (newLapses >= leechThreshold && !isLeech) {
    isLeech = true;
  }

    const meta = calculateAnkiMetadata(State.Learning, nextDue, intervalDays, card.due);

  return {
    ...card,
            type: meta.type,
    queue: meta.queue,
    due: meta.due,
    left: learningStepsMinutes.length - nextStep,
    last_modified: Math.floor(Date.now() / 1000),
    
    state: State.Learning,
    learningStep: nextStep,
    interval: intervalDays,
    precise_interval: intervalDays,
    scheduled_days: Math.floor(intervalDays),
    last_review: now.getTime(),
    reps: (card.reps || 0) + 1,
    lapses: newLapses,
    leechCount: newLapses,
    isLeech,
  };
};

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
    return null;
  }

  const isFirstReviewInRelearning = (card.learningStep ?? 0) < 0;
  const effectiveStep = isFirstReviewInRelearning ? 0 : currentStep;

  let nextStep = effectiveStep;
  let nextIntervalMinutes = 0;
  let shouldStayInRelearning = false;

  if (grade === "Again") {
    nextStep = -1;
    nextIntervalMinutes = relearnStepsMinutes[0] ?? 1;
    shouldStayInRelearning = true;
  } else if (grade === "Hard") {
    nextIntervalMinutes =
      relearnStepsMinutes[effectiveStep] ??
      relearnStepsMinutes[relearnStepsMinutes.length - 1] ??
      1;
    shouldStayInRelearning = true;
  } else if (grade === "Good") {
    if (isFirstReviewInRelearning) {
      nextStep = 0;
      nextIntervalMinutes = relearnStepsMinutes[0] ?? 1;
      shouldStayInRelearning = true;
    } else {
      nextStep = effectiveStep + 1;
      if (nextStep >= relearnStepsMinutes.length) {
        shouldStayInRelearning = false;
      } else {
        nextIntervalMinutes = relearnStepsMinutes[nextStep] ?? 1;
        shouldStayInRelearning = true;
      }
    }
  }

  if (!shouldStayInRelearning) {
    return null;
  }

  const nextIntervalMs = nextIntervalMinutes * 60 * 1000;
  let nextDue = new Date(now.getTime() + nextIntervalMs);
  if (isNaN(nextDue.getTime())) {
    nextDue = new Date(now.getTime() + 60 * 1000);
  }

  let intervalDays = nextIntervalMinutes / (24 * 60);
  if (!Number.isFinite(intervalDays) || intervalDays < 0) {
    intervalDays = 1 / (24 * 60);
  }

  let isLeech = card.isLeech || false;
  if (currentLapses >= leechThreshold && !isLeech) {
    isLeech = true;
  }

    const meta = calculateAnkiMetadata(State.Relearning, nextDue, intervalDays, card.due);

  return {
    ...card,
            type: meta.type,
    queue: meta.queue,
    due: meta.due,
    left: relearnStepsMinutes.length - Math.max(0, nextStep), 
    last_modified: Math.floor(Date.now() / 1000),

    state: State.Relearning,
    learningStep: nextStep,
    interval: intervalDays,
    precise_interval: intervalDays,
    scheduled_days: Math.floor(intervalDays),
    last_review: now.getTime(),
    reps: (card.reps || 0) + 1,
    lapses: currentLapses,
    leechCount: currentLapses,
    isLeech,
  };
};

const applyLeechAction = (
  leechAction: "suspend" | undefined,
  isLeech: boolean
): Partial<Card> => {
  if (!isLeech) {
    return {};
  }

  if (leechAction === "suspend") {
        return { queue: -1 }; 
  }

  return {};
};

export const calculateNextReview = (
  card: Card,
  grade: Grade,
  settings?: UserSettings["fsrs"],
  learningSteps: number[] = [1, 10],
  lapsesSettings?: LapsesSettings
): Card => {
  const now = new Date();
  const validLearningSteps = learningSteps.filter((s) => s > 0);
  const learningStepsMinutes =
    validLearningSteps.length > 0 ? validLearningSteps : [1, 10];
  const validRelearnSteps = (lapsesSettings?.relearnSteps ?? []).filter(
    (s) => s > 0
  );
  const relearnStepsMinutes = validRelearnSteps;
  const leechThreshold = lapsesSettings?.leechThreshold ?? 8;
  const leechAction = lapsesSettings?.leechAction;

    card.difficulty = card.difficulty
    ? Math.max(1, Math.min(10, card.difficulty))
    : undefined;
  card.stability = card.stability ? Math.max(0.1, card.stability) : undefined;

  const rawStep = card.learningStep ?? 0;

  const learningStep = Math.max(
    0,
    Math.min(rawStep, learningStepsMinutes.length - 1)
  );

      const isLearningPhase =
    (card.type === 0 || card.type === 1) &&
    card.state !== State.Relearning &&
    (card.learningStep !== undefined || card.type === 0) &&
    (card.learningStep ?? 0) < learningStepsMinutes.length;

  if (
    (card.type === 1 || card.type === 0) &&
    card.learningStep === undefined &&
    card.state !== State.Relearning
  ) {
    const minuteInterval = Math.round(card.interval * 24 * 60);

    if (minuteInterval > 0) {
      let recoveredStep = 0;
      let minDiff = Infinity;

      for (let i = 0; i < learningStepsMinutes.length; i++) {
        const diff = Math.abs(learningStepsMinutes[i] - minuteInterval);
        if (diff < minDiff) {
          minDiff = diff;
          recoveredStep = i;
        }
      }

      if (recoveredStep < learningStepsMinutes.length) {
        const learningResult = handleLearningPhase(
          card,
          grade,
          now,
          learningStepsMinutes,
          recoveredStep,
          leechThreshold
        );
        if (learningResult) {
          const leechOverrides = applyLeechAction(
            leechAction,
            learningResult.isLeech || false
          );
          return { ...learningResult, ...leechOverrides };
        }
      }
    }
  }
  const isRelearningPhase = card.state === State.Relearning;

  if (isLearningPhase) {
    const learningResult = handleLearningPhase(
      card,
      grade,
      now,
      learningStepsMinutes,
      learningStep,
      leechThreshold
    );
    if (learningResult) {
      const leechOverrides = applyLeechAction(
        leechAction,
        learningResult.isLeech || false
      );
      return { ...learningResult, ...leechOverrides };
    }
  }

  if (isRelearningPhase && relearnStepsMinutes.length > 0) {
    const relearnStep = Math.min(rawStep, relearnStepsMinutes.length - 1);
    const relearnResult = handleRelearningPhase(
      card,
      grade,
      now,
      relearnStepsMinutes,
      relearnStep,
      leechThreshold,
      card.lapses || 0
    );
    if (relearnResult) {
      const leechOverrides = applyLeechAction(
        leechAction,
        relearnResult.isLeech || false
      );
      return { ...relearnResult, ...leechOverrides };
    }
  }

  const f = getFSRS(settings);

  const lastReviewDate = card.last_review
    ? new Date(card.last_review)
    : undefined;
      let currentState = inferCardState(card, !!lastReviewDate);

  // Fix for "Graduating from Learning"
  // If we fell through to here, it means we graduated from Learning/Relearning (or were never in it).
  // If the card was previously Learning/Relearning, we must treat it as a fresh Review candidate for FSRS
  // or State.New if it was the very first graduation.
  if (!isLearningPhase && !isRelearningPhase) {
    if (card.type === 1 || card.type === 0) {
      if (lastReviewDate) {
        // Was Learning, now Graduating -> Transition to Review
        // We set currentState to Learning so FSRS knows it's a graduation event if handled that way,
        // BUT ts-fsrs `repeat` typically expects the *current* state.
        // If we pass State.Learning to `f.repeat`, it treats it as a short-term learning step which is NOT what we want for graduation.
        // We want to initialize Stability/Difficulty.
        // Actually, FSRS ignores `state` in the input Card object for `repeat`? No, it uses it.
        // If input state is Learning, FSRS might try to apply learning steps again?
        // Let's look at `inferCardState`.
        
        // Correct FSRS usage:
        // If transferring from Learning -> Review, we should probably provide the best guess params.
        // However, standard ts-fsrs usage for "First Review" (New -> Review) expects State.New.
        // For Learning -> Review (Graduation), if we want FSRS to schedule the first long interval,
        // we might treat it as State.Learning (if supported) or State.New?
        // Most FSRS implementations treat the graduation as the "First Review".
        currentState = State.New; 
        
        // NOTE: If we want to preserve history of learning, that's what 'reps' captures.
        // Setting to State.New triggers the 'first review' logic in FSRS (calculating initial S/D).
      } else {
         currentState = State.New;
      }
    }
  }

  let dueObj = new Date();   
  if (card.queue === 1) {       dueObj = new Date(card.due * 1000);
  } else if (card.queue === 2 || card.queue === 3) {                                                 const ms = card.due * 24 * 60 * 60 * 1000;
      dueObj = new Date(ms); 
  } else {
            dueObj = new Date(); 
  }

    const fsrsCard: FSRSCard = {
    due: dueObj,
    stability:
      card.stability !== undefined && Number.isFinite(card.stability) && card.stability > 0
        ? card.stability
        : currentState === State.New
          ? 0
          : 2.0,
    difficulty:
      card.difficulty !== undefined && Number.isFinite(card.difficulty) && card.difficulty > 0
        ? card.difficulty
        : currentState === State.New
          ? 0
          : 5.0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: currentState,
    last_review: lastReviewDate,
  } as FSRSCard;

  const schedulingCards = f.repeat(fsrsCard, now);

  const rating = mapGradeToRating(grade);
  const schedulingResult = (schedulingCards as any)[rating] as {
    card: FSRSCard;
  };

  const log = schedulingResult.card;

  const isLapse =
    grade === "Again" &&
    (currentState === State.Review || currentState === State.Relearning);

  const safeNum = (n: number | undefined | null) => {
    if (typeof n !== "number" || !Number.isFinite(n)) return 0;
    return n;
  };

  if (isLapse && relearnStepsMinutes.length > 0) {
    const newLapses = log.lapses;
    let isLeech = card.isLeech || false;
    if (newLapses >= leechThreshold && !isLeech) {
      isLeech = true;
    }

    const nextDue = new Date(
      now.getTime() + (relearnStepsMinutes[0] ?? 1) * 60 * 1000
    );
    const intervalDays = (relearnStepsMinutes[0] ?? 1) / (24 * 60);

    const meta = calculateAnkiMetadata(State.Relearning, nextDue, intervalDays, card.due);

    const result: Card = {
      ...card,
            type: meta.type,
      queue: meta.queue,
      due: meta.due,
      left: relearnStepsMinutes.length, 
      last_modified: Math.floor(Date.now() / 1000),

      state: State.Relearning,
      learningStep: -1,
      stability: safeNum(log.stability),
      difficulty: safeNum(log.difficulty),
      elapsed_days: safeNum(log.elapsed_days),
      interval: safeNum(intervalDays),
      precise_interval: safeNum(intervalDays),
      scheduled_days: safeNum(intervalDays),
      last_review: now.getTime(),
      first_review: card.first_review || now.getTime(),
      reps: safeNum(log.reps),
      lapses: safeNum(newLapses),
      leechCount: safeNum(newLapses),
      isLeech,
    };

    const leechOverrides = applyLeechAction(leechAction, isLeech);
    return { ...result, ...leechOverrides };
  }

    const newState = log.state;
  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  if (totalLapses >= leechThreshold && !isLeech) {
    isLeech = true;
  }

  const nowMs = now.getTime();
  const dueMs = log.due.getTime();
  const diffMs = dueMs - nowMs;
  let preciseInterval = 0;
  if (Number.isFinite(diffMs)) {
    preciseInterval = Math.max(0, diffMs / (24 * 60 * 60 * 1000));
  }

  let scheduledDaysInt = Math.round(preciseInterval);
  if (
    newState !== State.Learning &&
    newState !== State.New
  ) {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }

    const nextDueDateObj = !isNaN(log.due.getTime())
      ? log.due
      : addMinutes(now, FALLBACK_DUE_DATE_MINUTES);
  
  const meta = calculateAnkiMetadata(newState, nextDueDateObj, preciseInterval, card.due);

  const result: Card = {
    ...card,
    type: meta.type,
    queue: meta.queue,
    due: meta.due,
    left: 0, 
    last_modified: Math.floor(Date.now() / 1000),

    stability: safeNum(log.stability),
    difficulty: Math.max(1, Math.min(10, safeNum(log.difficulty))),
    elapsed_days: safeNum(log.elapsed_days),
    scheduled_days: safeNum(scheduledDaysInt),
    precise_interval: safeNum(preciseInterval),
    reps: safeNum(log.reps),
    lapses: safeNum(log.lapses),
    state: log.state,
    last_review:
      log.last_review && !isNaN(log.last_review.getTime())
        ? log.last_review.getTime()
        : now.getTime(),
    first_review: card.first_review || now.getTime(),
    
    interval: safeNum(preciseInterval),
    learningStep: undefined,
    leechCount: safeNum(totalLapses),
    isLeech,
  };

  const leechOverrides = applyLeechAction(leechAction, isLeech);
  return { ...result, ...leechOverrides };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
      if (card.queue < 0) return false;
  
  if (card.queue === 0) return true;

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const nowDays = toSchedulerDays(now);

  if (card.queue === 1) {     return card.due <= nowSeconds;
  }

  if (card.queue === 2 || card.queue === 3) {     return card.due <= nowDays;
  }

  return false;
};
