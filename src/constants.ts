import { Card, ReviewHistory } from "./types";

export const MOCK_CARDS: Card[] = [
  {
    id: "1",
    targetSentence: "Cześć, jak się masz?",
    targetWord: "Cześć",
    nativeTranslation: "Hi, how are you?",
    notes: "Informal greeting. Also means 'Bye' depending on context.",
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: "2",
    targetSentence: "Dziękuję za pomoc.",
    targetWord: "Dziękuję",
    nativeTranslation: "Thank you for the help.",
    notes: "First person singular of dziękować.",
    status: "learning",
    interval: 1,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    targetSentence: "Ten mężczyzna jest wysoki.",
    targetWord: "mężczyzna",
    nativeTranslation: "That man is tall.",
    notes: "Noun, Masculine Personal.",
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: "4",
    targetSentence: "Lubię pić kawę rano.",
    targetWord: "kawę",
    nativeTranslation: "I like to drink coffee in the morning.",
    notes: "Accusative case of 'kawa'.",
    status: "graduated",
    interval: 10,
    easeFactor: 2.7,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: "5",
    targetSentence: "Wszystko w porządku?",

    nativeTranslation: "Is everything okay?",
    notes:
      "Common phrase used to ask if someone is fine or if a situation is resolved.",
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
];

export const getUTCDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
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
