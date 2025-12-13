import { describe, it, expect } from "vitest";
import { applyStudyLimits, isNewCard } from "./studyLimits";
import { Card, LanguageId } from "../types";
import { State } from "ts-fsrs";

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: "test",
  targetSentence: "test",
  targetWord: "test",
  nativeTranslation: "test",
  language: LanguageId.Polish,
  notes: "",
  type: 0,
  queue: 0,
  due: 0,
  last_modified: 0,
  left: 0,
  interval: 0,
  easeFactor: 2.5,
  ...overrides,
});

describe("studyLimits", () => {
  describe("isNewCard", () => {
    it("should return true if state is State.New", () => {
      expect(isNewCard(createCard({ state: State.New }))).toBe(true);
    });

    it("should return true if state is State.New", () => {
      expect(isNewCard(createCard({ state: State.New }))).toBe(true);
    });

    it("should return true if reps is 0", () => {
      expect(isNewCard(createCard({ reps: 0 }))).toBe(true);
    });

    it("should return false for review cards", () => {
      expect(isNewCard(createCard({ reps: 1, state: State.Review }))).toBe(false);
    });
  });

  describe("applyStudyLimits", () => {
    const newCard = createCard({ state: State.New, reps: 0 });
    const reviewCard = createCard({ state: State.Review, reps: 1 });

    it("should limit new cards", () => {
      const cards = [newCard, newCard, newCard];
      const limits = { dailyNewLimit: 2 };
      const result = applyStudyLimits(cards, limits);
      expect(result.length).toBe(2);
    });

    it("should limit review cards", () => {
      const cards = [reviewCard, reviewCard, reviewCard];
      const limits = { dailyReviewLimit: 2 };
      const result = applyStudyLimits(cards, limits);
      expect(result.length).toBe(2);
    });

    it("should account for cards already reviewed today", () => {
      const cards = [newCard, newCard, newCard];
      const limits = { dailyNewLimit: 3, reviewsToday: { newCards: 2, reviewCards: 0 } };
      // 3 allowed total, 2 done, so 1 more allowed
      const result = applyStudyLimits(cards, limits);
      expect(result.length).toBe(1);
    });

    it("should return empty array if limit reached", () => {
      const cards = [newCard];
      const limits = { dailyNewLimit: 1, reviewsToday: { newCards: 1, reviewCards: 0 } };
      const result = applyStudyLimits(cards, limits);
      expect(result.length).toBe(0);
    });

    it("should allow unlimited if limit is undefined", () => {
      const cards = [newCard, newCard, newCard];
      const limits = {};
      const result = applyStudyLimits(cards, limits);
      expect(result.length).toBe(3);
    });
  });
});
