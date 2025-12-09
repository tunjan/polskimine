import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCardModal } from "./AddCardModal";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mocks
vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: vi.fn(() => ({
    language: "polish",
    geminiApiKey: "test-key",
  })),
}));

vi.mock("@/lib/ai", () => ({
  aiService: {
    generateCardContent: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock dynamic import
vi.mock("@/db/repositories/cardRepository", () => ({
  getCardByTargetWord: vi.fn().mockResolvedValue(null),
}));

// Mock clipboard/selection in jsdom (often needed for hook forms focusing, though maybe not here)

import { aiService } from "@/lib/ai";

describe("AddCardModal", () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not open", () => {
    render(
      <AddCardModal isOpen={false} onClose={mockOnClose} onAdd={mockOnAdd} />,
    );
    expect(screen.queryByText("Add New Card")).not.toBeInTheDocument();
  });

  it("renders form when open", () => {
    render(
      <AddCardModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />,
    );
    expect(screen.getByText("Add New Card")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Type the sentence/i),
    ).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(
      <AddCardModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />,
    );

    const saveButton = screen.getByRole("button", { name: "Save Card" });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Sentence is required")).toBeInTheDocument();
      expect(screen.getByText("Translation is required")).toBeInTheDocument();
    });
  });

  it("submits valid form", async () => {
    const user = userEvent.setup();
    render(
      <AddCardModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />,
    );

    await user.type(
      screen.getByPlaceholderText(/Type the sentence/i),
      "To jest test.",
    );
    await user.type(
      screen.getByPlaceholderText(/Sentence translation/i),
      "This is a test.",
    );

    await user.click(screen.getByRole("button", { name: "Save Card" }));

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("calls auto-fill on button click", async () => {
    const user = userEvent.setup();
    (aiService.generateCardContent as any).mockResolvedValue({
      formattedSentence: "To jest <b>test</b>.",
      translation: "This is a test.",
      targetWord: "test",
      targetWordTranslation: "test (exam)",
      targetWordPartOfSpeech: "noun",
      notes: "Usage notes",
      furigana: "",
    });

    render(
      <AddCardModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />,
    );

    await user.type(
      screen.getByPlaceholderText(/Type the sentence/i),
      "To jest test.",
    );
    await user.click(screen.getByText("Auto-Fill with AI"));

    await waitFor(() => {
      expect(aiService.generateCardContent).toHaveBeenCalled();
      // Check if fields are populated (checking values is harder with react-hook-form controlled inputs sometimes, but verify result)
      // Use display value checking
      expect(screen.getByPlaceholderText(/Word to highlight/i)).toHaveValue(
        "test",
      );
    });
  });
});
