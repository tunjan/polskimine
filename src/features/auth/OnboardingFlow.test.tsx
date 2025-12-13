import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingFlow } from "./OnboardingFlow";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { LanguageId } from "@/types";
import * as cardRepo from "@/db/repositories/cardRepository";

// Mock dependencies (Similar to AuthPage but slightly different context usage)
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));
const mockUpdateSettings = vi.fn();
vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: (selector: any) => {
      return selector({ updateSettings: mockUpdateSettings });
  }
}));
vi.mock("@/db/repositories/cardRepository", () => ({
  saveAllCards: vi.fn(),
}));
vi.mock("@/db/repositories/settingsRepository", () => ({
  updateUserSettings: vi.fn(),
}));
vi.mock("@/features/generator/services/deckGeneration", () => ({
  generateInitialDeck: vi.fn(),
}));
vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn() }
}));

// Mock Components
vi.mock("./components/LanguageSelector", () => ({
    LanguageSelector: ({ onContinue, onToggle }: any) => (
        <div>
            <button onClick={() => onToggle(LanguageId.Polish)}>Toggle PL</button>
            <button onClick={onContinue}>Continue Lang</button>
        </div>
    )
}));
vi.mock("./components/LanguageLevelSelector", () => ({
    LanguageLevelSelector: ({ onSelectLevel }: any) => (
        <div>
            <button onClick={() => onSelectLevel(LanguageId.Polish, "A1")}>Select A1</button>
        </div>
    )
}));
vi.mock("./components/DeckGenerationStep", () => ({
    DeckGenerationStep: ({ onComplete }: any) => (
        <div>
            <button onClick={() => onComplete([LanguageId.Polish], false, undefined)}>Complete Deck</button>
        </div>
    )
}));

describe("OnboardingFlow", () => {
    const signOutMock = vi.fn();
    const markInitialDeckGeneratedMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: { id: "user123" },
            signOut: signOutMock,
        });
        (useProfile as any).mockReturnValue({
            markInitialDeckGenerated: markInitialDeckGeneratedMock,
        });
         Object.defineProperty(window, 'location', {
            writable: true,
            value: { reload: vi.fn() }
        });
    });

    it("should navigate through onboarding steps", async () => {
        render(<OnboardingFlow />);
        
        // Language Step
        expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Toggle PL"));
        fireEvent.click(screen.getByText("Continue Lang"));

        // Level Step
        expect(await screen.findByText("Step 2 of 3")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Select A1"));
        fireEvent.click(screen.getByText("Continue"));

        // Deck Step
        expect(await screen.findByText("Step 3 of 3")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Complete Deck"));

        await waitFor(() => expect(cardRepo.saveAllCards).toHaveBeenCalled());
        expect(markInitialDeckGeneratedMock).toHaveBeenCalled();
        // window.location.reload is valid here? It is used in OnboardingFlow but inside setTimeout(..., 2000).
        // I won't wait 2 seconds in test. I can enable fake timers.
    });
});
