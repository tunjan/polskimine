import { useMemo } from "react";
import { Card, Language, LanguageId, FuriganaSegment } from "@/types";
import {
  parseFurigana,
  findInflectedWordInSentence,
  escapeRegExp,
} from "@/lib/utils";

export type JapaneseStructure = {
  type: "japanese";
  segments: FuriganaSegment[];
  targetIndices: Set<number>;
};

export type HighlightStructure = {
  type: "highlight";
  parts: string[];
  matchedWord: string;
};

export type PlainStructure = {
  type: "plain";
};

export type CardSentenceStructure =
  | JapaneseStructure
  | HighlightStructure
  | PlainStructure;

export const useCardSentence = (
  card: Card,
  languageOverride?: Language,
): CardSentenceStructure => {
  return useMemo(() => {
    const language = languageOverride ?? card.language;
    const displayedSentence = card.targetSentence;

    if (language === LanguageId.Japanese) {
      const hasFuriganaInDedicatedField =
        card.furigana && /\[.+?\]/.test(card.furigana);
      const hasFuriganaInSentence =
        card.targetSentence && /\[.+?\]/.test(card.targetSentence);

      let furiganaSource: string | undefined;
      if (hasFuriganaInDedicatedField) {
        const furiganaPlainText = parseFurigana(card.furigana!)
          .map((s) => s.text)
          .join("");
        const sentencePlainText = card.targetSentence || "";
        if (furiganaPlainText.length >= sentencePlainText.length * 0.5) {
          furiganaSource = card.furigana;
        }
      }

      if (!furiganaSource && hasFuriganaInSentence) {
        furiganaSource = card.targetSentence;
      }

      if (!furiganaSource) {
        furiganaSource = card.targetSentence;
      }

      if (furiganaSource) {
        const segments = parseFurigana(furiganaSource);
        const hasFurigana = segments.some((s) => s.furigana);

        if (hasFurigana) {
          const targetWordPlain = card.targetWord
            ? parseFurigana(card.targetWord)
              .map((s) => s.text)
              .join("")
            : null;

          const segmentTexts = segments.map((s) => s.text);
          const fullText = segmentTexts.join("");
          const targetIndices = new Set<number>();

          if (targetWordPlain) {
            let targetStart = fullText.indexOf(targetWordPlain);
            let matchedWordLength = targetWordPlain.length;

            if (targetStart === -1) {
              const matchedWord = findInflectedWordInSentence(
                targetWordPlain,
                fullText,
              );
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
            type: "japanese",
            segments,
            targetIndices,
          };
        }
      }
    }

    if (card.targetWord) {
      const targetWordPlain = parseFurigana(card.targetWord)
        .map((s) => s.text)
        .join("");

      const matchedWord = findInflectedWordInSentence(
        targetWordPlain,
        displayedSentence,
      );

      if (matchedWord) {
        const wordBoundaryRegex = new RegExp(
          `(\\b${escapeRegExp(matchedWord)}\\b)`,
          "gi",
        );
        const parts = displayedSentence.split(wordBoundaryRegex);
        return {
          type: "highlight",
          parts,
          matchedWord,
        };
      }
    }

    return { type: "plain" };
  }, [
    card.targetSentence,
    card.targetWord,
    card.furigana,
    card.language,
    languageOverride,
  ]);
};
