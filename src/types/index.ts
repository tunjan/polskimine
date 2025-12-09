import type {
  CardOrderValue,
  TTSProviderValue,
  NewCardGatherOrderValue,
  NewCardSortOrderValue,
  NewReviewOrderValue,
  InterdayLearningOrderValue,
  ReviewSortOrderValue,
  LeechActionValue,
} from "@/constants/settings";
export type {
  CardOrderValue,
} from "@/constants/settings";
import { Card as FSRSCard, State as FSRSState } from "ts-fsrs";

export type Difficulty = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

import { CardStatus } from "./cardStatus";
export {
  CardStatus,
  mapFsrsStateToStatus,
  mapStatusToFsrsState,
} from "./cardStatus";

export interface Card extends Omit<Partial<FSRSCard>, "due" | "last_review"> {
  id: string;
  targetSentence: string;
  targetWord?: string;
  targetWordTranslation?: string;
  targetWordPartOfSpeech?: string;
  nativeTranslation: string;
  furigana?: string;
  gender?: string;
  grammaticalCase?: string;
  notes: string;

  language: Language;
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
  isBookmarked?: boolean;
  precise_interval?: number;
  user_id?: string;
}

export type Grade = "Again" | "Hard" | "Good" | "Easy";

export type ReviewHistory = Record<string, number>;

export interface DeckStats {
  total: number;
  due: number;
  newDue: number;
  learningDue: number;
  lapseDue: number;
  reviewDue: number;
  learned: number;
  streak: number;
  totalReviews: number;
  longestStreak: number;
}

import { Language } from "./languages";
export type { Language } from "./languages";
export { LanguageId, LANGUAGE_LABELS } from "./languages";

export type TTSProvider = TTSProviderValue;

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
  proficiency: Record<Language, Difficulty>;
  dailyNewLimits: Record<Language, number>;
  dailyReviewLimits: Record<Language, number>;
  autoPlayAudio: boolean;
  playTargetWordAudioBeforeSentence: boolean;
  blindMode: boolean;
  showTranslationAfterFlip: boolean;
  showWholeSentenceOnFront?: boolean;
  ignoreLearningStepsWhenNoCards: boolean;
  binaryRatingMode: boolean;
  cardOrder: CardOrderValue;
  learningSteps: number[];
    newCardGatherOrder?: NewCardGatherOrderValue;
  newCardSortOrder?: NewCardSortOrderValue;
  newReviewOrder?: NewReviewOrderValue;
  interdayLearningOrder?: InterdayLearningOrderValue;
  reviewSortOrder?: ReviewSortOrderValue;
    relearnSteps?: number[];
  leechThreshold?: number;
  leechAction?: LeechActionValue;
  tts: TTSSettings;
  fsrs: {
    request_retention: number;
    maximum_interval: number;
    w?: number[];
    enable_fuzzing?: boolean;
  };
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

export interface FuriganaSegment {
  text: string;
  furigana?: string;
}
