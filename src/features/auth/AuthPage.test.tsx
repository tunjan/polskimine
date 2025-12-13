import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthPage } from "./AuthPage";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import * as cardRepo from "@/db/repositories/cardRepository";
import { LanguageId } from "@/types";


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
        
        
        expect(await screen.findByText("Continue Lang")).toBeInTheDocument();
        
        
        fireEvent.click(screen.getByText("Toggle PL"));
        fireEvent.click(screen.getByText("Continue Lang"));

        
        expect(await screen.findByText("Select A1")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Select A1"));
        
        
        
        
        
        
        
        const continueLevelBtn = screen.getByText("Continue");
        fireEvent.click(continueLevelBtn);

        
        expect(await screen.findByText("Complete Deck")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Complete Deck"));

        await waitFor(() => expect(cardRepo.saveAllCards).toHaveBeenCalled());
        expect(markInitialDeckGeneratedMock).toHaveBeenCalledWith("user123");
        expect(window.location.reload).toHaveBeenCalled();
    });
});
