import { Card, ReviewHistory, LanguageId } from "./types";
import { format } from "date-fns";

export const MOCK_CARDS: Card[] = [
  {
    id: "1",
    targetSentence: "Cześć, jak się masz?",
    targetWord: "Cześć",
    nativeTranslation: "Hi, how are you?",
    notes: "Informal greeting. Also means 'Bye' depending on context.",
    language: LanguageId.Polish,
    type: 0,
    queue: 0,
    due: 0,
    last_modified: 0,
    left: 0,
    interval: 0,
    easeFactor: 2.5,
  },
  {
    id: "2",
    targetSentence: "Dziękuję za pomoc.",
    targetWord: "Dziękuję",
    nativeTranslation: "Thank you for the help.",
    notes: "First person singular of dziękować.",
    language: LanguageId.Polish,
    type: 1,
    queue: 1,
    due: Math.floor(Date.now() / 1000),     last_modified: 0,
    left: 2,     interval: 0,
    easeFactor: 2.5,
  },
  {
    id: "3",
    targetSentence: "Tamten mężczyzna jest wysoki.",
    targetWord: "mężczyzna",
    nativeTranslation: "That man is tall.",
    notes: "Noun, Masculine Personal.",
    language: LanguageId.Polish,
    type: 0,
    queue: 0,
    due: 1,     last_modified: 0,
    left: 0,
    interval: 0,
    easeFactor: 2.5,
  },
  {
    id: "4",
    targetSentence: "Lubię pić kawę rano.",
    targetWord: "kawę",
    nativeTranslation: "I like to drink coffee in the morning.",
    notes: "Accusative case of 'kawa'.",
    language: LanguageId.Polish,
    type: 2,
    queue: 2,
    due: Math.floor(Date.now() / (24 * 60 * 60 * 1000)) + 5,     last_modified: 0,
    left: 0,
    interval: 10,
    easeFactor: 2.7,
  },
  {
    id: "5",
    targetSentence: "Wszystko w porządku?",
    nativeTranslation: "Is everything okay?",
    notes:
      "Common phrase used to ask if someone is fine or if a situation is resolved.",
    language: LanguageId.Polish,
    type: 0,
    queue: 0,
    due: 2,     last_modified: 0,
    left: 0,
    interval: 0,
    easeFactor: 2.5,
  },
];

export const getUTCDateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

const generateMockHistory = (): ReviewHistory => {
  const history: ReviewHistory = {};
  const today = new Date();
  for (let i = 0; i < 100; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));
    const dateKey = getUTCDateString(pastDate);

    history[dateKey] =
      (history[dateKey] || 0) + Math.floor(Math.random() * 10) + 1;
  }
  return history;
};

export const MOCK_HISTORY = generateMockHistory();

export const STORAGE_KEY = "language_mining_deck_v1";
export const HISTORY_KEY = "language_mining_history_v1";

export const SRS_CONFIG = {
  CUTOFF_HOUR: 4,
};

export const FSRS_DEFAULTS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzzing: true,
  w: [
    0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722,
    0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425,
    0.0912, 0.0658, 0.1542,
  ],
};

export const LANGUAGE_NAMES = {
  polish: "Polish",
  norwegian: "Norwegian",
  japanese: "Japanese",
  spanish: "Spanish",
  german: "German",
} as const;
