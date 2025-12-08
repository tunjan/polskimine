import { Card, CardStatus, Language, LanguageId } from "@/types";
import { State as FSRSState } from "ts-fsrs";
import { v4 as uuidv4 } from "uuid";
import { findInflectedWordInSentence, escapeRegExp } from "@/lib/utils";

/**
 * Creates a Unicode-aware word boundary regex that works with non-Latin scripts.
 * Standard \b doesn't work for Polish (ą, ę, ł), German (ä, ö, ü, ß), etc.
 */
const createWordBoundaryRegex = (word: string): RegExp => {
  const escaped = escapeRegExp(word);
  // Use negative lookbehind/lookahead for Unicode letters
  return new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "gu");
};

export const createCard = (
  language: Language,
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  furigana?: string,
): Card => {
  let formattedSentence = sentence;

  if (
    targetWord &&
    !sentence.includes("<b>") &&
    language !== LanguageId.Japanese
  ) {
    const matchedWord = findInflectedWordInSentence(targetWord, sentence);
    if (matchedWord) {
      // Use Unicode-aware word boundary for proper non-Latin script support
      formattedSentence = sentence.replace(
        createWordBoundaryRegex(matchedWord),
        `<b>${matchedWord}</b>`,
      );
    }
  }

  return {
    id: uuidv4(),
    targetSentence: formattedSentence,
    targetWord,
    nativeTranslation: translation,
    notes,
    targetWordTranslation,
    targetWordPartOfSpeech,
    furigana,
    status: CardStatus.NEW,
    state: FSRSState.New,
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    language,
    reps: 0,
    lapses: 0,
    isLeech: false,
    isBookmarked: false,
  };
};

export const createPolishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
): Card =>
  createCard(
    LanguageId.Polish,
    sentence,
    translation,
    targetWord,
    notes,
    targetWordTranslation,
    targetWordPartOfSpeech,
  );

export const createNorwegianCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
): Card =>
  createCard(
    LanguageId.Norwegian,
    sentence,
    translation,
    targetWord,
    notes,
    targetWordTranslation,
    targetWordPartOfSpeech,
  );

export const createJapaneseCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  furigana?: string,
): Card =>
  createCard(
    LanguageId.Japanese,
    sentence,
    translation,
    targetWord,
    notes,
    undefined,
    undefined,
    furigana,
  );

export const createSpanishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
): Card =>
  createCard(LanguageId.Spanish, sentence, translation, targetWord, notes);

export const createGermanCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
): Card =>
  createCard(
    LanguageId.German,
    sentence,
    translation,
    targetWord,
    notes,
    targetWordTranslation,
    targetWordPartOfSpeech,
  );
