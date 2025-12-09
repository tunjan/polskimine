import { render, screen } from "@testing-library/react";
import { Flashcard } from "./Flashcard";
import { StudyFooter } from "./StudyFooter";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Card } from "@/types";
import * as SettingsStore from "@/stores/useSettingsStore";

// Mock dependencies
// We don't mock the module factory for useSettingsStore entirely effectively if we want to change it per test easily 
// without using doMock (which is async/complex with import).
// Instead, we can spy on useSettingsStore if we import it as *
// BUT, zustand hooks are usually default exports or named. 
// Let's try to mock the module and expose a mock implementation setter.

const mockSettings = {
    geminiApiKey: "test-key",
    showWholeSentenceOnFront: false,
    tts: { rate: 1, volume: 1 },
    playTargetWordAudioBeforeSentence: false,
    blindMode: false,
    autoPlayAudio: false,
    // Add other defaults as needed
    language: "polish",
    binaryRatingMode: false,
};

let currentSettings = { ...mockSettings };

vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: vi.fn((selector) => selector(currentSettings)),
}));

function setMockSettings(newSettings: any) {
    currentSettings = { ...mockSettings, ...newSettings };
}

vi.mock("@/features/collection/hooks/useCardText", () => ({
  useCardText: (card: any) => ({
    displayedTranslation: card.targetSentenceTranslation,
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
    useTextSelection: () => ({ selection: null, handleMouseUp: vi.fn(), clearSelection: vi.fn() }),
}));

vi.mock("@/features/study/hooks/useCardInteraction", () => ({
    useCardInteraction: ({ blindMode }: any) => ({ 
        isRevealed: false, 
        handleReveal: vi.fn(), 
        handleKeyDown: vi.fn() 
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
        handleGenerateCard: vi.fn() 
    }),
}));

vi.mock("@/features/study/hooks/useCardSentence", () => ({
    useCardSentence: (card: any) => ({ type: "text", segments: [{ text: card.targetSentence }] }),
}));

const mockCard: Card = {
  id: "1",
  targetWord: "TargetWord",
  targetSentence: "Target Sentence.",
  targetWordTranslation: "Palabra",
  targetSentenceTranslation: "Oración objetivo.",
  status: "new",
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  interval: 0,
  ease: 0,
  repetitions: 0,
};

describe("Settings Features Integration", () => {
  beforeEach(() => {
      currentSettings = { ...mockSettings };
      vi.clearAllMocks();
  });

  describe("Blind Mode", () => {
    it("should render microphone icon and hide text when blind mode is enabled via prop", () => {
        // Note: blindMode is passed as prop to Flashcard, but Flashcard might also check store?
        // In the code: Flashcard receives `blindMode` prop.
        render(
            <Flashcard 
              card={mockCard} 
              isFlipped={false} 
              blindMode={true} 
            />
        );
      
        const revealButton = screen.getByLabelText("Reveal card content");
        expect(revealButton).toBeInTheDocument();
        // The text shouldn't be directly visible (it has opacity/blur classes), 
        // but testing for class presence on the text element is good.
        // The text content IS inside the DOM but visually hidden.
        const textElement = screen.getByText("Target Sentence."); 
        expect(textElement).toHaveClass("blur-3xl");
    });

    it("should render text visibly when blind mode is disabled", () => {
        render(
            <Flashcard 
              card={mockCard} 
              isFlipped={false} 
              blindMode={false} 
            />
        );
        const textElement = screen.getByText("Target Sentence."); 
        expect(textElement).not.toHaveClass("blur-3xl");
    });
  });

  describe("Show Whole Sentence On Front", () => {
    it("should render target word on front by default (when disabled)", () => {
        setMockSettings({ showWholeSentenceOnFront: false });
        
        // When !isFlipped and !showWholeSentenceOnFront => show targetWord
        render(
            <Flashcard 
              card={mockCard} 
              isFlipped={false} 
              blindMode={false} 
            />
        );

        // Should see "TargetWord"
        expect(screen.getByText("TargetWord")).toBeInTheDocument();
        // Should NOT see "Target Sentence."
        expect(screen.queryByText("Target Sentence.")).not.toBeInTheDocument();
    });

    it("should render target sentence on front when enabled", () => {
        setMockSettings({ showWholeSentenceOnFront: true });

        render(
            <Flashcard 
              card={mockCard} 
              isFlipped={false} 
              blindMode={false} 
            />
        );

        // Should see "Target Sentence."
        expect(screen.getByText("Target Sentence.")).toBeInTheDocument();
        // Should NOT see "TargetWord"
        expect(screen.queryByText("TargetWord")).not.toBeInTheDocument();
    });
  });
  
  describe("Binary Rating Mode", () => {
      // NOTE: StudyFooter receives binaryRatingMode as a PROP.
      // So we don't strictly need to mock the store for StudyFooter if we pass the prop correctly,
      // but the StudySession container passes it from store.
      // Since we are testing StudyFooter component in isolation here:
      
      it("should render only Again and Good buttons when enabled", () => {
          render(
              <StudyFooter 
                isFlipped={true} 
                setIsFlipped={vi.fn()} 
                isProcessing={false} 
                binaryRatingMode={true} 
                onGrade={vi.fn()} 
              />
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
            />
        );
        
        expect(screen.getByText("Again")).toBeInTheDocument();
        expect(screen.getByText("Hard")).toBeInTheDocument();
        expect(screen.getByText("Good")).toBeInTheDocument();
        expect(screen.getByText("Easy")).toBeInTheDocument();
    });
  });
});
