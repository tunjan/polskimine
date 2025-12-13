import { generateInitialDeck } from "./deckGeneration";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiService } from "@/lib/ai";
import { LanguageId } from "@/types";

vi.mock("@/lib/ai");

describe("generateInitialDeck", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should throw if no API key", async () => {
        await expect(generateInitialDeck({ language: LanguageId.Polish, proficiencyLevel: "A1" }))
            .rejects.toThrow("API Key is required");
    });

    it("should generate cards using AI service", async () => {
        const mockCards = [
            { targetSentence: "S1", nativeTranslation: "T1", targetWord: "W1" }
        ];
        (aiService.generateBatchCards as any).mockResolvedValue(mockCards);

        const result = await generateInitialDeck({ language: LanguageId.Polish, proficiencyLevel: "A1", apiKey: "key" });
        
        expect(aiService.generateBatchCards).toHaveBeenCalledTimes(4); // 4 topics
        expect(result.length).toBe(4); // 1 card per batch * 4 batches
        expect(result[0].targetSentence).toBe("S1");
        expect(result[0].tags).toContain("AI-Gen");
        expect(result[0].type).toBe(0); // New
    });

    it("should handle AI service failure", async () => {
        (aiService.generateBatchCards as any).mockRejectedValue(new Error("AI Error"));
        
        await expect(generateInitialDeck({ language: LanguageId.Polish, proficiencyLevel: "A1", apiKey: "key" }))
            .rejects.toThrow("AI Error");
    });
});
