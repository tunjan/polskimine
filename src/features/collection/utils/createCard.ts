import { Card, Language, LanguageId } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const createCard = (
  language: Language,
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  furigana?: string
): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  targetWordTranslation,
  targetWordPartOfSpeech,
  furigana,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language
});

export const createPolishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.Polish, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

export const createNorwegianCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.Norwegian, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

export const createJapaneseCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  furigana?: string
): Card => createCard(LanguageId.Japanese, sentence, translation, targetWord, notes, undefined, undefined, furigana);

export const createSpanishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = ''
): Card => createCard(LanguageId.Spanish, sentence, translation, targetWord, notes);

export const createGermanCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.German, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

