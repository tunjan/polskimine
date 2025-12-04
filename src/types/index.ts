import { Card as FSRSCard, State as FSRSState } from 'ts-fsrs';

export type Difficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CardStatus = 'new' | 'learning' | 'graduated' | 'known';

export interface Card extends Omit<Partial<FSRSCard>, 'due' | 'last_review'> {
  id: string;
  targetSentence: string; 
  targetWord?: string; 
  targetWordTranslation?: string;
  targetWordPartOfSpeech?: string;
  nativeTranslation: string; 
  furigana?: string; 
  notes: string; 
  tags?: string[]; 
  language?: Language; 
  status: CardStatus;


  interval: number; 
  easeFactor: number; 
  dueDate: string; 


  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: FSRSState;
  due?: string; 
  last_review?: string; 
  first_review?: string; 
  learningStep?: number; 
  leechCount?: number; 
  isLeech?: boolean; 
}

export type Grade = 'Again' | 'Hard' | 'Good' | 'Easy';

export type ReviewHistory = Record<string, number>; 

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
  volume: number; 
  rate: number; 
  pitch: number; 
  googleApiKey?: string;
  azureApiKey?: string;
  azureRegion?: string;
}

export interface UserSettings {
  language: Language;
  languageColors?: Record<Language, string>; 

  dailyNewLimits: Record<Language, number>;
  dailyReviewLimits: Record<Language, number>;
  autoPlayAudio: boolean;
  blindMode: boolean; 
  showTranslationAfterFlip: boolean;
  showWholeSentenceOnFront?: boolean;
  ignoreLearningStepsWhenNoCards: boolean;
  binaryRatingMode: boolean; 
  cardOrder: 'newFirst' | 'reviewFirst' | 'mixed'; 
  tts: TTSSettings;
  fsrs: {
    request_retention: number; 
    maximum_interval: number; 
    w?: number[]; 
    enable_fuzzing?: boolean;
  }
  geminiApiKey: string; 
}

export interface ReviewLog {
  id: string;
  card_id: string;
  grade: number; 
  state: number; 
  elapsed_days: number;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  created_at: string;
}