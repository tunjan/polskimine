import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UsernameSetup } from "./UsernameSetup";
import { vi, describe, it, expect } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

describe("UsernameSetup", () => {
  const mockUpdateUsername = vi.fn();
  const mockUser = { email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      updateUsername: mockUpdateUsername,
      user: mockUser,
    });
  });

  it("renders input and user email", () => {
    render(<UsernameSetup />);
    expect(screen.getByText(/How should we/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: test@example.com/i)).toBeInTheDocument();
  });

  it("validates input length", () => {
    render(<UsernameSetup />);
    const input = screen.getByPlaceholderText("Type name...");
    const button = screen.getByText("Confirm");

    
    expect(button.closest("button")).toBeDisabled();

    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.click(button);
    
    

    
    

    fireEvent.submit(
      screen.getByRole("button", { name: "Confirm" }).closest("form")!,
    );

    expect(toast.error).toHaveBeenCalledWith("Minimum 3 characters required.");
    expect(mockUpdateUsername).not.toHaveBeenCalled();
  });

  it("calls updateUsername on valid submit", async () => {
    render(<UsernameSetup />);
    const input = screen.getByPlaceholderText("Type name...");

    fireEvent.change(input, { target: { value: "validUser" } });
    fireEvent.submit(
      screen.getByRole("button", { name: "Confirm" }).closest("form")!,
    );

    await waitFor(() => {
      expect(mockUpdateUsername).toHaveBeenCalledWith("validUser");
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
