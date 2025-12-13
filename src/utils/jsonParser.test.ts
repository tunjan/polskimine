import { describe, it, expect, vi } from "vitest";
import { repairJSON, parseAIJSON } from "./jsonParser";

describe("jsonParser", () => {
  describe("repairJSON", () => {
    it("should strip markdown code blocks", () => {
      const input = "```json\n{\"foo\":\"bar\"}\n```";
      expect(repairJSON(input)).toBe("{\"foo\":\"bar\"}");
    });

    it("should extract JSON from text", () => {
      const input = "Here is the JSON: {\"foo\":\"bar\"} thanks.";
      expect(repairJSON(input)).toBe("{\"foo\":\"bar\"}");
    });

    it("should handle mixed brackets and braces", () => {
      const input = "Some text [1, 2, 3] end";
      expect(repairJSON(input)).toBe("[1, 2, 3]");
    });

    it("should fix trailing commas", () => {
      const input = "{\"foo\":\"bar\",}";
      expect(repairJSON(input)).toBe("{\"foo\":\"bar\"}");
    });
  });

  describe("parseAIJSON", () => {
    it("should parse valid JSON", () => {
      const input = "{\"foo\":\"bar\"}";
      expect(parseAIJSON(input)).toEqual({ foo: "bar" });
    });

    it("should parse repaired JSON", () => {
      const input = "```json {\"foo\":\"bar\",} ```";
      expect(parseAIJSON(input)).toEqual({ foo: "bar" });
    });

    it("should throw error on invalid JSON", () => {
      const input = "{invalid}";
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => parseAIJSON(input)).toThrow("Failed to parse AI output.");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
