import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDueCards, saveCard } from "./cardRepository";
import { db } from "@/db/dexie";
import { LanguageId, Card } from "@/types";

describe("getDueCards - Skip Learning Wait Reproduction", () => {
  const userId = "test_user";
  const language = LanguageId.Polish;

  beforeEach(async () => {
    localStorage.setItem("linguaflow_current_user", userId);
    await db.cards.clear();
    await db.notes.clear();
  });

  it("should return future learning cards when ignoreLearningSteps is true", async () => {
    const now = new Date();
    const nowSeconds = Math.floor(now.getTime() / 1000);
    const futureDue = nowSeconds + 600; // Due in 10 minutes

    const card: Card = {
      id: "1",
      targetSentence: "Dzień dobry",
      nativeTranslation: "Good morning",
      notes: "",
      language,
      type: 0, // New
      queue: 1, // Learning
      due: futureDue,
      last_modified: nowSeconds,
      left: 0,
      interval: 0,
      easeFactor: 2500,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: 1 as any, // Learning
      isLeech: false,
      isBookmarked: false,
      user_id: userId,
      created_at: nowSeconds,
    };

    // Save the card
    await saveCard(card);

    // Case 1: ignoreLearningSteps = false (Default)
    // Should NOT find the card because it is due in the future
    const cardsDefault = await getDueCards(now, language, false);
    expect(cardsDefault).toHaveLength(0);

    // Case 2: ignoreLearningSteps = true
    // Should find the card even though it is due in the future
    const cardsIgnored = await getDueCards(now, language, true);
    // This Expectation fails currently because of the bug
    expect(cardsIgnored).toHaveLength(1);
    // expect(cardsIgnored[0].id).toBe("1"); // ID is overwritten by saveCard logic
  });
});
