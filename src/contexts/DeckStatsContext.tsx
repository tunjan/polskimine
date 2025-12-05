import React, { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react';
import { DeckStats, ReviewHistory } from '@/types';
import { useDeckStatsQuery, useDueCardsQuery, useHistoryQuery } from '@/features/deck/hooks/useDeckQueries';
import { useSettings } from './SettingsContext';
import { useSessionState } from './SessionContext';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';
import { getUTCDateString } from '@/constants';
import { getSRSDate } from '@/features/study/logic/srs';

interface DeckStatsState {
    stats: DeckStats;
    history: ReviewHistory;
    isLoading: boolean;
}

const DeckStatsContext = createContext<DeckStatsState | undefined>(undefined);

export const DeckStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings } = useSettings();
    const { reviewsToday } = useSessionState();

    const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
    const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
    const { data: history, isLoading: historyLoading } = useHistoryQuery();

    const isLoading = statsLoading || dueCardsLoading || historyLoading;

    // State for streak stats to update asynchronously without blocking render
    const [streakStats, setStreakStats] = useState({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
    const workerRef = useRef<Worker | null>(null);

    // Initialize worker on mount
    useEffect(() => {
        // Create worker instance
        workerRef.current = new Worker(
            new URL('@/services/db/workers/stats.worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Set up message handler
        workerRef.current.onmessage = (e: MessageEvent) => {
            const { currentStreak, longestStreak, totalReviews } = e.data;
            setStreakStats({ currentStreak, longestStreak, totalReviews });
        };

        // Cleanup on unmount
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    // Calculate streak stats using web worker
    useEffect(() => {
        if (!history || Object.keys(history).length === 0) {
            setStreakStats({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
            return;
        }

        if (!workerRef.current) return;

        // Get today and yesterday strings
        const srsToday = getSRSDate(new Date());
        const todayStr = getUTCDateString(srsToday);
        const srsYesterday = new Date(srsToday);
        srsYesterday.setDate(srsYesterday.getDate() - 1);
        const yesterdayStr = getUTCDateString(srsYesterday);

        // Send calculation task to worker
        workerRef.current.postMessage({
            action: 'calculate_streaks',
            history,
            todayStr,
            yesterdayStr
        });

    }, [history]);

    const currentNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
    const currentReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;

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

    const value = useMemo(() => ({
        stats,
        history: history || {},
        isLoading
    }), [stats, history, isLoading]);

    return (
        <DeckStatsContext.Provider value={value}>
            {children}
        </DeckStatsContext.Provider>
    );
};

export const useDeckStats = () => {
    const context = useContext(DeckStatsContext);
    if (context === undefined) {
        throw new Error('useDeckStats must be used within a DeckStatsProvider');
    }
    return context;
};
