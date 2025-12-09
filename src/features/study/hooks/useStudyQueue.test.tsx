import { renderHook, act } from "@testing-library/react";
import { useStudyQueue } from "./useStudyQueue";
import { describe, it, expect, vi } from "vitest";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

// Mock dependencies if needed
vi.mock("./useXpSession", () => ({
  useXpSession: () => ({
    sessionXp: 0,
    sessionStreak: 0,
    multiplierInfo: { label: "1x", multiplier: 1 },
    processCardResult: () => ({ totalXp: 10, baseXp: 10, bonusXp: 0 }),
    subtractXp: vi.fn(),
  }),
}));

const mockCard: Card = {
  id: "1",
  targetSentence: "Sentence 1",
  nativeTranslation: "Translation 1",
  notes: "",
  language: "pl", // 'pl' for Polish assuming typical usage, or just a string
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
  interval: 1,
  easeFactor: 2.5,
  created_at: new Date().toISOString(),
};

const mockCard2: Card = { ...mockCard, id: "2", targetSentence: "Sentence 2" };

describe("useStudyQueue", () => {
  const defaultProps = {
    dueCards: [mockCard, mockCard2],
    reserveCards: [],
    cardOrder: "newFirst" as const,
    ignoreLearningStepsWhenNoCards: false,
    fsrs: {
        request_retention: 0.9,
        maximum_interval: 365,
        w: [],
      } as any,
    learningSteps: [1, 10],
    onUpdateCard: vi.fn(),
    onRecordReview: vi.fn(),
    canUndo: true,
    onUndo: vi.fn(),
    dailyStreak: 0,
    isCramMode: false,
  };

  it("should NOT reset session progress when dueCards prop updates", async () => {
    const { result, rerender } = renderHook((props) => useStudyQueue(props), {
      initialProps: defaultProps,
    });

    // 1. Verify initial state
    expect(result.current.stats.currentIndex).toBe(0);
    expect(result.current.currentCard.id).toBe("1");

    // 2. Advance to next card
    act(() => {
        result.current.uiState.setIsFlipped(true);
    });
    
    await act(async () => {
        await result.current.actions.gradeCard("Good");
    });

    // Verify index advanced
    expect(result.current.stats.currentIndex).toBe(1);
    expect(result.current.currentCard.id).toBe("2");

    // 3. Update dueCards prop (simulate background re-fetch)
    const newDueCards = [mockCard, mockCard2]; // Same content, new reference
    
    rerender({
        ...defaultProps,
        dueCards: newDueCards
    });

    // 4. Assert session did NOT reset
    expect(result.current.stats.currentIndex).toBe(1);
    expect(result.current.currentCard.id).toBe("2");
  });

  it("should revert card state on undo (single card scenario)", async () => {
    // Setup a single NEW card. 
    // This forces the 'isLast' path in reducer, which updates in-place.
    const newCard: Card = {
        ...mockCard,
        id: "new-1",
        status: CardStatus.NEW,
        state: State.New,
        step: 0
    };
    
    // Only ONE card in dueCards
    const propsSingleCard = {
        ...defaultProps,
        dueCards: [newCard]
    };

    const { result } = renderHook((props) => useStudyQueue(props), {
      initialProps: propsSingleCard,
    });

    // 1. Initial state check
    expect(result.current.stats.currentIndex).toBe(0);
    const initialCard = result.current.currentCard;
    expect(initialCard.status).toBe(CardStatus.NEW);

    // 2. Grade the card (New -> Learning)
    act(() => {
        result.current.uiState.setIsFlipped(true);
    });
    
    await act(async () => {
        // Mock calculateNextReview response if needed, but it should default to reasonable transition
        await result.current.actions.gradeCard("Good");
    });
    
    // For single card, if it becomes Learning, it stays at index 0 (rescheduled 'soon')
    // but the reducer logic for 'isLast' + 'learning' returns checkSchedule.
    // checkSchedule might keep it at status 'WAITING' or 'IDLE' depending on due time.
    // But importantly, the card object at index 0 should have been UPDATED to 'Learning'.
    
    
    expect(result.current.currentCard.status).not.toBe(CardStatus.NEW);
    // It should effectively be 'Learning' or have new state.

    // 3. Undo
    act(() => {
        result.current.actions.undo();
    });

    // 4. Verify we are still at index 0 (or back to it)
    expect(result.current.stats.currentIndex).toBe(0);

    // 5. Verify the card state is reverted
    const currentCardAfterUndo = result.current.currentCard;
    
    // The bug: This will assume the modified state (Learning) instead of reverting to NEW
    expect(currentCardAfterUndo.status).toBe(CardStatus.NEW);
    expect(currentCardAfterUndo.state).toBe(State.New);
  });
});
