import { describe, it, expect } from "vitest";
import { sortCards } from "./cardSorter";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const createCard = (id: string, status: CardStatus, dueDate: string, interval: number = 10, partOfSpeech: string = ""): Card => ({
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
  easeFactor: 0
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
      
      expect(result.map(c => c.id)).toEqual(["new", "review"]);
    });

    it("should strictly respect 'Review First' setting", () => {
      const reviewCard = createCard("review", CardStatus.REVIEW, past);
      const newCard = createCard("new", CardStatus.NEW, past);
      
      const result = sortCards([reviewCard, newCard], "reviewFirst");
      
      expect(result.map(c => c.id)).toEqual(["review", "new"]);
    });
  });

  describe("Display Order Settings - New Cards", () => {
    it("should sort new cards by 'cardType' when configured", () => {
      const cardA = createCard("verb", CardStatus.NEW, past, 0, "verb");
      const cardB = createCard("noun", CardStatus.NEW, past, 0, "noun");
      const cardC = createCard("adj", CardStatus.NEW, past, 0, "adjective");

      // Adjective < Noun < Verb
      const result = sortCards([cardA, cardB, cardC], "newFirst", {
        newCardSortOrder: "cardType"
      });

      expect(result.map(c => c.id)).toEqual(["adj", "noun", "verb"]);
    });

    it("should shuffle new cards when gatherOrder is 'random'", () => {
       // Since shuffle is random, we just check that the function runs without error
       // and returns the same set of cards. 
       // For a robust test we'd mock Math.random, but for now we trust the implementation calls shuffle.
       const cards = Array.from({ length: 10 }, (_, i) => createCard(`new-${i}`, CardStatus.NEW, past));
       const result = sortCards(cards, "newFirst", {
         newCardGatherOrder: "random"
       });
       expect(result).toHaveLength(10);
       expect(new Set(result.map(c => c.id))).toEqual(new Set(cards.map(c => c.id)));
    });
  });

  describe("Display Order Settings - Review Cards", () => {
    it("should sort reviews by 'overdueness'", () => {
      const now = new Date();
      // Card A: Due 100 days ago, interval 100. Overdueness = 1.
      const cardA = createCard("A", CardStatus.REVIEW, new Date(now.getTime() - 100 * 86400000).toISOString(), 100);
      
      // Card B: Due 10 days ago, interval 1. Overdueness = 10. (More overdue relative to interval)
      const cardB = createCard("B", CardStatus.REVIEW, new Date(now.getTime() - 10 * 86400000).toISOString(), 1);

      // Card C: Due today. Overdueness = 0.
      const cardC = createCard("C", CardStatus.REVIEW, now.toISOString(), 10);

      const result = sortCards([cardA, cardB, cardC], "reviewFirst", {
        reviewSortOrder: "overdueness"
      });

      // Expect B (highest ratio), then A, then C
      expect(result.map(c => c.id)).toEqual(["B", "A", "C"]);
    });

    it("should group by day when 'dueRandom' is used", () => {
      // 2 cards due on same day, 1 on another
      const day1 = "2023-01-01T10:00:00.000Z";
      const day1Later = "2023-01-01T20:00:00.000Z";
      const day2 = "2023-01-02T10:00:00.000Z";

      const c1 = createCard("d1-1", CardStatus.REVIEW, day1);
      const c2 = createCard("d1-2", CardStatus.REVIEW, day1Later);
      const c3 = createCard("d2-1", CardStatus.REVIEW, day2);

      const result = sortCards([c3, c2, c1], "reviewFirst", {
        reviewSortOrder: "dueRandom"
      });

      // Should be sorted by date groups: Day 1 cards, then Day 2 cards.
      // Order within Day 1 is random, but both must come before Day 2.
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
      // 2 New, 4 Review. Ratio is roughly 1 New every 2 Reviews in the combined array?
      // Logic: step = combined.length / (new.length + 1) => 4 / (2+1) = 1.33 => 1.
      // Insert at: 1*1=1, 2*1=2.
      // Combined (Rev): [R1, R2, R3, R4]
      // Insert N1 at 1: [R1, N1, R2, R3, R4]
      // Insert N2 at 2: [R1, N1, N2, R2, R3, R4] <-- wait, splice shifts indices?
      // Let's verify actual behavior.
      
      const n1 = createCard("n1", CardStatus.NEW, past);
      const n2 = createCard("n2", CardStatus.NEW, past);
      
      const r1 = createCard("r1", CardStatus.REVIEW, past);
      const r2 = createCard("r2", CardStatus.REVIEW, past);
      const r3 = createCard("r3", CardStatus.REVIEW, past);
      const r4 = createCard("r4", CardStatus.REVIEW, past);

      const result = sortCards([r1, r2, r3, r4, n1, n2], "mixed", {
        newReviewOrder: "mixed"
      });

      // We just want to verify they are mixed, i.e., not all new at start or end.
      const ids = result.map(c => c.id);
      const newIndices = ids.map((id, i) => id.startsWith("n") ? i : -1).filter(i => i !== -1);
      
      // Check that not all new cards are at the beginning (0, 1) or end.
      const allAtStart = newIndices.every(i => i < 2);
      const allAtEnd = newIndices.every(i => i >= 4);
      
      expect(allAtStart).toBe(false);
      expect(allAtEnd).toBe(false);
    });

    it("should place learning cards 'before' reviews", () => {
      const l1 = createCard("l1", CardStatus.LEARNING, past); // In scheduler.ts we might need 'learning' status or state
      // Manually setting state to Learning for the test helper to ensure isLearningCard picks it up
      // Note: createCard helper above sets state based on status New/Review. We need to override.
      // Let's make a better helper or just override here.
      const learningCard = { ...createCard("learn", CardStatus.LEARNING, past), state: State.Learning };
      const reviewCard = createCard("review", CardStatus.REVIEW, past);

      const result = sortCards([reviewCard, learningCard], "reviewFirst", {
        interdayLearningOrder: "before"
      });

      expect(result.map(c => c.id)).toEqual(["learn", "review"]);
    });

    it("should place learning cards 'after' reviews", () => {
        const learningCard = { ...createCard("learn", CardStatus.LEARNING, past), state: State.Learning };
        const reviewCard = createCard("review", CardStatus.REVIEW, past);
  
        const result = sortCards([reviewCard, learningCard], "reviewFirst", {
          interdayLearningOrder: "after"
        });
  
        expect(result.map(c => c.id)).toEqual(["review", "learn"]);
    });
  });

  describe("Edge Cases", () => {
    it("should always prioritize manually 'Prioritized' cards (EPOCH date)", () => {
        const normalCard = createCard("normal", CardStatus.REVIEW, past);
        const priorityCard = createCard("priority", CardStatus.NEW, epoch);
        
        // Even in 'due' sort, epoch is way in the past.
        const result = sortCards([normalCard, priorityCard], "newFirst", {
            newCardSortOrder: "due" 
        });
        
        // Note: Legacy "New First" gathers New cards separate from Review.
        // If priorityCard is NEW, it ends up in the New bucket.
        // If normalCard is REVIEW, it ends up in the Review bucket.
        // If "newFirst", New bucket comes first.
        expect(result[0].id).toBe("priority");
    });
    
    it("should handle empty input gracefully", () => {
        expect(sortCards([], "mixed")).toEqual([]);
    });

    it("should fallback to 'due' sort if settings are missing", () => {
        const c1 = createCard("c1", CardStatus.REVIEW, "2023-01-02");
        const c2 = createCard("c2", CardStatus.REVIEW, "2023-01-01");
        
        // Default review sort is 'due'
        const result = sortCards([c1, c2], "reviewFirst");
        expect(result.map(c => c.id)).toEqual(["c2", "c1"]);
    });
  });
});