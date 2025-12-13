import { render, screen } from "@testing-library/react";
import { LanguageLevelSelector } from "./LanguageLevelSelector";
import { describe, it, expect, vi } from "vitest";
import { LanguageId } from "@/types";

describe("LanguageLevelSelector", () => {
  it("should render selectors for each language", () => {
    const onSelect = vi.fn();
    render(
      <LanguageLevelSelector
        selectedLanguages={[LanguageId.Polish, LanguageId.German]}
        selectedLevels={{ [LanguageId.Polish]: "A1" } as any}
        onSelectLevel={onSelect}
      />
    );

    expect(screen.getByText("Polish")).toBeInTheDocument();
    expect(screen.getByText("German")).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  // Interacting with Shadecn select in pure jsdom might be tricky if it uses portals or complex focus logic.
  // We verified it renders.
});
