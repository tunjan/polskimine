import { reducer, SessionState, Action, getInitialStatus, checkSchedule } from "./sessionReducer";
import { describe, it, expect } from "vitest";
import { Card } from "@/types";

describe("sessionReducer", () => {
    const mockCard: Card = { id: "1", type: 0, due: 0, state: 0 } as any; // Minimal mock
    const initialState: SessionState = {
        status: "IDLE",
        cards: [mockCard],
        reserveCards: [],
        currentIndex: 0,
        history: []
    };

    it("should handle FLIP", () => {
        const next = reducer(initialState, { type: "FLIP" });
        expect(next.status).toBe("FLIPPED");
    });

    it("should handle GRADE_SUCCESS (Wait/Learn logic)", () => {
        const processingState = { ...initialState, status: "PROCESSING" as const };
        // Card staying in queue (learning)
        const updatedCard = { ...mockCard, type: 1, due: Date.now() + 10000 };
        
        const next = reducer(processingState, { 
            type: "GRADE_SUCCESS", 
            updatedCard, 
            isLast: false, 
            now: new Date(), 
            ignoreLearningSteps: false 
        });

        expect(next.cards).toContain(updatedCard);
        expect(next.status).toBe("WAITING"); // Due in future
        // If ignoreLearningSteps = false, and due is future, checkSchedule might set WAITING
        // But checkSchedule says: if (isCardDue(current, now)) -> IDLE.
        // current is updatedCard?
        // Logic: newCards.push(updatedCard).
        // Then newIndex stays executing? No.
        // The reducer logic puts updated card at END or Current Index?
        // Logic: push(updatedCard). And NOT advancing index unless isLast?
        // Code: "if (updatedCard.type === 1) ... if (!isLast) newCards.push(updatedCard)".
        // And then "if (newIndex < newCards.length - 1) ... currentIndex: newIndex + 1".
        
        // Wait, if pushed to end, length increases.
        // next index is currentIndex + 1.
        expect(next.currentIndex).toBe(1);
    });

    it("should handle COMPLETE", () => {
        const lastState = { ...initialState, status: "PROCESSING" as const };
        const next = reducer(lastState, { 
            type: "GRADE_SUCCESS", 
            isLast: true, // Wait, isLast logic in reducer
            updatedCard: undefined, 
            now: new Date(),
            ignoreLearningSteps: false
        });
        // Logic for completion: if (newIndex < newCards.length - 1) ... else COMPLETE
        // newIndex is 0. newCards length 1. 0 < 0 is false.
        
        expect(next.status).toBe("COMPLETE");
    });

    it("should handle UNDO", () => {
        const historyState: SessionState = {
            ...initialState,
            status: "IDLE",
            currentIndex: 1,
            history: [{ addedCardId: null, cardSnapshot: mockCard }]
        };

        const next = reducer(historyState, { type: "UNDO" });
        expect(next.currentIndex).toBe(0);
        expect(next.status).toBe("FLIPPED");
        expect(next.history.length).toBe(0);
    });
});
