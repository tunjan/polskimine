import { render, screen, fireEvent } from "@testing-library/react";
import { DeckGenerationStep } from "./DeckGenerationStep";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LanguageId } from "@/types";

describe("DeckGenerationStep", () => {
  const onComplete = vi.fn();
  const languages = [LanguageId.Polish];
  const selectedLevels: any = { [LanguageId.Polish]: "A1" };

  beforeEach(() => {
    onComplete.mockClear();
  });

  it("should render options", () => {
    render(
      <DeckGenerationStep
        languages={languages}
        selectedLevels={selectedLevels}
        onComplete={onComplete}
      />
    );
    expect(screen.getByText("AI-Generated Decks")).toBeInTheDocument();
    expect(screen.getByText("Standard Courses")).toBeInTheDocument();
  });

  it("should select default and generate", async () => {
    render(
      <DeckGenerationStep
        languages={languages}
        selectedLevels={selectedLevels}
        onComplete={onComplete}
      />
    );

    const defaultBtn = screen.getByRole("button", { name: /Standard Courses/i });
    fireEvent.click(defaultBtn);
    
    expect(await screen.findByText("Start Learning")).toBeInTheDocument();
    
    const startBtn = screen.getByText("Start Learning");
    fireEvent.click(startBtn);

    expect(onComplete).toHaveBeenCalledWith(languages, false, undefined);
  });

  it("should require API key for AI", async () => {
    render(
      <DeckGenerationStep
        languages={languages}
        selectedLevels={selectedLevels}
        onComplete={onComplete}
      />
    );

    const aiBtn = screen.getByRole("button", { name: /AI-Generated Decks/i });
    fireEvent.click(aiBtn); 
    
    
    const input = screen.getByPlaceholderText("Enter your API key");
    expect(input).toBeInTheDocument();

    const generateBtn = screen.getByText(/Generate 1 Deck/i);
    fireEvent.click(generateBtn);

    
    expect(screen.getByText("Please enter your Gemini API key")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    
    fireEvent.change(input, { target: { value: "test-key" } });
    fireEvent.click(generateBtn);
    expect(onComplete).toHaveBeenCalledWith(languages, true, "test-key");
  });
});
