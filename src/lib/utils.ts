import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export interface FuriganaSegment {
  text: string;
  furigana?: string;
}

export function parseFurigana(text: string): FuriganaSegment[] {
  const regex = /([^\s\[\]]+)\[([^\]]+)\]/g;
  const segments: FuriganaSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add any text between the last match and this match
    if (match.index > lastIndex) {
      const betweenText = text.slice(lastIndex, match.index);
      // Split by spaces and add each part as a segment
      betweenText.split(/(\s+)/).forEach(part => {
        if (part) {
          segments.push({ text: part });
        }
      });
    }

    // Check for leading hiragana to fix spatial displacement
    const kanjiText = match[1];
    const furigana = match[2];
    const hiraganaRegex = /^([\u3040-\u309f]+)(.*)/;
    const hiraganaMatch = kanjiText.match(hiraganaRegex);

    if (hiraganaMatch && hiraganaMatch[2]) {
      // If there's leading hiragana and remaining text (kanji/katakana/etc),
      // split it so the hiragana is outside the ruby tag
      segments.push({ text: hiraganaMatch[1] });
      segments.push({ text: hiraganaMatch[2], furigana: furigana });
    } else {
      segments.push({ text: kanjiText, furigana: furigana });
    }

    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    remainingText.split(/(\s+)/).forEach(part => {
      if (part) {
        segments.push({ text: part });
      }
    });
  }

  return segments;
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

/**
 * Calculate level from XP using formula: XP = 100 * (level - 1)^2
 * @param xp - The experience points
 * @returns The calculated level (minimum 1)
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP required for a given level
 * @param level - The target level
 * @returns XP required to reach this level
 */
export function getXpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

/**
 * Calculate level progress percentage
 * @param xp - Current XP
 * @returns Object with current level, progress percentage, and XP to next level
 */
export function getLevelProgress(xp: number): {
  level: number;
  progressPercent: number;
  xpToNextLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const progressPercent = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  const xpToNextLevel = nextLevelXp - xp;
  
  return {
    level,
    progressPercent,
    xpToNextLevel,
    currentLevelXp,
    nextLevelXp,
  };
}
