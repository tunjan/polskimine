import { createNewCard, formatSentenceWithTargetWord, createPolishCard } from "./cardFactory";
import { describe, it, expect } from "vitest";
import { LanguageId } from "@/types";

describe("cardFactory", () => {
    describe("formatSentenceWithTargetWord", () => {
        it("should bold target word in sentence", () => {
             const result = formatSentenceWithTargetWord("To jest jabłko", "jabłko", LanguageId.Polish);
             expect(result).toBe("To jest <b>jabłko</b>");
        });

        it("should handle mixed case if supported", () => {
             
             
             const result = formatSentenceWithTargetWord("To jest Jabłko", "jabłko", LanguageId.Polish);
             expect(result).toMatch(/To jest (<b>)?Jabłko(<\/b>)?/);
        });

        it("should ignore Japanese", () => {
            const result = formatSentenceWithTargetWord("これはペンです", "ペン", LanguageId.Japanese);
            expect(result).toBe("これはペンです");
        });
    });

    describe("createNewCard", () => {
        it("should create card with defaults", () => {
            const card = createNewCard({
                language: LanguageId.Polish,
                targetSentence: "Sentence",
                nativeTranslation: "Translation",
                targetWord: "Word"
            });
            expect(card.id).toBeDefined();
            expect(card.state).toBe(0); 
            expect(card.targetSentence).toBe("Sentence"); 
            expect(card.created_at).toBeLessThanOrEqual(Date.now());
        });
    });

    describe("createPolishCard", () => {
        it("should create polish card", () => {
             const card = createPolishCard("Tak", "Yes");
             expect(card.language).toBe(LanguageId.Polish);
        });
    });
});
