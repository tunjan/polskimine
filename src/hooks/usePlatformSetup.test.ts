import { renderHook } from "@testing-library/react";
import { usePlatformSetup } from "./usePlatformSetup";
import { describe, it } from "vitest";

describe("usePlatformSetup", () => {
  it("should fail safe (no-op)", () => {
    renderHook(() => usePlatformSetup());
    
  });
});
