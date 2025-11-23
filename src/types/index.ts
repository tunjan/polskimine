import { Card as FSRSCard, State as FSRSState } from 'ts-fsrs';

export type Difficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CardStatus = 'new' | 'learning' | 'graduated' | 'known';

export interface Card extends Omit<Partial<FSRSCard>, 'due' | 'last_review'> {
  id: string;
  targetSentence: string; // "Ten samochód jest szybki"
  targetWord?: string; // Optional: "samochód". If empty, whole sentence is the target.
  nativeTranslation: string; // "This car is fast"
  furigana?: string; // Optional: Furigana for Japanese text (e.g., "私[わたし]は...")
  notes: string; // "Masc. sing. nominative"
  tags?: string[]; // Optional tags for filtering
  language?: Language; // 'polish' | 'norwegian' | 'japanese'
  status: CardStatus;
  

  interval: number; // Days
  easeFactor: number; // Default 2.5
  dueDate: string; // ISO Date string
  

  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: FSRSState;
  due?: string; // ISO Date string (overrides FSRSCard's Date type)
  last_review?: string; // ISO Date string (overrides FSRSCard's Date type)
  first_review?: string; // ISO Date string
  learningStep?: number; // 1 = waiting for 10m review
  leechCount?: number; // Number of times answered "Again" consecutively or totally (depending on logic)
  isLeech?: boolean; // Flag for leech status
}

export type Grade = 'Again' | 'Hard' | 'Good' | 'Easy';

export type ReviewHistory = Record<string, number>; // 'YYYY-MM-DD': count

export interface DeckStats {
  total: number;
  due: number;
  newDue: number;
  reviewDue: number;
  learned: number;
  streak: number;
  totalReviews: number;
  longestStreak: number;
}

export type Language = 'polish' | 'norwegian' | 'japanese' | 'spanish';

export type TTSProvider = 'browser' | 'google' | 'azure';

export interface TTSSettings {
  provider: TTSProvider;
  voiceURI: string | null;
  volume: number; // 0 to 1
  rate: number; // 0.5 to 2
  pitch: number; // 0 to 2
  googleApiKey?: string;
  azureApiKey?: string;
  azureRegion?: string;
}

export interface UserSettings {
  language: Language;
  languageColors?: Record<Language, string>; // HSL values e.g. "346 84% 45%"

  dailyNewLimits: Record<Language, number>;
  dailyReviewLimits: Record<Language, number>;
  autoPlayAudio: boolean;
  blindMode: boolean; // New: Play audio before showing text
  showTranslationAfterFlip: boolean;
  ignoreLearningStepsWhenNoCards: boolean;
  binaryRatingMode: boolean; // Pass/Fail only (Again vs Good)
  tts: TTSSettings;
  fsrs: {
    request_retention: number; // 0.8 to 0.99
    maximum_interval: number; // Days
    w?: number[]; // Weights
    enable_fuzzing?: boolean;
  }
  geminiApiKey: string; // Gemini API key for client-side AI calls
}

export interface ReviewLog {
  id: string;
  card_id: string;
  grade: number; // 1 | 2 | 3 | 4
  state: number; // 0 | 1 | 2 | 3
  elapsed_days: number;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  created_at: string;
}