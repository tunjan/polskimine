import { useMemo } from "react";
import { Card, Grade, UserSettings } from "@/types";
import { calculateNextReview, LapsesSettings } from "@/core/srs/scheduler";
import { formatInterval } from "@/utils/formatInterval";

export const useReviewIntervals = (
  card: Card | undefined,
  fsrs: UserSettings["fsrs"],
  learningSteps: number[],
  lapsesSettings?: LapsesSettings,
): Record<Grade, string> => {
  return useMemo(() => {
    if (!card) {
      return { Again: "", Hard: "", Good: "", Easy: "" };
    }

    const now = new Date();
    const calculate = (grade: Grade) => {
      try {
        const next = calculateNextReview(
          card,
          grade,
          fsrs,
          learningSteps,
          lapsesSettings,
        );
        // next.due is a numeric timestamp in different units based on queue:
        // - queue 1 (intraday learning): seconds
        // - queue 2/3 (review/interday): days since epoch
        // We need to convert to milliseconds
        let dueMs: number;
        if (next.queue === 1) {
          // Intraday learning: due is in seconds
          dueMs = next.due * 1000;
        } else if (next.queue === 2 || next.queue === 3) {
          // Review or interday learning: due is in days since epoch
          dueMs = next.due * 24 * 60 * 60 * 1000;
        } else {
          // New cards or other states
          dueMs = now.getTime();
        }
        
        const diff = dueMs - now.getTime();
        return formatInterval(Math.max(0, diff));
      } catch (error) {
        console.error(
          "[useReviewIntervals] Error calculating interval:",
          error,
        );
        return "<1m";
      }
    };

    return {
      Again: calculate("Again"),
      Hard: calculate("Hard"),
      Good: calculate("Good"),
      Easy: calculate("Easy"),
    };
  }, [card, fsrs, learningSteps, lapsesSettings]);
};
