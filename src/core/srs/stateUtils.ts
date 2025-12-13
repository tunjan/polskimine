import { Card } from "@/types";
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

  if (card.type === 0) {
    return State.New;
  }

  if (card.type === 1) {
    if ((card.reps || 0) === 0) {
      return State.Learning;
    }
    return card.lapses && card.lapses > 0 ? State.Relearning : State.Learning;
  }

  if (card.type === 2) {
    return State.Review;
  }
  
  if (card.type === 3) {
    return State.Relearning;
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
    card.type === 0 || card.type === 1;

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
    (card.type === 1 && hasLapsed) ||     card.type === 3;
    
  const hasRelearningStep = card.learningStep !== undefined;

  return isRelearningState && hasRelearningStep;
};

export const getClampedStep = (card: Card, stepsArray: number[]): number => {
  const rawStep = card.learningStep ?? 0;
  return Math.max(0, Math.min(rawStep, stepsArray.length - 1));
};
