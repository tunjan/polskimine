import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthPage } from "./AuthPage";
import { vi, describe, it, expect, beforeEach } from "vitest";


vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    register: vi.fn(),
    login: vi.fn(),
    getRegisteredUsers: vi.fn(),
  })),
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

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
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

vi.mock("./components", () => ({
  AuthLayout: ({ children }: any) => (
    <div data-testid="auth-layout">{children}</div>
  ),
  LanguageLevelSelector: ({ onSelectLevel }: any) => (
    <div data-testid="level-selector">
      <button onClick={() => onSelectLevel("beginner")}>Beginner</button>
    </div>
  ),
  DeckGenerationStep: ({ onComplete, languages, proficiencyLevel }: any) => (
    <div data-testid="deck-generation">
      <button onClick={() => onComplete(languages, false, undefined)}>
        Generate
      </button>
    </div>
  ),
}));

import { useAuth } from "@/contexts/AuthContext";

describe("AuthPage", () => {
  const mockRegister = vi.fn();
  const mockLogin = vi.fn();
  const mockGetRegisteredUsers = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      register: mockRegister,
      login: mockLogin,
      getRegisteredUsers: mockGetRegisteredUsers,
    });
    
    mockGetRegisteredUsers.mockResolvedValue([]);
  });

  it("renders registration form by default when no users exist", async () => {
    await waitFor(() => render(<AuthPage />));
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Choose a username"),
    ).toBeInTheDocument();
  });

  it("renders login form by default when users exist", async () => {
    mockGetRegisteredUsers.mockResolvedValue([{ username: "testuser" }]);
    await waitFor(() => render(<AuthPage />));

    
    await waitFor(() => {
      
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      
      expect(
        screen.getByPlaceholderText("Enter your username"),
      ).toBeInTheDocument();
    });
  });

  it("switches between login and register tabs", async () => {
    const user = userEvent.setup();
    await waitFor(() => render(<AuthPage />));

    
    expect(
      screen.getByRole("button", { name: "Create Account" }),
    ).toBeInTheDocument();

    
    const loginTab = screen.getByRole("tab", { name: "Sign In" });
    await user.click(loginTab);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    
    const registerTab = screen.getByRole("tab", { name: "Register" });
    await user.click(registerTab);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create Account" }),
      ).toBeInTheDocument();
    });
  });

  it("validates registration inputs", async () => {
    const user = userEvent.setup();
    await waitFor(() => render(<AuthPage />));

    const submitBtn = screen.getByRole("button", { name: "Create Account" });

    
    await user.click(submitBtn);

    
    await user.type(screen.getByPlaceholderText("Choose a username"), "ab");
    await user.click(submitBtn);

    
    await user.clear(screen.getByPlaceholderText("Choose a username"));
    await user.type(screen.getByPlaceholderText("Choose a username"), "user");
    await user.type(screen.getByPlaceholderText("Enter password"), "123");
    await user.click(submitBtn);

    
    await user.clear(screen.getByPlaceholderText("Enter password"));
    await user.type(screen.getByPlaceholderText("Enter password"), "1234");
    await user.type(screen.getByPlaceholderText("Confirm password"), "12345");
    await user.click(submitBtn);
  });

  it("calls register on valid submission", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ user: { id: "123" } });
    await waitFor(() => render(<AuthPage />));

    await user.type(
      screen.getByPlaceholderText("Choose a username"),
      "newuser",
    );
    await user.type(screen.getByPlaceholderText("Enter password"), "password");
    await user.type(
      screen.getByPlaceholderText("Confirm password"),
      "password",
    );

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("newuser", "password");
    });

    
    await waitFor(() => {
      expect(screen.getByTestId("language-selector")).toBeInTheDocument();
    });
  });

  it("calls login on valid submission", async () => {
    const user = userEvent.setup();
    mockGetRegisteredUsers.mockResolvedValue([{ username: "existing" }]);
    await waitFor(() => render(<AuthPage />));

    
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument(),
    );

    await user.clear(screen.getByPlaceholderText("Enter your username"));
    await user.type(
      screen.getByPlaceholderText("Enter your username"),
      "existing",
    );
    await user.type(screen.getByPlaceholderText("Enter password"), "password");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("existing", "password");
    });
  });

  it("navigates through setup flow after registration", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ user: { id: "123" } });
    await waitFor(() => render(<AuthPage />));

    
    await user.type(
      screen.getByPlaceholderText("Choose a username"),
      "flowuser",
    );
    await user.type(screen.getByPlaceholderText("Enter password"), "password");
    await user.type(
      screen.getByPlaceholderText("Confirm password"),
      "password",
    );
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    
    await waitFor(() =>
      expect(screen.getByTestId("language-selector")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("Toggle Polish"));
    await user.click(screen.getByText("Continue"));

    
    await waitFor(() =>
      expect(screen.getByTestId("level-selector")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("Beginner"));

    
    await waitFor(() =>
      expect(screen.getByTestId("deck-generation")).toBeInTheDocument(),
    );
  });
});
