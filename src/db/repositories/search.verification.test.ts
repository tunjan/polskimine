
import { describe, it, expect, beforeEach } from "vitest";
import Dexie from "dexie";
import { searchCards, saveCard, getCurrentUserId } from "./cardRepository";
import { db } from "@/db/dexie";
import { LanguageId } from "@/types";

// Mock localStorage
const mockUserId = "test-user-search";
global.localStorage = {
  getItem: (key: string) => (key === "linguaflow_current_user" ? mockUserId : null),
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
} as any;

describe("searchCards Verification", () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
        // Clear tables
        await db.cards.clear();
        await db.notes.clear();
    });

    it("should search cards by target sentence content", async () => {
        // Create 3 cards
        await saveCard({
            id: "1",
            targetSentence: "Hello World",
            nativeTranslation: "Hola Mundo",
            notes: "Greeting",
            language: LanguageId.Polish,
            user_id: mockUserId,
            type: 0, queue: 0, due: 0, interval: 0, easeFactor: 0, reps: 0, lapses: 0, left: 0,
            stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, state: 0,
            isBookmarked: false, isLeech: false,
            last_modified: Date.now(),
        });
        
        await saveCard({
            id: "2",
            targetSentence: "Another Card",
            nativeTranslation: "Otra tarjeta",
            notes: "More stuff",
            language: LanguageId.Polish,
            user_id: mockUserId,
            type: 0, queue: 0, due: 0, interval: 0, easeFactor: 0, reps: 0, lapses: 0, left: 0,
            stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, state: 0,
            isBookmarked: false, isLeech: false,
            last_modified: Date.now(),
        });

        // Search "World"
        const result1 = await searchCards(LanguageId.Polish, 0, 10, "World");
        expect(result1.count).toBe(1);
        expect(result1.data[0].targetSentence).toBe("Hello World");
        
        // Search "tarjeta" (translation)
        const result2 = await searchCards(LanguageId.Polish, 0, 10, "tarjeta");
        expect(result2.count).toBe(1);
        expect(result2.data[0].nativeTranslation).toBe("Otra tarjeta");
        
        // Search "stuff" (notes)
        const result3 = await searchCards(LanguageId.Polish, 0, 10, "stuff");
        expect(result3.count).toBe(1);
        expect(result3.data[0].notes).toBe("More stuff");
    });
});
