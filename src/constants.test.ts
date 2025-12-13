import { describe, it, expect } from "vitest";
import {
  MOCK_CARDS,
  getUTCDateString,
  MOCK_HISTORY,
  SRS_CONFIG,
  FSRS_DEFAULTS,
  LANGUAGE_NAMES,
} from "./constants";

describe("constants", () => {
  describe("MOCK_CARDS", () => {
    it("should be an array of cards", () => {
      expect(Array.isArray(MOCK_CARDS)).toBe(true);
      expect(MOCK_CARDS.length).toBeGreaterThan(0);
    });

    it("should have valid structure for each card", () => {
      const card = MOCK_CARDS[0];
      expect(card).toHaveProperty("id");
      expect(card).toHaveProperty("targetSentence");
      expect(card).toHaveProperty("targetWord");
    });
  });

  describe("getUTCDateString", () => {
    it("should format date as yyyy-MM-dd", () => {
      const date = new Date("2023-12-25T12:00:00Z");
      expect(getUTCDateString(date)).toBe("2023-12-25");
    });
  });

  describe("MOCK_HISTORY", () => {
    it("should be an object with date keys", () => {
      expect(typeof MOCK_HISTORY).toBe("object");
      const keys = Object.keys(MOCK_HISTORY);
      
      expect(keys.length).toBeGreaterThan(0);
      expect(keys[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("SRS_CONFIG", () => {
    it("should have CUTOFF_HOUR", () => {
      expect(SRS_CONFIG.CUTOFF_HOUR).toBeDefined();
    });
  });

  describe("FSRS_DEFAULTS", () => {
    it("should have default parameters", () => {
      expect(FSRS_DEFAULTS.request_retention).toBe(0.9);
      expect(FSRS_DEFAULTS.w.length).toBe(21);
    });
  });

  describe("LANGUAGE_NAMES", () => {
    it("should map keys to names", () => {
      expect(LANGUAGE_NAMES.polish).toBe("Polish");
    });
  });
});
