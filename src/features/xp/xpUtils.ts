export type CardRating = 'again' | 'hard' | 'good' | 'easy';

export const XP_CONFIG = {
  BASE: {
    again: 1,
    hard: 3,
    good: 5,
    easy: 8,
  },
  CRAM_CORRECT: 2,
  ASYMPTOTE_SCALE: 30,
} as const;

export const getDailyStreakMultiplier = (
  days: number
): { value: number; label: string } => {
  if (days <= 0) return { value: 1.0, label: 'Standard (1.00x)' };

  const rawCurve = Math.tanh(days / XP_CONFIG.ASYMPTOTE_SCALE);
  
  const value = Math.round((1 + rawCurve) * 100) / 100;

  let tier = 'Rookie';
  if (value >= 1.9) tier = 'Godlike';
  else if (value >= 1.75) tier = 'Grandmaster';
  else if (value >= 1.5) tier = 'Master';
  else if (value >= 1.25) tier = 'Elite';
  else if (value >= 1.1) tier = 'Pro';

  return {
    value,
    label: `${tier} (${value.toFixed(2)}x)`
  };
};

export interface XpCalculationResult {
  baseXp: number;
  bonusXp: number;
  multiplier: number;
  totalXp: number;
  isStreakBonus: boolean;
}

export interface CardXpPayload extends XpCalculationResult {
  rating: CardRating;
  streakAfter: number;
  isCramMode: boolean;
  dailyStreak: number;
  multiplierLabel: string;
}

/**
 * Calculates the XP reward for a single card interaction.
 * Keeps logic pure so it can run on both client and server.
 */
export const calculateCardXp = (
  rating: CardRating,
  sessionStreak: number,
  dailyStreak: number,
  isCramMode: boolean = false
): XpCalculationResult => {
  if (isCramMode) {
    const cramXp = rating === 'again' ? 0 : XP_CONFIG.CRAM_CORRECT;
    return {
      baseXp: cramXp,
      bonusXp: 0,
      multiplier: 1,
      totalXp: cramXp,
      isStreakBonus: false,
    };
  }

  const baseXp = XP_CONFIG.BASE[rating];
  const bonusXp = 0;

  const { value: multiplier } = getDailyStreakMultiplier(dailyStreak);
  const preMultiplied = baseXp + bonusXp;
  
  
  const totalXp = Math.round(preMultiplied * multiplier);

  return {
    baseXp,
    bonusXp,
    multiplier,
    totalXp,
    isStreakBonus: false,
  };
};