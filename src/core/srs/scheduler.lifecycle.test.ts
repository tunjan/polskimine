
import { describe, it, expect } from "vitest";
import { calculateNextReview, LapsesSettings } from "./scheduler";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const createNewCard = (id: string): Card => ({
  id,
  targetSentence: "Test",
  nativeTranslation: "Test",
  notes: "",
  status: CardStatus.NEW,
  state: State.New,
  reps: 0,
  lapses: 0,
  interval: 0,
  precise_interval: 0,
  scheduled_days: 0,
  dueDate: new Date().toISOString(),
  stability: 0,
  difficulty: 0,
  elapsed_days: 0,
  learningStep: undefined,
  language: "polish" as any,
  easeFactor: 2.5
});

describe("scheduler - lifecycle simulations", () => {
  const learningSteps = [1, 10]; // 1m, 10m
  
  it("Scenario 1: Perfect Recall (New -> Graduation -> Review -> Maturity)", () => {
    let card = createNewCard("perfect-card");
    
    // 1. New -> Learning Step 0 (1m)
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(0);
    expect(card.interval * 24 * 60).toBeCloseTo(1, 0.1);

    // 2. Learning Step 0 -> Learning Step 1 (10m)
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(1);
    expect(card.interval * 24 * 60).toBeCloseTo(10, 0.1);

    // 3. Learning Step 1 -> Graduation (Review)
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.learningStep).toBeUndefined();
    expect(card.interval).toBeGreaterThan(0.9); // Should be ~1-3 days

    // 4. Review 1 -> Review 2
    const firstInterval = card.interval;
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.interval).toBeGreaterThan(firstInterval); // Interval should increase
  });

  it("Scenario 2: Struggling Learner (New -> Again -> Again -> Good -> Good)", () => {
    let card = createNewCard("struggling-card");

    // 1. New -> Again (Stay New/Step 0)
    card = calculateNextReview(card, "Again", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(0);
    expect(card.interval * 24 * 60).toBeCloseTo(1, 0.1);

    // 2. Again multiple times
    for (let i = 0; i < 5; i++) {
        card = calculateNextReview(card, "Again", undefined, learningSteps);
        expect(card.learningStep).toBe(0);
    }

    // 3. Finally Good -> Step 1
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.learningStep).toBe(1);

    // 4. Good -> Graduate
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.interval).toBeGreaterThan(0.9);
  });

  it("Scenario 3: Lapsing Card (Review -> Again -> Relearning -> Review)", () => {
    let card = createNewCard("lapsing-card");
    
    // Fast forward to Review
    card = calculateNextReview(card, "Easy", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    const preLapseStability = card.stability;

    // Lapse
    const lapsesSettings: LapsesSettings = { relearnSteps: [10], leechThreshold: 8 };
    card = calculateNextReview(card, "Again", undefined, learningSteps, lapsesSettings);
    
    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.state).toBe(State.Relearning);
    expect(card.learningStep).toBe(0);
    expect(card.lapses).toBe(1);
    expect(card.stability).toBeLessThan(preLapseStability || 100); // Stability should decrease

    // Relearn -> Review
    card = calculateNextReview(card, "Good", undefined, learningSteps, lapsesSettings);
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.interval).toBeGreaterThan(0);
  });
  
  it("Scenario 4: Broken History Recovery (Simulate bug state -> Recover)", () => {
     let card = createNewCard("broken-card");
     // Manually break it
     card = {
         ...card,
         status: CardStatus.REVIEW,
         state: State.Review,
         learningStep: undefined, // Ensure it's not seen as learning
         stability: -1, // Invalid for review (triggered fix)
         difficulty: 0,
         reps: 5,
         elapsed_days: 1,
         scheduled_days: 1,
         last_review: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
         interval: 0.005, // 7 mins
     };
     
     // Review "Good" on broken card
     card = calculateNextReview(card, "Good", undefined, learningSteps);
     
     if (card.status !== CardStatus.REVIEW) {
         console.log("Failed recovery card:", JSON.stringify(card, null, 2));
     }

     // Should be fixed
     expect(card.status).toBe(CardStatus.REVIEW);
     expect(card.interval).toBeGreaterThan(0.9); // Should not remain 10 mins
     expect(card.stability).toBeGreaterThan(0);
  });
});
