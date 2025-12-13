import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSelector } from "./LanguageSelector";
import { describe, it, expect, vi } from "vitest";
import { LanguageId } from "@/types";

describe("LanguageSelector", () => {
  it("should render all languages", () => {
    render(
      <LanguageSelector
        selectedLanguages={[]}
        onToggle={vi.fn()}
        onContinue={vi.fn()}
      />
    );
    expect(screen.getByText("Polish")).toBeInTheDocument();
    expect(screen.getByText("Japanese")).toBeInTheDocument();
  });

  it("should highlight selected", () => {
    render(
      <LanguageSelector
        selectedLanguages={[LanguageId.Polish]}
        onToggle={vi.fn()}
        onContinue={vi.fn()}
      />
    );
    
    const polishCheckbox = screen.getByLabelText(/Polish/i);
    expect(polishCheckbox).toBeChecked();
  });

  it("should call onToggle", () => {
    const onToggle = vi.fn();
    render(
      <LanguageSelector
        selectedLanguages={[]}
        onToggle={onToggle}
        onContinue={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText(/Polish/i));
    expect(onToggle).toHaveBeenCalledWith(LanguageId.Polish);
  });

  it("should show continue button only if selection exists", () => {
    const { rerender } = render(
      <LanguageSelector 
        selectedLanguages={[]} 
        onToggle={vi.fn()} 
        onContinue={vi.fn()} 
      />
    );
    expect(screen.queryByText(/Continue/i)).not.toBeInTheDocument();

    rerender(
      <LanguageSelector 
        selectedLanguages={[LanguageId.Polish]} 
        onToggle={vi.fn()} 
        onContinue={vi.fn()} 
      />
    );
    expect(screen.getByText(/Continue/i)).toBeInTheDocument();
  });
});
