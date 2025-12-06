import { useState, useEffect, useRef } from 'react';
import { useHistoryQuery } from '@/features/deck/hooks/useDeckQueries';
import { getUTCDateString } from '@/constants';
import { getSRSDate } from '@/features/study/logic/srs';

export interface StreakStats {
    currentStreak: number;
    longestStreak: number;
    totalReviews: number;
}

export const useStreakStats = () => {
    const { data: history } = useHistoryQuery();
    const [stats, setStats] = useState<StreakStats>({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
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
            setStats({ currentStreak, longestStreak, totalReviews });
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
            setStats({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
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

    return stats;
};
