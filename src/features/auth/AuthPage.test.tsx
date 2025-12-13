import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthPage } from "./AuthPage";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import * as cardRepo from "@/db/repositories/cardRepository";
import { LanguageId } from "@/types";

// Mock dependencies
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));
const mockUpdateSettings = vi.fn();
vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: (selector: any) => {
      // Mock s.updateSettings
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

// Mock Components provided by index.ts in components
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

describe("AuthPage", () => {
    const registerMock = vi.fn();
    const loginMock = vi.fn();
    const getRegisteredUsersMock = vi.fn().mockResolvedValue([]);
    const markInitialDeckGeneratedMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            register: registerMock,
            login: loginMock,
            getRegisteredUsers: getRegisteredUsersMock,
        });
        (useProfile as any).mockReturnValue({
            markInitialDeckGenerated: markInitialDeckGeneratedMock,
        });
        // Override mock implementation for window.location.reload
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { reload: vi.fn() }
        });
    });

    it("should render registration form by default", async () => {
        render(<AuthPage />);
        expect(screen.getByText("Begin your journey")).toBeInTheDocument();
        expect(screen.getByText("Register")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Choose a username")).toBeInTheDocument();
    });

    it("should handle registration flow", async () => {
        registerMock.mockResolvedValue({ user: { id: "user123" } });
        render(<AuthPage />);

        fireEvent.change(screen.getByPlaceholderText("Choose a username"), { target: { value: "newuser" } });
        fireEvent.change(screen.getByPlaceholderText("Enter password"), { target: { value: "password" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm password"), { target: { value: "password" } });

        fireEvent.click(screen.getByText(/Create Account/i));

        await waitFor(() => expect(registerMock).toHaveBeenCalledWith("newuser", "password"));
        
        // Should transition to Language Step (mocked)
        expect(await screen.findByText("Continue Lang")).toBeInTheDocument();
        
        // Select Language
        fireEvent.click(screen.getByText("Toggle PL"));
        fireEvent.click(screen.getByText("Continue Lang"));

        // Should transition to Level Step (mocked)
        expect(await screen.findByText("Select A1")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Select A1"));
        
        // Wait for Continue button in parent? 
        // In AuthPage, switching steps renders new component.
        // My mock for Level Selector doesn't include the Continue button of the page.
        // The Page renders the "Continue" button for Level Step.
        // Wait, look at AuthPage.tsx:392: <Button onClick={handleLevelContinue}>
        // So I need to find that button.
        const continueLevelBtn = screen.getByText("Continue");
        fireEvent.click(continueLevelBtn);

        // Should transition to Deck Step (mocked)
        expect(await screen.findByText("Complete Deck")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Complete Deck"));

        await waitFor(() => expect(cardRepo.saveAllCards).toHaveBeenCalled());
        expect(markInitialDeckGeneratedMock).toHaveBeenCalledWith("user123");
        expect(window.location.reload).toHaveBeenCalled();
    });
});
