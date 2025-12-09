import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/dexie";
import { saveCard } from "./cardRepository";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

describe("cardRepository", () => {
  beforeEach(async () => {
    await db.cards.clear();
  });

  it("should persist NaN values when saving a corrupted card (reproduction)", async () => {
    const corruptedCard: Card = {
      id: "nan-card",
      targetSentence: "Test",
      notes: "",
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
      reps: 0,
      lapses: 0,
      interval: NaN,
      easeFactor: 2.5,

      language: "polish",
    };

    await saveCard(corruptedCard);

    const storedCard = await db.cards.get("nan-card");

    expect(storedCard).toBeDefined();
    expect(storedCard?.interval).toBe(0);
  });
});
