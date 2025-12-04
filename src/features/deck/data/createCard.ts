import { Card, Language } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a flashcard with default SRS values.
 * Used by beginner deck generators for consistent card structure.
 */
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

/**
 * Helper to create a Polish card with language pre-set.
 */
export const createPolishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard('polish', sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

/**
 * Helper to create a Norwegian card with language pre-set.
 */
export const createNorwegianCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard('norwegian', sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

/**
 * Helper to create a Japanese card with language pre-set.
 */
export const createJapaneseCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  furigana?: string
): Card => createCard('japanese', sentence, translation, targetWord, notes, undefined, undefined, furigana);

/**
 * Helper to create a Spanish card with language pre-set.
 */
export const createSpanishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = ''
): Card => createCard('spanish', sentence, translation, targetWord, notes);

