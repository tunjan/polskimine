
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/dexie";
import { saveCard, getDueCards, getDashboardCounts } from "./cardRepository";
import { Card, CardStatus, LanguageId } from "@/types";
import { State } from "ts-fsrs";

describe("cardRepository - Skip Learning Wait Repro", () => {
  beforeEach(async () => {
    localStorage.setItem("linguaflow_current_user", "test-user");
    await db.cards.clear();
  });

  it("should not fetch future learning cards by default", async () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 30); // Due in 30 mins

    const futureLearningCard: Card = {
      id: "future-learning",
      targetSentence: "Test",
      nativeTranslation: "Test",
      status: CardStatus.LEARNING,
      state: State.Learning,
      due: futureDate.toISOString(),
      dueDate: futureDate.toISOString(),
      last_review: new Date().toISOString(),
      stability: 1,
      difficulty: 1,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      interval: 0.001, // Short interval
      easeFactor: 2.5,
      language: LanguageId.Polish,
      notes: "",
    };

    await saveCard(futureLearningCard);

    const dueCards = await getDueCards(new Date(), LanguageId.Polish);
    expect(dueCards).toHaveLength(0);
  });

  it("should fetch future learning cards when ignoreLearningSteps is true", async () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 30); // Due in 30 mins

    const futureLearningCard: Card = {
      id: "future-learning-2",
      targetSentence: "Test",
      nativeTranslation: "Test",
      status: CardStatus.LEARNING,
      state: State.Learning,
      due: futureDate.toISOString(),
      dueDate: futureDate.toISOString(),
      last_review: new Date().toISOString(),
      stability: 1,
      difficulty: 1,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      interval: 0.001,
      easeFactor: 2.5,
      language: LanguageId.Polish,
      notes: "",
    };

    await saveCard(futureLearningCard);

    // This is expected to FAIL before the fix because getDueCards doesn't support the flag yet
    // @ts-ignore - Argument not yet added
    const dueCards = await getDueCards(new Date(), LanguageId.Polish, true);
    expect(dueCards[0].id).toBe("future-learning-2");
  });

  it("should include future learning cards in dashboard counts when ignoreLearningSteps is true", async () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 30); // Due in 30 mins

    const futureLearningCard: Card = {
      id: "future-learning-3",
      targetSentence: "Test",
      nativeTranslation: "Test",
      status: CardStatus.LEARNING,
      state: State.Learning,
      due: futureDate.toISOString(),
      dueDate: futureDate.toISOString(),
      last_review: new Date().toISOString(),
      stability: 1,
      difficulty: 1,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      interval: 0.001,
      easeFactor: 2.5,
      language: LanguageId.Polish,
      notes: "",
    };

    await saveCard(futureLearningCard);

    // @ts-ignore - Argument not yet added
    const countsStart = await getDashboardCounts(LanguageId.Polish, false);
    expect(countsStart.hueDue).toBe(0);

    // @ts-ignore - Argument not yet added
    const countsIgnored = await getDashboardCounts(LanguageId.Polish, true);
    expect(countsIgnored.hueDue).toBe(1);
  });
});
