export type CardStatus = 'learning' | 'review' | 'graduated';

export interface Card {
  id: string;
  targetSentence: string; // "Ten samochód jest szybki"
  targetWord: string; // "samochód"
  nativeTranslation: string; // "This car is fast"
  notes: string; // "Masc. sing. nominative"
  status: CardStatus;
  interval: number; // Days
  easeFactor: number; // Default 2.5
  dueDate: string; // ISO Date string
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