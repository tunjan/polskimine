import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { calculateCardXp, CardRating, CardXpPayload } from '../xpUtils';

/**
 * Tracks XP accumulation for a single study session.
 */
export const useXpSession = (isCramMode: boolean = false) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);

  const processCardResult = useCallback(
    (rating: CardRating): CardXpPayload => {
      let computedStreak = 0;
      setSessionStreak((prev) => {
        const next = rating === 'again' ? 0 : prev + 1;
        computedStreak = next;
        return next;
      });

      const xpResult = calculateCardXp(rating, computedStreak, isCramMode);
      setSessionXp((prevXp) => prevXp + xpResult.totalXp);

      if (xpResult.isStreakBonus && xpResult.bonusXp > 0) {
        toast.success(`Combo! +${xpResult.bonusXp} Bonus XP`, {
          duration: 1500,
          position: 'bottom-center',
          className: 'w-auto min-w-0 px-4 py-2 h-8 text-xs font-medium',
        });
      }

      return {
        rating,
        streakAfter: computedStreak,
        isCramMode,
        ...xpResult,
      };
    },
    [isCramMode]
  );

  const resetSession = useCallback(() => {
    setSessionXp(0);
    setSessionStreak(0);
  }, []);

  return {
    sessionXp,
    sessionStreak,
    processCardResult,
    resetSession,
  };
};
