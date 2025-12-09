import { describe, it, expect } from "vitest";
import {
  inferCardState,
  isInLearningPhase,
  isInRelearningPhase,
  getClampedStep,
} from "./stateUtils";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

// ============================================================================
// Test Utilities
// ============================================================================

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: "test-card",
  targetSentence: "Test",
  nativeTranslation: "Test",
  notes: "",
  status: CardStatus.NEW,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: "polish" as any,
  ...overrides,
});

// ============================================================================
// inferCardState Tests
// ============================================================================

describe("inferCardState", () => {
  describe("When card.state is defined", () => {
    it("should return card.state directly for State.New", () => {
      const card = createCard({ state: State.New });
      expect(inferCardState(card)).toBe(State.New);
    });

    it("should return card.state directly for State.Review with last_review", () => {
      const card = createCard({ 
        state: State.Review,
        last_review: new Date().toISOString() 
      });
      expect(inferCardState(card)).toBe(State.Review);
    });

    it("should return card.state directly for State.Learning", () => {
      const card = createCard({
        state: State.Learning,
        last_review: new Date().toISOString(),
      });
      expect(inferCardState(card)).toBe(State.Learning);
    });

    it("should return card.state directly for State.Relearning", () => {
      const card = createCard({
        state: State.Relearning,
        last_review: new Date().toISOString(),
      });
      expect(inferCardState(card)).toBe(State.Relearning);
    });
  });

  describe("State correction when hasLastReview is false", () => {
    it("should return State.New if state is Review but no last_review", () => {
      const card = createCard({
        state: State.Review,
        last_review: undefined,
      });
      expect(inferCardState(card, false)).toBe(State.New);
    });

    it("should return State.New if state is Learning but no last_review", () => {
      const card = createCard({
        state: State.Learning,
        last_review: undefined,
      });
      expect(inferCardState(card, false)).toBe(State.New);
    });

    it("should return State.New if state is Relearning but no last_review", () => {
      const card = createCard({
        state: State.Relearning,
        last_review: undefined,
      });
      expect(inferCardState(card, false)).toBe(State.New);
    });

    it("should keep State.New even without last_review", () => {
      const card = createCard({
        state: State.New,
        last_review: undefined,
      });
      expect(inferCardState(card, false)).toBe(State.New);
    });
  });

  describe("Inference from CardStatus when state is undefined", () => {
    it("should infer State.New from CardStatus.NEW", () => {
      const card = createCard({
        state: undefined,
        status: CardStatus.NEW,
      });
      expect(inferCardState(card)).toBe(State.New);
    });

    it("should infer State.Learning from CardStatus.LEARNING with 0 reps", () => {
      const card = createCard({
        state: undefined,
        status: CardStatus.LEARNING,
        reps: 0,
      });
      expect(inferCardState(card)).toBe(State.Learning);
    });

    it("should infer State.Learning from CardStatus.LEARNING with 0 lapses", () => {
      const card = createCard({
        state: undefined,
        status: CardStatus.LEARNING,
        reps: 5,
        lapses: 0,
      });
      expect(inferCardState(card)).toBe(State.Learning);
    });

    it("should infer State.Relearning from CardStatus.LEARNING with lapses > 0", () => {
      const card = createCard({
        state: undefined,
        status: CardStatus.LEARNING,
        reps: 5,
        lapses: 1,
      });
      expect(inferCardState(card)).toBe(State.Relearning);
    });

    it("should infer State.Review from CardStatus.REVIEW", () => {
      const card = createCard({
        state: undefined,
        status: CardStatus.REVIEW,
      });
      expect(inferCardState(card)).toBe(State.Review);
    });

    it("should infer State.Review from CardStatus.KNOWN", () => {
      const card = createCard({
        state: undefined,
        status: CardStatus.KNOWN,
      });
      expect(inferCardState(card)).toBe(State.Review);
    });
  });

  describe("Fallback inference when no status/state", () => {
    it("should return State.New for 0 reps", () => {
      const card = createCard({
        state: undefined,
        status: undefined as any,
        reps: 0,
      });
      expect(inferCardState(card)).toBe(State.New);
    });

    it("should return State.Review for reps > 0 with no status", () => {
      const card = createCard({
        state: undefined,
        status: undefined as any,
        reps: 5,
      });
      expect(inferCardState(card)).toBe(State.Review);
    });

    it("should default to State.New for undefined reps", () => {
      const card = createCard({
        state: undefined,
        status: undefined as any,
        reps: undefined,
      });
      expect(inferCardState(card)).toBe(State.New);
    });
  });

  describe("hasLastReview parameter handling", () => {
    it("should use card.last_review when hasLastReview not provided", () => {
      const card = createCard({
        state: State.Review,
        last_review: new Date().toISOString(),
      });
      // Default should detect last_review
      expect(inferCardState(card)).toBe(State.Review);
    });

    it("should respect explicit hasLastReview = true", () => {
      const card = createCard({
        state: State.Review,
        last_review: undefined,
      });
      expect(inferCardState(card, true)).toBe(State.Review);
    });

    it("should respect explicit hasLastReview = false", () => {
      const card = createCard({
        state: State.Review,
        last_review: new Date().toISOString(),
      });
      expect(inferCardState(card, false)).toBe(State.New);
    });
  });
});

// ============================================================================
// isInLearningPhase Tests
// ============================================================================

describe("isInLearningPhase", () => {
  const learningSteps = [1, 10, 60];

  describe("Positive cases", () => {
    it("should return true for NEW card at step 0", () => {
      const card = createCard({
        status: CardStatus.NEW,
        learningStep: 0,
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(true);
    });

    it("should return true for LEARNING card at step 1", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 1,
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(true);
    });

    it("should return true for LEARNING card at last step", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 2, // steps.length - 1
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(true);
    });
  });

  describe("Negative cases", () => {
    it("should return false for REVIEW card", () => {
      const card = createCard({
        status: CardStatus.REVIEW,
        learningStep: 0,
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(false);
    });

    it("should return false for KNOWN card", () => {
      const card = createCard({
        status: CardStatus.KNOWN,
        learningStep: 0,
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(false);
    });

    it("should return false when step exceeds config length", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 5, // Exceeds [1, 10, 60]
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(false);
    });

    it("should return false when step equals config length", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 3, // Equals length of [1, 10, 60]
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined learningStep as 0", () => {
      const card = createCard({
        status: CardStatus.NEW,
        learningStep: undefined,
      });
      expect(isInLearningPhase(card, learningSteps)).toBe(true);
    });

    it("should handle empty learning steps array", () => {
      const card = createCard({
        status: CardStatus.NEW,
        learningStep: 0,
      });
      expect(isInLearningPhase(card, [])).toBe(false);
    });

    it("should handle single-step learning config", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 0,
      });
      expect(isInLearningPhase(card, [10])).toBe(true);
    });
  });
});

// ============================================================================
// isInRelearningPhase Tests
// ============================================================================

describe("isInRelearningPhase", () => {
  const relearnSteps = [5, 15];

  describe("Positive cases", () => {
    it("should return true for State.Relearning with learningStep", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(true);
    });

    it("should return true for LEARNING status with lapses > 0", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 1,
        lapses: 2,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(true);
    });
  });

  describe("Negative cases", () => {
    it("should return false for empty relearnSteps", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
      });
      expect(isInRelearningPhase(card, [])).toBe(false);
    });

    it("should return false for undefined relearnSteps", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
      });
      expect(isInRelearningPhase(card, undefined as any)).toBe(false);
    });

    it("should return false for LEARNING status with 0 lapses", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 0,
        lapses: 0,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });

    it("should return false without learningStep defined", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: undefined,
        lapses: 1,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });

    it("should return false for NEW card", () => {
      const card = createCard({
        status: CardStatus.NEW,
        learningStep: 0,
        lapses: 0,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });

    it("should return false for REVIEW card", () => {
      const card = createCard({
        status: CardStatus.REVIEW,
        state: State.Review,
        learningStep: undefined,
        lapses: 2,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle learningStep = 0", () => {
      const card = createCard({
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
      });
      expect(isInRelearningPhase(card, [5])).toBe(true);
    });

    it("should handle undefined lapses as 0", () => {
      const card = createCard({
        status: CardStatus.LEARNING,
        learningStep: 0,
        lapses: undefined,
      });
      expect(isInRelearningPhase(card, relearnSteps)).toBe(false);
    });
  });
});

// ============================================================================
// getClampedStep Tests
// ============================================================================

describe("getClampedStep", () => {
  describe("Normal clamping", () => {
    it("should return step when within bounds", () => {
      const card = createCard({ learningStep: 1 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(1);
    });

    it("should return 0 for step 0", () => {
      const card = createCard({ learningStep: 0 });
      expect(getClampedStep(card, [1, 10])).toBe(0);
    });

    it("should clamp to max index when step exceeds length", () => {
      const card = createCard({ learningStep: 10 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(2); // length - 1
    });

    it("should clamp to 0 for negative step", () => {
      const card = createCard({ learningStep: -5 });
      expect(getClampedStep(card, [1, 10])).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined learningStep as 0", () => {
      const card = createCard({ learningStep: undefined });
      expect(getClampedStep(card, [1, 10])).toBe(0);
    });

    it("should handle single-element array", () => {
      const card = createCard({ learningStep: 5 });
      expect(getClampedStep(card, [10])).toBe(0);
    });

    it("should handle empty array (clamps to 0 via Math.max)", () => {
      const card = createCard({ learningStep: 0 });
      // Math.max(0, Math.min(0, -1)) = Math.max(0, -1) = 0
      expect(getClampedStep(card, [])).toBe(0);
    });

    it("should return exact last index for step at boundary", () => {
      const card = createCard({ learningStep: 2 });
      expect(getClampedStep(card, [1, 10, 60])).toBe(2);
    });
  });
});
