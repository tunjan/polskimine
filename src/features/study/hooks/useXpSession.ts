import { useState, useCallback } from 'react';
import { CardRating, calculateCardXp, XpCalculationResult, getDailyStreakMultiplier } from '@/core/gamification/xp';

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

  const processCardResult = useCallback((rating: CardRating): XpCalculationResult => {
    // Calculate what the XP would be
    const result = calculateCardXp(rating, sessionStreak, dailyStreak, isCramMode);
    
    // Update state
    setSessionXp(prev => prev + result.totalXp);
    
    if (rating === 'again') {
        setSessionStreak(0);
    } else {
        setSessionStreak(prev => prev + 1);
    }

    // Generate feedback if applicable (e.g. > 0 xp)
    if (result.totalXp > 0) {
        setFeedback({
            id: Date.now(),
            message: `+${result.totalXp} XP`,
            isBonus: result.multiplier > 1,
            amount: result.totalXp
        });
    }

    return result;
  }, [sessionStreak, dailyStreak, isCramMode]);

  const subtractXp = useCallback((amount: number) => {
    setSessionXp(prev => Math.max(0, prev - amount));
    // We might also want to revert streak? But it's complex to know previous streak. 
    // Usually undo just reverts the last action.
    // For now, let's just revert XP.
    // Ideally the consumer handles streak reversion if they have state, 
    // but here we just expose what was asked.
  }, []);

  return {
    sessionXp,
    sessionStreak,
    multiplierInfo,
    feedback,
    processCardResult,
    subtractXp
  };
};
