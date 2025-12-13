import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveAllCards, getCards, clearAllCards } from "./cardRepository";
import { Card, LanguageId } from "@/types";
import { db } from "@/db/dexie";
import { v4 as uuidv4 } from "uuid";

describe("cardRepository - saveAllCards Reproduction", () => {
    beforeEach(async () => {
        await clearAllCards();
    });

    it("should save all cards even when called rapidly", async () => {
        const cards: Card[] = [];
        for (let i = 0; i < 50; i++) {
            cards.push({
                id: uuidv4(),
                language: LanguageId.Polish,
                targetSentence: `Sentence ${i}`,
                nativeTranslation: `Translation ${i}`,
                notes: "",
                type: 0,
                queue: 0,
                due: 0,
                last_modified: 0,
                left: 0,
                interval: 0,
                easeFactor: 2.5,
                reps: 0,
                lapses: 0,
                user_id: "test_user"
            } as any);
        }

        await saveAllCards(cards);

        const savedCards = await db.cards.where("user_id").equals("test_user").toArray();
        expect(savedCards.length).toBe(50);
    });
});
