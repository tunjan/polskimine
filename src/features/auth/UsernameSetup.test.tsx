import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UsernameSetup } from "./UsernameSetup";
import { describe, it, expect, vi } from "vitest";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
const { mockToast } = vi.hoisted(() => ({
  mockToast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: mockToast }));

describe("UsernameSetup", () => {
  it("should render input", () => {
    (useAuth as any).mockReturnValue({ updateUsername: vi.fn(), user: { email: "test@example.com" } });
    render(<UsernameSetup />);
    expect(screen.getByPlaceholderText("Type name...")).toBeInTheDocument();
    expect(screen.getByText(/how should we/i)).toBeInTheDocument();
  });

  it("should validate length and submit", async () => {
    const updateUsername = vi.fn().mockResolvedValue(undefined);
    (useAuth as any).mockReturnValue({ updateUsername, user: { email: "test@example.com" } });
    render(<UsernameSetup />);

    const input = screen.getByPlaceholderText("Type name...");
    const btn = screen.getByText("Confirm"); 
    
    
    fireEvent.change(input, { target: { value: "ab" } }); 
    fireEvent.click(btn); 
    expect(mockToast.error).toHaveBeenCalledWith("Minimum 3 characters required.");
    expect(updateUsername).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "validUser" } });
    fireEvent.click(btn);

    await waitFor(() => expect(updateUsername).toHaveBeenCalledWith("validUser"));
    expect(mockToast.success).toHaveBeenCalled();
  });
});
