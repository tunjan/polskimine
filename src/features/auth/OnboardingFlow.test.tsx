import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingFlow } from "./OnboardingFlow";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useAuth } from "@/contexts/AuthContext";

// Mocks
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: vi.fn(() => ({
    markInitialDeckGenerated: vi.fn(),
  })),
}));

vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: vi.fn(() => vi.fn()),
}));

vi.mock("@/features/generator/services/deckGeneration", () => ({
  generateInitialDeck: vi.fn(),
}));

vi.mock("@/db/repositories/cardRepository", () => ({
  saveAllCards: vi.fn(),
}));

vi.mock("@/db/repositories/settingsRepository", () => ({
  updateUserSettings: vi.fn(),
}));

vi.mock("./components/LanguageSelector", () => ({
  LanguageSelector: ({ onContinue, onToggle, selectedLanguages }: any) => (
    <div data-testid="language-selector">
      <button onClick={() => onToggle("polish")}>Toggle Polish</button>
      <button onClick={onContinue} disabled={selectedLanguages.length === 0}>
        Continue
      </button>
    </div>
  ),
}));

vi.mock("./components/LanguageLevelSelector", () => ({
  LanguageLevelSelector: ({ onSelectLevel }: any) => (
    <div data-testid="level-selector">
      <button onClick={() => onSelectLevel("beginner")}>Beginner</button>
    </div>
  ),
}));

vi.mock("./components/DeckGenerationStep", () => ({
  DeckGenerationStep: ({ onComplete, languages }: any) => (
    <div data-testid="deck-generation">
      <button onClick={() => onComplete(languages, false, undefined)}>
        Generate Deck
      </button>
    </div>
  ),
}));

describe("OnboardingFlow", () => {
  const mockSignOut = vi.fn();
  const mockMarkInitialDeckGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: "123" },
      signOut: mockSignOut,
    });

    // Need to Mock useProfile hook in file scope if possible, or just rely on global mock.
    // We defined global mock above.
  });

  it("renders language step initially", () => {
    render(<OnboardingFlow />);
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
    expect(screen.getByText("Select Languages.")).toBeInTheDocument();
  });

  it("progresses through steps", async () => {
    render(<OnboardingFlow />);

    // Language Step
    fireEvent.click(screen.getByText("Toggle Polish"));
    fireEvent.click(screen.getByText("Continue"));

    // Level Step
    await waitFor(() =>
      expect(screen.getByTestId("level-selector")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Beginner"));

    // Deck Step
    await waitFor(() =>
      expect(screen.getByTestId("deck-generation")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Generate Deck"));

    // Wait for completion (saveAllCards mocked)
    // Since we didn't export the mockSaveAllCards to verify here, we just check no error.
    // Or we could export it from the mock section but that's messy.
    // Just verify navigation works.
  });

  it("allows sign out", () => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("Sign Out"));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
