import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";
import { calculateNextReview } from "./scheduler";
import { inferCardState } from "./stateUtils";

describe("Bug Reproduction: Incorrect State Inference for Learning Cards", () => {
  it("should not reclassify a Learning card as Relearning after a failure", () => {
    // 1. Create a New card
    const card: Card = {
      id: "test-card",
      status: CardStatus.NEW,
      state: State.New,
      interval: 0,
      easeFactor: 0,
      dueDate: new Date().toISOString(),
      targetSentence: "test",
      nativeTranslation: "test",
      notes: "",
      language: "pl",
      lapses: 0, // Initially 0
      reps: 0,
    };

    // 2. Fail the card (Again)
    const learningSteps = [1, 10, 1440]; // 1m, 10m, 1d
    const failedCard = calculateNextReview(card, "Again", undefined, learningSteps);

    // Verify scheduler behavior: it DOES increment lapses
    expect(failedCard.lapses).toBe(0);
    expect(failedCard.status).toBe(CardStatus.LEARNING);
    // It correctly sets state to Learning initially
    expect(failedCard.state).toBe(State.Learning);

    // 3. Simulate state loss (e.g. reload from DB where state was not strictly persisted or just re-inferred)
    // We pass the card to inferCardState. 
    // Note: inferCardState prefers card.state if present, so we simulate the case where it might be missing
    // or where we are re-evaluating strictly from status/lapses.
    const cardWithoutState = { ...failedCard, state: undefined };
    
    const inferredState = inferCardState(cardWithoutState as Card);

    // BUG: It infers Relearning because lapses > 0
    // We WANT it to be Learning
    expect(inferredState).toBe(State.Learning); 
  });
});
