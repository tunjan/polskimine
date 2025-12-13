import { renderHook, act, waitFor } from "@testing-library/react";
import { useAIAnalysis } from "./useAIAnalysis";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiService } from "@/lib/ai";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Card, LanguageId } from "@/types";
import { toast } from "sonner";

vi.mock("@/lib/ai");
vi.mock("@/stores/useSettingsStore");
vi.mock("@/db/repositories/cardRepository", () => ({ getCardByTargetWord: vi.fn().mockResolvedValue(null) }));
vi.mock("@/db/dexie", () => ({ db: { cards: { where: vi.fn() } } }));
const { mockToast } = vi.hoisted(() => ({ mockToast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("sonner", () => ({ toast: mockToast }));

describe("useAIAnalysis", () => {
    const mockCard: Card = { id: "1", targetSentence: "S", language: LanguageId.Polish } as any;
    const defaultProps = {
        card: mockCard,
        language: LanguageId.Polish,
        apiKey: "key",
        selection: { text: "word" },
        clearSelection: vi.fn(),
        onAddCard: vi.fn(),
        onUpdateCard: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSettingsStore as any).mockReturnValue({ proficiency: {} });
        (useSettingsStore as any).getState = vi.fn().mockReturnValue({ proficiency: {} });
    });

    it("should analyze word", async () => {
        (aiService.analyzeWord as any).mockResolvedValue({ definition: "Def" });
        const { result } = renderHook(() => useAIAnalysis(defaultProps));

        await act(async () => {
            await result.current.handleAnalyze();
        });

        expect(aiService.analyzeWord).toHaveBeenCalled();
        expect(result.current.analysisResult).toEqual(expect.objectContaining({ definition: "Def" }));
        expect(result.current.isAnalysisOpen).toBe(true);
    });

    it("should generate card from selection", async () => {
        (aiService.lemmatizeWord as any).mockResolvedValue("lemma");
        (aiService.generateSentenceForWord as any).mockResolvedValue({ targetSentence: "Sent", targetWordTranslation: "Trans" });
        
        const { result } = renderHook(() => useAIAnalysis(defaultProps));
        
        await act(async () => {
            await result.current.handleGenerateCard();
        });

        expect(aiService.lemmatizeWord).toHaveBeenCalled();
        expect(aiService.generateSentenceForWord).toHaveBeenCalled();
        expect(defaultProps.onAddCard).toHaveBeenCalledWith(expect.objectContaining({ targetWord: "lemma" }));
        expect(mockToast.success).toHaveBeenCalled();
    });

    it("should modify card", async () => {
        (aiService.modifyCard as any).mockResolvedValue({ formattedSentence: "Modified" });
        const { result } = renderHook(() => useAIAnalysis(defaultProps));

        await act(async () => {
            await result.current.handleModifyCard("easier");
        });

        expect(aiService.modifyCard).toHaveBeenCalledWith(expect.anything(), "easier", "key");
        expect(defaultProps.onUpdateCard).toHaveBeenCalledWith(expect.objectContaining({ targetSentence: "Modified" }));
    });
});
