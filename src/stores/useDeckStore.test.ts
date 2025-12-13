import { describe, it, expect, beforeEach } from "vitest";
import { useDeckStore } from "./useDeckStore";
import { Card, LanguageId } from "../types";

describe("useDeckStore", () => {
  beforeEach(() => {
    useDeckStore.setState({
      streakStats: {
        currentStreak: 0,
        longestStreak: 0,
        totalReviews: 0,
      },
      lastReview: null,
    });
  });

  it("should have initial state", () => {
    const state = useDeckStore.getState();
    expect(state.streakStats.currentStreak).toBe(0);
    expect(state.lastReview).toBeNull();
  });

  it("should update streakStats", () => {
    const stats = {
      currentStreak: 5,
      longestStreak: 10,
      totalReviews: 100,
    };
    useDeckStore.getState().setStreakStats(stats);
    expect(useDeckStore.getState().streakStats).toEqual(stats);
  });

  it("should set and clear lastReview", () => {
    const review = {
      card: { id: "1" } as Card,
      date: "2023-01-01",
      xpEarned: 10,
    };
    useDeckStore.getState().setLastReview(review);
    expect(useDeckStore.getState().lastReview).toEqual(review);

    useDeckStore.getState().clearLastReview();
    expect(useDeckStore.getState().lastReview).toBeNull();
  });
});
