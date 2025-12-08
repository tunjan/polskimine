import { describe, it, expect } from "vitest";
import { calculateNextReview, isCardDue, LapsesSettings } from "./scheduler";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

// Helper to create a base card for testing
const createBaseCard = (overrides: Partial<Card> = {}): Card => ({
  id: "test-card-1",
  targetSentence: "Test sentence",
  nativeTranslation: "Test translation",
  notes: "",
  status: CardStatus.NEW,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  ...overrides,
});

describe("scheduler", () => {
  describe("calculateNextReview", () => {
    describe("Learning Phase", () => {
      it("should reset to step 0 on Again", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1,
        });

        const result = calculateNextReview(card, "Again", undefined, [1, 10]);

        expect(result.learningStep).toBe(0);
        expect(result.status).toBe(CardStatus.LEARNING);
        expect(result.state).toBe(State.Learning);
      });

      it("should stay at current step on Hard", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1,
        });

        const result = calculateNextReview(card, "Hard", undefined, [1, 10]);

        expect(result.learningStep).toBe(1);
        expect(result.status).toBe(CardStatus.LEARNING);
      });

      it("should advance to next step on Good", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

        const result = calculateNextReview(card, "Good", undefined, [1, 10]);

        expect(result.learningStep).toBe(1);
        expect(result.status).toBe(CardStatus.LEARNING);
      });

      it("should graduate to FSRS on Good when completing all steps", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1,
        });

        const result = calculateNextReview(card, "Good", undefined, [1, 10]);

        // Should have graduated - learningStep cleared, status is REVIEW
        expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });

      it("should graduate immediately on Easy", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

        const result = calculateNextReview(card, "Easy", undefined, [1, 10]);

        expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });
    });

    describe("Relearning Phase", () => {
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [1, 5],
        leechThreshold: 8,
      };

      it("should enter relearning on Again from Review state", () => {
        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          stability: 10,
          difficulty: 5,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.state).toBe(State.Relearning);
        expect(result.learningStep).toBe(0);
        expect(result.status).toBe(CardStatus.LEARNING);
      });

      it("should progress through relearning steps on Good", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          state: State.Relearning,
          learningStep: 0,
          lapses: 1,
          last_review: new Date().toISOString(),
        });

        const result = calculateNextReview(
          card,
          "Good",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.learningStep).toBe(1);
        expect(result.state).toBe(State.Relearning);
      });

      it("should exit relearning to Review on completing all steps", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          state: State.Relearning,
          learningStep: 1,
          lapses: 1,
          stability: 5,
          difficulty: 5,
          last_review: new Date().toISOString(),
        });

        const result = calculateNextReview(
          card,
          "Good",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });

      it("should stay at current step on Hard during relearning", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          state: State.Relearning,
          learningStep: 1,
          lapses: 1,
          last_review: new Date().toISOString(),
        });

        const result = calculateNextReview(
          card,
          "Hard",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.learningStep).toBe(1);
        expect(result.state).toBe(State.Relearning);
        expect(result.status).toBe(CardStatus.LEARNING);
      });

      it("should exit relearning immediately on Easy", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          state: State.Relearning,
          learningStep: 0,
          lapses: 1,
          stability: 5,
          difficulty: 5,
          last_review: new Date().toISOString(),
        });

        const result = calculateNextReview(
          card,
          "Easy",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });

      it("should reset to step 0 on Again during relearning", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          state: State.Relearning,
          learningStep: 1,
          lapses: 1,
          last_review: new Date().toISOString(),
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.learningStep).toBe(0);
        expect(result.state).toBe(State.Relearning);
      });
    });

    describe("Leech Detection", () => {
      it("should mark card as leech when threshold reached", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 3,
        };

        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          lapses: 2,
          stability: 10,
          difficulty: 5,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.isLeech).toBe(true);
      });

      it("should not mark as leech when below threshold", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 8,
        };

        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          lapses: 1,
          stability: 10,
          difficulty: 5,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.isLeech).toBeFalsy();
      });
    });

    describe("Leech Action", () => {
      it("should suspend card when leechAction is suspend", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 2,
          leechAction: "suspend",
        };

        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          lapses: 1,
          stability: 10,
          difficulty: 5,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.isLeech).toBe(true);
        expect(result.status).toBe(CardStatus.KNOWN);
      });

      it("should only tag when leechAction is tag", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 2,
          leechAction: "tag",
        };

        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          lapses: 1,
          stability: 10,
          difficulty: 5,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.isLeech).toBe(true);
        expect(result.status).not.toBe(CardStatus.KNOWN);
      });
    });

    describe("FSRS Integration", () => {
      it("should return increased interval on Good for review cards", () => {
        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          stability: 10,
          difficulty: 5,
          interval: 1,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
        });

        const result = calculateNextReview(card, "Good");

        expect(result.interval).toBeGreaterThan(0);
        expect(result.stability).toBeGreaterThan(0);
      });

      it("should return valid due date", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
        });

        const result = calculateNextReview(card, "Good");

        expect(result.dueDate).toBeDefined();
        expect(new Date(result.dueDate).getTime()).not.toBeNaN();
      });
    });

    describe("Edge Cases", () => {
      it("should handle single-step learning", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 0,
          last_review: new Date().toISOString(),
        });

        const result = calculateNextReview(card, "Good", undefined, [1]);

        // With only one step at step 0, Good advances to step 1 which is >= length (1),
        // so should graduate to FSRS
        expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });

      it("should handle empty learning steps", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

        // Empty steps should use default [1, 10]
        const result = calculateNextReview(card, "Good", undefined, []);

        // Should use default steps, advance to step 1
        expect(result.learningStep).toBe(1);
        expect(result.status).toBe(CardStatus.LEARNING);
      });

      it("should handle legacy card without state property", () => {
        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: undefined,
          interval: 5,
          stability: 10,
          difficulty: 5,
          reps: 10,
          dueDate: new Date(Date.now() - 86400000).toISOString(),
          last_review: new Date(Date.now() - 86400000 * 5).toISOString(),
        });

        const result = calculateNextReview(card, "Good");

        // Should infer state and schedule correctly
        expect(result.status).toBe(CardStatus.REVIEW);
        expect(result.interval).toBeGreaterThan(0);
      });

      it("should pass lapsesSettings correctly", () => {
        const lapsesSettings: LapsesSettings = {
          relearnSteps: [5, 15],
          leechThreshold: 3,
          leechAction: "suspend",
        };

        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          stability: 10,
          difficulty: 5,
          lapses: 2, // One more lapse will hit threshold
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        // Should enter relearning at step 0
        expect(result.state).toBe(State.Relearning);
        expect(result.learningStep).toBe(0);
        // Should be marked as leech (3 lapses >= threshold 3)
        expect(result.isLeech).toBe(true);
        // Should be suspended due to leechAction: "suspend"
        expect(result.status).toBe(CardStatus.KNOWN);
      });
    });
  });

  describe("isCardDue", () => {
    it("should return true for new cards", () => {
      const card = createBaseCard({ status: CardStatus.NEW });
      expect(isCardDue(card)).toBe(true);
    });

    it("should return true for cards with past due date", () => {
      const card = createBaseCard({
        status: CardStatus.REVIEW,
        state: State.Review,
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        interval: 1,
      });
      expect(isCardDue(card)).toBe(true);
    });

    it("should return false for cards with future due date", () => {
      const card = createBaseCard({
        status: CardStatus.REVIEW,
        state: State.Review,
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        interval: 5,
      });
      expect(isCardDue(card)).toBe(false);
    });
  });

  describe("Bug Fix Edge Cases", () => {
    describe("Lapses Increment in Learning (#2)", () => {
      it("should increment lapses on Again in learning phase", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1,
          lapses: 0,
        });

        const result = calculateNextReview(card, "Again", undefined, [1, 10]);

        expect(result.lapses).toBe(1);
        expect(result.leechCount).toBe(1);
      });

      it("should mark as leech after repeated Again in learning", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 3,
        };

        // Card already has 2 lapses from previous Again presses
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1,
          lapses: 2,
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        // 2 + 1 = 3, which hits threshold
        expect(result.lapses).toBe(3);
        expect(result.isLeech).toBe(true);
      });
    });

    describe("Leech Tagging (#7)", () => {
      it("should add 'leech' tag when leechAction is tag", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 2,
          leechAction: "tag",
        };

        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          lapses: 1,
          stability: 10,
          difficulty: 5,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
          tags: ["existing-tag"],
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.isLeech).toBe(true);
        expect(result.tags).toContain("leech");
        expect(result.tags).toContain("existing-tag");
      });

      it("should not duplicate leech tag if already present", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 2,
          leechAction: "tag",
        };

        const card = createBaseCard({
          status: CardStatus.REVIEW,
          state: State.Review,
          lapses: 2,
          isLeech: true,
          stability: 10,
          difficulty: 5,
          last_review: new Date(Date.now() - 86400000).toISOString(),
          reps: 5,
          tags: ["leech"],
        });

        const result = calculateNextReview(
          card,
          "Again",
          undefined,
          [1, 10],
          lapsesSettings,
        );

        expect(result.tags?.filter((t) => t === "leech").length).toBe(1);
      });
    });

    describe("Learning Steps Validation (#5)", () => {
      it("should filter out negative learning steps", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

        // Negative steps should be filtered, leaving only valid [5]
        // With single step, Good at step 0 advances to step 1 but clamped detection
        // means it's still in learning. Press Good again to graduate.
        const result1 = calculateNextReview(card, "Good", undefined, [-5, 5]);
        expect(result1.status).toBe(CardStatus.LEARNING);

        const result2 = calculateNextReview(
          result1,
          "Good",
          undefined,
          [-5, 5],
        );
        expect(result2.status).toBe(CardStatus.REVIEW);
      });

      it("should filter out zero learning steps", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

        // Zero step should be filtered, using defaults
        const result = calculateNextReview(card, "Good", undefined, [0, 0]);

        // Should use defaults [1, 10], advance to step 1
        expect(result.learningStep).toBe(1);
        expect(result.status).toBe(CardStatus.LEARNING);
      });
    });

    describe("Learning Phase Detection (#1)", () => {
      it("should handle card with step exceeding current config", () => {
        // Card was saved with 3 steps, now config only has 2 steps
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 2, // This exceeds [1, 10] length
        });

        // With clamped step, should still be treated as in learning
        const result = calculateNextReview(card, "Good", undefined, [1, 10]);

        // Should clamp step to 1 (max valid), then Good graduates
        expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });

      it("should not prematurely graduate when step equals config length", () => {
        // This tests that clamped step detection works correctly
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1, // At last step of [1, 10]
        });

        const result = calculateNextReview(card, "Hard", undefined, [1, 10]);

        // Hard should keep at current step, not graduate
        expect(result.learningStep).toBe(1);
        expect(result.status).toBe(CardStatus.LEARNING);
      });
    });

    describe("Consecutive Again Presses", () => {
      it("should track lapses across multiple consecutive Again presses", () => {
        let card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 0,
          lapses: 0,
        });

        // Press Again 5 times
        for (let i = 0; i < 5; i++) {
          card = calculateNextReview(card, "Again", undefined, [1, 10]);
        }

        expect(card.lapses).toBe(5);
        expect(card.learningStep).toBe(0);
        expect(card.status).toBe(CardStatus.LEARNING);
      });
    });
  });
});
