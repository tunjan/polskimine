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
      
      expect(result.due).toBeGreaterThan(1000000000); 
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
      
      expect(result.due).toBeLessThan(1000000); 
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
      const pastDue = Math.floor(now.getTime() / 1000) - 60; 
      const card = createCard({ queue: 1, due: pastDue });
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should return false for intraday learning future cards (queue 1)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      const futureDue = Math.floor(now.getTime() / 1000) + 3600; 
      const card = createCard({ queue: 1, due: futureDue });
      expect(isCardDue(card, now)).toBe(false);
    });

    it("should return true for review due cards (queue 2)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      
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

      
      expect(result.scheduled_days).toBeLessThanOrEqual(31);
    });
  });

  describe("Scheduler Days and Cutoff Handling", () => {
    it("should correctly calculate day count at midnight", () => {
      const midnight = new Date("2024-03-15T00:00:00");
      vi.setSystemTime(midnight);
      const result = getSRSDate(midnight);
      
      expect(result.getDate()).toBe(14);
    });

    it("should correctly calculate day count just after cutoff", () => {
      const afterCutoff = new Date("2024-03-15T05:00:00");
      vi.setSystemTime(afterCutoff);
      const result = getSRSDate(afterCutoff);
      expect(result.getDate()).toBe(15);
    });

    it("should correctly calculate day count at exactly cutoff hour", () => {
      const atCutoff = new Date("2024-03-15T04:00:00");
      vi.setSystemTime(atCutoff);
      const result = getSRSDate(atCutoff);
      expect(result.getDate()).toBe(15);
    });

    it("should handle late night (23:59) correctly", () => {
      const lateNight = new Date("2024-03-15T23:59:59");
      vi.setSystemTime(lateNight);
      const result = getSRSDate(lateNight);
      expect(result.getDate()).toBe(15);
    });
  });

  describe("Grade Processing", () => {
    it("should process Again grade correctly", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        reps: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Again", defaultFsrsSettings);

      expect(result).toBeDefined();
      expect(result.reps).toBeGreaterThanOrEqual(card.reps || 0);
    });

    it("should process Hard grade correctly", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Hard", defaultFsrsSettings);

      expect(result).toBeDefined();
    });

    it("should process Good grade correctly", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result).toBeDefined();
    });

    it("should process Easy grade correctly", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Easy", defaultFsrsSettings);

      expect(result).toBeDefined();
    });
  });

  describe("Anki Metadata Generation", () => {
    it("should set correct metadata for new card", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
        queue: 0,
        due: 5,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 10]);

      
      expect(result.type).toBe(1);
      expect(result.queue).toBe(1);
    });

    it("should set correct metadata for intraday learning", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        queue: 1,
        learningStep: 0,
        last_review: Date.now() - 60000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 60]);

      expect(result.queue).toBe(1);
      expect(result.due).toBeGreaterThan(1000000000); 
    });

    it("should set correct metadata for interday learning", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        queue: 1,
        learningStep: 0,
        last_review: Date.now() - 60000,
      });

      
      const result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 1440]);

      
      expect(result.learningStep).toBe(1);
    });

    it("should set correct metadata for review card", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        queue: 2,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 10 * 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.type).toBe(2);
      expect(result.queue).toBe(2);
      expect(result.due).toBeLessThan(100000); 
    });

    it("should set correct metadata for relearning card", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10, 20],
        leechThreshold: 8,
      };

      const card = createCard({
        type: 2,
        state: State.Review,
        queue: 2,
        reps: 5,
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

      expect(result.type).toBe(3);
      expect(result.state).toBe(State.Relearning);
    });
  });

  describe("Learning Phase Edge Cases", () => {
    it("should handle first review with undefined learningStep", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
        learningStep: undefined,
        reps: 0,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 10]);

      expect(result.state).toBe(State.Learning);
      expect(result.learningStep).toBe(0);
    });

    it("should handle learning with single step", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        learningStep: 0,
        last_review: Date.now() - 60000,
        reps: 1,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, [10]);

      
      expect(result.learningStep).toBeUndefined();
    });

    it("should handle leech at exact threshold in learning", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 2,
      };

      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 1,
        isLeech: false,
        stability: 5,
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

      expect(result.lapses).toBe(2);
      expect(result.isLeech).toBe(true);
    });

    it("should advance through learning steps correctly", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const learningSteps = [1, 10, 60];

      
      let card = createCard({
        type: 1,
        state: State.Learning,
        learningStep: 0,
        reps: 1,
        last_review: Date.now() - 60000,
      });

      
      let result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps);
      expect(result.learningStep).toBe(1);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps);
      expect(result.learningStep).toBe(2);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps);
      expect(result.learningStep).toBeUndefined();
      expect(result.state).toBe(State.Review);
    });
  });

  describe("Relearning Phase Edge Cases", () => {
    it("should handle empty relearn steps", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [],
        leechThreshold: 8,
      };

      const card = createCard({
        type: 2,
        state: State.Review,
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

      
      expect(result).toBeDefined();
    });

    it("should handle relearning with single step", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 8,
      };

      const card = createCard({
        type: 3,
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
        stability: 5,
        difficulty: 5,
        last_review: Date.now() - 600000,
      });

      const result = calculateNextReview(
        card,
        "Good",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      
      expect(result.learningStep).toBeUndefined();
    });

    it("should handle Again during relearning", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10, 20],
        leechThreshold: 8,
      };

      const card = createCard({
        type: 3,
        state: State.Relearning,
        learningStep: 1,
        lapses: 1,
        last_review: Date.now() - 600000,
      });

      const result = calculateNextReview(
        card,
        "Again",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      expect(result.state).toBe(State.Relearning);
      expect(result.learningStep).toBe(-1);
    });

    it("should handle Hard during relearning", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10, 20],
        leechThreshold: 8,
      };

      const card = createCard({
        type: 3,
        state: State.Relearning,
        learningStep: 0,
        lapses: 1,
        last_review: Date.now() - 600000,
      });

      const result = calculateNextReview(
        card,
        "Hard",
        defaultFsrsSettings,
        [1, 10],
        lapsesSettings
      );

      expect(result.state).toBe(State.Relearning);
    });
  });

  describe("Leech Action Handling", () => {
    it("should not apply any action when not a leech", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 8,
        leechAction: "suspend",
      };

      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 0,
        isLeech: false,
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

      expect(result.queue).not.toBe(-1);
    });

    it("should apply suspend action on leech", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 2,
        leechAction: "suspend",
      };

      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 1,
        isLeech: false,
        stability: 5,
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

      expect(result.isLeech).toBe(true);
      expect(result.queue).toBe(-1);
    });

    it("should keep leech status without action when no action specified", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 2,
      };

      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 1,
        isLeech: false,
        stability: 5,
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

      expect(result.isLeech).toBe(true);
      expect(result.queue).not.toBe(-1);
    });

    it("should preserve leechCount", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 8,
      };

      const card = createCard({
        type: 2,
        state: State.Review,
        lapses: 3,
        isLeech: false,
        stability: 5,
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

      expect(result.leechCount).toBe(4);
    });
  });

  describe("Full Card Lifecycle Simulation", () => {
    it("should correctly progress card through full lifecycle", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const learningSteps = [1, 10];
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 8,
      };

      
      let card = createCard({
        type: 0,
        state: State.New,
        queue: 0,
        reps: 0,
      });

      expect(card.state).toBe(State.New);

      
      let result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps, lapsesSettings);
      expect(result.state).toBe(State.Learning);
      expect(result.learningStep).toBe(0);
      expect(result.reps).toBe(1);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps, lapsesSettings);
      expect(result.state).toBe(State.Learning);
      expect(result.learningStep).toBe(1);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps, lapsesSettings);
      expect(result.state).toBe(State.Review);
      expect(result.learningStep).toBeUndefined();
      expect(result.lapses).toBe(0);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Again", defaultFsrsSettings, learningSteps, lapsesSettings);
      expect(result.state).toBe(State.Relearning);
      expect(result.lapses).toBe(1);

      
      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps, lapsesSettings);
      
      expect(result.learningStep).toBe(0);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, learningSteps, lapsesSettings);
      
      expect(result.learningStep).toBeUndefined();
    });

    it("should handle multiple lapses correctly", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const lapsesSettings: LapsesSettings = {
        relearnSteps: [10],
        leechThreshold: 3,
      };

      let card = createCard({
        type: 2,
        state: State.Review,
        queue: 2,
        reps: 5,
        lapses: 0,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      
      let result = calculateNextReview(card, "Again", defaultFsrsSettings, [1, 10], lapsesSettings);
      expect(result.lapses).toBe(1);
      expect(result.isLeech).toBe(false);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 10], lapsesSettings);

      
      card = { ...result, last_review: Date.now(), state: State.Review, type: 2 };
      result = calculateNextReview(card, "Again", defaultFsrsSettings, [1, 10], lapsesSettings);
      expect(result.lapses).toBe(2);
      expect(result.isLeech).toBe(false);

      
      card = { ...result, last_review: Date.now() };
      result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 10], lapsesSettings);

      
      card = { ...result, last_review: Date.now(), state: State.Review, type: 2 };
      result = calculateNextReview(card, "Again", defaultFsrsSettings, [1, 10], lapsesSettings);
      expect(result.lapses).toBe(3);
      expect(result.isLeech).toBe(true);
    });
  });

  describe("FSRS Integration - Boundary Conditions", () => {
    it("should handle minimum retention (0.7)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 10 * 86400000,
      });

      const result = calculateNextReview(card, "Good", {
        request_retention: 0.7,
        maximum_interval: 36500,
      });

      expect(result).toBeDefined();
      expect(result.scheduled_days).toBeGreaterThan(0);
    });

    it("should handle maximum retention (0.99)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 10 * 86400000,
      });

      const result = calculateNextReview(card, "Good", {
        request_retention: 0.99,
        maximum_interval: 36500,
      });

      expect(result).toBeDefined();
      expect(result.scheduled_days).toBeGreaterThan(0);
    });

    it("should handle very high stability", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 5000,
        difficulty: 5,
        last_review: Date.now() - 365 * 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result).toBeDefined();
      expect(result.stability).toBeGreaterThan(0);
    });

    it("should handle very low stability", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 0.1,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result).toBeDefined();
      expect(result.stability).toBeGreaterThan(0);
    });

    it("should handle minimum difficulty (1)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 1,
        last_review: Date.now() - 10 * 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.difficulty).toBeLessThanOrEqual(10);
    });

    it("should handle maximum difficulty (10)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 10,
        last_review: Date.now() - 10 * 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.difficulty).toBeLessThanOrEqual(10);
    });

    it("should handle zero elapsed days", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        elapsed_days: 0,
        last_review: Date.now(),
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result).toBeDefined();
    });

    it("should handle missing w parameter", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 2,
        state: State.Review,
        stability: 10,
        difficulty: 5,
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", {
        request_retention: 0.9,
        maximum_interval: 36500,
        
      });

      expect(result).toBeDefined();
    });
  });

  describe("Edge Cases - Card State Transitions", () => {
    it("should handle type 1 card without learningStep", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        learningStep: undefined,
        interval: 0.007, 
        last_review: Date.now() - 60000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 10]);

      expect(result).toBeDefined();
    });

    it("should handle type 0 card with non-zero interval", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 0,
        state: State.New,
        interval: 1, 
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings);

      expect(result).toBeDefined();
    });

    it("should handle queue 3 (interday learning)", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const card = createCard({
        type: 1,
        state: State.Learning,
        queue: 3,
        learningStep: 0,
        due: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
        last_review: Date.now() - 86400000,
      });

      const result = calculateNextReview(card, "Good", defaultFsrsSettings, [1, 10]);

      expect(result).toBeDefined();
    });
  });

  describe("isCardDue - Additional Edge Cases", () => {
    it("should return false for suspended relearning card", () => {
      const card = createCard({
        queue: -1,
        state: State.Relearning,
        lapses: 1,
      });
      expect(isCardDue(card)).toBe(false);
    });

    it("should handle exactly due intraday card", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      const exactlyDue = Math.floor(now.getTime() / 1000); 
      const card = createCard({ queue: 1, due: exactlyDue });
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should handle exactly due review card", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00"));
      const now = new Date();
      const currentDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
      const card = createCard({ queue: 2, due: currentDay });
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should handle unknown queue value", () => {
      const card = createCard({ queue: 99 as any });
      expect(isCardDue(card)).toBe(false);
    });
  });
});
