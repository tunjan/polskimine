import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

/**
 * Single source of truth for inferring FSRS state from card properties.
 * Consolidates the fragmented state inference logic into one clear function.
 */
export const inferCardState = (
  card: Card,
  hasLastReview: boolean = !!card.last_review,
): State => {
  // If state is explicitly set, use it (but verify it's valid)
  if (card.state !== undefined) {
    // Verify state is consistent with having a last_review for non-New states
    if (
      (card.state === State.Review ||
        card.state === State.Learning ||
        card.state === State.Relearning) &&
      !hasLastReview
    ) {
      // Invalid state - card claims to have been reviewed but has no last_review
      return State.New;
    }
    return card.state;
  }

  // Infer from status and other properties
  if (card.status === CardStatus.NEW) {
    return State.New;
  }

  if (card.status === CardStatus.LEARNING) {
    // Could be Learning or Relearning - check reps to distinguish
    if ((card.reps || 0) === 0) {
      return State.Learning;
    }
    // Has reps but in learning status - likely relearning
    return card.lapses && card.lapses > 0 ? State.Relearning : State.Learning;
  }

  if (card.status === CardStatus.REVIEW || card.status === CardStatus.KNOWN) {
    return State.Review;
  }

  // Default fallback based on reps
  if ((card.reps || 0) === 0) {
    return State.New;
  }

  return State.Review;
};

/**
 * Check if card is in the initial learning phase (not yet graduated to FSRS).
 */
export const isInLearningPhase = (
  card: Card,
  learningSteps: number[],
): boolean => {
  const rawStep = card.learningStep ?? 0;
  const isNewOrLearning =
    card.status === CardStatus.NEW || card.status === CardStatus.LEARNING;

  return isNewOrLearning && rawStep < learningSteps.length;
};

/**
 * Check if card is in relearning phase after a lapse.
 */
export const isInRelearningPhase = (
  card: Card,
  relearnSteps: number[],
): boolean => {
  if (!relearnSteps || relearnSteps.length === 0) {
    return false;
  }

  // Card is relearning if it has lapses and is in a relearning state
  const hasLapsed = (card.lapses || 0) > 0;
  const isRelearningState =
    card.state === State.Relearning ||
    (card.status === CardStatus.LEARNING && hasLapsed);
  const hasRelearningStep = card.learningStep !== undefined;

  return isRelearningState && hasRelearningStep;
};

/**
 * Get the current step index, clamped to valid range.
 */
export const getClampedStep = (card: Card, stepsArray: number[]): number => {
  const rawStep = card.learningStep ?? 0;
  return Math.max(0, Math.min(rawStep, stepsArray.length - 1));
};
