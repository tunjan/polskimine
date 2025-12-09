import { calculateNextReview } from "./scheduler";
import { Card, CardStatus, Grade, UserSettings } from "@/types";
import { State } from "ts-fsrs";

describe("Leech Suspend Bug", () => {
  const mockCard: Card = {
    id: "test-card",
    status: CardStatus.REVIEW,
    state: State.Review,
    lapses: 0,
    reps: 5,
    interval: 10,
    isLeech: true,
    leechCount: 10, // Make sure it stays a leech
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    targetSentence: "test",
    nativeTranslation: "test",
    notes: "test",
    language: "es", // Using string as placeholder for Language enum if not easily imported, or cast
  } as any;

  it("should incorrectly mark suspended leech as KNOWN (reproducing the bug)", () => {
    // Setup: Leech threshold 1, Action Suspend
    const settings: Partial<UserSettings["fsrs"]> = {};
    const lapsesSettings = {
      leechThreshold: 1,
      leechAction: "suspend" as const,
      relearnSteps: [10],
    };

    // Fail the card to trigger leech
    const result = calculateNextReview(
      mockCard,
      "Again" as Grade,
      settings as any,
      [1, 10], // learning steps
      lapsesSettings
    );

    // BUG: Status is KNOWN, should be something else (or SUSPENDED when fixed)
    // For reproduction, we assert the current buggy behavior or just check strictly what we expect to FAIL once fixed.
    // If I want to assert the bug exists, I expect it to be KNOWN.
    expect(result.isLeech).toBe(true);
    expect(result.status).toBe(CardStatus.SUSPENDED); 
  });
});
