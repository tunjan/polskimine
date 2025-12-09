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
    leechCount: 10,     easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    targetSentence: "test",
    nativeTranslation: "test",
    notes: "test",
    language: "es",   } as any;

  it("should incorrectly mark suspended leech as KNOWN (reproducing the bug)", () => {
        const settings: Partial<UserSettings["fsrs"]> = {};
    const lapsesSettings = {
      leechThreshold: 1,
      leechAction: "suspend" as const,
      relearnSteps: [10],
    };

        const result = calculateNextReview(
      mockCard,
      "Again" as Grade,
      settings as any,
      [1, 10],       lapsesSettings
    );

                expect(result.isLeech).toBe(true);
    expect(result.status).toBe(CardStatus.SUSPENDED); 
  });
});
