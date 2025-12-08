import { useState, useCallback } from "react";
import {
  CardRating,
  calculateCardXp,
  XpCalculationResult,
  getDailyStreakMultiplier,
} from "@/core/gamification/xp";

export interface XpFeedback {
  id: number;
  message: string;
  isBonus: boolean;
  amount: number;
}

export const useXpSession = (dailyStreak: number, isCramMode: boolean) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [feedback, setFeedback] = useState<XpFeedback | null>(null);

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

      if (result.totalXp > 0) {
        setFeedback({
          id: Date.now(),
          message: `+${result.totalXp} XP`,
          isBonus: result.multiplier > 1,
          amount: result.totalXp,
        });
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
    feedback,
    processCardResult,
    subtractXp,
  };
};
