import { renderHook, act } from "@testing-library/react";
import { useStudyQueue } from "./useStudyQueue";
import { describe, it, expect, vi } from "vitest";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

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
  language: "polish",
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

    expect(result.current.stats.currentIndex).toBe(0);
    expect(result.current.currentCard.id).toBe("1");

    act(() => {
      result.current.uiState.setIsFlipped(true);
    });

    await act(async () => {
      await result.current.actions.gradeCard("Good");
    });

    expect(result.current.stats.currentIndex).toBe(1);
    expect(result.current.currentCard.id).toBe("2");

    const newDueCards = [mockCard, mockCard2];
    rerender({
      ...defaultProps,
      dueCards: newDueCards,
    });

    expect(result.current.stats.currentIndex).toBe(1);
    expect(result.current.currentCard.id).toBe("2");
  });

  it("should revert card state on undo (single card scenario)", async () => {
    const newCard: Card = {
      ...mockCard,
      id: "new-1",
      status: CardStatus.NEW,
      state: State.New,
      learningStep: 0,
    };

    const propsSingleCard = {
      ...defaultProps,
      dueCards: [newCard],
    };

    const { result } = renderHook((props) => useStudyQueue(props), {
      initialProps: propsSingleCard,
    });

    expect(result.current.stats.currentIndex).toBe(0);
    const initialCard = result.current.currentCard;
    expect(initialCard.status).toBe(CardStatus.NEW);

    act(() => {
      result.current.uiState.setIsFlipped(true);
    });

    await act(async () => {
      await result.current.actions.gradeCard("Good");
    });

    expect(result.current.currentCard.status).not.toBe(CardStatus.NEW);

    act(() => {
      result.current.actions.undo();
    });

    expect(result.current.stats.currentIndex).toBe(0);

    const currentCardAfterUndo = result.current.currentCard;

    expect(currentCardAfterUndo.status).toBe(CardStatus.NEW);
    expect(currentCardAfterUndo.state).toBe(State.New);
  });
});
