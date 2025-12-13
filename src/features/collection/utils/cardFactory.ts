import { Card, Language, LanguageId } from "@/types";
import { State as FSRSState } from "ts-fsrs";
import { v4 as uuidv4 } from "uuid";
import { escapeRegExp, findInflectedWordInSentence } from "@/lib/utils";

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
}

const createWordBoundaryRegex = (word: string): RegExp => {
  const escaped = escapeRegExp(word);
  return new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "gu");
};

export const formatSentenceWithTargetWord = (
  sentence: string,
  targetWord: string | undefined,
  language: Language,
): string => {
  if (
    !targetWord ||
    sentence.includes("<b>") ||
    language === LanguageId.Japanese
  ) {
    return sentence;
  }

  const matchedWord = findInflectedWordInSentence(targetWord, sentence);

  if (matchedWord) {
    return sentence.replace(
      createWordBoundaryRegex(matchedWord),
      `<b>${matchedWord}</b>`,
    );
  }

  return sentence;
};

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

    type: 0,
    queue: 0,
    due: 0,
    last_modified: Math.floor(Date.now() / 1000),
    left: 0,
    state: FSRSState.New,

    interval: 0,
    easeFactor: 2.5,

    reps: 0,
    lapses: 0,

    isLeech: false,
    isBookmarked: false,
    created_at: Date.now(),
  };
};

export const createNewCardWithOffset = (
  params: CreateCardParams,
  offsetMs: number,
): Card => {
  const card = createNewCard(params);
  card.created_at = Date.now() + offsetMs;     return card;
};

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
