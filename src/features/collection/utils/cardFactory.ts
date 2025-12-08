/**
 * Centralized card factory - single source of truth for card creation.
 * Ensures all cards have consistent structure with required FSRS fields.
 *
 * ALL card creation in the app should go through this factory.
 */
import { Card, CardStatus, Language, LanguageId } from "@/types";
import { State as FSRSState } from "ts-fsrs";
import { v4 as uuidv4 } from "uuid";
import { escapeRegExp, findInflectedWordInSentence } from "@/lib/utils";

/**
 * Parameters for creating a new card.
 */
export interface CreateCardParams {
  language: Language;
  targetSentence: string;
  nativeTranslation: string;
  targetWord?: string;
  targetWordTranslation?: string;
  targetWordPartOfSpeech?: string;
  notes?: string;
  furigana?: string;
  gender?: string;
  grammaticalCase?: string;
  tags?: string[];
}

/**
 * Unicode-aware word boundary pattern that works with non-Latin scripts
 * (Polish: ą, ę, ł, ż, etc. German: ä, ö, ü, ß, etc.)
 */
const createWordBoundaryRegex = (word: string): RegExp => {
  const escaped = escapeRegExp(word);
  // Use negative lookbehind/lookahead for Unicode letters
  return new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "gu");
};

/**
 * Formats a sentence by wrapping the target word in <b> tags.
 * Uses fuzzy matching to find inflected forms of the target word.
 * Handles non-Latin scripts properly.
 */
export const formatSentenceWithTargetWord = (
  sentence: string,
  targetWord: string | undefined,
  language: Language,
): string => {
  // Skip if no target word, already formatted, or Japanese (handled differently with furigana)
  if (
    !targetWord ||
    sentence.includes("<b>") ||
    language === LanguageId.Japanese
  ) {
    return sentence;
  }

  // Use fuzzy matching to find inflected forms (e.g., "rozumieć" -> "rozumiem")
  const matchedWord = findInflectedWordInSentence(targetWord, sentence);

  if (matchedWord) {
    // Use Unicode-aware word boundary for proper replacement
    return sentence.replace(
      createWordBoundaryRegex(matchedWord),
      `<b>${matchedWord}</b>`,
    );
  }

  return sentence;
};

/**
 * Creates a new card with all required fields initialized.
 * This is the single source of truth for card creation.
 */
export const createNewCard = (params: CreateCardParams): Card => {
  const {
    language,
    targetSentence,
    nativeTranslation,
    targetWord,
    targetWordTranslation,
    targetWordPartOfSpeech,
    notes = "",
    furigana,
    gender,
    grammaticalCase,
    tags,
  } = params;

  const formattedSentence = formatSentenceWithTargetWord(
    targetSentence,
    targetWord,
    language,
  );

  return {
    id: uuidv4(),
    language,
    targetSentence: formattedSentence,
    nativeTranslation,
    targetWord,
    targetWordTranslation,
    targetWordPartOfSpeech,
    notes,
    furigana,
    gender,
    grammaticalCase,
    tags,

    // Status
    status: CardStatus.NEW,
    state: FSRSState.New,

    // Scheduling defaults
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),

    // FSRS tracking - MUST be initialized
    reps: 0,
    lapses: 0,

    // Optional fields with safe defaults
    isLeech: false,
    isBookmarked: false,
  };
};

/**
 * Creates a card with a staggered due date (for batch creation).
 * Each card gets a slightly later due date to control introduction order.
 */
export const createNewCardWithOffset = (
  params: CreateCardParams,
  offsetMs: number,
): Card => {
  const card = createNewCard(params);
  card.dueDate = new Date(Date.now() + offsetMs).toISOString();
  return card;
};

// Language-specific convenience functions

export const createPolishCard = (
  targetSentence: string,
  nativeTranslation: string,
  targetWord?: string,
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  notes?: string,
): Card =>
  createNewCard({
    language: LanguageId.Polish,
    targetSentence,
    nativeTranslation,
    targetWord,
    targetWordTranslation,
    targetWordPartOfSpeech,
    notes,
  });

export const createGermanCard = (
  targetSentence: string,
  nativeTranslation: string,
  targetWord?: string,
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  notes?: string,
  gender?: string,
): Card =>
  createNewCard({
    language: LanguageId.German,
    targetSentence,
    nativeTranslation,
    targetWord,
    targetWordTranslation,
    targetWordPartOfSpeech,
    notes,
    gender,
  });

export const createSpanishCard = (
  targetSentence: string,
  nativeTranslation: string,
  targetWord?: string,
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  notes?: string,
): Card =>
  createNewCard({
    language: LanguageId.Spanish,
    targetSentence,
    nativeTranslation,
    targetWord,
    targetWordTranslation,
    targetWordPartOfSpeech,
    notes,
  });

export const createNorwegianCard = (
  targetSentence: string,
  nativeTranslation: string,
  targetWord?: string,
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  notes?: string,
  gender?: string,
): Card =>
  createNewCard({
    language: LanguageId.Norwegian,
    targetSentence,
    nativeTranslation,
    targetWord,
    targetWordTranslation,
    targetWordPartOfSpeech,
    notes,
    gender,
  });

export const createJapaneseCard = (
  targetSentence: string,
  nativeTranslation: string,
  targetWord?: string,
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  notes?: string,
  furigana?: string,
): Card =>
  createNewCard({
    language: LanguageId.Japanese,
    targetSentence,
    nativeTranslation,
    targetWord,
    targetWordTranslation,
    targetWordPartOfSpeech,
    notes,
    furigana,
  });
