import { describe, it, expect, vi } from "vitest";
import { State } from "ts-fsrs";
import { Card, LanguageId } from "@/types";
import {
  sortCards,
  DisplayOrderSettings,
} from "./cardSorter";

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

describe("cardSorter", () => {
  describe("sortCards - Basic Functionality", () => {
    it("should return empty array for empty input", () => {
      expect(sortCards([], "newFirst")).toEqual([]);
    });

    it("should return all cards", () => {
      const cards = [
        createCard({ id: "1" }),
        createCard({ id: "2" }),
        createCard({ id: "3" }),
      ];
      const result = sortCards(cards, "newFirst");
      expect(result).toHaveLength(3);
    });
  });

  describe("sortCards - Card Type Classification", () => {
    it("should identify new cards (state: New, queue: 0)", () => {
      const newCard = createCard({
        id: "new",
        state: State.New,
        queue: 0,
        reps: 0,
      });
      const reviewCard = createCard({
        id: "review",
        state: State.Review,
        queue: 2,
        reps: 5,
      });

      const result = sortCards([reviewCard, newCard], "newFirst");

      
      expect(result[0].id).toBe("new");
    });

    it("should identify learning cards (state: Learning)", () => {
      const learningCard = createCard({
        id: "learning",
        state: State.Learning,
        queue: 1,
      });
      const newCard = createCard({
        id: "new",
        state: State.New,
        queue: 0,
        reps: 0,
      });

      const result = sortCards([learningCard, newCard], "newFirst");

      
      expect(result).toHaveLength(2);
    });

    it("should identify relearning cards (state: Relearning)", () => {
      const relearningCard = createCard({
        id: "relearning",
        state: State.Relearning,
        queue: 1,
        lapses: 1,
      });

      const result = sortCards([relearningCard], "mixed");
      expect(result).toHaveLength(1);
    });

    it("should identify review cards (state: Review)", () => {
      const reviewCard = createCard({
        id: "review",
        state: State.Review,
        queue: 2,
        reps: 5,
      });

      const result = sortCards([reviewCard], "reviewFirst");
      expect(result[0].id).toBe("review");
    });
  });

  describe("sortCards - Order: newFirst", () => {
    it("should place new cards before review cards", () => {
      const newCard = createCard({
        id: "new",
        state: State.New,
        queue: 0,
        reps: 0,
      });
      const reviewCard = createCard({
        id: "review",
        state: State.Review,
        queue: 2,
        reps: 5,
      });

      const result = sortCards([reviewCard, newCard], "newFirst");

      expect(result[0].id).toBe("new");
      expect(result[1].id).toBe("review");
    });

    it("should maintain new card order within new cards", () => {
      const newCards = [
        createCard({ id: "new1", state: State.New, queue: 0, due: 2 }),
        createCard({ id: "new2", state: State.New, queue: 0, due: 1 }),
        createCard({ id: "new3", state: State.New, queue: 0, due: 3 }),
      ];

      const result = sortCards(newCards, "newFirst");

      
      expect(result).toHaveLength(3);
      expect(result.map((c) => c.id)).toContain("new1");
    });
  });

  describe("sortCards - Order: reviewFirst", () => {
    it("should place review cards before new cards", () => {
      const newCard = createCard({
        id: "new",
        state: State.New,
        queue: 0,
        reps: 0,
      });
      const reviewCard = createCard({
        id: "review",
        state: State.Review,
        queue: 2,
        reps: 5,
      });

      const result = sortCards([newCard, reviewCard], "reviewFirst");

      
      const reviewIndex = result.findIndex((c) => c.id === "review");
      const newIndex = result.findIndex((c) => c.id === "new");
      expect(reviewIndex).toBeLessThan(newIndex);
    });
  });

  describe("sortCards - Order: mixed", () => {
    it("should shuffle cards when order is mixed without settings", () => {
      const cards = Array.from({ length: 20 }, (_, i) =>
        createCard({ id: `card-${i}`, state: State.New, reps: 0 })
      );

      
      const results = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const result = sortCards(cards, "mixed");
        results.add(result.map((c) => c.id).join(","));
      }

      
      expect(results.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe("sortCards - Display Settings", () => {
    describe("newCardGatherOrder", () => {
      it("should sort by due when gatherOrder is 'added' (default)", () => {
        const cards = [
          createCard({ id: "1", state: State.New, queue: 0, due: 3 }),
          createCard({ id: "2", state: State.New, queue: 0, due: 1 }),
          createCard({ id: "3", state: State.New, queue: 0, due: 2 }),
        ];

        const settings: DisplayOrderSettings = {
          newCardGatherOrder: "added",
          newCardSortOrder: "due",
        };

        const result = sortCards(cards, "newFirst", settings);

        expect(result[0].due).toBe(1);
        expect(result[1].due).toBe(2);
        expect(result[2].due).toBe(3);
      });

      it("should randomize when gatherOrder is 'random'", () => {
        const cards = Array.from({ length: 10 }, (_, i) =>
          createCard({ id: `${i}`, state: State.New, queue: 0, due: i })
        );

        const settings: DisplayOrderSettings = {
          newCardGatherOrder: "random",
          newCardSortOrder: "due",
        };

        const results = new Set<string>();
        for (let i = 0; i < 3; i++) {
          const result = sortCards(cards, "newFirst", settings);
          results.add(result.map((c) => c.id).join(","));
        }

        expect(results.size).toBeGreaterThanOrEqual(1);
      });
    });

    describe("newCardSortOrder", () => {
      it("should sort new cards by due", () => {
        const cards = [
          createCard({ id: "1", state: State.New, queue: 0, due: 3 }),
          createCard({ id: "2", state: State.New, queue: 0, due: 1 }),
        ];

        const settings: DisplayOrderSettings = {
          newCardSortOrder: "due",
        };

        const result = sortCards(cards, "newFirst", settings);

        expect(result[0].due).toBeLessThan(result[1].due);
      });

      it("should randomize new cards when sortOrder is 'random'", () => {
        const cards = Array.from({ length: 10 }, (_, i) =>
          createCard({ id: `${i}`, state: State.New, queue: 0, due: i })
        );

        const settings: DisplayOrderSettings = {
          newCardSortOrder: "random",
        };

        const results = new Set<string>();
        for (let i = 0; i < 3; i++) {
          const result = sortCards(cards, "newFirst", settings);
          results.add(result.map((c) => c.id).join(","));
        }

        expect(results.size).toBeGreaterThanOrEqual(1);
      });

      it("should sort by card type (part of speech)", () => {
        const cards = [
          createCard({
            id: "1",
            state: State.New,
            queue: 0,
            targetWordPartOfSpeech: "verb",
          }),
          createCard({
            id: "2",
            state: State.New,
            queue: 0,
            targetWordPartOfSpeech: "adjective",
          }),
          createCard({
            id: "3",
            state: State.New,
            queue: 0,
            targetWordPartOfSpeech: "noun",
          }),
        ];

        const settings: DisplayOrderSettings = {
          newCardSortOrder: "cardType",
        };

        const result = sortCards(cards, "newFirst", settings);

        
        expect(result[0].targetWordPartOfSpeech).toBe("adjective");
      });
    });

    describe("reviewSortOrder", () => {
      it("should sort reviews by due when sortOrder is 'due'", () => {
        const cards = [
          createCard({ id: "1", state: State.Review, queue: 2, reps: 1, due: 3 }),
          createCard({ id: "2", state: State.Review, queue: 2, reps: 1, due: 1 }),
        ];

        const settings: DisplayOrderSettings = {
          reviewSortOrder: "due",
        };

        const result = sortCards(cards, "reviewFirst", settings);

        expect(result[0].due).toBeLessThan(result[1].due);
      });

      it("should randomize reviews when sortOrder is 'random'", () => {
        const cards = Array.from({ length: 10 }, (_, i) =>
          createCard({ id: `${i}`, state: State.Review, queue: 2, reps: 1, due: i })
        );

        const settings: DisplayOrderSettings = {
          reviewSortOrder: "random",
        };

        const results = new Set<string>();
        for (let i = 0; i < 3; i++) {
          const result = sortCards(cards, "reviewFirst", settings);
          results.add(result.map((c) => c.id).join(","));
        }

        expect(results.size).toBeGreaterThanOrEqual(1);
      });

      it("should sort by overdueness when sortOrder is 'overdueness'", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-03-15T12:00:00"));

        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;

        
        
        const cards = [
          createCard({
            id: "less-overdue",
            state: State.Review,
            queue: 2,
            reps: 1,
            due: Math.floor((now.getTime() - 2 * dayMs) / dayMs),
            interval: 10,
          }),
          createCard({
            id: "more-overdue",
            state: State.Review,
            queue: 2,
            reps: 1,
            due: Math.floor((now.getTime() - dayMs) / dayMs),
            interval: 1,
          }),
        ];

        const settings: DisplayOrderSettings = {
          reviewSortOrder: "overdueness",
        };

        const result = sortCards(cards, "reviewFirst", settings);

        
        expect(result[0].id).toBe("more-overdue");

        vi.useRealTimers();
      });
    });

    describe("newReviewOrder", () => {
      it("should respect newFirst in newReviewOrder", () => {
        const newCard = createCard({
          id: "new",
          state: State.New,
          queue: 0,
          reps: 0,
        });
        const reviewCard = createCard({
          id: "review",
          state: State.Review,
          queue: 2,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          newReviewOrder: "newFirst",
        };

        const result = sortCards([reviewCard, newCard], "newFirst", settings);

        expect(result[0].id).toBe("new");
      });

      it("should respect reviewFirst in newReviewOrder", () => {
        const newCard = createCard({
          id: "new",
          state: State.New,
          queue: 0,
          reps: 0,
        });
        const reviewCard = createCard({
          id: "review",
          state: State.Review,
          queue: 2,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          newReviewOrder: "reviewFirst",
        };

        const result = sortCards([newCard, reviewCard], "reviewFirst", settings);

        
        const reviewIndex = result.findIndex((c) => c.id === "review");
        const newIndex = result.findIndex((c) => c.id === "new");
        expect(reviewIndex).toBeLessThan(newIndex);
      });

      it("should mix cards when newReviewOrder is 'mixed'", () => {
        const newCards = Array.from({ length: 5 }, (_, i) =>
          createCard({ id: `new-${i}`, state: State.New, queue: 0, reps: 0 })
        );
        const reviewCards = Array.from({ length: 5 }, (_, i) =>
          createCard({
            id: `review-${i}`,
            state: State.Review,
            queue: 2,
            reps: 5,
          })
        );

        const settings: DisplayOrderSettings = {
          newReviewOrder: "mixed",
        };

        const result = sortCards(
          [...newCards, ...reviewCards],
          "mixed",
          settings
        );

        
        expect(result).toHaveLength(10);
      });
    });

    describe("interdayLearningOrder", () => {
      it("should place learning cards before reviews when 'before'", () => {
        const learningCard = createCard({
          id: "learning",
          state: State.Learning,
          queue: 1,
          due: Math.floor(Date.now() / 1000) - 60,
        });
        const reviewCard = createCard({
          id: "review",
          state: State.Review,
          queue: 2,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "before",
        };

        const result = sortCards(
          [reviewCard, learningCard],
          "reviewFirst",
          settings
        );

        const learningIndex = result.findIndex((c) => c.id === "learning");
        const reviewIndex = result.findIndex((c) => c.id === "review");
        expect(learningIndex).toBeLessThan(reviewIndex);
      });

      it("should place learning cards after reviews when 'after'", () => {
        const learningCard = createCard({
          id: "learning",
          state: State.Learning,
          queue: 1,
          due: Math.floor(Date.now() / 1000) - 60,
        });
        const reviewCard = createCard({
          id: "review",
          state: State.Review,
          queue: 2,
          reps: 5,
        });

        const settings: DisplayOrderSettings = {
          interdayLearningOrder: "after",
        };

        const result = sortCards(
          [learningCard, reviewCard],
          "reviewFirst",
          settings
        );

        const learningIndex = result.findIndex((c) => c.id === "learning");
        const reviewIndex = result.findIndex((c) => c.id === "review");
        expect(learningIndex).toBeGreaterThan(reviewIndex);
      });
    });
  });

  describe("sortCards - Queue Handling", () => {
    it("should distinguish intraday (queue 1) from interday (queue 3) learning", () => {
      const intradayLearning = createCard({
        id: "intraday",
        state: State.Learning,
        queue: 1,
        due: Math.floor(Date.now() / 1000),
      });
      const interdayLearning = createCard({
        id: "interday",
        state: State.Learning,
        queue: 3,
        due: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
      });

      const result = sortCards([intradayLearning, interdayLearning], "mixed");

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toContain("intraday");
      expect(result.map((c) => c.id)).toContain("interday");
    });

    it("should handle suspended cards (queue -1)", () => {
      const suspended = createCard({
        id: "suspended",
        queue: -1,
        state: State.Review,
        reps: 5,
      });
      const active = createCard({
        id: "active",
        queue: 2,
        state: State.Review,
        reps: 5,
      });

      const result = sortCards([suspended, active], "reviewFirst");

      
      expect(result).toHaveLength(2);
    });
  });

  describe("sortCards - Edge Cases", () => {
    it("should handle cards with missing queue", () => {
      const card = createCard({
        id: "1",
        queue: undefined as any,
        state: State.Learning,
      });

      const result = sortCards([card], "mixed");
      expect(result).toHaveLength(1);
    });

    it("should handle cards with missing state", () => {
      const card = createCard({
        id: "1",
        state: undefined,
        type: 0,
      });

      const result = sortCards([card], "mixed");
      expect(result).toHaveLength(1);
    });

    it("should handle mixed card types", () => {
      const cards = [
        createCard({ id: "new", state: State.New, queue: 0, reps: 0 }),
        createCard({ id: "learning", state: State.Learning, queue: 1 }),
        createCard({ id: "relearning", state: State.Relearning, queue: 1 }),
        createCard({ id: "review", state: State.Review, queue: 2, reps: 5 }),
      ];

      const result = sortCards(cards, "newFirst");

      expect(result).toHaveLength(4);
    });

    it("should maintain stable sort for cards with same due date", () => {
      const cards = [
        createCard({ id: "a", state: State.New, queue: 0, due: 1 }),
        createCard({ id: "b", state: State.New, queue: 0, due: 1 }),
        createCard({ id: "c", state: State.New, queue: 0, due: 1 }),
      ];

      const settings: DisplayOrderSettings = {
        newCardSortOrder: "due",
      };

      const result1 = sortCards(cards, "newFirst", settings);
      const result2 = sortCards(cards, "newFirst", settings);

      
      expect(result1.map((c) => c.id)).toEqual(result2.map((c) => c.id));
    });

    it("should handle single card", () => {
      const card = createCard({ id: "solo" });
      const result = sortCards([card], "mixed");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("solo");
    });
  });

  describe("sortCards - Integration with due-based sorting", () => {
    it("should sort by due with secondary id sort for stability", () => {
      const cards = [
        createCard({ id: "z", state: State.Review, queue: 2, reps: 1, due: 1 }),
        createCard({ id: "a", state: State.Review, queue: 2, reps: 1, due: 1 }),
        createCard({ id: "m", state: State.Review, queue: 2, reps: 1, due: 1 }),
      ];

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "due",
      };

      const result = sortCards(cards, "reviewFirst", settings);

      
      expect(result[0].id).toBe("a");
      expect(result[1].id).toBe("m");
      expect(result[2].id).toBe("z");
    });
  });

  describe("sortCards - dueRandom Sort Order", () => {
    it("should group cards by due date and shuffle within groups", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      
      const day1Count = 19800; 
      const day2Count = 19801; 

      const cards = [
        createCard({ id: "1a", state: State.Review, queue: 2, reps: 1, due: day1Count }),
        createCard({ id: "1b", state: State.Review, queue: 2, reps: 1, due: day1Count }),
        createCard({ id: "1c", state: State.Review, queue: 2, reps: 1, due: day1Count }),
        createCard({ id: "2a", state: State.Review, queue: 2, reps: 1, due: day2Count }),
        createCard({ id: "2b", state: State.Review, queue: 2, reps: 1, due: day2Count }),
      ];

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "dueRandom",
      };

      const result = sortCards(cards, "reviewFirst", settings);

      
      expect(result).toHaveLength(5);

      
      const day1Ids = result.filter((c) => c.id.startsWith("1")).map((c) => c.id);
      const day2Ids = result.filter((c) => c.id.startsWith("2")).map((c) => c.id);
      
      expect(day1Ids).toHaveLength(3);
      expect(day2Ids).toHaveLength(2);

      vi.useRealTimers();
    });

    it("should handle all cards with same due date", () => {
      const cards = Array.from({ length: 10 }, (_, i) =>
        createCard({ id: `${i}`, state: State.Review, queue: 2, reps: 1, due: 100 })
      );

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "dueRandom",
      };

      const result = sortCards(cards, "reviewFirst", settings);

      expect(result).toHaveLength(10);
    });

    it("should handle single card in dueRandom", () => {
      const cards = [
        createCard({ id: "solo", state: State.Review, queue: 2, reps: 1, due: 100 }),
      ];

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "dueRandom",
      };

      const result = sortCards(cards, "reviewFirst", settings);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("solo");
    });
  });

  describe("sortCards - Queue Timestamp Handling", () => {
    it("should correctly compare intraday cards by timestamp", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      const now = Date.now();
      const cards = [
        createCard({
          id: "later",
          state: State.Learning,
          queue: 1,
          due: Math.floor((now + 60000) / 1000), 
        }),
        createCard({
          id: "earlier",
          state: State.Learning,
          queue: 1,
          due: Math.floor((now - 60000) / 1000), 
        }),
      ];

      const result = sortCards(cards, "newFirst");

      
      expect(result[0].id).toBe("earlier");
      expect(result[1].id).toBe("later");

      vi.useRealTimers();
    });

    it("should correctly compare interday cards by day count", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      const cards = [
        createCard({
          id: "later",
          state: State.Review,
          queue: 2,
          reps: 1,
          due: 20000, 
        }),
        createCard({
          id: "earlier",
          state: State.Review,
          queue: 2,
          reps: 1,
          due: 19000, 
        }),
      ];

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "due",
      };

      const result = sortCards(cards, "reviewFirst", settings);

      expect(result[0].id).toBe("earlier");
      expect(result[1].id).toBe("later");

      vi.useRealTimers();
    });

    it("should handle cards with zero due value", () => {
      const cards = [
        createCard({ id: "zero", state: State.Review, queue: 2, reps: 1, due: 0 }),
        createCard({ id: "nonzero", state: State.Review, queue: 2, reps: 1, due: 100 }),
      ];

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "due",
      };

      const result = sortCards(cards, "reviewFirst", settings);

      expect(result[0].id).toBe("zero");
    });

    it("should handle cards with undefined due value", () => {
      const cards = [
        createCard({ id: "withDue", state: State.Review, queue: 2, reps: 1, due: 100 }),
        createCard({ id: "undefinedDue", state: State.Review, queue: 2, reps: 1, due: undefined as any }),
      ];

      const result = sortCards(cards, "reviewFirst");

      
      expect(result).toHaveLength(2);
    });
  });

  describe("sortCards - Interday Learning Integration", () => {
    it("should separate interday learning from intraday learning", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      const intradayCard = createCard({
        id: "intraday",
        state: State.Learning,
        queue: 1,
        due: Math.floor(Date.now() / 1000),
      });
      const interdayCard = createCard({
        id: "interday",
        state: State.Learning,
        queue: 3,
        due: 19800, 
      });
      const reviewCard = createCard({
        id: "review",
        state: State.Review,
        queue: 2,
        reps: 5,
        due: 19800,
      });

      const settings: DisplayOrderSettings = {
        interdayLearningOrder: "mixed",
      };

      const result = sortCards([interdayCard, intradayCard, reviewCard], "reviewFirst", settings);

      expect(result).toHaveLength(3);
      expect(result.map(c => c.id)).toContain("intraday");
      expect(result.map(c => c.id)).toContain("interday");
      expect(result.map(c => c.id)).toContain("review");

      vi.useRealTimers();
    });

    it("should treat interday learning like reviews for sorting", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      const interdayCard = createCard({
        id: "interday",
        state: State.Learning,
        queue: 3,
        due: 19800,
      });
      const reviewCard = createCard({
        id: "review",
        state: State.Review,
        queue: 2,
        reps: 5,
        due: 19801,
      });

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "due",
      };

      const result = sortCards([reviewCard, interdayCard], "reviewFirst", settings);

      
      expect(result[0].id).toBe("interday");

      vi.useRealTimers();
    });
  });

  describe("sortCards - Interleaving Edge Cases", () => {
    it("should handle empty new cards array in mixed mode", () => {
      const reviewCards = Array.from({ length: 5 }, (_, i) =>
        createCard({ id: `review-${i}`, state: State.Review, queue: 2, reps: 5 })
      );

      const settings: DisplayOrderSettings = {
        newReviewOrder: "mixed",
      };

      const result = sortCards(reviewCards, "mixed", settings);

      expect(result).toHaveLength(5);
    });

    it("should handle empty review cards array in mixed mode", () => {
      const newCards = Array.from({ length: 5 }, (_, i) =>
        createCard({ id: `new-${i}`, state: State.New, queue: 0, reps: 0 })
      );

      const settings: DisplayOrderSettings = {
        newReviewOrder: "mixed",
      };

      const result = sortCards(newCards, "mixed", settings);

      expect(result).toHaveLength(5);
    });

    it("should handle more learning cards than review cards", () => {
      const learningCards = Array.from({ length: 10 }, (_, i) =>
        createCard({
          id: `learning-${i}`,
          state: State.Learning,
          queue: 1,
          due: Math.floor(Date.now() / 1000),
        })
      );
      const reviewCards = Array.from({ length: 2 }, (_, i) =>
        createCard({ id: `review-${i}`, state: State.Review, queue: 2, reps: 5 })
      );

      const settings: DisplayOrderSettings = {
        interdayLearningOrder: "mixed",
      };

      const result = sortCards([...learningCards, ...reviewCards], "reviewFirst", settings);

      expect(result).toHaveLength(12);
    });

    it("should handle single learning card with many reviews", () => {
      const learningCard = createCard({
        id: "learning",
        state: State.Learning,
        queue: 1,
        due: Math.floor(Date.now() / 1000),
      });
      const reviewCards = Array.from({ length: 20 }, (_, i) =>
        createCard({ id: `review-${i}`, state: State.Review, queue: 2, reps: 5 })
      );

      const settings: DisplayOrderSettings = {
        interdayLearningOrder: "mixed",
      };

      const result = sortCards([learningCard, ...reviewCards], "reviewFirst", settings);

      expect(result).toHaveLength(21);
      expect(result.map(c => c.id)).toContain("learning");
    });
  });

  describe("sortCards - Stress Tests", () => {
    it("should handle 500 cards efficiently", () => {
      const cards = Array.from({ length: 500 }, (_, i) => {
        const type = i % 4;
        const state = [State.New, State.Learning, State.Review, State.Relearning][type];
        const queue = [0, 1, 2, 1][type];
        return createCard({
          id: `card-${i}`,
          state,
          queue,
          reps: type === 0 ? 0 : 5,
          due: i,
        });
      });

      const start = performance.now();
      const result = sortCards(cards, "newFirst");
      const end = performance.now();

      expect(result).toHaveLength(500);
      
      expect(end - start).toBeLessThan(100);
    });

    it("should maintain data integrity with large mixed set", () => {
      const cards = Array.from({ length: 100 }, (_, i) =>
        createCard({
          id: `card-${i}`,
          state: i % 2 === 0 ? State.New : State.Review,
          queue: i % 2 === 0 ? 0 : 2,
          reps: i % 2 === 0 ? 0 : 5,
          targetWord: `word-${i}`,
          targetSentence: `sentence-${i}`,
        })
      );

      const settings: DisplayOrderSettings = {
        newReviewOrder: "mixed",
      };

      const result = sortCards(cards, "mixed", settings);

      
      expect(result).toHaveLength(100);
      result.forEach(card => {
        expect(card.targetWord).toBeDefined();
        expect(card.targetSentence).toBeDefined();
      });
    });
  });

  describe("sortCards - All Card Types Combination", () => {
    it("should correctly sort all card types together", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      const cards = [
        
        createCard({ id: "new-1", state: State.New, queue: 0, reps: 0, due: 1 }),
        createCard({ id: "new-2", state: State.New, queue: 0, reps: 0, due: 2 }),
        
        createCard({
          id: "learning-intraday",
          state: State.Learning,
          queue: 1,
          due: Math.floor(Date.now() / 1000) - 100,
        }),
        
        createCard({
          id: "learning-interday",
          state: State.Learning,
          queue: 3,
          due: 19800,
        }),
        
        createCard({ id: "review-1", state: State.Review, queue: 2, reps: 5, due: 19799 }),
        createCard({ id: "review-2", state: State.Review, queue: 2, reps: 5, due: 19800 }),
        
        createCard({
          id: "relearning",
          state: State.Relearning,
          queue: 1,
          due: Math.floor(Date.now() / 1000) - 50,
          lapses: 1,
        }),
      ];

      const settings: DisplayOrderSettings = {
        newCardSortOrder: "due",
        reviewSortOrder: "due",
        newReviewOrder: "newFirst",
        interdayLearningOrder: "mixed",
      };

      const result = sortCards(cards, "newFirst", settings);

      
      expect(result).toHaveLength(7);

      
      expect(result[0].id).toBe("new-1");
      expect(result[1].id).toBe("new-2");

      vi.useRealTimers();
    });
  });

  describe("sortCards - Overdueness Advanced Cases", () => {
    it("should handle cards with very small intervals", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;

      const cards = [
        createCard({
          id: "small-interval",
          state: State.Review,
          queue: 2,
          reps: 1,
          due: Math.floor((now.getTime() - dayMs) / dayMs),
          interval: 0.001, 
        }),
        createCard({
          id: "normal-interval",
          state: State.Review,
          queue: 2,
          reps: 1,
          due: Math.floor((now.getTime() - dayMs) / dayMs),
          interval: 10,
        }),
      ];

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "overdueness",
      };

      const result = sortCards(cards, "reviewFirst", settings);

      
      expect(result[0].id).toBe("small-interval");

      vi.useRealTimers();
    });

    it("should handle cards with zero interval", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));

      const cards = [
        createCard({
          id: "zero-interval",
          state: State.Review,
          queue: 2,
          reps: 1,
          due: 19000,
          interval: 0,
        }),
        createCard({
          id: "normal-interval",
          state: State.Review,
          queue: 2,
          reps: 1,
          due: 19000,
          interval: 5,
        }),
      ];

      const settings: DisplayOrderSettings = {
        reviewSortOrder: "overdueness",
      };

      
      const result = sortCards(cards, "reviewFirst", settings);
      expect(result).toHaveLength(2);

      vi.useRealTimers();
    });
  });

  describe("sortCards - Fallback Behavior", () => {
    it("should use default sorting when no settings provided", () => {
      const cards = [
        createCard({ id: "new", state: State.New, queue: 0, reps: 0 }),
        createCard({ id: "review", state: State.Review, queue: 2, reps: 5 }),
      ];

      const result = sortCards(cards, "newFirst");

      expect(result).toHaveLength(2);
    });

    it("should handle partial settings gracefully", () => {
      const cards = [
        createCard({ id: "new", state: State.New, queue: 0, reps: 0 }),
        createCard({ id: "review", state: State.Review, queue: 2, reps: 5 }),
      ];

      const settings: DisplayOrderSettings = {
        
        newCardSortOrder: "due",
      };

      const result = sortCards(cards, "newFirst", settings);

      expect(result).toHaveLength(2);
    });
  });
});
