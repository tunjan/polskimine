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
  easeFactor: 2.5,
});

describe("scheduler - lifecycle simulations", () => {
  const learningSteps = [1, 10]; 

  it("Scenario 1: Perfect Recall (New -> Graduation -> Review -> Maturity)", () => {
    let card = createNewCard("perfect-card");

    
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(0);
    expect(card.interval * 24 * 60).toBeCloseTo(1, 0.1);

    
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(1);
    expect(card.interval * 24 * 60).toBeCloseTo(10, 0.1);

    
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.learningStep).toBeUndefined();
    expect(card.interval).toBeGreaterThan(0.9); 

    
    const firstInterval = card.interval;
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.interval).toBeGreaterThan(firstInterval); 
  });

  it("Scenario 2: Struggling Learner (New -> Again -> Again -> Good -> Good)", () => {
    let card = createNewCard("struggling-card");

    
    card = calculateNextReview(card, "Again", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(0);
    expect(card.interval * 24 * 60).toBeCloseTo(1, 0.1);

    
    for (let i = 0; i < 5; i++) {
      card = calculateNextReview(card, "Again", undefined, learningSteps);
      expect(card.learningStep).toBe(0);
    }

    
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.learningStep).toBe(1);

    
    card = calculateNextReview(card, "Good", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.interval).toBeGreaterThan(0.9);
  });

  it("Scenario 3: Lapsing Card (Review -> Again -> Relearning -> Review)", () => {
    let card = createNewCard("lapsing-card");

    
    card = calculateNextReview(card, "Easy", undefined, learningSteps);
    expect(card.status).toBe(CardStatus.REVIEW);
    const preLapseStability = card.stability;

    
    const lapsesSettings: LapsesSettings = {
      relearnSteps: [10],
      leechThreshold: 8,
    };
    card = calculateNextReview(
      card,
      "Again",
      undefined,
      learningSteps,
      lapsesSettings,
    );

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.state).toBe(State.Relearning);
    expect(card.learningStep).toBe(0);
    expect(card.lapses).toBe(1);
    expect(card.stability).toBeLessThan(preLapseStability || 100); 

    
    card = calculateNextReview(
      card,
      "Good",
      undefined,
      learningSteps,
      lapsesSettings,
    );
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.interval).toBeGreaterThan(0);
  });

  it("Scenario 4: Broken History Recovery (Simulate bug state -> Recover)", () => {
    let card = createNewCard("broken-card");
    
    card = {
      ...card,
      status: CardStatus.REVIEW,
      state: State.Review,
      learningStep: undefined, 
      stability: -1, 
      difficulty: 0,
      reps: 5,
      elapsed_days: 1,
      scheduled_days: 1,
      last_review: new Date(Date.now() - 86400000).toISOString(), 
      interval: 0.005, 
    };

    
    card = calculateNextReview(card, "Good", undefined, learningSteps);

    if (card.status !== CardStatus.REVIEW) {
      console.log("Failed recovery card:", JSON.stringify(card, null, 2));
    }

    
    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.interval).toBeGreaterThan(0.9); 
    expect(card.stability).toBeGreaterThan(0);
  });
});
