import { describe, it, expect } from "vitest";
import { State } from "ts-fsrs";
import { Card, LanguageId } from "@/types";
import {
  inferCardState,
  isInLearningPhase,
  isInRelearningPhase,
  getClampedStep,
} from "./stateUtils";

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: "test-card-1",
  targetSentence: "Test sentence",
  targetWord: "test",
  nativeTranslation: "Test translation",
  language: LanguageId.Polish,
  notes: "",
  type: 0,
  queue: 0,
  due: 0,
  last_modified: 0,
  left: 0,
  interval: 0,
  easeFactor: 2.5,
  ...overrides,
});

describe("stateUtils", () => {
  describe("inferCardState", () => {
    describe("when card.state is defined", () => {
      it("should return State.New if state is Review but no last_review", () => {
        const card = createCard({ state: State.Review, last_review: undefined });
        expect(inferCardState(card, false)).toBe(State.New);
      });

      it("should return State.New if state is Learning but no last_review", () => {
        const card = createCard({ state: State.Learning, last_review: undefined });
        expect(inferCardState(card, false)).toBe(State.New);
      });

      it("should return State.New if state is Relearning but no last_review", () => {
        const card = createCard({ state: State.Relearning, last_review: undefined });
        expect(inferCardState(card, false)).toBe(State.New);
      });

      it("should return the card state if state is Review and has last_review", () => {
        const card = createCard({ state: State.Review, last_review: Date.now() });
        expect(inferCardState(card, true)).toBe(State.Review);
      });

      it("should return the card state if state is Learning and has last_review", () => {
        const card = createCard({ state: State.Learning, last_review: Date.now() });
        expect(inferCardState(card, true)).toBe(State.Learning);
      });

      it("should return State.New if state is explicitly New", () => {
        const card = createCard({ state: State.New });
        expect(inferCardState(card)).toBe(State.New);
      });
    });

    describe("when card.state is undefined (infer from type)", () => {
      it("should return State.New for type 0 (new card)", () => {
        const card = createCard({ type: 0, state: undefined });
        expect(inferCardState(card)).toBe(State.New);
      });

      it("should return State.Learning for type 1 with 0 reps", () => {
        const card = createCard({ type: 1, reps: 0, state: undefined });
        expect(inferCardState(card)).toBe(State.Learning);
      });

      it("should return State.Relearning for type 1 with lapses > 0", () => {
        const card = createCard({ type: 1, reps: 3, lapses: 2, state: undefined });
        expect(inferCardState(card)).toBe(State.Relearning);
      });

      it("should return State.Learning for type 1 with no lapses", () => {
        const card = createCard({ type: 1, reps: 1, lapses: 0, state: undefined });
        expect(inferCardState(card)).toBe(State.Learning);
      });

      it("should return State.Review for type 2", () => {
        const card = createCard({ type: 2, state: undefined });
        expect(inferCardState(card)).toBe(State.Review);
      });

      it("should return State.Relearning for type 3", () => {
        const card = createCard({ type: 3, state: undefined });
        expect(inferCardState(card)).toBe(State.Relearning);
      });

      it("should return State.New for unknown type with 0 reps", () => {
        const card = createCard({ type: 99 as any, reps: 0, state: undefined });
        expect(inferCardState(card)).toBe(State.New);
      });

      it("should return State.Review for unknown type with reps > 0", () => {
        const card = createCard({ type: 99 as any, reps: 5, state: undefined });
        expect(inferCardState(card)).toBe(State.Review);
      });
    });

    describe("edge cases", () => {
      it("should handle undefined reps as 0", () => {
        const card = createCard({ type: 99 as any, reps: undefined, state: undefined });
        expect(inferCardState(card)).toBe(State.New);
      });

      it("should use default hasLastReview from card.last_review", () => {
        const card = createCard({ state: State.Review, last_review: Date.now() });
        expect(inferCardState(card)).toBe(State.Review);
      });
    });
  });

  describe("isInLearningPhase", () => {
    const learningSteps = [1, 10, 60];

    it("should return true for new card (type 0) with step < steps.length", () => {
      const card = createCard({ type: 0, learningStep: 0 });
      expect(isInLearningPhase(card, learningSteps)).toBe(true);
    });

    it("should return true for learning card (type 1) with step < steps.length", () => {
      const card = createCard({ type: 1, learningStep: 1 });
      expect(isInLearningPhase(card, learningSteps)).toBe(true);
    });

    it("should return false for learning card at last step", () => {
      const card = createCard({ type: 1, learningStep: 3 });
      expect(isInLearningPhase(card, learningSteps)).toBe(false);
    });

    it("should return false for review card (type 2)", () => {
      const card = createCard({ type: 2, learningStep: 0 });
      expect(isInLearningPhase(card, learningSteps)).toBe(false);
    });

    it("should return false for relearning card (type 3)", () => {
      const card = createCard({ type: 3, learningStep: 0 });
      expect(isInLearningPhase(card, learningSteps)).toBe(false);
    });

    it("should handle missing learningStep as 0", () => {
      const card = createCard({ type: 0, learningStep: undefined });
      expect(isInLearningPhase(card, learningSteps)).toBe(true);
    });

    it("should return false with empty learning steps array", () => {
      const card = createCard({ type: 0, learningStep: 0 });
      expect(isInLearningPhase(card, [])).toBe(false);
    });
  });

  describe("isInRelearningPhase", () => {
    const relearnSteps = [10, 20];

    it("should return false if relearnSteps is empty", () => {
      const card = createCard({
        state: State.Relearning,
        lapses: 1,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, [])).toBe(false);
    });

    it("should return true for card in Relearning state with learningStep", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(true);
    });

    it("should return true for type 1 card with lapses > 0 and learningStep", () => {
      const card = createCard({
        type: 1,
        lapses: 2,
        learningStep: 1,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(true);
    });

    it("should return true for type 3 card with learningStep", () => {
      const card = createCard({
        type: 3,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(true);
    });

    it("should return false if learningStep is undefined", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: undefined,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });

    it("should return false for new card", () => {
      const card = createCard({
        type: 0,
        state: State.New,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });

    it("should return false for review card", () => {
      const card = createCard({
        type: 2,
        state: State.Review,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });
  });

  describe("getClampedStep", () => {
    it("should return 0 for undefined learningStep", () => {
      const card = createCard({ learningStep: undefined });
      expect(getClampedStep(card, [1, 10, 60])).toBe(0);
    });

    it("should return the step if within bounds", () => {
      const card = createCard({ learningStep: 1 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(1);
    });

    it("should clamp to max index if step exceeds array length", () => {
      const card = createCard({ learningStep: 10 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(2);
    });

    it("should return 0 for negative step", () => {
      const card = createCard({ learningStep: -5 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(0);
    });

    it("should handle single-element array", () => {
      const card = createCard({ learningStep: 2 });
      expect(getClampedStep(card, [10])).toBe(0);
    });

    it("should handle empty array by returning 0", () => {
      const card = createCard({ learningStep: 2 });
      
      expect(getClampedStep(card, [])).toBe(0);
    });
  });

  describe("inferCardState - Combined Scenarios", () => {
    it("should handle type 1 with lapses but no reps", () => {
      const card = createCard({ type: 1, reps: 0, lapses: 1, state: undefined });
      expect(inferCardState(card)).toBe(State.Learning);
    });

    it("should prioritize explicit state over type inference", () => {
      
      const card = createCard({ type: 0, state: State.Review, last_review: Date.now() });
      expect(inferCardState(card)).toBe(State.Review);
    });

    it("should handle state mismatch: Learning type with Relearning state", () => {
      const card = createCard({
        type: 1,
        state: State.Relearning,
        last_review: Date.now(),
      });
      expect(inferCardState(card)).toBe(State.Relearning);
    });

    it("should handle state mismatch: Review type with Learning state", () => {
      const card = createCard({
        type: 2,
        state: State.Learning,
        last_review: Date.now(),
      });
      expect(inferCardState(card)).toBe(State.Learning);
    });

    it("should handle all valid type values", () => {
      expect(inferCardState(createCard({ type: 0, state: undefined }))).toBe(State.New);
      expect(inferCardState(createCard({ type: 1, reps: 0, state: undefined }))).toBe(State.Learning);
      expect(inferCardState(createCard({ type: 2, state: undefined }))).toBe(State.Review);
      expect(inferCardState(createCard({ type: 3, state: undefined }))).toBe(State.Relearning);
    });
  });

  describe("isInLearningPhase - Boundary Conditions", () => {
    it("should return true at step exactly at length - 1", () => {
      const card = createCard({ type: 1, learningStep: 2 });
      expect(isInLearningPhase(card, [1, 10, 60])).toBe(true);
    });

    it("should return false at step exactly at length", () => {
      const card = createCard({ type: 1, learningStep: 3 });
      expect(isInLearningPhase(card, [1, 10, 60])).toBe(false);
    });

    it("should handle large learning steps array", () => {
      const card = createCard({ type: 1, learningStep: 5 });
      expect(isInLearningPhase(card, [1, 5, 10, 30, 60, 120, 240])).toBe(true);
    });

    it("should return false for type 2 even with valid learning step", () => {
      const card = createCard({ type: 2, learningStep: 0 });
      expect(isInLearningPhase(card, [1, 10, 60])).toBe(false);
    });
  });

  describe("isInRelearningPhase - Boundary Conditions", () => {
    it("should handle card with zero lapses but Relearning state", () => {
      const card = createCard({
        state: State.Relearning,
        lapses: 0,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, [10, 20])).toBe(true);
    });

    it("should handle undefined learningStep", () => {
      const card = createCard({
        state: State.Relearning,
        lapses: 1,
        learningStep: undefined,
      });
      expect(isInRelearningPhase(card, [10, 20])).toBe(false);
    });

    it("should handle type 1 with positive lapses but no explicit learningStep", () => {
      const card = createCard({
        type: 1,
        lapses: 2,
        learningStep: undefined,
        state: undefined,
      });
      expect(isInRelearningPhase(card, [10, 20])).toBe(false);
    });

    it("should handle type 3 (relearning) explicitly", () => {
      const card = createCard({
        type: 3,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, [10, 20])).toBe(true);
    });

    it("should handle single relearn step", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: 0,
      });
      expect(isInRelearningPhase(card, [10])).toBe(true);
    });
  });

  describe("getClampedStep - Additional Cases", () => {
    it("should handle step 0 exactly", () => {
      const card = createCard({ learningStep: 0 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(0);
    });

    it("should handle step at exactly last index", () => {
      const card = createCard({ learningStep: 2 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(2);
    });

    it("should handle large step value", () => {
      const card = createCard({ learningStep: 1000 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(2);
    });

    it("should handle two-element array", () => {
      const card = createCard({ learningStep: 1 });
      expect(getClampedStep(card, [1, 10])).toBe(1);
    });
  });

  describe("State Inference - hasLastReview parameter", () => {
    it("should use card.last_review when hasLastReview not provided", () => {
      const cardWithReview = createCard({
        state: State.Review,
        last_review: Date.now(),
      });
      expect(inferCardState(cardWithReview)).toBe(State.Review);
    });

    it("should override card.last_review when hasLastReview is false", () => {
      const card = createCard({
        state: State.Review,
        last_review: Date.now(),
      });
      
      expect(inferCardState(card, false)).toBe(State.New);
    });

    it("should treat missing last_review as false", () => {
      const card = createCard({
        state: State.Learning,
        last_review: undefined,
      });
      expect(inferCardState(card)).toBe(State.New);
    });
  });

  describe("Edge Cases - Unusual Card Configurations", () => {
    it("should handle card with all optional fields undefined", () => {
      const card = createCard({
        type: 0,
        state: undefined,
        reps: undefined,
        lapses: undefined,
        learningStep: undefined,
      });
      expect(inferCardState(card)).toBe(State.New);
    });

    it("should handle card with negative type value", () => {
      const card = createCard({ type: -1 as any, reps: 0, state: undefined });
      expect(inferCardState(card)).toBe(State.New);
    });

    it("should handle card with null values", () => {
      const card = createCard({
        type: 0,
        reps: null as any,
        state: undefined,
      });
      expect(inferCardState(card)).toBe(State.New);
    });

    it("should handle isInLearningPhase with null learningStep", () => {
      const card = createCard({
        type: 1,
        learningStep: null as any,
      });
      expect(isInLearningPhase(card, [1, 10])).toBe(true);
    });

    it("should handle getClampedStep with null values", () => {
      const card = createCard({ learningStep: null as any });
      expect(getClampedStep(card, [1, 10, 60])).toBe(0);
    });
  });

  describe("Consistency Checks", () => {
    it("should be consistent between inferCardState and isInLearningPhase", () => {
      const learningCard = createCard({
        type: 1,
        state: State.Learning,
        learningStep: 0,
        last_review: Date.now(),
      });

      const state = inferCardState(learningCard);
      const inLearning = isInLearningPhase(learningCard, [1, 10]);

      expect(state).toBe(State.Learning);
      expect(inLearning).toBe(true);
    });

    it("should be consistent between inferCardState and isInRelearningPhase", () => {
      const relearningCard = createCard({
        type: 3,
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
        last_review: Date.now(),
      });

      const state = inferCardState(relearningCard);
      const inRelearning = isInRelearningPhase(relearningCard, [10, 20]);

      expect(state).toBe(State.Relearning);
      expect(inRelearning).toBe(true);
    });

    it("should correctly identify graduated card (not in learning or relearning)", () => {
      const reviewCard = createCard({
        type: 2,
        state: State.Review,
        reps: 10,
        learningStep: undefined,
        last_review: Date.now(),
      });

      const state = inferCardState(reviewCard);
      const inLearning = isInLearningPhase(reviewCard, [1, 10]);
      const inRelearning = isInRelearningPhase(reviewCard, [10, 20]);

      expect(state).toBe(State.Review);
      expect(inLearning).toBe(false);
      expect(inRelearning).toBe(false);
    });
  });
});
