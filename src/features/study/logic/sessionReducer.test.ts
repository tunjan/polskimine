import { reducer, SessionState, Action, getInitialStatus, checkSchedule } from "./sessionReducer";
import { describe, it, expect } from "vitest";
import { Card } from "@/types";

describe("sessionReducer", () => {
    const mockCard: Card = { id: "1", type: 0, due: 0, state: 0 } as any; 
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
        
        const updatedCard = { ...mockCard, type: 1, due: Date.now() + 10000 };
        
        const next = reducer(processingState, { 
            type: "GRADE_SUCCESS", 
            updatedCard, 
            isLast: false, 
            now: new Date(), 
            ignoreLearningSteps: false 
        });

        expect(next.cards).toContain(updatedCard);
        expect(next.status).toBe("WAITING"); 
        
        
        
        
        
        
        
        
        
        
        
        
        expect(next.currentIndex).toBe(1);
    });

    it("should handle COMPLETE", () => {
        const lastState = { ...initialState, status: "PROCESSING" as const };
        const next = reducer(lastState, { 
            type: "GRADE_SUCCESS", 
            isLast: true, 
            updatedCard: undefined, 
            now: new Date(),
            ignoreLearningSteps: false
        });
        
        
        
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
