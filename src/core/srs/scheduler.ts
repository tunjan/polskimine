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

const FALLBACK_DUE_DATE_MINUTES = 10;

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
            lapsesToAdd = 0;
  } else if (grade === "Hard") {
        nextIntervalMinutes =
      learningStepsMinutes[currentStep] ??
      learningStepsMinutes[learningStepsMinutes.length - 1] ??
      1;
    shouldStayInLearning = true;
  } else if (grade === "Good") {
    if (card.status === "new" || (card.reps === 0 && card.state !== 2)) {
         // If it's a new card (or effectively new), we start at step 0
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
    return null;   }

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
    intervalDays = 1 / (24 * 60);   }
  const newLapses = (card.lapses || 0) + lapsesToAdd;

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
    scheduled_days: Math.floor(intervalDays),
    last_review: now.toISOString(),
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
    return null;   }

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
            shouldStayInRelearning = false;
    } else {
      nextIntervalMinutes = relearnStepsMinutes[nextStep] ?? 1;
      shouldStayInRelearning = true;
    }
  }
  
  if (!shouldStayInRelearning) {
    return null;   }

  const nextIntervalMs = nextIntervalMinutes * 60 * 1000;
  let nextDue = new Date(now.getTime() + nextIntervalMs);
  if (isNaN(nextDue.getTime())) {
    nextDue = new Date(now.getTime() + 60 * 1000);
  }

  let intervalDays = nextIntervalMinutes / (24 * 60);
  if (!Number.isFinite(intervalDays) || intervalDays < 0) {
    intervalDays = 1 / (24 * 60);   }

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
    scheduled_days: Math.floor(intervalDays),
    last_review: now.toISOString(),
    reps: (card.reps || 0) + 1,
    lapses: currentLapses,
    leechCount: currentLapses,
    isLeech,
  };
};

const applyLeechAction = (
  leechAction: "suspend" | undefined,
  isLeech: boolean,
): Partial<Card> => {
  if (!isLeech) {
    return {};
  }

  if (leechAction === "suspend") {
        return { status: CardStatus.SUSPENDED };
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

      const learningStep = Math.max(
    0,
    Math.min(rawStep, learningStepsMinutes.length - 1),
  );
  const isLearningPhase =
    (card.status === CardStatus.NEW || card.status === CardStatus.LEARNING) &&
    card.state !== State.Relearning &&
    (card.learningStep !== undefined || card.status === CardStatus.NEW) &&
    (card.learningStep ?? 0) < learningStepsMinutes.length;

    // BUG FIX: If we are in learning status but learningStep is undefined (persistence issue),
    // try to recover the step from the current interval.
    // This prevents the card from resetting to step 0 and getting stuck in a loop.
    if (
      (card.status === CardStatus.LEARNING || card.status === CardStatus.NEW) &&
      card.learningStep === undefined &&
      card.state !== State.Relearning
    ) {
      // Find the closest step that matches the current interval
      const minuteInterval = Math.round(card.interval * 24 * 60);
      
      // If interval is 0, it's a new card (eff. step 0)
      if (minuteInterval <= 0) {
        // It's effectively step 0, so we let the logic proceed.
        // We don't need to force isLearningPhase=true here because rawStep=0 matches expectations.
      } else {
         // Find best matching step
         let recoveredStep = 0;
         let minDiff = Infinity;
         
         for (let i = 0; i < learningStepsMinutes.length; i++) {
           const diff = Math.abs(learningStepsMinutes[i] - minuteInterval);
           if (diff < minDiff) {
             minDiff = diff;
             recoveredStep = i;
           }
         }
         
         // If we found a step that is "close enough" (or just the best match), assume it.
         // But we only want to resume learning if we are NOT at the last step.
         if (recoveredStep < learningStepsMinutes.length) {
            // We can't mutate 'card' validly here since it's an arg, but we can treat 'rawStep' as this.
            // But 'rawStep' was const above. Let's recalculate isLearningPhase.
            // Actually, let's just delegate to handleLearningPhase with the recovered step.
            
            // Re-check valid step
            if (recoveredStep < learningStepsMinutes.length) {
                 const learningResult = handleLearningPhase(
                  card,
                  grade,
                  now,
                  learningStepsMinutes,
                  recoveredStep,
                  leechThreshold,
                );
                if (learningResult) {
                  const leechOverrides = applyLeechAction(
                    leechAction,
                    learningResult.isLeech || false,
                  );
                  return { ...learningResult, ...leechOverrides };
                }
            }
         }
      }
    }      const isRelearningPhase = card.state === State.Relearning;

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
        leechAction,
        learningResult.isLeech || false,
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
      card.lapses || 0,
    );
    if (relearnResult) {
      const leechOverrides = applyLeechAction(
        leechAction,
        relearnResult.isLeech || false,
      );
      return { ...relearnResult, ...leechOverrides };
    }
  }

    const f = getFSRS(settings);

      const lastReviewDate = card.last_review
    ? new Date(card.last_review)
    : undefined;
  let currentState = inferCardState(card, !!lastReviewDate);

        if (!isLearningPhase && !isRelearningPhase) {
    if (card.status === CardStatus.LEARNING || card.status === CardStatus.NEW) {
                  currentState = lastReviewDate ? State.Learning : State.New;
    }
  }

  const fsrsCard: FSRSCard = {
    due: new Date(card.dueDate),
    stability: (card.stability !== undefined && card.stability > 0) ? card.stability : (currentState === State.New ? 0 : 2.0),
    difficulty: (card.difficulty !== undefined && card.difficulty > 0) ? card.difficulty : (currentState === State.New ? 0 : 5.0),
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

    const nextDue = new Date(now.getTime() + (relearnStepsMinutes[0] ?? 1) * 60 * 1000);
    const intervalDays = (relearnStepsMinutes[0] ?? 1) / (24 * 60);

    const result: Card = {
      ...card,
      dueDate: nextDue.toISOString(),
      status: CardStatus.LEARNING,
      state: State.Relearning,
      learningStep: 0,
      stability: safeNum(log.stability),
      difficulty: safeNum(log.difficulty),
      elapsed_days: safeNum(log.elapsed_days),
      interval: safeNum(intervalDays),
      precise_interval: safeNum(intervalDays),
      scheduled_days: 0,
      last_review: now.toISOString(),
      first_review: card.first_review || now.toISOString(),
      reps: safeNum(log.reps),
      lapses: safeNum(newLapses),
      leechCount: safeNum(newLapses),
      isLeech,
    };

    const leechOverrides = applyLeechAction(leechAction, isLeech);
    return { ...result, ...leechOverrides };
  }

    const tentativeStatus = mapStateToStatus(log.state);
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
    tentativeStatus !== CardStatus.LEARNING &&
    tentativeStatus !== CardStatus.NEW
  ) {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }

  const result: Card = {
    ...card,
    dueDate: !isNaN(log.due.getTime())
      ? log.due.toISOString()
      : addMinutes(now, FALLBACK_DUE_DATE_MINUTES).toISOString(),
    stability: safeNum(log.stability),
    difficulty: safeNum(log.difficulty),
    elapsed_days: safeNum(log.elapsed_days),
    scheduled_days: safeNum(scheduledDaysInt),
    precise_interval: safeNum(preciseInterval),
    reps: safeNum(log.reps),
    lapses: safeNum(log.lapses),
    state: log.state,
    last_review:
      log.last_review && !isNaN(log.last_review.getTime())
        ? log.last_review.toISOString()
        : now.toISOString(),
    first_review: card.first_review || now.toISOString(),
    status: tentativeStatus,
    interval: safeNum(preciseInterval),
    learningStep: undefined,
    leechCount: safeNum(totalLapses),
    isLeech,
  };

  const leechOverrides = applyLeechAction(leechAction, isLeech);
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

    if (card.status === CardStatus.LEARNING && card.interval < 1) {
    return due <= now;
  }

  const ONE_HOUR_IN_DAYS = 1 / 24;
  if (card.interval < ONE_HOUR_IN_DAYS) {
    return due <= now;
  }

  const srsToday = getSRSDate(now);
  const nextSRSDay = addDays(srsToday, 1);

  return isBefore(due, nextSRSDay);
};
