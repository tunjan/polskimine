import { describe, it, expect } from "vitest";
import { calculateNextReview } from "./core/srs/scheduler";
import { Card, CardStatus } from "@/types";

const createBaseCard = (overrides: Partial<Card> = {}): Card => ({
  id: "test-card-repro",
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

describe("scheduler bug reproduction", () => {
  it("should graduate after the last learning step", () => {
    
    const steps = [1, 10];

    
    let card = createBaseCard({ status: CardStatus.NEW, learningStep: 0 });

    
    console.log("Step 1: New -> Good");
    card = calculateNextReview(card, "Good", undefined, steps);
    console.log(
      `Status: ${card.status}, Interval: ${card.interval * 24 * 60}m, Step: ${card.learningStep}`,
    );

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.interval * 24 * 60).toBeCloseTo(1, 0.1);
    expect(card.learningStep).toBe(0);

    
    console.log("Step 2: Learning(0) -> Good");
    card = calculateNextReview(card, "Good", undefined, steps);
    console.log(
      `Status: ${card.status}, Interval: ${card.interval * 24 * 60}m, Step: ${card.learningStep}`,
    );

    expect(card.status).toBe(CardStatus.LEARNING);
    expect(card.interval * 24 * 60).toBeCloseTo(10, 0.1);
    expect(card.learningStep).toBe(1);

    
    console.log("Step 3: Learning(1) -> Good");
    card = calculateNextReview(card, "Good", undefined, steps);
    console.log(
      `Status: ${card.status}, Interval: ${card.interval} days, Step: ${card.learningStep}`,
    );

    
    
    expect(card.status).not.toBe(CardStatus.LEARNING);
    expect(card.interval).toBeGreaterThan(10 / (24 * 60)); 
  });
});

import { mapToCard, DBRawCard } from "./db/repositories/cardRepository";

describe("persistence check", () => {
  it("should preserve learningStep: 0 through mapToCard", () => {
    const raw: DBRawCard = {
      id: "1",
      targetSentence: "t",
      nativeTranslation: "n",
      language: "polish",
      status: CardStatus.LEARNING,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
      learningStep: 0,
      notes: "",
      isLeech: false,
      isBookmarked: false,
    };

    const card = mapToCard(raw);
    expect(card.learningStep).toBe(0);
  });

  it("should preserve learningStep: 1 through mapToCard", () => {
    const raw: DBRawCard = {
      id: "1",
      targetSentence: "t",
      nativeTranslation: "n",
      language: "polish",
      status: CardStatus.LEARNING,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
      learningStep: 1,
      notes: "",
      isLeech: false,
      isBookmarked: false,
    };

    const card = mapToCard(raw);
    expect(card.learningStep).toBe(1);
  });

  it("should handle missing learningStep as undefined", () => {
    const raw: DBRawCard = {
      id: "1",
      targetSentence: "t",
      nativeTranslation: "n",
      language: "polish",
      status: CardStatus.LEARNING,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
      
      notes: "",
      isLeech: false,
      isBookmarked: false,
    };

    const card = mapToCard(raw);
    expect(card.learningStep).toBeUndefined();
  });
});
