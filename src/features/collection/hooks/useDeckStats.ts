import { useMemo } from "react";
import {
  useDeckStatsQuery,
  useDueCardsQuery,
  useHistoryQuery,
  useReviewsTodayQuery,
} from "@/features/collection/hooks/useDeckQueries";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useStreakStats } from "./useStreakStats";
import { applyStudyLimits, isNewCard } from "@/services/studyLimits";
import { DeckStats, Card } from "@/types";
import { State } from "ts-fsrs";

const isLearningCard = (card: Card): boolean => {
  return card.state === State.Learning;
};

const isRelearningCard = (card: Card): boolean => {
  // Relearning = card has state Relearning, or Learning status with lapses > 0
  return (
    card.state === State.Relearning ||
    (card.status === "learning" && (card.lapses || 0) > 0)
  );
};

const isReviewCard = (card: Card): boolean => {
  return (
    card.state === State.Review ||
    (card.status === "review" && !isLearningCard(card) && !isRelearningCard(card))
  );
};

export const useDeckStats = () => {
  const { language, dailyNewLimits, dailyReviewLimits } = useSettingsStore(
    useShallow((s) => ({
      language: s.language,
      dailyNewLimits: s.dailyNewLimits,
      dailyReviewLimits: s.dailyReviewLimits,
    })),
  );
  const streakStats = useStreakStats();

  const { data: reviewsTodayData, isLoading: reviewsTodayLoading } =
    useReviewsTodayQuery();
  const reviewsToday = reviewsTodayData || { newCards: 0, reviewCards: 0 };

  const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
  const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
  const { data: history, isLoading: historyLoading } = useHistoryQuery();

  const isLoading =
    statsLoading || dueCardsLoading || historyLoading || reviewsTodayLoading;

  const currentNewLimit = dailyNewLimits?.[language] ?? 20;
  const currentReviewLimit = dailyReviewLimits?.[language] ?? 100;

  const stats = useMemo<DeckStats>(() => {
    if (!dbStats || !dueCards) {
      return {
        total: 0,
        due: 0,
        newDue: 0,
        learningDue: 0,
        lapseDue: 0,
        reviewDue: 0,
        learned: 0,
        streak: 0,
        totalReviews: 0,
        longestStreak: 0,
      };
    }

    const limitedCards = applyStudyLimits(dueCards, {
      dailyNewLimit: currentNewLimit,
      dailyReviewLimit: currentReviewLimit,
      reviewsToday: reviewsToday,
    });

    const newDue = limitedCards.filter(isNewCard).length;
    const learningDue = limitedCards.filter(isLearningCard).length;
    const lapseDue = limitedCards.filter(isRelearningCard).length;
    const reviewDue = limitedCards.filter(isReviewCard).length;

    return {
      total: dbStats.total,
      learned: dbStats.learned,
      due: limitedCards.length,
      newDue,
      learningDue,
      lapseDue,
      reviewDue,
      streak: streakStats.currentStreak,
      totalReviews: streakStats.totalReviews,
      longestStreak: streakStats.longestStreak,
    };
  }, [
    dbStats,
    dueCards,
    reviewsToday,
    currentNewLimit,
    currentReviewLimit,
    streakStats,
  ]);

  return {
    stats,
    history: history || {},
    isLoading,
  };
};
