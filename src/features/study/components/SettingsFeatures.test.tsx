import { render, screen, cleanup } from "@testing-library/react";
import { Flashcard } from "./Flashcard";
import { StudyFooter } from "./StudyFooter";
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from "vitest";
import { Card, CardStatus } from "@/types";
import { useSettingsStore } from "@/stores/useSettingsStore";

vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: vi.fn(),
}));

function mockStore(state: any) {
  (useSettingsStore as unknown as Mock).mockImplementation((selector) =>
    selector(state),
  );
}

const defaultSettings = {
  geminiApiKey: "test-key",
  showWholeSentenceOnFront: false,
  tts: { rate: 1, volume: 1 },
  playTargetWordAudioBeforeSentence: false,
  blindMode: false,
  autoPlayAudio: false,
  language: "polish",
  binaryRatingMode: false,
};

vi.mock("@/features/collection/hooks/useCardText", () => ({
  useCardText: (card: any) => ({
    displayedTranslation: card.nativeTranslation,
    isGaslit: false,
    processText: (text: string) => text,
  }),
}));

vi.mock("@/features/study/hooks/useFlashcardAudio", () => ({
  useFlashcardAudio: () => ({
    speak: vi.fn(),
    playSlow: false,
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
  useCardInteraction: ({ blindMode }: any) => ({
    isRevealed: false,
    handleReveal: vi.fn(),
    handleKeyDown: vi.fn(),
  }),
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
  targetSentence: "Target Sentence.",
  targetWordTranslation: "Palabra",
  nativeTranslation: "Oración objetivo.",
  status: CardStatus.NEW,
  created_at: new Date().toISOString(),
  interval: 0,
  easeFactor: 0,
  reps: 0,
};

describe("Settings Features Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockStore(defaultSettings);
  });

  describe("Blind Mode", () => {
    it("should render microphone icon and hide text when blind mode is enabled via prop", () => {
      mockStore({ ...defaultSettings, blindMode: true });

      render(<Flashcard card={mockCard} isFlipped={false} blindMode={true} />);

      const revealButton = screen.getByLabelText("Reveal card content");
      expect(revealButton).toBeInTheDocument();
      const textElement = screen.getByText("TargetWord");
      expect(textElement).toHaveClass("blur-3xl");
    });

    it("should render text visibly when blind mode is disabled", () => {
      mockStore({ ...defaultSettings, blindMode: false });

      render(<Flashcard card={mockCard} isFlipped={false} blindMode={false} />);
      const textElement = screen.getByText("TargetWord");
      expect(textElement).not.toHaveClass("blur-3xl");
    });
  });

  describe("Show Whole Sentence On Front", () => {
    it("should render target word on front by default (when disabled)", () => {
      mockStore({ ...defaultSettings, showWholeSentenceOnFront: false });

      render(<Flashcard card={mockCard} isFlipped={false} blindMode={false} />);

      expect(screen.getByText("TargetWord")).toBeInTheDocument();
      expect(screen.queryByText("Target Sentence.")).not.toBeInTheDocument();
    });

    it("should render target sentence on front when enabled", () => {
      mockStore({ ...defaultSettings, showWholeSentenceOnFront: true });

      render(<Flashcard card={mockCard} isFlipped={false} blindMode={false} />);

      expect(screen.getByText("Target Sentence.")).toBeInTheDocument();
      expect(screen.queryByText("TargetWord")).not.toBeInTheDocument();
    });
  });

  describe("Binary Rating Mode", () => {
    it("should render only Again and Good buttons when enabled", () => {
      render(
        <StudyFooter
          isFlipped={true}
          setIsFlipped={vi.fn()}
          isProcessing={false}
          binaryRatingMode={true}
          onGrade={vi.fn()}
        />,
      );

      expect(screen.getByText("Again")).toBeInTheDocument();
      expect(screen.getByText("Good")).toBeInTheDocument();
      expect(screen.queryByText("Hard")).not.toBeInTheDocument();
      expect(screen.queryByText("Easy")).not.toBeInTheDocument();
    });

    it("should render all 4 buttons when disabled", () => {
      render(
        <StudyFooter
          isFlipped={true}
          setIsFlipped={vi.fn()}
          isProcessing={false}
          binaryRatingMode={false}
          onGrade={vi.fn()}
        />,
      );

      expect(screen.getByText("Again")).toBeInTheDocument();
      expect(screen.getByText("Hard")).toBeInTheDocument();
      expect(screen.getByText("Good")).toBeInTheDocument();
      expect(screen.getByText("Easy")).toBeInTheDocument();
    });
  });
});
