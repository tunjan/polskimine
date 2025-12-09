import { create } from "zustand";
import { Card, DeckStats, ReviewHistory } from "@/types";

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
}

interface DeckState {
  streakStats: StreakStats;

  lastReview: { card: Card; date: string; xpEarned: number } | null;

  setStreakStats: (stats: StreakStats) => void;
  setLastReview: (
    review: { card: Card; date: string; xpEarned: number } | null,
  ) => void;
  clearLastReview: () => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  streakStats: {
    currentStreak: 0,
    longestStreak: 0,
    totalReviews: 0,
  },
  lastReview: null,

  setStreakStats: (stats) => set({ streakStats: stats }),
  setLastReview: (review) => set({ lastReview: review }),
  clearLastReview: () => set({ lastReview: null }),
}));
