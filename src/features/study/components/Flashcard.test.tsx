import { render, screen } from "@testing-library/react";
import { Flashcard } from "./Flashcard";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Card, CardStatus } from "@/types";
import { useSettingsStore } from "@/stores/useSettingsStore";

// Mocks
vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: vi.fn(() => ({
    geminiApiKey: "test-key",
    showWholeSentenceOnFront: false,
    showFullSentenceOnNew: false,
    tts: { rate: 1, volume: 1 },
    playTargetWordAudioBeforeSentence: false,
  })),
}));

vi.mock("@/features/collection/hooks/useCardText", () => ({
  useCardText: (card: any) => ({
    displayedTranslation: card.nativeTranslation,
    isGaslit: false,
    processText: (text: string) => text,
  }),
}));

vi.mock("@/features/study/hooks/useTextSelection", () => ({
  useTextSelection: () => ({
    selection: null,
    handleMouseUp: vi.fn(),
    clearSelection: vi.fn(),
  }),
}));

vi.mock("@/features/study/hooks/useCardInteraction", () => ({
  useCardInteraction: vi.fn(),
}));

vi.mock("@/features/study/hooks/useFlashcardAudio", () => ({
  useFlashcardAudio: () => ({ speak: vi.fn(), playSlow: false }),
}));

vi.mock("@/features/study/hooks/useAIAnalysis", () => ({
  useAIAnalysis: () => ({
    isAnalyzing: false,
    analysisResult: null,
    isAnalysisOpen: false,
    setIsAnalysisOpen: vi.fn(),
    isGeneratingCard: false,
    handleAnalyze: vi.fn(),
    handleGenerateCard: vi.fn(),
  }),
}));

vi.mock("@/features/study/hooks/useCardSentence", () => ({
  useCardSentence: (card: any) => ({
    type: "text",
    segments: [{ text: card.targetSentence }],
  }),
}));

const mockCard: Card = {
  id: "1",
  targetWord: "TargetWord",
  targetSentence: "Target Sentence",
  targetWordTranslation: "Target Translation",
  nativeTranslation: "Native Translation",
  status: CardStatus.NEW,
  created_at: new Date().toISOString(),
  interval: 0,
  easeFactor: 0,
  reps: 0,
  language: "polish",
  dueDate: new Date().toISOString(),
  notes: "Some notes",
  user_id: "user1",
};

import { useCardInteraction } from "@/features/study/hooks/useCardInteraction";
import { Mock } from "vitest";

describe("Flashcard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useCardInteraction as unknown as Mock).mockReturnValue({
      isRevealed: false,
      handleReveal: vi.fn(),
      handleKeyDown: vi.fn(),
    });
  });

  it("renders front by default", () => {
    render(<Flashcard card={mockCard} isFlipped={false} />);
    // Front shows target word by default
    expect(screen.getByText("TargetWord")).toBeInTheDocument();
    // and hides sentence if not revealed
    expect(screen.queryByText("Target Sentence")).not.toBeInTheDocument();
  });

  it("renders back when flipped", () => {
    // Mock revealed state for back view logic usually, but here isFlipped controls position.
    // Actually, Flashcard uses isRevealed for determining valid content display?
    // Let's check logic:
    // if (!isRevealed) return front elements.
    // if (isRevealed) return revealed elements.

    // We need to mock useCardInteraction to return isRevealed=true to see sentence?
    (useCardInteraction as any).mockReturnValue({
      isRevealed: true,
      handleReveal: vi.fn(),
      handleKeyDown: vi.fn(),
    });

    render(<Flashcard card={mockCard} isFlipped={true} />);
    // When revealed and flipped, we should see sentence and translation if enabled
    expect(screen.getByText("Target Sentence")).toBeInTheDocument();
    expect(screen.getByText("Native Translation")).toBeInTheDocument();
  });

  it("shows translation when provided", () => {
    (useCardInteraction as any).mockReturnValue({ isRevealed: true });
    render(
      <Flashcard card={mockCard} isFlipped={true} showTranslation={true} />,
    );
    expect(screen.getByText("Native Translation")).toBeInTheDocument();
  });

  it("hides translation when disabled", () => {
    (useCardInteraction as any).mockReturnValue({ isRevealed: true });
    render(
      <Flashcard card={mockCard} isFlipped={true} showTranslation={false} />,
    );
    expect(screen.queryByText("Native Translation")).not.toBeInTheDocument();
  });

  it("shows full sentence on front when card is new and showFullSentenceOnNew is true", () => {
    // Override store mock for this test
    vi.mocked(useSettingsStore).mockImplementation(
      () =>
        ({
          geminiApiKey: "test-key",
          showWholeSentenceOnFront: false,
          showFullSentenceOnNew: true,
          tts: { rate: 1, volume: 1 },
          playTargetWordAudioBeforeSentence: false,
        }) as any,
    );

    const newCard = { ...mockCard, status: CardStatus.NEW };
    render(<Flashcard card={newCard} isFlipped={false} />);
    expect(screen.getByText("Target Sentence")).toBeInTheDocument();
  });

  it("shows target word on front when card is new but showFullSentenceOnNew is false", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      () =>
        ({
          geminiApiKey: "test-key",
          showWholeSentenceOnFront: false,
          showFullSentenceOnNew: false,
          tts: { rate: 1, volume: 1 },
          playTargetWordAudioBeforeSentence: false,
        }) as any,
    );

    const newCard = { ...mockCard, status: CardStatus.NEW };
    render(<Flashcard card={newCard} isFlipped={false} />);
    expect(screen.getByText("TargetWord")).toBeInTheDocument();
    expect(screen.queryByText("Target Sentence")).not.toBeInTheDocument();
  });

  it("shows target word on front when card is review even if showFullSentenceOnNew is true", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      () =>
        ({
          geminiApiKey: "test-key",
          showWholeSentenceOnFront: false,
          showFullSentenceOnNew: true,
          tts: { rate: 1, volume: 1 },
          playTargetWordAudioBeforeSentence: false,
        }) as any,
    );

    const reviewCard = { ...mockCard, status: CardStatus.REVIEW };
    render(<Flashcard card={reviewCard} isFlipped={false} />);
    expect(screen.getByText("TargetWord")).toBeInTheDocument();
    expect(screen.queryByText("Target Sentence")).not.toBeInTheDocument();
  });
});
