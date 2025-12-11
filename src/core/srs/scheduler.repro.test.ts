import { describe, it, expect } from "vitest";
import { calculateNextReview } from "./scheduler";
import { Card, CardStatus } from "@/types";

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

describe("scheduler reproduction", () => {
  it("should correctly progress through 3 learning steps [1, 10, 60]", () => {
    
    let card = createBaseCard({
      status: CardStatus.NEW,
      learningStep: 0, 
    });
    const steps = [1, 10, 60];

    
    card = calculateNextReview(card, "Good", undefined, steps);

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(0);
    expect(card.interval).toBeCloseTo(1 / (24 * 60)); 

    
    card = calculateNextReview(card, "Good", undefined, steps);

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(1);
    expect(card.interval).toBeCloseTo(10 / (24 * 60)); 

    
    card = calculateNextReview(card, "Good", undefined, steps);

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(2);
    expect(card.interval).toBeCloseTo(60 / (24 * 60)); 

    
    card = calculateNextReview(card, "Good", undefined, steps);

    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.learningStep).toBeUndefined();
  });

  it("should correctly progress through 2 learning steps [1, 10]", () => {
    
    let card = createBaseCard({
      status: CardStatus.NEW,
      learningStep: 0,
    });
    const steps = [1, 10];

    
    card = calculateNextReview(card, "Good", undefined, steps);

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(0);
    expect(card.interval).toBeCloseTo(1 / (24 * 60));

    
    card = calculateNextReview(card, "Good", undefined, steps);

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.learningStep).toBe(1);
    expect(card.interval).toBeCloseTo(10 / (24 * 60));

    
    card = calculateNextReview(card, "Good", undefined, steps);

    expect(card.status).toBe(CardStatus.REVIEW);
    expect(card.learningStep).toBeUndefined();
  });

  it("should NOT graduate prematurely if current step is valid", () => {
    
    
    
    

    let card = createBaseCard({
      status: CardStatus.NEW,
      learningStep: 0,
    });
    const steps = [10];

    
    
    
    card = calculateNextReview(card, "Good", undefined, steps);

    
    console.log("Status after Good on [10m]:", card.status);
  });

  it("should recover learningStep from interval if undefined (BUG FIX)", () => {
    
    
    

    
    

    
    

    const steps = [1, 10, 60];

    const cardLikeLostState = createBaseCard({
      status: CardStatus.LEARNING,
      state: 1, 
      learningStep: undefined, 
      interval: 10 / (24 * 60), 
    });

    const next = calculateNextReview(
      cardLikeLostState,
      "Good",
      undefined,
      steps,
    );

    
    
    

    expect(next.status).toBe(CardStatus.LEARNING);
    
    expect(next.interval).toBeCloseTo(60 / (24 * 60));
  });
});
