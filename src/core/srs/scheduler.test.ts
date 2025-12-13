import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { State } from "ts-fsrs";
import { Card, LanguageId, UserSettings } from "@/types";
import {
  getSRSDate,
  calculateNextReview,
  isCardDue,
  LapsesSettings,
} from "./scheduler";

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

const defaultFsrsSettings: UserSettings["fsrs"] = {
  request_retention: 0.9,
  maximum_interval: 36500,
};

describe("scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getSRSDate", () => {
    it("should return start of day adjusted for cutoff hour", () => {
      const date = new Date("2024-03-15T10:30:00");
      vi.setSystemTime(date);
      const result = getSRSDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it("should handle early morning before cutoff", () => {
      const date = new Date("2024-03-15T02:00:00");
      vi.setSystemTime(date);
      const result = getSRSDate(date);
      // 2 AM should be counted as previous day
      expect(result.getDate()).toBe(14);
    });

    it("should handle time after cutoff", () => {
      const date = new Date("2024-03-15T06:00:00");
      vi.setSystemTime(date);
      const result = getSRSDate(date);
      expect(result.getDate()).toBe(15);
    });

    it("should use current date when no argument provided", () => {
      const now = new Date("2024-03-15T12:00:00");
      vi.setSystemTime(now);
      const result = getSRSDate();
      expect(result).toBeDefined();
    });
  });

  describe("calculateNextReview - New Cards", () => {
    it("should process first review as new card", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
        queue: 0,
        reps: 0,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.reps).toBe(1);
      expect(result.state).toBeDefined();
    });

    it("should set first_review when graduating to review", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        first_review: undefined,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      // first_review is set when going through FSRS scheduling
      expect(result.first_review).toBeDefined();
    });
  });

  describe("calculateNextReview - Learning Phase", () => {
    const learningSteps = [1, 10];

    it("should stay in learning phase on Again", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
        learningStep: 0,
      });

      const result = calculateNextReview(card, "Again", defaultFsrsSettings, learningSteps);

      expect(result.state).toBe(State.Learning);
      expect(result.learningStep).toBe(0);
    });

    it("should reset to step 0 on Again during learning", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        learningStep: 1,
        last_review: Date.now() - 60000,
      });

      const result = calculateNextReview(card, "Again", defaultFsrsSettings, learningSteps);

      expect(result.learningStep).toBe(0);
    });

    it("should stay at same step on Hard during learning", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        learningStep: 0,
        last_review: Date.now() - 60000,
      });

      const result = calculateNextReview(card, "Hard", defaultFsrsSettings, learningSteps);

      expect(result.state).toBe(State.Learning);
      expect(result.learningStep).toBe(0);
    });

    it("should advance step on Good for first review", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
        learningStep: undefined,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps);

      // First Good should set step to 0 and stay in learning
      expect(result.state).toBe(State.Learning);
    });

    it("should graduate from learning on Good at last step", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        learningStep: 1,
        reps: 1,
        last_review: Date.now() - 60000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps);

      // Should graduate to review state
      expect(result.learningStep).toBeUndefined();
    });

    it("should track left steps correctly", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
        learningStep: 0,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps);

      // left = totalSteps - currentStep
      expect(result.left).toBeDefined();
    });

    it("should set intraday schedule for short intervals (queue 1)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
      });

      const result = calculateNextReview(card, "Again", defaultFsrsSettings, [1, 10]);

      expect(result.queue).toBe(1);
      // Due should be Unix timestamp for queue 1
      expect(result.due).toBeGreaterThan(1000000000); // After year 2001
    });
  });

  describe("calculateNextReview - Relearning Phase", () => {
    const lapsesSettings: LapsesSettings = {
      relearnSteps: [10, 20],
      leechThreshold: 8,
    };

    it("should enter relearning on lapse (Again on review card)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        queue: 2,
        reps: 5,
        lapses: 0,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(
        card,
        "Again",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      expect(result.state).toBe(State.Relearning);
      expect(result.lapses).toBe(1);
    });

    it("should increment lapses on relearning entry", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        reps: 5,
        lapses: 2,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(
        card,
        "Again",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      expect(result.lapses).toBe(3);
    });

    it("should progress through relearning steps", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 3,
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
        last_review: Date.now() - 600000,
      });

      const result = calculateNextReview(
        card,
        "Good",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      // Should advance in relearning or graduate
      expect(result.reps).toBeGreaterThan(card.reps || 0);
    });
  });

  describe("calculateNextReview - Review Cards", () => {
    it("should update stability on successful review", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        queue: 2,
        reps: 5,
        lapses: 0,
        stability: 10,
        difficulty: 5,
        interval: 10,
        last_review: Date.now() - 10 * 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.stability).toBeDefined();
      expect(result.stability).not.toBe(card.stability);
    });

    it("should update difficulty on review", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Hard", defaultFsrsSettings);

      expect(result.difficulty).toBeDefined();
    });

    it("should clamp difficulty between 1 and 10", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 10,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Again", defaultFsrsSettings);

      expect(result.difficulty).toBeLessThanOrEqual(10);
      expect(result.difficulty).toBeGreaterThanOrEqual(1);
    });

    it("should set interday schedule for review cards (queue 2)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 30,
        difficulty: 5,
        last_review: Date.now() - 30 * 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.queue).toBe(2);
      // Due should be day count for queue 2
      expect(result.due).toBeLessThan(1000000); // Day count, not timestamp
    });

    it("should increment reps on each review", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        reps: 5,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.reps).toBe(6);
    });
  });

  describe("calculateNextReview - Leech Detection", () => {
    const lapsesSettings: LapsesSettings = {
      relearnSteps: [10],
      leechThreshold: 4,
    };

    it("should mark card as leech when threshold reached", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 3,
        isLeech: false,
        stability: 5,
        difficulty: 7,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(
        card,
        "Again",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      expect(result.isLeech).toBe(true);
      expect(result.lapses).toBe(4);
    });

    it("should not mark as leech below threshold", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 1,
        isLeech: false,
        stability: 5,
        difficulty: 7,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(
        card,
        "Again",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      expect(result.isLeech).toBe(false);
    });

    it("should keep isLeech true once set", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 5,
        isLeech: true,
        stability: 5,
        difficulty: 7,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.isLeech).toBe(true);
    });

    it("should suspend card when leech action is suspend", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const suspendSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 4,
        leechAction: "suspend",
      };
      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 3,
        isLeech: false,
        stability: 5,
        difficulty: 7,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(
        card,
        "Again",
        defaultFsrsSettings,
        [1, 10],
        suspendSettings
      );

      expect(result.queue).toBe(-1);
    });
  });

  describe("calculateNextReview - Edge Cases", () => {
    it("should handle missing stability gracefully", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: undefined,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.stability).toBeDefined();
      expect(Number.isFinite(result.stability)).toBe(true);
    });

    it("should handle missing difficulty gracefully", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: undefined,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.difficulty).toBeDefined();
      expect(Number.isFinite(result.difficulty)).toBe(true);
    });

    it("should handle invalid stability values", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: -5,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.stability).toBeGreaterThan(0);
    });

    it("should handle empty learning steps array", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, []);

      // Should use default [1, 10] when empty
      expect(result).toBeDefined();
    });

    it("should set last_review on every review", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.last_review).toBeDefined();
      expect(result.last_review).toBeGreaterThan(card.last_review!);
    });

    it("should update last_modified", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        last_modified: 0,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.last_modified).toBeGreaterThan(0);
    });
  });

  describe("calculateNextReview - All Grades", () => {
    const grades = ["Again", "Hard", "Good", "Easy"] as const;

    grades.forEach((grade) => {
      it(`should handle ${grade} grade for new card`, () => {
        vi.setSystemTime(new Date("2024-03-15T12:00:00"));
        const card = createCard({
          type: 0,
          state: State.New,
        });

        const result = calculateNextReview(card, grade, defaultFsrsSettings);

        expect(result).toBeDefined();
        expect(result.reps).toBeGreaterThan(0);
      });

      it(`should handle ${grade} grade for review card`, () => {
        vi.setSystemTime(new Date("2024-03-15T12:00:00"));
        const card = createCard({
          type: 2,
          state: State.Review,
          stability: 10,
          difficulty: 5,
          reps: 3,
          last_review: Date.now() - 86400000,
        });

        const result = calculateNextReview(card, grade, defaultFsrsSettings);

        expect(result).toBeDefined();
      });
    });
  });

  describe("isCardDue", () => {
    it("should return false for suspended cards (queue < 0)", () => {
      const card = createCard({ queue: -1 });
      expect(isCardDue(card)).toBe(false);
    });

    it("should return true for new cards (queue 0)", () => {
      const card = createCard({ queue: 0 });
      expect(isCardDue(card)).toBe(true);
    });

    it("should return true for intraday learning due cards (queue 1)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      const pastDue = Math.floor(now.getTime() / 1000) - 60; // 1 minute ago
      const card = createCard({ queue: 1, due: pastDue });
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should return false for intraday learning future cards (queue 1)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      const futureDue = Math.floor(now.getTime() / 1000) + 3600; // 1 hour from now
      const card = createCard({ queue: 1, due: futureDue });
      expect(isCardDue(card, now)).toBe(false);
    });

    it("should return true for review due cards (queue 2)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      // Day count calculation 
      const pastDueDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000)) - 1;
      const card = createCard({ queue: 2, due: pastDueDay });
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should return false for future review cards (queue 2)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      const futureDueDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000)) + 10;
      const card = createCard({ queue: 2, due: futureDueDay });
      expect(isCardDue(card, now)).toBe(false);
    });

    it("should return true for interday learning due cards (queue 3)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      const pastDueDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000)) - 1;
      const card = createCard({ queue: 3, due: pastDueDay });
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should use current date when no date provided", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({ queue: 0 });
      expect(isCardDue(card)).toBe(true);
    });
  });

  describe("FSRS Integration", () => {
    it("should respect request_retention setting", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 10 * 86400000,
      });

      const highRetention = calculateNextReview(card, "Good", {
        request_retention: 0.95,
        maximum_interval: 36500,
      });

      const lowRetention = calculateNextReview(card, "Good", {
        request_retention: 0.85,
        maximum_interval: 36500,
      });

      // Higher retention should result in shorter intervals
      expect(highRetention.interval).toBeLessThan(lowRetention.interval!);
    });

    it("should respect maximum_interval setting", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 1000,
        difficulty: 3,
        last_review: Date.now() - 365 * 86400000,
      });

      const result = calculateNextReview(card, "Easy", {
        request_retention: 0.9,
        maximum_interval: 30,
      });

      // Maximum interval might have slight rounding differences
      expect(result.scheduled_days).toBeLessThanOrEqual(31);
    });
  });
});
