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
      // Note: Math.min(2, -1) = -1, then Math.max(0, -1) = 0
      expect(getClampedStep(card, [])).toBe(0);
    });
  });
});
