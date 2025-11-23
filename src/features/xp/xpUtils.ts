export type CardRating = 'again' | 'hard' | 'good' | 'easy';

export const XP_CONFIG = {
  BASE: {
    again: 1,
    hard: 3,
    good: 5,
    easy: 8,
  },
  CRAM_CORRECT: 2,
  STREAK_DIVISOR: 5,
  STREAK_BONUS_CAP: 5,
} as const;

export interface XpCalculationResult {
  baseXp: number;
  bonusXp: number;
  totalXp: number;
  isStreakBonus: boolean;
}

export interface CardXpPayload extends XpCalculationResult {
  rating: CardRating;
  streakAfter: number;
  isCramMode: boolean;
}

/**
 * Calculates the XP reward for a single card interaction.
 * Keeps logic pure so it can run on both client and server.
 */
export const calculateCardXp = (
  rating: CardRating,
  currentStreak: number,
  isCramMode: boolean = false
): XpCalculationResult => {
  if (isCramMode) {
    const cramXp = rating === 'again' ? 0 : XP_CONFIG.CRAM_CORRECT;
    return {
      baseXp: cramXp,
      bonusXp: 0,
      totalXp: cramXp,
      isStreakBonus: false,
    };
  }

  const baseXp = XP_CONFIG.BASE[rating];

  let bonusXp = 0;
  if (rating !== 'again') {
    const rawBonus = Math.floor(currentStreak / XP_CONFIG.STREAK_DIVISOR);
    bonusXp = Math.min(rawBonus, XP_CONFIG.STREAK_BONUS_CAP);
  }

  return {
    baseXp,
    bonusXp,
    totalXp: baseXp + bonusXp,
    isStreakBonus: bonusXp > 0,
  };
};
