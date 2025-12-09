import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/dexie";
import { saveCard, getCards } from "./cardRepository";
import { Card, CardStatus, LanguageId } from "@/types";
import { State } from "ts-fsrs";

describe("cardRepository - Persistence Repro", () => {
  beforeEach(async () => {
    localStorage.setItem("linguaflow_current_user", "test-user");
    await db.cards.clear();
  });

  it("should persist learningStep correctly", async () => {
    const card: Card = {
      id: "persistence-test-1",
      targetSentence: "Test",
      nativeTranslation: "Test",
      status: CardStatus.LEARNING,
      state: State.Learning,
      due: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      last_review: new Date().toISOString(),
      stability: 1,
      difficulty: 1,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 1,
      lapses: 0,
      interval: 0.001,
      easeFactor: 2.5,
      language: LanguageId.Polish,
      notes: "",
      learningStep: 1, // Crucial field
    };

    await saveCard(card);

    const cards = await getCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("persistence-test-1");
    expect(cards[0].learningStep).toBe(1);
  });

  it("should persist learningStep via update", async () => {
    // 1. Save initial card
    let card: Card = {
      id: "persistence-test-2",
      targetSentence: "Test",
      nativeTranslation: "Test",
      status: CardStatus.LEARNING,
      learningStep: 0,
      interval: 0,
      easeFactor: 2.5,
      language: LanguageId.Polish,
      dueDate: new Date().toISOString(),
      notes: "",
    };
    await saveCard(card);

    // 2. Load and update
    const [loaded] = await getCards();
    expect(loaded.learningStep).toBe(0);

    // 3. Simulate scheduler update
    loaded.learningStep = 1;
    await saveCard(loaded);

    // 4. Load again
    const [reloaded] = await getCards();
    expect(reloaded.learningStep).toBe(1);
  });
});
