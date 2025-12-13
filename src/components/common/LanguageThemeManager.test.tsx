import { render } from "@testing-library/react";
import { LanguageThemeManager } from "./LanguageThemeManager";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { LanguageId } from "@/types";

describe("LanguageThemeManager", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      language: LanguageId.Polish,
      languageColors: { [LanguageId.Polish]: "#ff0000" } as any,
    });
    // Clear head
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("data-language");
  });

  it("should set data-language attribute", () => {
    render(<LanguageThemeManager />);
    expect(document.documentElement.getAttribute("data-language")).toBe("polish");
  });

  it("should inject style tag with custom colors", () => {
    render(<LanguageThemeManager />);
    const styleTag = document.getElementById("custom-language-theme");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain("--primary: hsl(0 100% 50%)"); // #ff0000 -> 0 100 50
  });

  it("should remove attribute on unmount", () => {
    const { unmount } = render(<LanguageThemeManager />);
    unmount();
    expect(document.documentElement.getAttribute("data-language")).toBeNull();
    expect(document.getElementById("custom-language-theme")).toBeNull();
  });
});
