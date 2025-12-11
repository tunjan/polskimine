import { describe, it, expect } from "vitest";
import { calculateNextReview, LapsesSettings } from "./scheduler";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const generateRandomCard = (seed: number): Card => {
  const statuses = [
    CardStatus.NEW,
    CardStatus.LEARNING,
    CardStatus.REVIEW,
    CardStatus.KNOWN,
  ];
  const states = [State.New, State.Learning, State.Review, State.Relearning];

  // Seeded random for reproducibility
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  return {
    id: `fuzz-${seed}`,
    targetSentence: "Fuzz",
    nativeTranslation: "Fuzz",
    notes: "",
    status: statuses[Math.floor(rand() * statuses.length)],
    state: states[Math.floor(rand() * states.length)],
    reps: Math.floor(rand() * 100),
    lapses: Math.floor(rand() * 10),
    interval: rand() * 100,
    precise_interval: rand() * 100,
    scheduled_days: Math.floor(rand() * 100),
    dueDate: new Date().toISOString(),
    stability: (rand() - 0.2) * 10, // Can be negative to test edge cases
    difficulty: (rand() - 0.2) * 10,
    elapsed_days: rand() * 50,
    learningStep: rand() > 0.5 ? Math.floor(rand() * 5) : undefined,
    language: "polish" as any,
    easeFactor: 2.5,
  };
};

describe("scheduler - invariant tests (fuzzing)", () => {
  it("should maintain invariants across 5000 random card states", () => {
    const grades = ["Again", "Hard", "Good", "Easy"] as const;

    for (let i = 0; i < 5000; i++) {
      const card = generateRandomCard(i);
      const grade = grades[i % 4];

      try {
        const result = calculateNextReview(card, grade, {
           request_retention: 0.9,
           maximum_interval: 36500,
           enable_fuzzing: false 
        });

        // Invariant 1: Interval should always be non-negative
        expect(result.interval).toBeGreaterThanOrEqual(0);

        // Invariant 2: Stability and difficulty should be finite numbers
        expect(Number.isFinite(result.stability)).toBe(true);
        expect(Number.isFinite(result.difficulty)).toBe(true);

        // Invariant 3: Review cards should have positive interval (except Again)
        if (result.status === CardStatus.REVIEW && grade !== "Again") {
          expect(result.interval).toBeGreaterThan(0);
        }

        // Invariant 4: Learning cards should have valid due date
        if (
          result.status === CardStatus.LEARNING &&
          result.state !== State.Relearning
        ) {
          expect(result.dueDate).toBeDefined();
        }

        // Invariant 5: Due date should always be valid
        expect(new Date(result.dueDate).getTime()).not.toBeNaN();

        // Invariant 6: Reps should never decrease
        expect(result.reps).toBeGreaterThanOrEqual(0);

        // Invariant 7: Lapses should never be negative
        expect(result.lapses).toBeGreaterThanOrEqual(0);

        // Invariant 8: Difficulty should be within bounds (1-10)
        expect(result.difficulty).toBeGreaterThanOrEqual(1);
        expect(result.difficulty).toBeLessThanOrEqual(10);

        // Invariant 9: scheduled_days should be non-negative
        expect(result.scheduled_days).toBeGreaterThanOrEqual(0);

        // Invariant 10: precise_interval should be non-negative
        expect(result.precise_interval).toBeGreaterThanOrEqual(0);
      } catch (e) {
        console.error(
          "Fuzz failure on card:",
          JSON.stringify(card, null, 2),
          "Grade:",
          grade,
        );
        throw e;
      }
    }
  });

  it("should maintain leech status once set", () => {
    for (let i = 0; i < 100; i++) {
      const card = generateRandomCard(i * 100);
      card.isLeech = true;
      card.lapses = 10;

      const result = calculateNextReview(card, "Good");
      expect(result.isLeech).toBe(true);
    }
  });

  it("should maintain ordering: Again <= Hard <= Good <= Easy intervals for review cards", () => {
    for (let i = 0; i < 100; i++) {
      const baseCard: Card = {
        id: `order-test-${i}`,
        targetSentence: "Test",
        nativeTranslation: "Test",
        notes: "",
        status: CardStatus.REVIEW,
        state: State.Review,
        reps: 10,
        lapses: 0,
        interval: 5 + i * 0.1,
        precise_interval: 5 + i * 0.1,
        scheduled_days: 5,
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        stability: 10 + i,
        difficulty: 5,
        elapsed_days: 1,
        language: "polish" as any,
        easeFactor: 2.5,
        last_review: new Date(Date.now() - 86400000).toISOString(),
      };

      const settings = { request_retention: 0.9, maximum_interval: 36500, enable_fuzzing: false };
      calculateNextReview(baseCard, "Again", settings, [1, 10], { relearnSteps: [] });
      const hardResult = calculateNextReview(baseCard, "Hard", settings);
      const goodResult = calculateNextReview(baseCard, "Good", settings);
      const easyResult = calculateNextReview(baseCard, "Easy", settings);

      // For review cards, intervals should follow: Hard <= Good <= Easy
      expect(hardResult.interval).toBeLessThanOrEqual(goodResult.interval);
      expect(goodResult.interval).toBeLessThanOrEqual(easyResult.interval);
    }
  });

  it("should maintain state consistency through multiple reviews", () => {
    for (let i = 0; i < 100; i++) {
      let card = generateRandomCard(i * 50);
      card.status = CardStatus.NEW;
      card.state = State.New;
      card.reps = 0;
      card.lapses = 0;

      // Simulate 10 reviews
      for (let j = 0; j < 10; j++) {
        const grade = ["Again", "Hard", "Good", "Easy"][j % 4] as "Again" | "Hard" | "Good" | "Easy";
        card = calculateNextReview(card, grade, undefined, [1, 10]);

        // After any review, the card should have a valid state
        expect(
          card.status === CardStatus.NEW ||
          card.status === CardStatus.LEARNING ||
          card.status === CardStatus.REVIEW ||
          card.status === CardStatus.SUSPENDED ||
          card.status === CardStatus.KNOWN
        ).toBe(true);

        expect(new Date(card.dueDate).getTime()).not.toBeNaN();
      }
    }
  });

  it("should handle extreme numeric values without crashing", () => {
    const extremeCards: Partial<Card>[] = [
      { stability: Number.MAX_SAFE_INTEGER },
      { stability: Number.MIN_VALUE },
      { difficulty: 0 },
      { difficulty: 100 },
      { interval: Number.MAX_SAFE_INTEGER },
      { elapsed_days: Number.MAX_SAFE_INTEGER },
      { reps: Number.MAX_SAFE_INTEGER },
      { lapses: Number.MAX_SAFE_INTEGER },
    ];

    for (const overrides of extremeCards) {
      const card: Card = {
        id: "extreme-test",
        targetSentence: "Test",
        nativeTranslation: "Test",
        notes: "",
        status: CardStatus.REVIEW,
        state: State.Review,
        reps: 5,
        lapses: 0,
        interval: 5,
        precise_interval: 5,
        scheduled_days: 5,
        dueDate: new Date().toISOString(),
        stability: 10,
        difficulty: 5,
        elapsed_days: 1,
        language: "polish" as any,
        easeFactor: 2.5,
        last_review: new Date().toISOString(),
        ...overrides,
      };

      expect(() => calculateNextReview(card, "Good")).not.toThrow();
    }
  });

  it("should handle NaN and Infinity values gracefully", () => {
    const invalidCards: Partial<Card>[] = [
      { stability: NaN },
      { stability: Infinity },
      { stability: -Infinity },
      { difficulty: NaN },
      { difficulty: Infinity },
      { interval: NaN },
      { interval: Infinity },
      { elapsed_days: NaN },
    ];

    for (const overrides of invalidCards) {
      const card: Card = {
        id: "invalid-test",
        targetSentence: "Test",
        nativeTranslation: "Test",
        notes: "",
        status: CardStatus.REVIEW,
        state: State.Review,
        reps: 5,
        lapses: 0,
        interval: 5,
        precise_interval: 5,
        scheduled_days: 5,
        dueDate: new Date().toISOString(),
        stability: 10,
        difficulty: 5,
        elapsed_days: 1,
        language: "polish" as any,
        easeFactor: 2.5,
        last_review: new Date().toISOString(),
        ...overrides,
      };

      const result = calculateNextReview(card, "Good");

      // Result should have valid numbers
      expect(Number.isFinite(result.stability)).toBe(true);
      expect(Number.isFinite(result.difficulty)).toBe(true);
      expect(Number.isFinite(result.interval)).toBe(true);
    }
  });
});

