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
        // Step 0: New Card
        let card = createBaseCard({
            status: CardStatus.NEW,
            learningStep: 0, // effectively 0 even if undefined
        });
        const steps = [1, 10, 60];

        // 1. New -> Good. Should go to Step 0 (1m).
        card = calculateNextReview(card, "Good", undefined, steps);
        
        expect(card.status).toBe(CardStatus.LEARNING);
        expect(card.learningStep).toBe(0);
        expect(card.interval).toBeCloseTo(1 / (24 * 60)); // 1 minute in days

        // 2. Learning (Step 0) -> Good. Should go to Step 1 (10m).
        card = calculateNextReview(card, "Good", undefined, steps);
        
        expect(card.status).toBe(CardStatus.LEARNING);
        expect(card.learningStep).toBe(1);
        expect(card.interval).toBeCloseTo(10 / (24 * 60)); // 10 minutes in days

        // 3. Learning (Step 1) -> Good. Should go to Step 2 (60m).
        card = calculateNextReview(card, "Good", undefined, steps);

        expect(card.status).toBe(CardStatus.LEARNING);
        expect(card.learningStep).toBe(2);
        expect(card.interval).toBeCloseTo(60 / (24 * 60)); // 60 minutes in days

        // 4. Learning (Step 2) -> Good. Should Graduate.
        card = calculateNextReview(card, "Good", undefined, steps);
        
        expect(card.status).toBe(CardStatus.REVIEW);
        expect(card.learningStep).toBeUndefined();
    });

    it("should correctly progress through 2 learning steps [1, 10]", () => {
        // Step 0: New Card
        let card = createBaseCard({
            status: CardStatus.NEW,
            learningStep: 0,
        });
        const steps = [1, 10];

        // 1. New -> Good. Should go to Step 0 (1m).
        card = calculateNextReview(card, "Good", undefined, steps);
        
        expect(card.status).toBe(CardStatus.LEARNING);
        expect(card.learningStep).toBe(0);
        expect(card.interval).toBeCloseTo(1 / (24 * 60));

        // 2. Learning (Step 0) -> Good. Should go to Step 1 (10m).
        card = calculateNextReview(card, "Good", undefined, steps);

         expect(card.status).toBe(CardStatus.LEARNING);
        expect(card.learningStep).toBe(1);
        expect(card.interval).toBeCloseTo(10 / (24 * 60));

        // 3. Learning (Step 1) -> Good. Should Graduate.
        card = calculateNextReview(card, "Good", undefined, steps);
        
        expect(card.status).toBe(CardStatus.REVIEW);
        expect(card.learningStep).toBeUndefined();
    });

    it("should NOT graduate prematurely if current step is valid", () => {
        // Edge case: user has [10m].
        // New -> Good. Should Go to Step 0? Or Graduate?
        // Anki default: New+Good -> Skips first step if 2 steps.
        // If 1 step: New+Good -> ?
        
        let card = createBaseCard({
            status: CardStatus.NEW,
            learningStep: 0,
        });
        const steps = [10];

        // 1. New -> Good.
        // If I have 1 step, I probably expect to see it at 10m?
        // But code skips first step?
        card = calculateNextReview(card, "Good", undefined, steps);
        
        // If it graduates here, user might be confused if they expected to see it in 10m.
        console.log("Status after Good on [10m]:", card.status);
    });

    it("should recover learningStep from interval if undefined (BUG FIX)", () => {
        // SCENARIO: User has [1, 10, 60] steps.
        // Card is in LEARNING. Interval is 10m (Step 1).
        // BUT learningStep is undefined (persistence loss).
        
        // Without fix: logic sees undefined, thinks NEW or defaults to 0.
        // If it defaults to 0: New interval -> 1m. LOOP!
        
        // With fix: logic sees 10m interval. Matches to Step 1.
        // Next Good -> Step 2 (60m).
        
        const steps = [1, 10, 60];
        
        const cardLikeLostState = createBaseCard({
            status: CardStatus.LEARNING,
            state: 1, // Learning
            learningStep: undefined, // LOST!
            interval: 10 / (24 * 60), // 10 minutes
        });
        
        const next = calculateNextReview(cardLikeLostState, "Good", undefined, steps);
        
        // Expect minimal correct behavior: 
        // Should NOT go back to 1 minute.
        // Should go to 60 minutes (Step 2).
        
        expect(next.status).toBe(CardStatus.LEARNING);
        // Step 1 was 10m. Next is Step 2 (60m).
        expect(next.interval).toBeCloseTo(60 / (24 * 60)); 
    });
});
