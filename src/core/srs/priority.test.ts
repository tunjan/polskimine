import { describe, it, expect } from "vitest";
import { sortCards } from "./cardSorter";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const createCard = (
  id: string,
  status: CardStatus,
  dueDate: string,
  interval: number = 10,
  partOfSpeech: string = "",
): Card => ({
  id,
  status,
  state: status === CardStatus.NEW ? State.New : State.Review,
  dueDate,
  targetSentence: "test",
  nativeTranslation: "test",
  targetWordPartOfSpeech: partOfSpeech,
  language: "en" as any,
  notes: "",
  interval,
  easeFactor: 0,
});

describe("Card Sorting & Priority System", () => {
  const past = new Date("2020-01-01").toISOString();
  const future = new Date("2030-01-01").toISOString();
  const epoch = new Date(0).toISOString();

  describe("Legacy Sort Modes", () => {
    it("should strictly respect 'New First' setting", () => {
      const reviewCard = createCard("review", CardStatus.REVIEW, past);
      const newCard = createCard("new", CardStatus.NEW, past);

      const result = sortCards([reviewCard, newCard], "newFirst");

      expect(result.map((c) => c.id)).toEqual(["new", "review"]);
    });

    it("should strictly respect 'Review First' setting", () => {
      const reviewCard = createCard("review", CardStatus.REVIEW, past);
      const newCard = createCard("new", CardStatus.NEW, past);

      const result = sortCards([reviewCard, newCard], "reviewFirst");

      expect(result.map((c) => c.id)).toEqual(["review", "new"]);
    });
  });

  describe("Display Order Settings - New Cards", () => {
    it("should sort new cards by 'cardType' when configured", () => {
      const cardA = createCard("verb", CardStatus.NEW, past, 0, "verb");
      const cardB = createCard("noun", CardStatus.NEW, past, 0, "noun");
      const cardC = createCard("adj", CardStatus.NEW, past, 0, "adjective");

      
      const result = sortCards([cardA, cardB, cardC], "newFirst", {
        newCardSortOrder: "cardType",
      });

      expect(result.map((c) => c.id)).toEqual(["adj", "noun", "verb"]);
    });

    it("should shuffle new cards when gatherOrder is 'random'", () => {
      
      
      
      const cards = Array.from({ length: 10 }, (_, i) =>
        createCard(`new-${i}`, CardStatus.NEW, past),
      );
      const result = sortCards(cards, "newFirst", {
        newCardGatherOrder: "random",
      });
      expect(result).toHaveLength(10);
      expect(new Set(result.map((c) => c.id))).toEqual(
        new Set(cards.map((c) => c.id)),
      );
    });
  });

  describe("Display Order Settings - Review Cards", () => {
    it("should sort reviews by 'overdueness'", () => {
      const now = new Date();
      
      const cardA = createCard(
        "A",
        CardStatus.REVIEW,
        new Date(now.getTime() - 100 * 86400000).toISOString(),
        100,
      );

      
      const cardB = createCard(
        "B",
        CardStatus.REVIEW,
        new Date(now.getTime() - 10 * 86400000).toISOString(),
        1,
      );

      
      const cardC = createCard("C", CardStatus.REVIEW, now.toISOString(), 10);

      const result = sortCards([cardA, cardB, cardC], "reviewFirst", {
        reviewSortOrder: "overdueness",
      });

      
      expect(result.map((c) => c.id)).toEqual(["B", "A", "C"]);
    });

    it("should group by day when 'dueRandom' is used", () => {
      
      const day1 = "2023-01-01T10:00:00.000Z";
      const day1Later = "2023-01-01T20:00:00.000Z";
      const day2 = "2023-01-02T10:00:00.000Z";

      const c1 = createCard("d1-1", CardStatus.REVIEW, day1);
      const c2 = createCard("d1-2", CardStatus.REVIEW, day1Later);
      const c3 = createCard("d2-1", CardStatus.REVIEW, day2);

      const result = sortCards([c3, c2, c1], "reviewFirst", {
        reviewSortOrder: "dueRandom",
      });

      
      
      const firstTimeout = result[0].dueDate?.split("T")[0];
      const secondTimeout = result[1].dueDate?.split("T")[0];
      const thirdTimeout = result[2].dueDate?.split("T")[0];

      expect(firstTimeout).toBe("2023-01-01");
      expect(secondTimeout).toBe("2023-01-01");
      expect(thirdTimeout).toBe("2023-01-02");
    });
  });

  describe("Interleaving & Mixed Mode", () => {
    it("should interleave new cards into reviews in 'mixed' new/review order", () => {
      
      
      
      
      
      
      

      const n1 = createCard("n1", CardStatus.NEW, past);
      const n2 = createCard("n2", CardStatus.NEW, past);

      const r1 = createCard("r1", CardStatus.REVIEW, past);
      const r2 = createCard("r2", CardStatus.REVIEW, past);
      const r3 = createCard("r3", CardStatus.REVIEW, past);
      const r4 = createCard("r4", CardStatus.REVIEW, past);

      const result = sortCards([r1, r2, r3, r4, n1, n2], "mixed", {
        newReviewOrder: "mixed",
      });

      
      const ids = result.map((c) => c.id);
      const newIndices = ids
        .map((id, i) => (id.startsWith("n") ? i : -1))
        .filter((i) => i !== -1);

      
      const allAtStart = newIndices.every((i) => i < 2);
      const allAtEnd = newIndices.every((i) => i >= 4);

      expect(allAtStart).toBe(false);
      expect(allAtEnd).toBe(false);
    });

    it("should place learning cards 'before' reviews", () => {
      
      
      
      const learningCard = {
        ...createCard("learn", CardStatus.LEARNING, past),
        state: State.Learning,
      };
      const reviewCard = createCard("review", CardStatus.REVIEW, past);

      const result = sortCards([reviewCard, learningCard], "reviewFirst", {
        interdayLearningOrder: "before",
      });

      expect(result.map((c) => c.id)).toEqual(["learn", "review"]);
    });

    it("should place learning cards 'after' reviews", () => {
      const learningCard = {
        ...createCard("learn", CardStatus.LEARNING, past),
        state: State.Learning,
      };
      const reviewCard = createCard("review", CardStatus.REVIEW, past);

      const result = sortCards([reviewCard, learningCard], "reviewFirst", {
        interdayLearningOrder: "after",
      });

      expect(result.map((c) => c.id)).toEqual(["review", "learn"]);
    });
  });

  describe("Edge Cases", () => {
    it("should always prioritize manually 'Prioritized' cards (EPOCH date)", () => {
      const normalCard = createCard("normal", CardStatus.REVIEW, past);
      const priorityCard = createCard("priority", CardStatus.NEW, epoch);

      
      const result = sortCards([normalCard, priorityCard], "newFirst", {
        newCardSortOrder: "due",
      });

      
      
      
      
      expect(result[0].id).toBe("priority");
    });

    it("should handle empty input gracefully", () => {
      expect(sortCards([], "mixed")).toEqual([]);
    });

    it("should fallback to 'due' sort if settings are missing", () => {
      const c1 = createCard("c1", CardStatus.REVIEW, "2023-01-02");
      const c2 = createCard("c2", CardStatus.REVIEW, "2023-01-01");

      
      const result = sortCards([c1, c2], "reviewFirst");
      expect(result.map((c) => c.id)).toEqual(["c2", "c1"]);
    });
  });
});
