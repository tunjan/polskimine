import { Card as FSRSCard, State as FSRSState } from 'ts-fsrs';

export type CardStatus = 'new' | 'learning' | 'graduated' | 'known';

export interface Card extends Partial<FSRSCard> {
  id: string;
  targetSentence: string; // "Ten samochód jest szybki"
  targetWord?: string; // Optional: "samochód". If empty, whole sentence is the target.
  nativeTranslation: string; // "This car is fast"
  notes: string; // "Masc. sing. nominative"
  status: CardStatus;
  
  // Legacy SM-2 fields (kept for migration/fallback if needed, though FSRS handles scheduling)
  interval: number; // Days
  easeFactor: number; // Default 2.5
  dueDate: string; // ISO Date string
  
  // FSRS specific fields (optional during migration)
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: FSRSState;
  last_review?: string; // ISO Date string
  learningStep?: number; // 1 = waiting for 10m review
}

export type Grade = 'Again' | 'Hard' | 'Good' | 'Easy';

export type ReviewHistory = Record<string, number>; // 'YYYY-MM-DD': count

export interface DeckStats {
  total: number;
  due: number;
  learned: number;
  streak: number;
  totalReviews: number;
  longestStreak: number;
}

export interface UserSettings {
  dailyNewLimit: number;
  dailyReviewLimit: number;
  autoPlayAudio: boolean;
  showTranslationAfterFlip: boolean;
  fsrs: {
    request_retention: number; // 0.8 to 0.99
    maximum_interval: number; // Days
    w?: number[]; // Weights
    enable_fuzzing?: boolean;
  }
}
