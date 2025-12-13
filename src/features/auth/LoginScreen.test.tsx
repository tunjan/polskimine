import { render, screen, fireEvent } from "@testing-library/react";
import { LoginScreen } from "./LoginScreen";
import { describe, it, expect, vi } from "vitest";
import { useAuth } from "@/contexts/AuthContext";

// Mock useAuth
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("LoginScreen", () => {
  it("should render correctly", () => {
    (useAuth as any).mockReturnValue({ signInWithGoogle: vi.fn(), loading: false });
    render(<LoginScreen />);
    expect(screen.getByText("LinguaFlow")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("should call signInWithGoogle on click", () => {
    const signIn = vi.fn();
    (useAuth as any).mockReturnValue({ signInWithGoogle: signIn, loading: false });
    render(<LoginScreen />);
    
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(signIn).toHaveBeenCalled();
  });

  it("should disable button when loading", () => {
    (useAuth as any).mockReturnValue({ signInWithGoogle: vi.fn(), loading: true });
    render(<LoginScreen />);
    
    const btn = screen.getByRole("button", { name: /Continue with Google/i });
    expect(btn).toBeDisabled();
  });
});
