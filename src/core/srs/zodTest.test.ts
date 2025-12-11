import { z } from "zod";
import { describe, it, expect } from "vitest";

const SafeNumber = (fieldName: string) =>
  z.preprocess((val) => {
    if (typeof val === "number" && isNaN(val)) {
      return 0;
    }
    return val;
  }, z.number());

const Schema = z.object({
  learningStep: SafeNumber("learningStep").optional().nullable(),
});

describe("Zod Schema", () => {
  it("should handle undefined", () => {
    const res = Schema.parse({ learningStep: undefined });
    expect(res.learningStep).toBeUndefined();
  });

  it("should handle null", () => {
    const res = Schema.parse({ learningStep: null });
    expect(res.learningStep).toBeNull();
  });

  it("should handle mixed null/undefined inputs", () => {
    
    const r1 = Schema.safeParse({ learningStep: null });
    expect(r1.success).toBe(true);
  });

  it("should handle number", () => {
    const res = Schema.parse({ learningStep: 1 });
    expect(res.learningStep).toBe(1);
  });
});
