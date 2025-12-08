import { useMemo } from 'react';
import { Card, LanguageId } from '@/types';
import { parseFurigana, findInflectedWordInSentence, escapeRegExp } from '@/lib/utils';

export interface FuriganaSegment {
  text: string;
  furigana?: string;
}

export type JapaneseStructure = {
  type: 'japanese';
  segments: FuriganaSegment[];
  targetIndices: Set<number>;
};

export type HighlightedStructure = {
  type: 'highlighted';
  parts: string[];
  matchedWord: string;
};

export type SimpleStructure = {
  type: 'simple';
  text: string;
};

export type CardSentenceStructure = JapaneseStructure | HighlightedStructure | SimpleStructure;

export const useCardSentence = (card: Card): CardSentenceStructure => {
  return useMemo(() => {
    const displayedSentence = card.targetSentence; // Assuming no processText modification for structure

    const hasFuriganaInDedicatedField = card.furigana && /\[.+?\]/.test(card.furigana);
    const hasFuriganaInSentence = card.targetSentence && /\[.+?\]/.test(card.targetSentence);

    let furiganaSource: string | undefined;
    if (hasFuriganaInDedicatedField) {
      const furiganaPlainText = parseFurigana(card.furigana!).map(s => s.text).join('');
      const sentencePlainText = card.targetSentence || '';
      // Heuristic: if furigana content matches at least 50% of the sentence, use it.
      if (furiganaPlainText.length >= sentencePlainText.length * 0.5) {
        furiganaSource = card.furigana;
      }
    }
    if (!furiganaSource && hasFuriganaInSentence) {
      furiganaSource = card.targetSentence;
    }
    
    // Japanese Logic
    if (card.language === LanguageId.Japanese && (furiganaSource || hasFuriganaInDedicatedField || hasFuriganaInSentence)) {
       // Start with best guess for source
       const effectiveSource = furiganaSource || card.targetSentence;
       const segments = parseFurigana(effectiveSource);
       const hasFurigana = segments.some(s => s.furigana);

       if (hasFurigana) {
         const targetWordPlain = card.targetWord
           ? parseFurigana(card.targetWord).map(s => s.text).join('')
           : null;

         const segmentTexts = segments.map(s => s.text);
         const fullText = segmentTexts.join('');
         const targetIndices = new Set<number>();

         if (targetWordPlain) {
           let targetStart = fullText.indexOf(targetWordPlain);
           let matchedWordLength = targetWordPlain.length;

           if (targetStart === -1) {
             const matchedWord = findInflectedWordInSentence(targetWordPlain, fullText);
             if (matchedWord) {
               targetStart = fullText.indexOf(matchedWord);
               matchedWordLength = matchedWord.length;
             }
           }

           if (targetStart !== -1) {
             const targetEnd = targetStart + matchedWordLength;
             let charIndex = 0;
             for (let i = 0; i < segments.length; i++) {
               const segmentStart = charIndex;
               const segmentEnd = charIndex + segments[i].text.length;
               if (segmentStart < targetEnd && segmentEnd > targetStart) {
                 targetIndices.add(i);
               }
               charIndex = segmentEnd;
             }
           }
         }
         return {
           type: 'japanese',
           segments,
           targetIndices
         };
       }
    }

    // Highlight Logic
    if (card.targetWord) {
        // Try to find the word to highlight
        const targetWordPlain = card.language === LanguageId.Japanese 
            ? parseFurigana(card.targetWord).map(s => s.text).join('')
            : card.targetWord;

        const matchedWord = findInflectedWordInSentence(targetWordPlain, displayedSentence);

        if (matchedWord) {
            const wordBoundaryRegex = new RegExp(`(\\b${escapeRegExp(matchedWord)}\\b)`, 'gi');
            const parts = displayedSentence.split(wordBoundaryRegex);
            return {
                type: 'highlighted',
                parts,
                matchedWord
            };
        }
    }

    // Default Simple Logic
    return {
        type: 'simple',
        text: displayedSentence
    };

  }, [card.targetSentence, card.targetWord, card.furigana, card.language]);
};
