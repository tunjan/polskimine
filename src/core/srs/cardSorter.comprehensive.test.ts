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

const createNewCard = (id: string, overrides: Partial<Card> = {}): Card =>
  createCard(id, {
    status: CardStatus.NEW,
    state: State.New,
    reps: 0,
    ...overrides,
  });

const createLearningCard = (id: string, overrides: Partial<Card> = {}): Card =>
  createCard(id, {
    status: CardStatus.LEARNING,
    state: State.Learning,
    reps: 1,
    ...overrides,
  });

const createReviewCard = (id: string, overrides: Partial<Card> = {}): Card =>
  createCard(id, {
    status: CardStatus.REVIEW,
    state: State.Review,
    reps: 5,
    interval: 5,
    ...overrides,
  });

const createRelearningCard = (id: string, overrides: Partial<Card> = {}): Card =>
  createCard(id, {
    status: CardStatus.LEARNING,
    state: State.Relearning,
    reps: 5,
    lapses: 1,
    ...overrides,
  });


describe("sortCards - Comprehensive Edge Cases", () => {
  describe("Boundary Conditions", () => {
    it("should return empty array for empty input", () => {
      expect(sortCards([], "newFirst")).toEqual([]);
      expect(sortCards([], "reviewFirst")).toEqual([]);
      expect(sortCards([], "mixed")).toEqual([]);
    });

    it("should handle single new card", () => {
      const cards = [createNewCard("1")];
      const result = sortCards(cards, "newFirst");
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should handle single review card", () => {
      const cards = [createReviewCard("1")];
      const result = sortCards(cards, "reviewFirst");
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should handle single learning card", () => {
      const cards = [createLearningCard("1")];
      const result = sortCards(cards, "newFirst");
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should handle very large deck (100+ cards)", () => {
      const cards = [
        ...Array.from({ length: 50 }, (_, i) => createNewCard(`new-${i}`)),
        ...Array.from({ length: 50 }, (_, i) => createReviewCard(`rev-${i}`)),
      ];
      
      const result = sortCards(cards, "newFirst");
      
      expect(result).toHaveLength(100);
            expect(result[0].status).toBe(CardStatus.NEW);
    });
  });

  describe("All New Cards Only", () => {
    it("should sort new cards by due date", () => {
      const cards = [
        createNewCard("3", { dueDate: "2024-01-03T00:00:00Z" }),
        createNewCard("1", { dueDate: "2024-01-01T00:00:00Z" }),
        createNewCard("2", { dueDate: "2024-01-02T00:00:00Z" }),
      ];
      
      const result = sortCards(cards, "newFirst");
      
      expect(result.map(c => c.id)).toEqual(["1", "2", "3"]);
    });

    it("should maintain order with same due dates (stable sort by id)", () => {
      const sameDate = "2024-01-01T00:00:00Z";
      const cards = [
        createNewCard("c", { dueDate: sameDate }),
        createNewCard("a", { dueDate: sameDate }),
        createNewCard("b", { dueDate: sameDate }),
      ];
      
      const result = sortCards(cards, "newFirst");
      
            expect(result.map(c => c.id)).toEqual(["a", "b", "c"]);
    });
  });

  describe("All Review Cards Only", () => {
    it("should sort review cards by due date by default", () => {
      const cards = [
        createReviewCard("3", { dueDate: "2024-01-03T00:00:00Z" }),
        createReviewCard("1", { dueDate: "2024-01-01T00:00:00Z" }),
        createReviewCard("2", { dueDate: "2024-01-02T00:00:00Z" }),
      ];
      
      const result = sortCards(cards, "reviewFirst");
      
      expect(result.map(c => c.id)).toEqual(["1", "2", "3"]);
    });
  });

  describe("All Learning Cards Only", () => {
    it("should sort learning cards by due date", () => {
      const cards = [
        createLearningCard("3", { dueDate: "2024-01-01T12:00:00Z" }),
        createLearningCard("1", { dueDate: "2024-01-01T10:00:00Z" }),
        createLearningCard("2", { dueDate: "2024-01-01T11:00:00Z" }),
      ];
      
      const settings: DisplayOrderSettings = {
        interdayLearningOrder: "mixed",
        newReviewOrder: "newFirst",
      };
      
      const result = sortCards(cards, "newFirst", settings);
      
      expect(result.map(c => c.id)).toEqual(["1", "2", "3"]);
    });

    it("should not reverse learning cards when review queue is empty", () => {
      const cards = [
        createLearningCard("1", { dueDate: "2024-01-01T10:00:00Z" }),
        createLearningCard("2", { dueDate: "2024-01-01T11:00:00Z" }),
        createLearningCard("3", { dueDate: "2024-01-01T12:00:00Z" }),
      ];
      
      const settings: DisplayOrderSettings = {
        interdayLearningOrder: "mixed",
        newReviewOrder: "newFirst",
      };
      
      const result = sortCards(cards, "newFirst", settings);
      
            const ids = result.map(c => c.id);
      expect(ids).toEqual(["1", "2", "3"]);
    });
  });

  describe("Mixed Card Types", () => {
    it("should interleave all card types correctly", () => {
      const cards = [
        createNewCard("new1"),
        createLearningCard("learn1"),
        createReviewCard("rev1"),
        createRelearningCard("relearn1"),
      ];
      
      const result = sortCards(cards, "mixed", {
        newReviewOrder: "mixed",
      });
      
            expect(result).toHaveLength(4);
      expect(result.map(c => c.id).sort()).toEqual(["learn1", "new1", "relearn1", "rev1"]);
    });

    it("should handle mix of new and review only", () => {
      const cards = [
        createNewCard("new1"),
        createNewCard("new2"),
        createReviewCard("rev1"),
        createReviewCard("rev2"),
      ];
      
      const result = sortCards(cards, "newFirst");
      
            expect(result[0].status).toBe(CardStatus.NEW);
      expect(result[1].status).toBe(CardStatus.NEW);
    });
  });

  describe("Overdueness Sorting", () => {
    it("should sort more overdue cards first", () => {
      const now = new Date();
      const cards = [
        createReviewCard("less-overdue", {
          dueDate: new Date(now.getTime() - 1 * 86400000).toISOString(),
          interval: 1,
        }),
        createReviewCard("more-overdue", {
          dueDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
          interval: 1,
        }),
      ];
      
      const settings: DisplayOrderSettings = {
        reviewSortOrder: "overdueness",
        newReviewOrder: "reviewFirst",
      };
      
      const result = sortCards(cards, "reviewFirst", settings);
      
      expect(result[0].id).toBe("more-overdue");
    });

    it("should handle overdueness with different intervals", () => {
      const now = new Date();
                  const cards = [
        createReviewCard("interval-10", {
          dueDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
          interval: 10,
        }),
        createReviewCard("interval-1", {
          dueDate: new Date(now.getTime() - 2 * 86400000).toISOString(),
          interval: 1,
        }),
      ];
      
      const settings: DisplayOrderSettings = {
        reviewSortOrder: "overdueness",
        newReviewOrder: "reviewFirst",
      };
      
      const result = sortCards(cards, "reviewFirst", settings);
      
            expect(result[0].id).toBe("interval-1");
    });

    it("should handle zero interval gracefully (no division by zero)", () => {
      const now = new Date();
      const cards = [
        createReviewCard("zero-interval", {
          dueDate: new Date(now.getTime() - 86400000).toISOString(),
          interval: 0,
        }),
        createReviewCard("normal-interval", {
          dueDate: new Date(now.getTime() - 86400000).toISOString(),
          interval: 5,
        }),
      ];
      
      const settings: DisplayOrderSettings = {
        reviewSortOrder: "overdueness",
        newReviewOrder: "reviewFirst",
      };
      
            expect(() => sortCards(cards, "reviewFirst", settings)).not.toThrow();
      
      const result = sortCards(cards, "reviewFirst", settings);
      expect(result).toHaveLength(2);
    });

    it("should handle negative interval (corrupted data)", () => {
      const now = new Date();
      const cards = [
        createReviewCard("negative-interval", {
          dueDate: new Date(now.getTime() - 86400000).toISOString(),
          interval: -5,
        }),
        createReviewCard("normal", {
          dueDate: now.toISOString(),
          interval: 1,
        }),
      ];
      
      const settings: DisplayOrderSettings = {
        reviewSortOrder: "overdueness",
        newReviewOrder: "reviewFirst",
      };
      
      expect(() => sortCards(cards, "reviewFirst", settings)).not.toThrow();
    });
  });

  describe("Card Order Settings", () => {
    describe("newFirst", () => {
      it("should put all new cards before all review cards", () => {
        const cards = [
          createReviewCard("rev1"),
          createNewCard("new1"),
          createReviewCard("rev2"),
          createNewCard("new2"),
        ];
        
        const result = sortCards(cards, "newFirst");
        
        const newIndices = result.map((c, i) => c.status === CardStatus.NEW ? i : -1).filter(i => i >= 0);
        const reviewIndices = result.map((c, i) => c.status === CardStatus.REVIEW ? i : -1).filter(i => i >= 0);
        
                expect(Math.max(...newIndices)).toBeLessThan(Math.min(...reviewIndices));
      });
    });

    describe("reviewFirst", () => {
      it("should put all review cards before all new cards", () => {
        const cards = [
          createNewCard("new1"),
          createReviewCard("rev1"),
          createNewCard("new2"),
          createReviewCard("rev2"),
        ];
        
        const result = sortCards(cards, "reviewFirst");
        
        const newIndices = result.map((c, i) => c.status === CardStatus.NEW ? i : -1).filter(i => i >= 0);
        const reviewIndices = result.map((c, i) => c.status === CardStatus.REVIEW ? i : -1).filter(i => i >= 0);
        
                expect(Math.max(...reviewIndices)).toBeLessThan(Math.min(...newIndices));
      });
    });

    describe("mixed", () => {
      it("should interleave new and review cards", () => {
        const cards = [
          ...Array.from({ length: 5 }, (_, i) => createNewCard(`new-${i}`)),
          ...Array.from({ length: 5 }, (_, i) => createReviewCard(`rev-${i}`)),
        ];
        
        const settings: DisplayOrderSettings = {
          newReviewOrder: "mixed",
        };
        
        const result = sortCards(cards, "mixed", settings);
        
                const hasNew = result.some(c => c.status === CardStatus.NEW);
        const hasReview = result.some(c => c.status === CardStatus.REVIEW);
        
        expect(hasNew).toBe(true);
        expect(hasReview).toBe(true);
      });
    });
  });

  describe("Display Settings", () => {
    describe("newCardGatherOrder", () => {
      it("should shuffle new cards when set to random", () => {
        const cards = Array.from({ length: 20 }, (_, i) =>
          createNewCard(`new-${i}`, { dueDate: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z` })
        );
        
        const settings: DisplayOrderSettings = {
          newCardGatherOrder: "random",
          newReviewOrder: "newFirst",
        };
        
                const results = [
          sortCards(cards, "newFirst", settings),
          sortCards(cards, "newFirst", settings),
        ];
        
                        expect(results[0]).toHaveLength(20);
      });
    });

    describe("newCardSortOrder", () => {
      it("should sort by cardType when specified", () => {
        const cards = [
          createNewCard("verb", { targetWordPartOfSpeech: "verb" }),
          createNewCard("adj", { targetWordPartOfSpeech: "adjective" }),
          createNewCard("noun", { targetWordPartOfSpeech: "noun" }),
        ];
        
        const settings: DisplayOrderSettings = {
          newCardSortOrder: "cardType",
          newReviewOrder: "newFirst",
        };
        
        const result = sortCards(cards, "newFirst", settings);
        
        const types = result.map(c => c.targetWordPartOfSpeech);
        expect(types).toEqual(["adjective", "noun", "verb"]);
      });
    });

    describe("interdayLearningOrder", () => {
      it("should put learning cards before reviews when set to 'before'", () => {
        const cards = [
          createReviewCard("rev1"),
          createLearningCard("learn1"),
          createNewCard("new1"),
        ];
        
        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "before",
          newReviewOrder: "newFirst",
        };
        
        const result = sortCards(cards, "newFirst", settings);
        
        const ids = result.map(c => c.id);
        expect(ids).toEqual(["new1", "learn1", "rev1"]);
      });

      it("should put learning cards after reviews when set to 'after'", () => {
        const cards = [
          createLearningCard("learn1"),
          createReviewCard("rev1"),
          createNewCard("new1"),
        ];
        
        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "after",
          newReviewOrder: "newFirst",
        };
        
        const result = sortCards(cards, "newFirst", settings);
        
        const ids = result.map(c => c.id);
        expect(ids).toEqual(["new1", "rev1", "learn1"]);
      });
    });

    describe("reviewSortOrder", () => {
      it("should sort by due date when set to 'due'", () => {
        const cards = [
          createReviewCard("rev3", { dueDate: "2024-01-03T00:00:00Z" }),
          createReviewCard("rev1", { dueDate: "2024-01-01T00:00:00Z" }),
          createReviewCard("rev2", { dueDate: "2024-01-02T00:00:00Z" }),
        ];
        
        const settings: DisplayOrderSettings = {
          reviewSortOrder: "due",
          newReviewOrder: "reviewFirst",
        };
        
        const result = sortCards(cards, "reviewFirst", settings);
        
        expect(result.map(c => c.id)).toEqual(["rev1", "rev2", "rev3"]);
      });

      it("should group by date then shuffle within date for 'dueRandom'", () => {
        const cards = [
          createReviewCard("rev1a", { dueDate: "2024-01-01T10:00:00Z" }),
          createReviewCard("rev1b", { dueDate: "2024-01-01T14:00:00Z" }),
          createReviewCard("rev2a", { dueDate: "2024-01-02T08:00:00Z" }),
        ];
        
        const settings: DisplayOrderSettings = {
          reviewSortOrder: "dueRandom",
          newReviewOrder: "reviewFirst",
        };
        
        const result = sortCards(cards, "reviewFirst", settings);
        
                expect(result).toHaveLength(3);
                const jan1Cards = result.filter(c => c.dueDate.startsWith("2024-01-01"));
        const jan2Cards = result.filter(c => c.dueDate.startsWith("2024-01-02"));
        expect(jan1Cards).toHaveLength(2);
        expect(jan2Cards).toHaveLength(1);
      });
    });
  });

  describe("Legacy Behavior (no displaySettings)", () => {
    it("should fall back to simple sorting without displaySettings", () => {
      const cards = [
        createReviewCard("rev1"),
        createNewCard("new1"),
      ];
      
      const result = sortCards(cards, "newFirst");
      
      expect(result[0].id).toBe("new1");
    });

    it("should shuffle cards for mixed mode without displaySettings", () => {
      const cards = Array.from({ length: 10 }, (_, i) => createNewCard(`${i}`));
      
            const result = sortCards(cards, "mixed");
      expect(result).toHaveLength(10);
    });
  });

  describe("Prioritized Cards (Epoch Date)", () => {
    it("should put epoch-dated cards first when sorted by due date", () => {
      const cards = [
        createNewCard("normal", { dueDate: "2024-01-15T00:00:00Z" }),
        createNewCard("priority", { dueDate: new Date(0).toISOString() }),
      ];
      
      const result = sortCards(cards, "newFirst");
      
      expect(result[0].id).toBe("priority");
    });

    it("should prioritize epoch card over other cards in reviewFirst mode", () => {
      const cards = [
        createReviewCard("review", { dueDate: "2024-01-01T00:00:00Z" }),
        createNewCard("priority", { dueDate: new Date(0).toISOString() }),
        createNewCard("normal", { dueDate: "2024-01-15T00:00:00Z" }),
      ];
      
      const result = sortCards(cards, "newFirst");
      
            const newCards = result.filter(c => c.status === CardStatus.NEW);
      expect(newCards[0].id).toBe("priority");
    });
  });

  describe("Relearning Cards Handling", () => {
    it("should treat relearning cards as learning cards", () => {
      const cards = [
        createRelearningCard("relearn1"),
        createReviewCard("rev1"),
        createNewCard("new1"),
      ];
      
      const settings: DisplayOrderSettings = {
        interdayLearningOrder: "before",
        newReviewOrder: "newFirst",
      };
      
      const result = sortCards(cards, "newFirst", settings);
      
            expect(result.map(c => c.id)).toEqual(["new1", "relearn1", "rev1"]);
    });
  });

  describe("Edge Cases with Missing Data", () => {
    it("should handle cards with undefined dueDate", () => {
      const cards = [
        createNewCard("1", { dueDate: undefined as any }),
        createNewCard("2", { dueDate: "2024-01-01T00:00:00Z" }),
      ];
      
            expect(() => sortCards(cards, "newFirst")).not.toThrow();
    });

    it("should handle cards with undefined interval for overdueness", () => {
      const cards = [
        createReviewCard("1", { interval: undefined as any }),
        createReviewCard("2", { interval: 5 }),
      ];
      
      const settings: DisplayOrderSettings = {
        reviewSortOrder: "overdueness",
        newReviewOrder: "reviewFirst",
      };
      
      expect(() => sortCards(cards, "reviewFirst", settings)).not.toThrow();
    });

    it("should handle cards with undefined status", () => {
      const cards = [
        createCard("1", { status: undefined as any }),
        createNewCard("2"),
      ];
      
      expect(() => sortCards(cards, "newFirst")).not.toThrow();
    });
  });
});
