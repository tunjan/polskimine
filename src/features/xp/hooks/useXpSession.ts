import { useState, useCallback, useRef } from 'react';
import { calculateCardXp, CardRating, getDailyStreakMultiplier, XpCalculationResult } from '../xpUtils';


export interface XpFeedback {
  id: number;
  amount: number;
  message: string;
  isBonus: boolean;
}

export const useXpSession = (dailyStreak: number, isCramMode: boolean = false) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [feedback, setFeedback] = useState<XpFeedback | null>(null);


  const feedbackIdRef = useRef(0);

  const multiplierInfo = getDailyStreakMultiplier(dailyStreak);

  const processCardResult = useCallback((rating: CardRating): XpCalculationResult => {
    let newStreak = sessionStreak;

    if (rating === 'again') {
      newStreak = 0;
    } else {
      newStreak += 1;
    }
    setSessionStreak(newStreak);

    const result = calculateCardXp(rating, newStreak, dailyStreak, isCramMode);
    setSessionXp(prev => prev + result.totalXp);

    return result;
  }, [sessionStreak, dailyStreak, isCramMode]);

  const subtractXp = useCallback((amount: number) => {
    setSessionXp(prev => Math.max(0, prev - amount));
    setSessionStreak(prev => Math.max(0, prev - 1));
  }, []);

  const resetSession = useCallback(() => {
    setSessionXp(0);
    setSessionStreak(0);
    setFeedback(null);
  }, []);

  return {
    sessionXp,
    sessionStreak,
    multiplierInfo,
    feedback,
    processCardResult,
    subtractXp,
    resetSession
  };
};
