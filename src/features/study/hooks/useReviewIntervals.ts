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
        
        
        
        
        let dueMs: number;
        if (next.queue === 1) {
          
          dueMs = next.due * 1000;
        } else if (next.queue === 2 || next.queue === 3) {
          
          dueMs = next.due * 24 * 60 * 60 * 1000;
        } else {
          
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
