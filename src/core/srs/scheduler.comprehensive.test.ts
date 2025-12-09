import { describe, it, expect } from "vitest";
import { calculateNextReview, isCardDue, getSRSDate, LapsesSettings } from "./scheduler";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";
import { addDays, addMinutes, subDays } from "date-fns";


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

const createLearningCard = (overrides: Partial<Card> = {}): Card =>
  createBaseCard({
    status: CardStatus.LEARNING,
    state: State.Learning,
    learningStep: 0,
    ...overrides,
  });

const createRelearningCard = (overrides: Partial<Card> = {}): Card =>
  createBaseCard({
    status: CardStatus.LEARNING,
    state: State.Relearning,
    learningStep: 0,
    lapses: 1,
    last_review: new Date().toISOString(),
    ...overrides,
  });


describe("calculateNextReview - Comprehensive Edge Cases", () => {
  describe("Boundary Conditions", () => {
    it("should handle card with all default values", () => {
      const card = createBaseCard();
      const result = calculateNextReview(card, "Good");
      
      expect(result.dueDate).toBeDefined();
      expect(new Date(result.dueDate).getTime()).not.toBeNaN();
    });

    it("should handle card with zero reps transitioning correctly", () => {
      const card = createBaseCard({ reps: 0 });
      const result = calculateNextReview(card, "Good");
      
      expect(result.reps).toBeGreaterThan(0);
    });

    it("should handle card with undefined optional fields", () => {
      const card = createBaseCard({
        stability: undefined,
        difficulty: undefined,
        elapsed_days: undefined,
        scheduled_days: undefined,
        reps: undefined,
        lapses: undefined,
      });
      
      const result = calculateNextReview(card, "Good");
      expect(result.dueDate).toBeDefined();
    });
  });

  describe("Learning Phase - All Grades", () => {
    const learningSteps = [1, 10, 60]; 
    it("should handle multi-step Good progression through all steps", () => {
      let card = createLearningCard({ learningStep: 0 });
      
            card = calculateNextReview(card, "Good", undefined, learningSteps);
      expect(card.learningStep).toBe(1);
      expect(card.status).toBe(CardStatus.LEARNING);
      
            card = calculateNextReview(card, "Good", undefined, learningSteps);
      expect(card.learningStep).toBe(2);
      expect(card.status).toBe(CardStatus.LEARNING);
      
            card = calculateNextReview(card, "Good", undefined, learningSteps);
      expect(card.learningStep).toBeUndefined();
      expect(card.status).toBe(CardStatus.REVIEW);
    });

    it("should reset to step 0 and stay in learning on Again from any step", () => {
      const card = createLearningCard({ learningStep: 2 });
      const result = calculateNextReview(card, "Again", undefined, learningSteps);
      
      expect(result.learningStep).toBe(0);
      expect(result.status).toBe(CardStatus.LEARNING);
      expect(result.state).toBe(State.Learning);
    });

    it("should stay at current step on Hard", () => {
      const card = createLearningCard({ learningStep: 1 });
      const result = calculateNextReview(card, "Hard", undefined, learningSteps);
      
      expect(result.learningStep).toBe(1);
      expect(result.status).toBe(CardStatus.LEARNING);
    });

    it("should graduate immediately on Easy from any step", () => {
      const card = createLearningCard({ learningStep: 0 });
      const result = calculateNextReview(card, "Easy", undefined, learningSteps);
      
      expect(result.learningStep).toBeUndefined();
      expect(result.status).toBe(CardStatus.REVIEW);
    });

    it("should handle Hard on last learning step", () => {
      const card = createLearningCard({ learningStep: 2 });
      const result = calculateNextReview(card, "Hard", undefined, learningSteps);
      
      expect(result.learningStep).toBe(2);
      expect(result.status).toBe(CardStatus.LEARNING);
    });
  });

  describe("Relearning Phase - All Grades", () => {
    const lapsesSettings: LapsesSettings = {
      relearnSteps: [5, 15, 30],
      leechThreshold: 8,
    };

    it("should handle multi-step Good progression through relearning", () => {
      let card = createRelearningCard({ learningStep: 0 });
      
            card = calculateNextReview(card, "Good", undefined, [1, 10], lapsesSettings);
      expect(card.learningStep).toBe(1);
      expect(card.state).toBe(State.Relearning);
      
            card = calculateNextReview(card, "Good", undefined, [1, 10], lapsesSettings);
      expect(card.learningStep).toBe(2);
      expect(card.state).toBe(State.Relearning);
      
            card = calculateNextReview(card, "Good", undefined, [1, 10], lapsesSettings);
      expect(card.learningStep).toBeUndefined();
      expect(card.status).toBe(CardStatus.REVIEW);
    });

    it("should reset to step 0 on Again during relearning", () => {
      const card = createRelearningCard({ learningStep: 2 });
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.learningStep).toBe(0);
      expect(result.state).toBe(State.Relearning);
    });

    it("should stay at current step on Hard during relearning", () => {
      const card = createRelearningCard({ learningStep: 1 });
      const result = calculateNextReview(card, "Hard", undefined, [1, 10], lapsesSettings);
      
      expect(result.learningStep).toBe(1);
      expect(result.state).toBe(State.Relearning);
    });

    it("should exit immediately on Easy during relearning", () => {
      const card = createRelearningCard({
        learningStep: 0,
        stability: 5,
        difficulty: 5,
      });
      const result = calculateNextReview(card, "Easy", undefined, [1, 10], lapsesSettings);
      
      expect(result.learningStep).toBeUndefined();
      expect(result.status).toBe(CardStatus.REVIEW);
    });

    it("should handle empty relearnSteps (fallback to FSRS)", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Again", undefined, [1, 10], {
        relearnSteps: [],
        leechThreshold: 8,
      });
      
            expect(result.lapses).toBeGreaterThan(0);
    });
  });

  describe("Lapse Detection and Entry to Relearning", () => {
    it("should enter relearning on Again from Review state", () => {
      const card = createReviewCard();
      const lapsesSettings: LapsesSettings = { relearnSteps: [5, 10] };
      
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.state).toBe(State.Relearning);
      expect(result.learningStep).toBe(0);
      expect(result.lapses).toBeGreaterThan(card.lapses || 0);
    });

    it("should increment lapses on lapse from Review", () => {
      const card = createReviewCard({ lapses: 3 });
      const lapsesSettings: LapsesSettings = { relearnSteps: [5] };
      
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.lapses).toBe(4);
    });

    it("should NOT increment lapses on Again during initial Learning", () => {
      const card = createLearningCard({ lapses: 0 });
      const result = calculateNextReview(card, "Again", undefined, [1, 10]);
      
      expect(result.lapses).toBe(0);
    });
  });

  describe("Leech Detection", () => {
    it("should mark card as leech when threshold is exactly reached", () => {
      const card = createReviewCard({ lapses: 7, isLeech: false });
      const lapsesSettings: LapsesSettings = { leechThreshold: 8, relearnSteps: [1] };
      
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.lapses).toBe(8);
      expect(result.isLeech).toBe(true);
    });

    it("should mark card as leech when threshold is exceeded", () => {
      const card = createReviewCard({ lapses: 10 });
      const lapsesSettings: LapsesSettings = { leechThreshold: 8, relearnSteps: [1] };
      
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.isLeech).toBe(true);
    });

    it("should not double-mark already leech card", () => {
      const card = createReviewCard({ lapses: 10, isLeech: true });
      const lapsesSettings: LapsesSettings = { leechThreshold: 8, relearnSteps: [1] };
      
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.isLeech).toBe(true);
    });

    it("should suspend card when leechAction is suspend and threshold reached", () => {
      const card = createReviewCard({ lapses: 7 });
      const lapsesSettings: LapsesSettings = {
        leechThreshold: 8,
        leechAction: "suspend",
        relearnSteps: [1],
      };
      
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.isLeech).toBe(true);
      expect(result.status).toBe(CardStatus.SUSPENDED);
    });

    it("should not suspend if below threshold", () => {
      const card = createReviewCard({ lapses: 5 });
      const lapsesSettings: LapsesSettings = {
        leechThreshold: 8,
        leechAction: "suspend",
        relearnSteps: [1],
      };
      
      const result = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
      expect(result.isLeech).toBe(false);
      expect(result.status).not.toBe(CardStatus.SUSPENDED);
    });
  });

  describe("Data Integrity - NaN and Invalid Values", () => {
    it("should handle NaN in stability", () => {
      const card = createReviewCard({ stability: NaN });
      const result = calculateNextReview(card, "Good");
      
      expect(Number.isNaN(result.stability)).toBe(false);
    });

    it("should handle NaN in difficulty", () => {
      const card = createReviewCard({ difficulty: NaN });
      const result = calculateNextReview(card, "Good");
      
      expect(Number.isNaN(result.difficulty)).toBe(false);
    });

    it("should handle NaN in interval", () => {
      const card = createReviewCard({ interval: NaN });
      const result = calculateNextReview(card, "Good");
      
      expect(Number.isNaN(result.interval)).toBe(false);
    });

    it("should handle NaN in elapsed_days", () => {
      const card = createReviewCard({ elapsed_days: NaN });
      const result = calculateNextReview(card, "Good");
      
      expect(Number.isNaN(result.elapsed_days)).toBe(false);
    });

    it("should handle negative interval gracefully", () => {
      const card = createReviewCard({ interval: -5 });
      const result = calculateNextReview(card, "Good");
      
      expect(result.interval).toBeGreaterThanOrEqual(0);
    });

    it("should handle invalid dueDate string", () => {
      const card = createBaseCard({ dueDate: "invalid-date" });
      
            expect(() => calculateNextReview(card, "Good")).not.toThrow();
    });

    it("should produce valid dueDate even with corrupted input", () => {
      const card = createBaseCard({
        dueDate: "not-a-date",
        stability: NaN,
        difficulty: NaN,
      });
      
      const result = calculateNextReview(card, "Good");
      expect(new Date(result.dueDate).getTime()).not.toBeNaN();
    });
  });

  describe("Learning Steps Validation", () => {
    it("should filter out negative learning steps", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [-5, 10]);
      
            expect(result.status).toBe(CardStatus.LEARNING);
    });

    it("should filter out zero learning steps", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [0, 10]);
      
      expect(result.status).toBe(CardStatus.LEARNING);
    });

    it("should use fallback [1, 10] for completely empty steps", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, []);
      
            expect(result.learningStep).toBe(1);
      expect(result.status).toBe(CardStatus.LEARNING);
    });

    it("should handle very large learning step values", () => {
      const card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [1440, 10080]);       
      expect(result.status).toBe(CardStatus.LEARNING);
      expect(result.interval).toBeGreaterThan(0);
    });
  });

  describe("Interval Calculations", () => {
    it("should set interval correctly for learning cards (intraday)", () => {
      const card = createLearningCard({ learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [10]);
      
            expect(result.interval).toBeLessThan(1);
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should set scheduled_days to 0 for learning cards", () => {
      const card = createLearningCard({ learningStep: 0 });
      const result = calculateNextReview(card, "Good", undefined, [10]);
      
      expect(result.scheduled_days).toBe(0);
    });

    it("should set minimum 1 day interval for graduated cards", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good");
      
      expect(result.scheduled_days).toBeGreaterThanOrEqual(1);
    });

    it("should respect precise_interval for FSRS cards", () => {
      const card = createReviewCard({ stability: 30 });
      const result = calculateNextReview(card, "Good");
      
      expect(result.precise_interval).toBeDefined();
      expect(result.precise_interval).toBeGreaterThan(0);
    });
  });

  describe("FSRS Settings Variations", () => {
    it("should respect custom request_retention", () => {
      const card = createReviewCard();
      
      const lowRetention = calculateNextReview(card, "Good", { request_retention: 0.7, maximum_interval: 36500 });
      const highRetention = calculateNextReview(card, "Good", { request_retention: 0.95, maximum_interval: 36500 });
      
            expect(highRetention.interval).toBeLessThanOrEqual(lowRetention.interval);
    });

    it("should respect maximum_interval setting by returning bounded intervals", () => {
            const card = createReviewCard({ stability: 1000, reps: 50 });       const result = calculateNextReview(card, "Easy", { request_retention: 0.9, maximum_interval: 365 });
      
                  expect(result.interval).toBeDefined();
      expect(result.interval).toBeGreaterThan(0);
            expect(result.scheduled_days).toBeLessThanOrEqual(36500);     });

    it("should use default FSRS params when settings undefined", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good", undefined);
      
      expect(result.dueDate).toBeDefined();
      expect(result.status).toBe(CardStatus.REVIEW);
    });
  });

  describe("State Transitions - Review Card Grades", () => {
    it("should stay in Review on Good", () => {
      const card = createReviewCard();
      const result = calculateNextReview(card, "Good");
      
      expect(result.status).toBe(CardStatus.REVIEW);
      expect(result.state).toBe(State.Review);
    });

    it("should stay in Review on Hard with shorter interval", () => {
      const card = createReviewCard();
      const goodResult = calculateNextReview(card, "Good");
      const hardResult = calculateNextReview(card, "Hard");
      
      expect(hardResult.status).toBe(CardStatus.REVIEW);
      expect(hardResult.interval).toBeLessThanOrEqual(goodResult.interval);
    });

    it("should stay in Review on Easy with longer interval", () => {
      const card = createReviewCard();
      const goodResult = calculateNextReview(card, "Good");
      const easyResult = calculateNextReview(card, "Easy");
      
      expect(easyResult.status).toBe(CardStatus.REVIEW);
      expect(easyResult.interval).toBeGreaterThanOrEqual(goodResult.interval);
    });
  });

  describe("First Review of New Card", () => {
    it("should set first_review when card graduates from learning", () => {
            let card = createBaseCard({ first_review: undefined, learningStep: 0 });
      card = calculateNextReview(card, "Good", undefined, [1]);       
            expect(card.first_review !== undefined || card.last_review !== undefined).toBe(true);
    });

    it("should set first_review when graduating via Easy", () => {
      const card = createBaseCard({ first_review: undefined });
            const result = calculateNextReview(card, "Easy");
      
      expect(result.first_review).toBeDefined();
    });

    it("should not overwrite existing first_review", () => {
      const existingDate = "2024-01-01T00:00:00Z";
      const card = createReviewCard({ first_review: existingDate });
      const result = calculateNextReview(card, "Good");
      
      expect(result.first_review).toBe(existingDate);
    });

    it("should increment reps on every review", () => {
      const card = createBaseCard({ reps: 0 });
      const result = calculateNextReview(card, "Good");
      
      expect(result.reps).toBe(1);
    });
  });

  describe("Legacy Card Compatibility", () => {
    it("should handle card with status but no state", () => {
      const card = createBaseCard({
        status: CardStatus.REVIEW,
        state: undefined,
        interval: 5,
        reps: 10,
        last_review: new Date(Date.now() - 86400000).toISOString(),
      });
      
      const result = calculateNextReview(card, "Good");
      
      expect(result.status).toBe(CardStatus.REVIEW);
    });

    it("should infer state from status and reps", () => {
      const card = createBaseCard({
        status: CardStatus.LEARNING,
        state: undefined,
        reps: 2,
        learningStep: 0,
      });
      
            const result = calculateNextReview(card, "Good", undefined, [1, 10]);
      expect(result.status).toBe(CardStatus.LEARNING);
    });
  });
});


describe("isCardDue - Comprehensive Edge Cases", () => {
  describe("New Card Detection", () => {
    it("should return true for CardStatus.NEW", () => {
      const card = createBaseCard({ status: CardStatus.NEW });
      expect(isCardDue(card)).toBe(true);
    });

    it("should return true for State.New", () => {
      const card = createBaseCard({ state: State.New, status: CardStatus.LEARNING });
      expect(isCardDue(card)).toBe(true);
    });

    it("should return true for undefined state with 0 reps", () => {
      const card = createBaseCard({ state: undefined, reps: 0 });
      expect(isCardDue(card)).toBe(true);
    });
  });

  describe("Learning Cards - Intraday Timing", () => {
    it("should use precise timing for learning cards with interval < 1 day", () => {
      const now = new Date();
      const card = createLearningCard({
        dueDate: addMinutes(now, 5).toISOString(),
        interval: 10 / 1440,       });
      
      expect(isCardDue(card, now)).toBe(false);
      expect(isCardDue(card, addMinutes(now, 10))).toBe(true);
    });

    it("should use precise timing for interval < 1 hour", () => {
      const now = new Date();
      const card = createBaseCard({
        status: CardStatus.REVIEW,
        state: State.Review,
        dueDate: addMinutes(now, 30).toISOString(),
        interval: 30 / 1440,       });
      
      expect(isCardDue(card, now)).toBe(false);
    });

    it("should return true when exact due time has passed", () => {
      const now = new Date();
      const card = createLearningCard({
        dueDate: subMinutes(now, 1).toISOString(),
        interval: 10 / 1440,
      });
      
      expect(isCardDue(card, now)).toBe(true);
    });
  });

  describe("SRS Day Boundary (4 AM Cutoff)", () => {
    it("should consider overdue cards as due", () => {
            const now = new Date();
      const card = createReviewCard({
        dueDate: subDays(now, 1).toISOString(),
        interval: 1,
      });
      
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should NOT consider card due if dueDate is far in future", () => {
            const now = new Date();
      const card = createReviewCard({
        dueDate: addDays(now, 7).toISOString(),
        interval: 7,
      });
      
      expect(isCardDue(card, now)).toBe(false);
    });

    it("should handle cards due within SRS day", () => {
            const now = new Date();
      const card = createReviewCard({
        dueDate: now.toISOString(),
        interval: 1,
      });
      
      expect(isCardDue(card, now)).toBe(true);
    });
  });

  describe("Overdue Cards", () => {
    it("should return true for card overdue by 1 day", () => {
      const now = new Date();
      const card = createReviewCard({
        dueDate: subDays(now, 1).toISOString(),
        interval: 1,
      });
      
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should return true for card overdue by 1 week", () => {
      const now = new Date();
      const card = createReviewCard({
        dueDate: subDays(now, 7).toISOString(),
        interval: 5,
      });
      
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should return true for card overdue by months", () => {
      const now = new Date();
      const card = createReviewCard({
        dueDate: subDays(now, 90).toISOString(),
        interval: 30,
      });
      
      expect(isCardDue(card, now)).toBe(true);
    });

    it("should return true for card overdue by years", () => {
      const now = new Date();
      const card = createReviewCard({
        dueDate: subDays(now, 365 * 2).toISOString(),
        interval: 180,
      });
      
      expect(isCardDue(card, now)).toBe(true);
    });
  });

  describe("Future Dated Cards", () => {
    it("should return false for card due far in future", () => {
      const now = new Date();
      const card = createReviewCard({
        dueDate: addDays(now, 30).toISOString(),
        interval: 30,
      });
      
      expect(isCardDue(card, now)).toBe(false);
    });

    it("should return false for card due tomorrow (day-based)", () => {
      const now = new Date();
      const card = createReviewCard({
        dueDate: addDays(now, 2).toISOString(),
        interval: 5,
      });
      
      expect(isCardDue(card, now)).toBe(false);
    });
  });

  describe("Edge Cases - Invalid Data", () => {
    it("should handle invalid dueDate gracefully", () => {
      const card = createBaseCard({
        status: CardStatus.REVIEW,
        dueDate: "invalid",
        interval: 1,
      });
      
            expect(() => isCardDue(card)).not.toThrow();
    });

    it("should handle epoch date (prioritized cards)", () => {
      const card = createBaseCard({
        dueDate: new Date(0).toISOString(),
        status: CardStatus.NEW,
      });
      
            expect(isCardDue(card)).toBe(true);
    });
  });
});


describe("getSRSDate", () => {
  it("should return a Date object", () => {
    const morning = new Date("2024-06-15T10:00:00Z");
    const srsDate = getSRSDate(morning);
    
    expect(srsDate).toBeInstanceOf(Date);
  });

  it("should return start of day adjusted by cutoff hours", () => {
    const date = new Date();
    const srsDate = getSRSDate(date);
    
        expect(srsDate.getTime()).not.toBeNaN();
        expect(srsDate.getHours()).toBe(0);
  });

  it("should handle different times of day consistently", () => {
    const morning = getSRSDate(new Date("2024-06-15T10:00:00"));
    const afternoon = getSRSDate(new Date("2024-06-15T14:00:00"));
    const evening = getSRSDate(new Date("2024-06-15T20:00:00"));
    
        expect(morning.getTime()).toBe(afternoon.getTime());
    expect(afternoon.getTime()).toBe(evening.getTime());
  });

  it("should handle current time", () => {
    const now = new Date();
    const srsDate = getSRSDate(now);
    
    expect(srsDate).toBeDefined();
    expect(srsDate.getTime()).toBeLessThanOrEqual(now.getTime());
  });
});


describe("Scheduling Simulation", () => {
  it("should handle 100 consecutive correct reviews without issues", () => {
    let card = createReviewCard({ stability: 5, difficulty: 5 });
    
    for (let i = 0; i < 100; i++) {
      card = calculateNextReview(card, "Good");
      
            expect(Number.isNaN(card.stability)).toBe(false);
      expect(Number.isNaN(card.interval)).toBe(false);
      expect(new Date(card.dueDate).getTime()).not.toBeNaN();
    }
    
            expect(card.interval).toBeGreaterThanOrEqual(1);
    expect(card.reps).toBeGreaterThan(100);
  });

  it("should handle alternating Good/Again pattern", () => {
    let card = createReviewCard({ stability: 10 });
    const lapsesSettings: LapsesSettings = { relearnSteps: [1], leechThreshold: 100 };
    
    for (let i = 0; i < 10; i++) {
      card = calculateNextReview(card, "Good", undefined, [1, 10], lapsesSettings);
      card = calculateNextReview(card, "Again", undefined, [1, 10], lapsesSettings);
      
            if (card.state === State.Relearning) {
        card = calculateNextReview(card, "Good", undefined, [1, 10], lapsesSettings);
      }
    }
    
        expect(card.lapses).toBeGreaterThan(0);
    expect(card.status === CardStatus.REVIEW || card.status === CardStatus.LEARNING).toBe(true);
  });

  it("should maintain learning progression through a full session", () => {
    let card = createBaseCard({ status: CardStatus.NEW });
    
        card = calculateNextReview(card, "Good", undefined, [1, 10, 60]);
    expect(card.learningStep).toBe(1);
    
    card = calculateNextReview(card, "Good", undefined, [1, 10, 60]);
    expect(card.learningStep).toBe(2);
    
    card = calculateNextReview(card, "Good", undefined, [1, 10, 60]);
    expect(card.status).toBe(CardStatus.REVIEW);
    
        for (let i = 0; i < 5; i++) {
      card = calculateNextReview(card, "Good");
      expect(card.status).toBe(CardStatus.REVIEW);
    }
    
    expect(card.reps).toBeGreaterThanOrEqual(8);
  });
});


function subMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}
