import { useState, useEffect, useRef } from "react";
import { useHistoryQuery } from "@/features/collection/hooks/useDeckQueries";
import { getUTCDateString } from "@/constants";
import { getSRSDate } from "@/core/srs/scheduler";

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
}

export const useStreakStats = () => {
  const { data: history } = useHistoryQuery();
  const [stats, setStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalReviews: 0,
  });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/db/workers/stats.worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { currentStreak, longestStreak, totalReviews } = e.data;
      setStats({ currentStreak, longestStreak, totalReviews });
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!history || Object.keys(history).length === 0) {
      setStats({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
      return;
    }

    if (!workerRef.current) return;

    const srsToday = getSRSDate(new Date());
    const todayStr = getUTCDateString(srsToday);
    const srsYesterday = new Date(srsToday);
    srsYesterday.setDate(srsYesterday.getDate() - 1);
    const yesterdayStr = getUTCDateString(srsYesterday);

    workerRef.current.postMessage({
      action: "calculate_streaks",
      history,
      todayStr,
      yesterdayStr,
    });
  }, [history]);

  return stats;
};
