import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useIsMobile", () => {
  beforeEach(() => {
    // Reset window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("should return false for desktop width", () => {
    window.innerWidth = 1024;
    
    // Mock matchMedia to match desktop
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true for mobile width", () => {
    window.innerWidth = 500;
    
    // Mock matchMedia to match mobile
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  // Note: testing the event listener requires triggering the change event which is complex in jsdom 
  // without a more sophisticated matchMedia mock library. 
  // For basic coverage, testing the initial state logic is sufficient.
});
