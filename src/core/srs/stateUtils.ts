import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

export const inferCardState = (
  card: Card,
  hasLastReview: boolean = !!card.last_review,
): State => {
  if (card.state !== undefined) {
    if (
      (card.state === State.Review ||
        card.state === State.Learning ||
        card.state === State.Relearning) &&
      !hasLastReview
    ) {
      return State.New;
    }
    return card.state;
  }

  if (card.status === CardStatus.NEW) {
    return State.New;
  }

  if (card.status === CardStatus.LEARNING) {
    if ((card.reps || 0) === 0) {
      return State.Learning;
    }
    return card.lapses && card.lapses > 0 ? State.Relearning : State.Learning;
  }

  if (card.status === CardStatus.REVIEW || card.status === CardStatus.KNOWN) {
    return State.Review;
  }

  if ((card.reps || 0) === 0) {
    return State.New;
  }

  return State.Review;
};

export const isInLearningPhase = (
  card: Card,
  learningSteps: number[],
): boolean => {
  const rawStep = card.learningStep ?? 0;
  const isNewOrLearning =
    card.status === CardStatus.NEW || card.status === CardStatus.LEARNING;

  return isNewOrLearning && rawStep < learningSteps.length;
};

export const isInRelearningPhase = (
  card: Card,
  relearnSteps: number[],
): boolean => {
  if (!relearnSteps || relearnSteps.length === 0) {
    return false;
  }

  const hasLapsed = (card.lapses || 0) > 0;
  const isRelearningState =
    card.state === State.Relearning ||
    (card.status === CardStatus.LEARNING && hasLapsed);
  const hasRelearningStep = card.learningStep !== undefined;

  return isRelearningState && hasRelearningStep;
};

export const getClampedStep = (card: Card, stepsArray: number[]): number => {
  const rawStep = card.learningStep ?? 0;
  return Math.max(0, Math.min(rawStep, stepsArray.length - 1));
};
