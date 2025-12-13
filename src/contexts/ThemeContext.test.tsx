import { renderHook } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { describe, it, expect } from "vitest";

describe("ThemeContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  it("should provide default theme (light)", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
  });

  it("should apply light class to document root on mount", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});
