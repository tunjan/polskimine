import { renderHook } from "@testing-library/react";
import { useChartColors } from "./useChartColors";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { LanguageId } from "@/types";


const mockUseTheme = vi.fn();
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("useChartColors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      language: LanguageId.Polish,
      languageColors: { [LanguageId.Polish]: "#ff0000" } as any,
    });
  });

  it("should return chart colors with defaults", () => {
    mockUseTheme.mockReturnValue({ theme: "light" });
    const { result } = renderHook(() => useChartColors());
    
    expect(result.current).toHaveProperty("primary");
    expect(result.current).toHaveProperty("background");
    expect(result.current.isDark).toBe(false);
  });

  it("should detect dark mode", () => {
    mockUseTheme.mockReturnValue({ theme: "dark" });
    const { result } = renderHook(() => useChartColors());
    expect(result.current.isDark).toBe(true);
  });
});
