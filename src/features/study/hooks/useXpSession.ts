import { useState, useCallback } from "react";
import {
  CardRating,
  calculateCardXp,
  XpCalculationResult,
  getDailyStreakMultiplier,
} from "@/core/gamification/xp";

export const useXpSession = (dailyStreak: number, isCramMode: boolean) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);

  const multiplierInfo = getDailyStreakMultiplier(dailyStreak);

  const processCardResult = useCallback(
    (rating: CardRating): XpCalculationResult => {
      const result = calculateCardXp(
        rating,
        sessionStreak,
        dailyStreak,
        isCramMode,
      );

      setSessionXp((prev) => prev + result.totalXp);

      if (rating === "again") {
        setSessionStreak(0);
      } else {
        setSessionStreak((prev) => prev + 1);
      }

      return result;
    },
    [sessionStreak, dailyStreak, isCramMode],
  );

  const subtractXp = useCallback((amount: number) => {
    setSessionXp((prev) => Math.max(0, prev - amount));
  }, []);

  return {
    sessionXp,
    sessionStreak,
    multiplierInfo,

    processCardResult,
    subtractXp,
  };
};
