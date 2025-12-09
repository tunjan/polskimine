import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FuriganaSegment } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getLevelProgress(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelStartXP = 100 * Math.pow(level - 1, 2);
  const nextLevelStartXP = 100 * Math.pow(level, 2);
  const xpGainedInLevel = xp - currentLevelStartXP;
  const xpRequiredForLevel = nextLevelStartXP - currentLevelStartXP;
  const progressPercent = Math.min(
    100,
    Math.max(0, (xpGainedInLevel / xpRequiredForLevel) * 100),
  );
  const xpToNextLevel = nextLevelStartXP - xp;

  return { level, progressPercent, xpToNextLevel };
}

export function parseFurigana(text: string): FuriganaSegment[] {
  const regex = /([^\s\[\]]+)\[([^\]]+)\]/g;
  const segments: FuriganaSegment[] = [];
  let lastIndex = 0;
  let match;

  const punctuationRegex = /^([、。！？「」『』（）\(\),.!?:;""''—\-–]+)(.*)/;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const betweenText = text.slice(lastIndex, match.index);

      betweenText.split(/(\s+)/).forEach((part) => {
        if (part) {
          segments.push({ text: part });
        }
      });
    }

    let kanjiText = match[1];
    const furigana = match[2];

    while (true) {
      const punctuationMatch = kanjiText.match(punctuationRegex);
      if (punctuationMatch && punctuationMatch[2]) {
        segments.push({ text: punctuationMatch[1] });
        kanjiText = punctuationMatch[2];
        continue;
      }

      const kanaRegex = /^([\u3040-\u30ff]+)(.*)/;
      const kanaMatch = kanjiText.match(kanaRegex);

      if (kanaMatch && kanaMatch[2]) {
        segments.push({ text: kanaMatch[1] });
        kanjiText = kanaMatch[2];
        continue;
      }

      break;
    }

    segments.push({ text: kanjiText, furigana: furigana });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    remainingText.split(/(\s+)/).forEach((part) => {
      if (part) {
        segments.push({ text: part });
      }
    });
  }

  return segments;
}

export function findInflectedWordInSentence(
  targetWord: string,
  sentence: string,
): string | null {
  if (!targetWord || !sentence) return null;

  const targetLower = targetWord.toLowerCase();

  const words = sentence.match(/[\p{L}]+/gu) || [];

    const exactMatch = words.find((w) => w.toLowerCase() === targetLower);
  if (exactMatch) return exactMatch;

      const minStemLength =
    targetWord.length <= 4
      ? Math.max(3, Math.ceil(targetWord.length * 0.7))
      : Math.min(4, Math.ceil(targetWord.length * 0.5));

  let bestMatch: string | null = null;
  let bestMatchScore = 0;

  for (const word of words) {
    const wordLower = word.toLowerCase();

            const lengthRatio = word.length / targetWord.length;
    if (lengthRatio < 0.5 || lengthRatio > 2.0) continue;

    let sharedLength = 0;

        for (let i = 0; i < targetLower.length; i++) {
      for (let j = 0; j < wordLower.length; j++) {
        let k = 0;
        while (
          i + k < targetLower.length &&
          j + k < wordLower.length &&
          targetLower[i + k] === wordLower[j + k]
        ) {
          k++;
        }
        if (k > sharedLength) {
          sharedLength = k;
        }
      }
    }

    if (sharedLength >= minStemLength) {
            const lengthDiff = Math.abs(targetWord.length - word.length);

                  const startsWithBonus = wordLower.startsWith(targetLower.slice(0, 2))
        ? 5
        : 0;

      if (targetWord.length < 5 && startsWithBonus === 0) {
        continue;       }

      const score = sharedLength * 10 - lengthDiff * 2 + startsWithBonus;

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = word;
      }
    }
  }

  return bestMatch;
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}
