import { renderHook, act, waitFor } from "@testing-library/react";
import { useStudyQueue } from "./useStudyQueue";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useXpSession } from "./useXpSession";

vi.mock("./useXpSession");
vi.mock("@/core/srs/scheduler", () => ({ 
    calculateNextReview: vi.fn().mockReturnValue({ due: 100, state: 1 }), 
    isCardDue: vi.fn().mockReturnValue(true) 
}));

describe("useStudyQueue", () => {
    const mockCard: any = { id: "1", state: 0, type: 0, due: 0 };
    const defaultProps = {
        dueCards: [mockCard],
        cardOrder: "newFirst" as const,
        ignoreLearningStepsWhenNoCards: false,
        fsrs: { w: [] } as any,
        learningSteps: [],
        onUpdateCard: vi.fn(),
        onRecordReview: vi.fn(),
        dailyStreak: 1,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useXpSession as any).mockReturnValue({
            sessionXp: 0, sessionStreak: 0, multiplierInfo: {},
            processCardResult: vi.fn().mockReturnValue({ totalXp: 10 }),
            subtractXp: vi.fn(),
        });
    });

    it("should initialize with cards", () => {
        const { result } = renderHook(() => useStudyQueue(defaultProps));
        expect(result.current.stats.totalCards).toBe(1);
        expect(result.current.currentCard).toEqual(mockCard);
        expect(result.current.stats.isFinished).toBe(false);
    });

    it("should flip card", () => {
        const { result } = renderHook(() => useStudyQueue(defaultProps));
        
        act(() => {
            result.current.uiState.setIsFlipped(true);
        });

        expect(result.current.uiState.isFlipped).toBe(true);
    });

    it("should grade card and record review", async () => {
        const { result } = renderHook(() => useStudyQueue(defaultProps));
        
        act(() => {
            result.current.uiState.setIsFlipped(true);
        });

        await act(async () => {
            await result.current.actions.gradeCard("Good");
        });

        expect(defaultProps.onRecordReview).toHaveBeenCalled();
        expect(useXpSession(1, false).processCardResult).toHaveBeenCalled();
    });

    it("should mark known", async () => {
         const { result } = renderHook(() => useStudyQueue(defaultProps));
        
         await act(async () => {
             await result.current.actions.markKnown();
         });

         expect(defaultProps.onUpdateCard).toHaveBeenCalledWith(expect.objectContaining({ state: 2 })); // Review state
    });
});
