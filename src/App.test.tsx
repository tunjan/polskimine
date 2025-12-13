import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";


vi.mock("@/components/ui/loading", () => ({ LoadingScreen: () => <div data-testid="loading">Loading...</div> }));
vi.mock("@/features/auth/AuthPage", () => ({ AuthPage: () => <div data-testid="auth-page">Auth Page</div> }));
vi.mock("@/features/auth/UsernameSetup", () => ({ UsernameSetup: () => <div data-testid="username-setup">Username Setup</div> }));
vi.mock("@/features/auth/OnboardingFlow", () => ({ OnboardingFlow: () => <div data-testid="onboarding-flow">Onboarding Flow</div> }));
vi.mock("@/app/AppRouter", () => ({ AppRouter: () => <div data-testid="app-router">App Router</div> }));
vi.mock("@/app/AppProviders", () => ({ AppProviders: ({ children }: any) => <div data-testid="providers">{children}</div> }));
vi.mock("@/hooks/usePlatformSetup", () => ({ usePlatformSetup: vi.fn() }));

vi.mock("@/contexts/AuthContext");
vi.mock("@/features/profile/hooks/useProfile");

describe("App Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should show loading screen initially", () => {
        (useAuth as any).mockReturnValue({ loading: true });
        (useProfile as any).mockReturnValue({ loading: false });
        render(<App />);
        expect(screen.getByTestId("loading")).toBeInTheDocument();
    });

    it("should show AuthPage if no user", () => {
        (useAuth as any).mockReturnValue({ loading: false, user: null });
        (useProfile as any).mockReturnValue({ loading: false, profile: null });
        render(<App />);
        expect(screen.getByTestId("auth-page")).toBeInTheDocument();
    });

    it("should show retry if no profile", () => {
         (useAuth as any).mockReturnValue({ loading: false, user: { id: "1" } });
         (useProfile as any).mockReturnValue({ loading: false, profile: null });
         render(<App />);
         expect(screen.getByText("Profile not found.")).toBeInTheDocument();
    });

    it("should show UsernameSetup if no username", () => {
        (useAuth as any).mockReturnValue({ loading: false, user: { id: "1" } });
        (useProfile as any).mockReturnValue({ loading: false, profile: { id: "1" } }); 
        render(<App />);
        expect(screen.getByTestId("username-setup")).toBeInTheDocument();
    });

    it("should show OnboardingFlow if not initialized", () => {
        (useAuth as any).mockReturnValue({ loading: false, user: { id: "1" } });
        (useProfile as any).mockReturnValue({ loading: false, profile: { id: "1", username: "Test", initial_deck_generated: false } });
        render(<App />);
        expect(screen.getByTestId("onboarding-flow")).toBeInTheDocument();
    });

    it("should show AppRouter if fully authenticated and setup", () => {
        (useAuth as any).mockReturnValue({ loading: false, user: { id: "1" } });
        (useProfile as any).mockReturnValue({ loading: false, profile: { id: "1", username: "Test", initial_deck_generated: true } });
        render(<App />);
        expect(screen.getByTestId("app-router")).toBeInTheDocument();
    });
});
