import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as cardRepo from "./cardRepository";
import { saveCard, getCards, clearAllCards } from "./cardRepository";
import { Card, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db/dexie";

describe("cardRepository - Mapping Verification", () => {
    beforeEach(async () => {
        // Mock localStorage
        const userId = "test_user_mapping";
        global.localStorage = {
            getItem: vi.fn((key) => key === "linguaflow_current_user" ? userId : null),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            key: vi.fn(),
            length: 1,
        } as any;

        // Still spy on it just in case, but localStorage is the real dependency
        // vi.spyOn(cardRepo, 'getCurrentUserId').mockReturnValue(userId); 
        await clearAllCards();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // @ts-ignore
        global.localStorage = undefined;
    });

    it("should correctly save and load targetWord", async () => {
        const card: Card = {
            id: uuidv4(),
            language: LanguageId.Polish,
            targetSentence: "To jest jabłko",
            nativeTranslation: "This is an apple",
            targetWord: "jabłko",
            notes: "Some notes",
            type: 0,
            queue: 0,
            due: 0,
            last_modified: 0,
            left: 0,
            interval: 0,
            easeFactor: 2.5,
            reps: 0,
            lapses: 0,
            user_id: "test_user_mapping"
        } as any;

        await saveCard(card);

        // Check DB directly first
        const savedAnkiCard = await (db as any).cards.get(parseInt(card.id as string) || 0); // card.id is UUID, saveCard generates timestamp ID.
        // Wait, saveCard generates a NEW ID. We don't know it easily.
        // Query by target_sentence
        const savedAnkiCards = await (db as any).cards.toArray();
        const targetCard = savedAnkiCards.find((c: any) => c.target_sentence === "To jest jabłko");
        
        expect(targetCard).toBeDefined();
        expect(targetCard.target_word).toBe("jabłko");
        expect(targetCard).toBeDefined();
        expect(targetCard.target_word).toBe("jabłko");

        // Verify getCards
        const loadedCards = await getCards();
        
        const loadedCard = loadedCards.find(c => c.targetSentence === card.targetSentence);
        expect(loadedCard).toBeDefined();
        expect(loadedCard?.targetWord).toBe("jabłko");
    });
});
