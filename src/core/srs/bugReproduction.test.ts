import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";
import { calculateNextReview } from "./scheduler";
import { inferCardState } from "./stateUtils";

describe("Bug Reproduction: Incorrect State Inference for Learning Cards", () => {
  it("should not reclassify a Learning card as Relearning after a failure", () => {
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
      language: "polish",
      lapses: 0,
      reps: 0,
    };

    const learningSteps = [1, 10, 1440];
    const failedCard = calculateNextReview(
      card,
      "Again",
      undefined,
      learningSteps,
    );

    expect(failedCard.lapses).toBe(0);
    expect(failedCard.status).toBe(CardStatus.LEARNING);
    expect(failedCard.state).toBe(State.Learning);

    const cardWithoutState = { ...failedCard, state: undefined };

    const inferredState = inferCardState(cardWithoutState as Card);

    expect(inferredState).toBe(State.Learning);
  });
});
