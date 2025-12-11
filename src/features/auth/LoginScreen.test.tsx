import { render, screen, fireEvent } from "@testing-library/react";
import { LoginScreen } from "./LoginScreen";
import { vi, describe, it, expect } from "vitest";
import { useAuth } from "@/contexts/AuthContext";


vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("LoginScreen", () => {
  it("renders correctly", () => {
    (useAuth as any).mockReturnValue({
      signInWithGoogle: vi.fn(),
      loading: false,
    });

    render(<LoginScreen />);
    expect(screen.getByText("LinguaFlow")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("calls signInWithGoogle on click", () => {
    const mockSignIn = vi.fn();
    (useAuth as any).mockReturnValue({
      signInWithGoogle: mockSignIn,
      loading: false,
    });

    render(<LoginScreen />);
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(mockSignIn).toHaveBeenCalled();
  });

  it("disables button when loading", () => {
    (useAuth as any).mockReturnValue({
      signInWithGoogle: vi.fn(),
      loading: true,
    });

    render(<LoginScreen />);
    expect(
      screen.getByText("Continue with Google").closest("button"),
    ).toBeDisabled();
  });
});
