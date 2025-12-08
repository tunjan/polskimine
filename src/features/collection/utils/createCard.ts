import { Card, Language, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { findInflectedWordInSentence, escapeRegExp } from "@/lib/utils";

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
      formattedSentence = sentence.replace(
        new RegExp(`\\b${escapeRegExp(matchedWord)}\\b`, "g"),
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
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    language,
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
