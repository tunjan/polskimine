import { describe, it, expect } from "vitest";
import { sortCards, DisplayOrderSettings } from "./cardSorter";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const createCard = (id: string, overrides: Partial<Card> = {}): Card => ({
  id,
  targetSentence: `Sentence ${id}`,
  nativeTranslation: `Translation ${id}`,
  notes: "",
  status: CardStatus.NEW,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: "en" as any,
  ...overrides,
});

describe("cardSorter", () => {
  describe("sortCards", () => {
    describe("Legacy behavior (no displaySettings)", () => {
      it("should return empty array for empty input", () => {
        expect(sortCards([], "newFirst")).toEqual([]);
      });

      it("should put new cards first when order is newFirst", () => {
        const newCard = createCard("1", { status: CardStatus.NEW });
        const reviewCard = createCard("2", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });

        const result = sortCards([reviewCard, newCard], "newFirst");

        expect(result[0].id).toBe("1");
        expect(result[1].id).toBe("2");
      });

      it("should put review cards first when order is reviewFirst", () => {
        const newCard = createCard("1", { status: CardStatus.NEW });
        const reviewCard = createCard("2", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });

        const result = sortCards([newCard, reviewCard], "reviewFirst");

        expect(result[0].id).toBe("2");
        expect(result[1].id).toBe("1");
      });
    });

    describe("With displaySettings", () => {
      it("should respect interdayLearningOrder: before", () => {
        const newCard = createCard("new", { status: CardStatus.NEW });
        const learningCard = createCard("learning", {
          status: CardStatus.LEARNING,
          state: State.Learning,
        });
        const reviewCard = createCard("review", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "before",
          newReviewOrder: "newFirst",
        };

        const result = sortCards(
          [reviewCard, newCard, learningCard],
          "newFirst",
          settings,
        );

                const ids = result.map((c) => c.id);
        expect(ids).toEqual(["new", "learning", "review"]);
      });

      it("should respect interdayLearningOrder: after", () => {
        const newCard = createCard("new", { status: CardStatus.NEW });
        const learningCard = createCard("learning", {
          status: CardStatus.LEARNING,
          state: State.Learning,
        });
        const reviewCard = createCard("review", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "after",
          newReviewOrder: "newFirst",
        };

        const result = sortCards(
          [reviewCard, newCard, learningCard],
          "newFirst",
          settings,
        );

                const ids = result.map((c) => c.id);
        expect(ids).toEqual(["new", "review", "learning"]);
      });

      it("should respect interdayLearningOrder: mixed (interleaved)", () => {
        const newCard = createCard("new", { status: CardStatus.NEW });
        const learningCard = createCard("learning", {
          status: CardStatus.LEARNING,
          state: State.Learning,
        });
        const reviewCard1 = createCard("review1", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });
        const reviewCard2 = createCard("review2", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "mixed",
          newReviewOrder: "newFirst",
        };

        const result = sortCards(
          [reviewCard1, reviewCard2, newCard, learningCard],
          "newFirst",
          settings,
        );

                expect(result[0].id).toBe("new");
                expect(result.map((c) => c.id)).toContain("learning");
      });

      it("should sort new cards by cardType when specified", () => {
        const nounCard = createCard("noun", {
          status: CardStatus.NEW,
          targetWordPartOfSpeech: "noun",
        });
        const verbCard = createCard("verb", {
          status: CardStatus.NEW,
          targetWordPartOfSpeech: "verb",
        });
        const adjCard = createCard("adj", {
          status: CardStatus.NEW,
          targetWordPartOfSpeech: "adjective",
        });

        const settings: DisplayOrderSettings = {
          newCardSortOrder: "cardType",
          newReviewOrder: "newFirst",
        };

        const result = sortCards(
          [verbCard, nounCard, adjCard],
          "newFirst",
          settings,
        );

                const types = result.map((c) => c.targetWordPartOfSpeech);
        expect(types).toEqual(["adjective", "noun", "verb"]);
      });

      it("should sort reviews by overdueness when specified", () => {
        const now = new Date();

                const moreOverdueCard = createCard("overdue", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
          dueDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
          interval: 1,
        });

                const lessOverdueCard = createCard("less-overdue", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
          dueDate: new Date(now.getTime() - 1 * 86400000).toISOString(),
          interval: 1,
        });

        const settings: DisplayOrderSettings = {
          reviewSortOrder: "overdueness",
          newReviewOrder: "reviewFirst",
        };

        const result = sortCards(
          [lessOverdueCard, moreOverdueCard],
          "reviewFirst",
          settings,
        );

                expect(result[0].id).toBe("overdue");
      });
    });

    describe("interleaveLearningCards integration", () => {
      it("should not discard learning cards in newFirst mode", () => {
        const newCard = createCard("new", { status: CardStatus.NEW });
        const learningCard = createCard("learning", {
          status: CardStatus.LEARNING,
          state: State.Learning,
        });
        const reviewCard = createCard("review", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          newReviewOrder: "newFirst",
          interdayLearningOrder: "before",
        };

        const result = sortCards(
          [reviewCard, newCard, learningCard],
          "newFirst",
          settings,
        );

                expect(result.length).toBe(3);
        expect(result.map((c) => c.id)).toContain("learning");
      });

      it("should not discard learning cards in reviewFirst mode", () => {
        const newCard = createCard("new", { status: CardStatus.NEW });
        const learningCard = createCard("learning", {
          status: CardStatus.LEARNING,
          state: State.Learning,
        });
        const reviewCard = createCard("review", {
          status: CardStatus.REVIEW,
          state: State.Review,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          newReviewOrder: "reviewFirst",
          interdayLearningOrder: "before",
        };

        const result = sortCards(
          [newCard, reviewCard, learningCard],
          "reviewFirst",
          settings,
        );

                expect(result.length).toBe(3);
        expect(result.map((c) => c.id)).toContain("learning");
      });
    });

    describe("Regression: Learning card sorting order", () => {
      it("should NOT reverse learning cards when review queue is empty", () => {
        const learningCard1 = createCard("learning1", {
          status: CardStatus.LEARNING,
          state: State.Learning,
          dueDate: "2023-01-01T10:00:00Z",
        });
        const learningCard2 = createCard("learning2", {
          status: CardStatus.LEARNING,
          state: State.Learning,
          dueDate: "2023-01-01T11:00:00Z",
        });
        const learningCard3 = createCard("learning3", {
          status: CardStatus.LEARNING,
          state: State.Learning,
          dueDate: "2023-01-01T12:00:00Z",
        });

                const learningCards = [learningCard1, learningCard2, learningCard3];

        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "mixed",
          newReviewOrder: "newFirst",
        };

        const result = sortCards(learningCards, "newFirst", settings);

                const ids = result.map((c) => c.id);
        expect(ids).toEqual(["learning1", "learning2", "learning3"]);
      });
    });
  });
});
