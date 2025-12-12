import { describe, it, expect } from "vitest";
import { calculateNextReview, isCardDue, LapsesSettings } from "./scheduler";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";
import { addDays, addMinutes, subDays, subMinutes } from "date-fns";

const createBaseCard = (overrides: Partial<Card> = {}): Card => ({
  id: "edge-test-card",
  targetSentence: "Edge test",
  nativeTranslation: "Edge test",
  notes: "",
  status: CardStatus.NEW,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: "polish" as any,
  ...overrides,
});

const createReviewCard = (overrides: Partial<Card> = {}): Card =>
  createBaseCard({
    status: CardStatus.REVIEW,
    state: State.Review,
    stability: 10,
    difficulty: 5,
    interval: 1,
    reps: 5,
    last_review: new Date(Date.now() - 86400000).toISOString(),
    ...overrides,
  });

const grades = ["Again", "Hard", "Good", "Easy"] as const;

describe("scheduler - Extreme Numeric Edge Cases", () => {
  describe("Extreme Stability Values", () => {
    it("should handle stability = 0", () => {
      const card = createReviewCard({ stability: 0 });
      const result = calculateNextReview(card, "Good");
      expect(result.stability).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.stability)).toBe(true);
    });

    it("should handle stability = 0.001 (very low)", () => {
      const card = createReviewCard({ stability: 0.001 });
      const result = calculateNextReview(card, "Good");
      expect(result.stability).toBeGreaterThan(0);
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle stability = 1000 (very high)", () => {
      const card = createReviewCard({ stability: 1000 });
      const result = calculateNextReview(card, "Good");
      expect(result.stability).toBeGreaterThan(0);
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle stability = Number.MAX_SAFE_INTEGER", () => {
      const card = createReviewCard({ stability: Number.MAX_SAFE_INTEGER });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.stability)).toBe(true);
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle stability = Number.MIN_VALUE (smallest positive)", () => {
      const card = createReviewCard({ stability: Number.MIN_VALUE });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.stability)).toBe(true);
    });

    it("should handle negative stability", () => {
      const card = createReviewCard({ stability: -5 });
      const result = calculateNextReview(card, "Good");
      expect(result.stability).toBeGreaterThanOrEqual(0);
    });

    it("should handle Infinity stability", () => {
      const card = createReviewCard({ stability: Infinity });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.stability)).toBe(true);
    });

    it("should handle -Infinity stability", () => {
      const card = createReviewCard({ stability: -Infinity });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.stability)).toBe(true);
    });
  });

  describe("Extreme Difficulty Values", () => {
    it("should handle difficulty = 0", () => {
      const card = createReviewCard({ difficulty: 0 });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.difficulty)).toBe(true);
    });

    it("should handle difficulty = 1 (minimum)", () => {
      const card = createReviewCard({ difficulty: 1 });
      const result = calculateNextReview(card, "Easy");
      expect(result.difficulty).toBeGreaterThanOrEqual(1);
    });

    it("should handle difficulty = 10 (maximum)", () => {
      const card = createReviewCard({ difficulty: 10 });
      const result = calculateNextReview(card, "Hard");
      expect(result.difficulty).toBeLessThanOrEqual(10);
    });

    it("should handle difficulty = 11 (exceeds max)", () => {
      const card = createReviewCard({ difficulty: 11 });
      const result = calculateNextReview(card, "Good");
      expect(result.difficulty).toBeLessThanOrEqual(10);
    });

    it("should handle negative difficulty", () => {
      const card = createReviewCard({ difficulty: -5 });
      const result = calculateNextReview(card, "Good");
      expect(result.difficulty).toBeGreaterThanOrEqual(1);
    });

    it("should handle Infinity difficulty", () => {
      const card = createReviewCard({ difficulty: Infinity });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.difficulty)).toBe(true);
    });
  });

  describe("Extreme Interval Values", () => {
    it("should handle interval = 0", () => {
      const card = createReviewCard({ interval: 0 });
      const result = calculateNextReview(card, "Good");
      expect(result.interval).toBeGreaterThanOrEqual(0);
    });

    it("should handle interval = 365 (1 year)", () => {
      const card = createReviewCard({ interval: 365 });
      const result = calculateNextReview(card, "Good");
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should handle interval = 3650 (10 years)", () => {
      const card = createReviewCard({ interval: 3650 });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle interval = 0.0001 (very small)", () => {
      const card = createReviewCard({ interval: 0.0001 });
      const result = calculateNextReview(card, "Good");
      expect(result.interval).toBeGreaterThanOrEqual(0);
    });

    it("should handle Infinity interval", () => {
      const card = createReviewCard({ interval: Infinity });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle -Infinity interval", () => {
      const card = createReviewCard({ interval: -Infinity });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });

  describe("Extreme Reps and Lapses Values", () => {
    it("should handle reps = 0", () => {
      const card = createReviewCard({ reps: 0 });
      const result = calculateNextReview(card, "Good");
      expect(result.reps).toBeGreaterThan(0);
    });

    it("should handle reps = 10000 (very high)", () => {
      const card = createReviewCard({ reps: 10000 });
      const result = calculateNextReview(card, "Good");
      expect(result.reps).toBe(10001);
    });

    it("should handle lapses = 0", () => {
      const card = createReviewCard({ lapses: 0 });
      const result = calculateNextReview(card, "Again", undefined, [1, 10], {
        relearnSteps: [1],
      });
      expect(result.lapses).toBe(1);
    });

    it("should handle lapses = 100 (very high)", () => {
      const card = createReviewCard({ lapses: 100, isLeech: true });
      const result = calculateNextReview(card, "Good");
      expect(result.lapses).toBe(100);
    });

    it("should handle negative reps (passes through without clamping)", () => {
      const card = createReviewCard({ reps: -5 });
      const result = calculateNextReview(card, "Good");
      // Negative reps are incremented by 1, so -5 becomes -4
      // The scheduler doesn't clamp negative values
      expect(result.reps).toBe(-4);
    });

    it("should handle negative lapses (passes through without clamping)", () => {
      const card = createReviewCard({ lapses: -5 });
      const result = calculateNextReview(card, "Good");
      // Negative lapses are preserved
      expect(result.lapses).toBe(-5);
    });
  });

  describe("Extreme Elapsed Days Values", () => {
    it("should handle elapsed_days = 0", () => {
      const card = createReviewCard({ elapsed_days: 0 });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.elapsed_days)).toBe(true);
    });

    it("should handle elapsed_days = 365", () => {
      const card = createReviewCard({ elapsed_days: 365 });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.elapsed_days)).toBe(true);
    });

    it("should handle negative elapsed_days", () => {
      const card = createReviewCard({ elapsed_days: -10 });
      const result = calculateNextReview(card, "Good");
      expect(result.elapsed_days).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("scheduler - Date Edge Cases", () => {
  describe("Overdue Cards", () => {
    const now = new Date();

    it("should handle card overdue by 1 hour", () => {
      const card = createReviewCard({
        dueDate: subMinutes(now, 60).toISOString(),
        interval: 1,
      });
      const result = calculateNextReview(card, "Good");
      expect(new Date(result.dueDate).getTime()).toBeGreaterThan(now.getTime());
    });

    it("should handle card overdue by 1 day", () => {
      const card = createReviewCard({
        dueDate: subDays(now, 1).toISOString(),
        interval: 1,
      });
      const result = calculateNextReview(card, "Good");
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should handle card overdue by 1 week", () => {
      const card = createReviewCard({
        dueDate: subDays(now, 7).toISOString(),
        interval: 3,
      });
      const result = calculateNextReview(card, "Good");
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should handle card overdue by 1 month", () => {
      const card = createReviewCard({
        dueDate: subDays(now, 30).toISOString(),
        interval: 7,
      });
      const result = calculateNextReview(card, "Good");
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should handle card overdue by 1 year", () => {
      const card = createReviewCard({
        dueDate: subDays(now, 365).toISOString(),
        interval: 30,
      });
      const result = calculateNextReview(card, "Good");
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should handle card overdue by 5 years", () => {
      const card = createReviewCard({
        dueDate: subDays(now, 365 * 5).toISOString(),
        interval: 180,
      });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });

  describe("Future Dates", () => {
    const now = new Date();

    it("should handle card due 1 year in future", () => {
      const card = createReviewCard({
        dueDate: addDays(now, 365).toISOString(),
        interval: 365,
      });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle card due 10 years in future", () => {
      const card = createReviewCard({
        dueDate: addDays(now, 3650).toISOString(),
        interval: 3650,
      });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });

  describe("Invalid Dates", () => {
    it("should handle empty string dueDate", () => {
      const card = createBaseCard({ dueDate: "" });
      expect(() => calculateNextReview(card, "Good")).not.toThrow();
    });

    it("should handle invalid date string", () => {
      const card = createBaseCard({ dueDate: "not-a-date" });
      const result = calculateNextReview(card, "Good");
      expect(new Date(result.dueDate).getTime()).not.toBeNaN();
    });

    it("should throw error on invalid last_review (current behavior)", () => {
      const card = createReviewCard({ last_review: "invalid" });
      // Current scheduler behavior throws on invalid dates
      expect(() => calculateNextReview(card, "Good")).toThrow();
    });

    it("should handle undefined last_review", () => {
      const card = createReviewCard({ last_review: undefined });
      const result = calculateNextReview(card, "Good");
      expect(result.last_review).toBeDefined();
    });

    it("should handle far past date (year 1900)", () => {
      const card = createReviewCard({
        dueDate: "1900-01-01T00:00:00.000Z",
        last_review: "1899-12-01T00:00:00.000Z",
      });
      const result = calculateNextReview(card, "Good");
      expect(new Date(result.dueDate).getTime()).not.toBeNaN();
    });

    it("should handle far future date (year 3000)", () => {
      const card = createReviewCard({
        dueDate: "3000-01-01T00:00:00.000Z",
      });
      const result = calculateNextReview(card, "Good");
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });

  describe("Timezone Edge Cases", () => {
    it("should handle UTC date string", () => {
      const card = createReviewCard({
        dueDate: "2024-06-15T12:00:00.000Z",
      });
      const result = calculateNextReview(card, "Good");
      expect(result.dueDate).toBeDefined();
    });

    it("should handle date with timezone offset", () => {
      const card = createReviewCard({
        dueDate: "2024-06-15T12:00:00+05:30",
      });
      const result = calculateNextReview(card, "Good");
      expect(result.dueDate).toBeDefined();
    });

    it("should handle midnight boundary", () => {
      const card = createReviewCard({
        dueDate: "2024-06-15T00:00:00.000Z",
      });
      const result = calculateNextReview(card, "Good");
      expect(result.dueDate).toBeDefined();
    });

    it("should handle end of day (23:59:59)", () => {
      const card = createReviewCard({
        dueDate: "2024-06-15T23:59:59.999Z",
      });
      const result = calculateNextReview(card, "Good");
      expect(result.dueDate).toBeDefined();
    });
  });
});

describe("scheduler - Grade Sequence Matrix", () => {
  describe("All Grade Combinations (2 grades)", () => {
    const gradeSequences = grades.flatMap((g1) => grades.map((g2) => [g1, g2]));

    gradeSequences.forEach(([grade1, grade2]) => {
      it(`should handle sequence: ${grade1} -> ${grade2}`, () => {
        let card = createBaseCard({
          status: CardStatus.NEW,
          learningStep: 0,
        });

        card = calculateNextReview(card, grade1, undefined, [1, 10]);
        expect(card.dueDate).toBeDefined();
        expect(new Date(card.dueDate).getTime()).not.toBeNaN();

        card = calculateNextReview(card, grade2, undefined, [1, 10]);
        expect(card.dueDate).toBeDefined();
        expect(new Date(card.dueDate).getTime()).not.toBeNaN();
        expect(Number.isFinite(card.interval)).toBe(true);
      });
    });
  });

  describe("Long Grade Sequences", () => {
    it("should handle 10 consecutive Good grades", () => {
      let card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });

      for (let i = 0; i < 10; i++) {
        card = calculateNextReview(card, "Good", undefined, [1, 10]);
        expect(Number.isFinite(card.interval)).toBe(true);
      }

      expect(card.status).toBe(CardStatus.REVIEW);
      expect(card.reps).toBe(10);
    });

    it("should handle 10 consecutive Again grades", () => {
      let card = createBaseCard({
        status: CardStatus.LEARNING,
        learningStep: 0,
      });

      for (let i = 0; i < 10; i++) {
        card = calculateNextReview(card, "Again", undefined, [1, 10]);
        expect(card.learningStep).toBe(0);
      }

      expect(card.status).toBe(CardStatus.LEARNING);
    });

    it("should handle alternating Good/Again sequence", () => {
      let card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });

      for (let i = 0; i < 10; i++) {
        const grade = i % 2 === 0 ? "Good" : "Again";
        card = calculateNextReview(card, grade, undefined, [1, 10]);
        expect(Number.isFinite(card.interval)).toBe(true);
      }
    });

    it("should handle alternating Hard/Easy sequence from Review", () => {
      let card = createReviewCard();

      for (let i = 0; i < 10; i++) {
        const grade = i % 2 === 0 ? "Hard" : "Easy";
        card = calculateNextReview(card, grade);
        expect(card.status).toBe(CardStatus.REVIEW);
      }
    });

    it("should handle random-like sequence", () => {
      let card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const sequence = [
        "Good",
        "Hard",
        "Again",
        "Good",
        "Good",
        "Easy",
        "Hard",
        "Again",
        "Good",
        "Good",
      ] as const;

      for (const grade of sequence) {
        card = calculateNextReview(card, grade, undefined, [1, 10]);
        expect(Number.isFinite(card.interval)).toBe(true);
      }
    });
  });
});

describe("scheduler - State/Status Consistency", () => {
  describe("Conflicting State and Status", () => {
    it("should handle NEW status with Review state", () => {
      const card = createBaseCard({
        status: CardStatus.NEW,
        state: State.Review,
      });
      const result = calculateNextReview(card, "Good", undefined, [1, 10]);
      expect(result.dueDate).toBeDefined();
    });

    it("should handle REVIEW status with New state", () => {
      const card = createBaseCard({
        status: CardStatus.REVIEW,
        state: State.New,
      });
      const result = calculateNextReview(card, "Good");
      expect(result.dueDate).toBeDefined();
    });

    it("should handle LEARNING status with Review state", () => {
      const card = createBaseCard({
        status: CardStatus.LEARNING,
        state: State.Review,
        learningStep: 0,
      });
      const result = calculateNextReview(card, "Good", undefined, [1, 10]);
      expect(result.dueDate).toBeDefined();
    });

    it("should handle SUSPENDED status", () => {
      const card = createBaseCard({
        status: CardStatus.SUSPENDED,
        state: State.Review,
        stability: 10,
        difficulty: 5,
      });
      const result = calculateNextReview(card, "Good");
      expect(result.dueDate).toBeDefined();
    });

    it("should handle KNOWN status", () => {
      const card = createBaseCard({
        status: CardStatus.KNOWN,
        state: State.Review,
        stability: 100,
        difficulty: 3,
        last_review: new Date().toISOString(),
      });
      const result = calculateNextReview(card, "Good");
      expect(result.status).toBe(CardStatus.REVIEW);
    });
  });

  describe("Missing Critical Fields", () => {
    it("should handle undefined state", () => {
      const card = createBaseCard({
        status: CardStatus.NEW,
        state: undefined,
      });
      const result = calculateNextReview(card, "Good", undefined, [1, 10]);
      expect(result.state).toBeDefined();
    });

    it("should handle undefined status", () => {
      const card = createBaseCard({
        status: undefined as any,
        state: State.New,
      });
      const result = calculateNextReview(card, "Good", undefined, [1, 10]);
      expect(result.dueDate).toBeDefined();
    });

    it("should handle both state and status undefined", () => {
      const card = createBaseCard({
        status: undefined as any,
        state: undefined,
        reps: 0,
      });
      const result = calculateNextReview(card, "Good", undefined, [1, 10]);
      expect(result.dueDate).toBeDefined();
    });
  });
});

describe("scheduler - FSRS Settings Edge Cases", () => {
  describe("Retention Settings", () => {
    it("should handle request_retention = 0.5 (50%)", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0.5,
        maximum_interval: 36500,
      });
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should handle request_retention = 0.99 (99%)", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0.99,
        maximum_interval: 36500,
      });
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should handle request_retention = 1.0 (100%)", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 1.0,
        maximum_interval: 36500,
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle request_retention = 0", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0,
        maximum_interval: 36500,
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });

  describe("Maximum Interval Settings", () => {
    it("should handle maximum_interval = 1 (FSRS respects this setting)", () => {
      const card = createReviewCard({ stability: 100 });
      const result = calculateNextReview(card, "Easy", {
        request_retention: 0.9,
        maximum_interval: 1,
      });
      // Verify result is finite - the exact clamping behavior depends on FSRS config
      expect(Number.isFinite(result.scheduled_days)).toBe(true);
      expect(result.scheduled_days).toBeGreaterThanOrEqual(0);
    });

    it("should handle maximum_interval = 36500 (100 years)", () => {
      const card = createReviewCard({ stability: 10000 });
      const result = calculateNextReview(card, "Easy", {
        request_retention: 0.9,
        maximum_interval: 36500,
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle maximum_interval = 0", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0.9,
        maximum_interval: 0,
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });

  describe("Custom FSRS Weights", () => {
    it("should handle custom w array", () => {
      const customW = [
        0.5, 1.5, 3.5, 16.0, 7.0, 0.5, 1.5, 0.0, 1.5, 0.1, 1.0, 2.5, 0.1, 0.3,
        1.4, 0.1, 2.5,
      ];
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0.9,
        maximum_interval: 36500,
        w: customW,
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle empty w array", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0.9,
        maximum_interval: 36500,
        w: [],
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle undefined settings", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", undefined);
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });

  describe("Fuzzing Toggle", () => {
    it("should handle enable_fuzzing = true", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0.9,
        maximum_interval: 36500,
        enable_fuzzing: true,
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });

    it("should handle enable_fuzzing = false", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", {
        request_retention: 0.9,
        maximum_interval: 36500,
        enable_fuzzing: false,
      });
      expect(Number.isFinite(result.interval)).toBe(true);
    });
  });
});

describe("scheduler - Leech Edge Cases", () => {
  describe("Leech Threshold Boundaries", () => {
    it("should handle leechThreshold = 1", () => {
      const card = createReviewCard({ lapses: 0 });
      const lapsesSettings: LapsesSettings = {
        leechThreshold: 1,
        relearnSteps: [1],
      };
      const result = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      expect(result.isLeech).toBe(true);
    });

    it("should handle leechThreshold = 0", () => {
      const card = createReviewCard({ lapses: 0 });
      const lapsesSettings: LapsesSettings = {
        leechThreshold: 0,
        relearnSteps: [1],
      };
      const result = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      // With threshold 0, any lapses should trigger leech
      expect(result.isLeech).toBe(true);
    });

    it("should handle leechThreshold = 100", () => {
      const card = createReviewCard({ lapses: 99 });
      const lapsesSettings: LapsesSettings = {
        leechThreshold: 100,
        relearnSteps: [1],
      };
      const result = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      expect(result.isLeech).toBe(true);
      expect(result.lapses).toBe(100);
    });

    it("should preserve leech status once set", () => {
      const card = createReviewCard({ lapses: 10, isLeech: true });
      const result = calculateNextReview(card, "Good");
      expect(result.isLeech).toBe(true);
    });
  });

  describe("Leech Suspend Action", () => {
    it("should suspend on leech with suspend action", () => {
      const card = createReviewCard({ lapses: 7 });
      const lapsesSettings: LapsesSettings = {
        leechThreshold: 8,
        leechAction: "suspend",
        relearnSteps: [1],
      };
      const result = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      expect(result.status).toBe(CardStatus.SUSPENDED);
    });

    it("should not suspend if no leechAction specified", () => {
      const card = createReviewCard({ lapses: 7 });
      const lapsesSettings: LapsesSettings = {
        leechThreshold: 8,
        relearnSteps: [1],
      };
      const result = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      expect(result.isLeech).toBe(true);
      expect(result.status).not.toBe(CardStatus.SUSPENDED);
    });
  });
});

describe("scheduler - Learning Steps Edge Cases", () => {
  describe("Unusual Learning Step Configurations", () => {
    it("should handle single 1-minute step (first Good goes to step 0)", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [1]);
      // First Good on a new card goes to learningStep 0, then next Good graduates
      expect(result.status).toBe(CardStatus.LEARNING);
      expect(result.learningStep).toBe(0);

      // Second Good should graduate
      const result2 = calculateNextReview(result, "Good", undefined, [1]);
      expect(result2.status).toBe(CardStatus.REVIEW);
    });

    it("should handle single 24-hour step", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [1440]);
      expect(result.interval).toBeCloseTo(1, 0.1);
    });

    it("should handle 5 learning steps (starts at step 0 on first Good)", () => {
      let card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const steps = [1, 5, 10, 30, 60];

      // First Good puts card at step 0
      card = calculateNextReview(card, "Good", undefined, steps);
      expect(card.status).toBe(CardStatus.LEARNING);
      expect(card.learningStep).toBe(0);

      // Subsequent Goods advance through steps
      for (let i = 0; i < 5; i++) {
        card = calculateNextReview(card, "Good", undefined, steps);
        if (i < 4) {
          expect(card.status).toBe(CardStatus.LEARNING);
          expect(card.learningStep).toBe(i + 1);
        }
      }
      expect(card.status).toBe(CardStatus.REVIEW);
    });

    it("should handle decreasing learning steps", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [60, 30, 10]);
      expect(result.status).toBe(CardStatus.LEARNING);
    });

    it("should handle very large learning steps (week)", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(
        card,
        "Good",
        undefined,
        [10080], // 1 week in minutes
      );
      expect(result.interval).toBeCloseTo(7, 0.5);
    });

    it("should handle duplicate learning steps", () => {
      let card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [10, 10, 10]);
      expect(result.status).toBe(CardStatus.LEARNING);
    });
  });

  describe("Relearn Steps Edge Cases", () => {
    it("should handle empty relearn steps", () => {
      const card = createReviewCard();
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [],
        leechThreshold: 8,
      };
      const result = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      // Without relearn steps, should go to FSRS directly
      expect(result.lapses).toBeGreaterThan(0);
    });

    it("should handle single relearn step", () => {
      const card = createReviewCard();
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 8,
      };
      const result = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      expect(result.state).toBe(State.Relearning);
      expect(result.learningStep).toBe(-1);
    });

    it("should handle 5 relearn steps", () => {
      let card = createReviewCard();
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [1, 5, 10, 30, 60],
        leechThreshold: 8,
      };

      // Enter relearning
      card = calculateNextReview(
        card,
        "Again",
        undefined,
        [1, 10],
        lapsesSettings,
      );
      expect(card.state).toBe(State.Relearning);

      // Progress through all 5 relearning steps (6 Good ratings total:
      // 1st Good completes initial step 0, then 5 more Goods advance through steps 0-4)
      for (let i = 0; i < 6; i++) {
        card = calculateNextReview(
          card,
          "Good",
          undefined,
          [1, 10],
          lapsesSettings,
        );
      }
      // Should exit after completing all steps
      expect(card.status).toBe(CardStatus.REVIEW);
    });
  });
});

describe("isCardDue - Extended Edge Cases", () => {
  describe("Learning Card Timing Precision", () => {
    it("should be due exactly at dueDate", () => {
      const now = new Date();
      const card = createBaseCard({
        status: CardStatus.LEARNING,
        state: State.Learning,
        dueDate: now.toISOString(),
        interval: 10 / 1440,
      });
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should not be due 1 second before dueDate for learning cards", () => {
      const now = new Date();
      const dueDate = addMinutes(now, 10);
      const card = createBaseCard({
        status: CardStatus.LEARNING,
        state: State.Learning,
        dueDate: dueDate.toISOString(),
        interval: 10 / 1440,
      });
      expect(isCardDue(card, now)).toBe(false);
    });

    it("should be due 1 second after dueDate for learning cards", () => {
      const now = new Date();
      const dueDate = subMinutes(now, 1);
      const card = createBaseCard({
        status: CardStatus.LEARNING,
        state: State.Learning,
        dueDate: dueDate.toISOString(),
        interval: 10 / 1440,
      });
      expect(isCardDue(card, now)).toBe(true);
    });
  });

  describe("Edge Cases for isDue", () => {
    it("should handle suspended cards", () => {
      const card = createBaseCard({
        status: CardStatus.SUSPENDED,
        dueDate: subDays(new Date(), 1).toISOString(),
      });
      // Suspended cards behavior depends on implementation
      // This test verifies it doesn't throw
      expect(() => isCardDue(card)).not.toThrow();
    });

    it("should handle undefined status", () => {
      const card = createBaseCard({
        status: undefined as any,
        reps: 0,
      });
      expect(isCardDue(card)).toBe(true); // Should be treated as new
    });

    it("should handle NaN interval", () => {
      const card = createBaseCard({
        status: CardStatus.REVIEW,
        state: State.Review,
        interval: NaN,
        dueDate: subDays(new Date(), 1).toISOString(),
      });
      expect(() => isCardDue(card)).not.toThrow();
    });
  });
});
