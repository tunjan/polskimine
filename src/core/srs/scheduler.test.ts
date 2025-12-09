import { describe, it, expect } from "vitest";
import { calculateNextReview, isCardDue, LapsesSettings } from "./scheduler";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const createBaseCard = (overrides: Partial<Card> = {}): Card => ({
  id: "test-card-1",
  targetSentence: "Test sentence",
  nativeTranslation: "Test translation",
  notes: "",
  status: CardStatus.NEW,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: "polish" as any,
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
        expect(result.status).toBe(CardStatus.SUSPENDED);
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

                        expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });

      it("should handle empty learning steps", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

                const result = calculateNextReview(card, "Good", undefined, []);

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
          lapses: 2,           last_review: new Date(Date.now() - 86400000).toISOString(),
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
                expect(result.isLeech).toBe(true);
                expect(result.status).toBe(CardStatus.SUSPENDED);
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
      it("should NOT increment lapses on Again in learning phase", () => {
        const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1,
          lapses: 0,
        });

        const result = calculateNextReview(card, "Again", undefined, [1, 10]);

        expect(result.lapses).toBe(0);
        expect(result.leechCount).toBe(0);
      });

      it("should NOT mark as leech after repeated Again in learning", () => {
        const lapsesSettings: LapsesSettings = {
          leechThreshold: 3,
        };

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

                expect(result.lapses).toBe(2);
        expect(result.isLeech).toBeFalsy();
      });
    });



    describe("Learning Steps Validation (#5)", () => {
      it("should filter out negative learning steps", () => {
        const card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

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

                const result = calculateNextReview(card, "Good", undefined, [0, 0]);

                expect(result.learningStep).toBe(1);
        expect(result.status).toBe(CardStatus.LEARNING);
      });
    });

    describe("Learning Phase Detection (#1)", () => {
      it("should handle card with step exceeding current config", () => {
                const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 2,         });

                const result = calculateNextReview(card, "Good", undefined, [1, 10]);

                expect(result.learningStep).toBeUndefined();
        expect(result.status).toBe(CardStatus.REVIEW);
      });

      it("should not prematurely graduate when step equals config length", () => {
                const card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 1,         });

        const result = calculateNextReview(card, "Hard", undefined, [1, 10]);

                expect(result.learningStep).toBe(1);
        expect(result.status).toBe(CardStatus.LEARNING);
      });
    });

    describe("Consecutive Again Presses", () => {
      it("should NOT track lapses across multiple consecutive Again presses in learning", () => {
        let card = createBaseCard({
          status: CardStatus.LEARNING,
          learningStep: 0,
          lapses: 0,
        });

                for (let i = 0; i < 5; i++) {
          card = calculateNextReview(card, "Again", undefined, [1, 10]);
        }

        expect(card.lapses).toBe(0);
        expect(card.learningStep).toBe(0);
        expect(card.status).toBe(CardStatus.LEARNING);
      });
    });
  });
});
