import { useMemo } from 'react';
import { useDeckStatsQuery, useDueCardsQuery, useHistoryQuery, useReviewsTodayQuery } from '@/features/collection/hooks/useDeckQueries';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { useStreakStats } from './useStreakStats';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';
import { DeckStats } from '@/types';

export const useDeckStats = () => {
    const { language, dailyNewLimits, dailyReviewLimits } = useSettingsStore(useShallow(s => ({
        language: s.settings.language,
        dailyNewLimits: s.settings.dailyNewLimits,
        dailyReviewLimits: s.settings.dailyReviewLimits
    })));
    const streakStats = useStreakStats();

    const { data: reviewsTodayData, isLoading: reviewsTodayLoading } = useReviewsTodayQuery();
    const reviewsToday = reviewsTodayData || { newCards: 0, reviewCards: 0 };

    const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
    const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
    const { data: history, isLoading: historyLoading } = useHistoryQuery();

    const isLoading = statsLoading || dueCardsLoading || historyLoading || reviewsTodayLoading;

    const currentNewLimit = dailyNewLimits?.[language] ?? 20;
    const currentReviewLimit = dailyReviewLimits?.[language] ?? 100;

    const stats = useMemo<DeckStats>(() => {
        if (!dbStats || !dueCards) {
            return {
                total: 0,
                due: 0,
                newDue: 0,
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
        const reviewDue = limitedCards.length - newDue;

        return {
            total: dbStats.total,
            learned: dbStats.learned,
            due: limitedCards.length,
            newDue,
            reviewDue,
            streak: streakStats.currentStreak,
            totalReviews: streakStats.totalReviews,
            longestStreak: streakStats.longestStreak,
        };
    }, [dbStats, dueCards, reviewsToday, currentNewLimit, currentReviewLimit, streakStats]);

    return {
        stats,
        history: history || {},
        isLoading
    };
};
