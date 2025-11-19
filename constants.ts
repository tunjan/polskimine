import { Card, ReviewHistory } from './types';

export const MOCK_CARDS: Card[] = [
  {
    id: '1',
    targetSentence: "Cześć, jak się masz?",
    targetWord: "Cześć",
    nativeTranslation: "Hi, how are you?",
    notes: "Informal greeting. Also means 'Bye' depending on context.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '2',
    targetSentence: "Dziękuję za pomoc.",
    targetWord: "Dziękuję",
    nativeTranslation: "Thank you for the help.",
    notes: "First person singular of dziękować.",
    status: 'learning',
    interval: 1,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Due yesterday
  },
  {
    id: '3',
    targetSentence: "Ten mężczyzna jest wysoki.",
    targetWord: "mężczyzna",
    nativeTranslation: "That man is tall.",
    notes: "Noun, Masculine Personal.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '4',
    targetSentence: "Lubię pić kawę rano.",
    targetWord: "kawę",
    nativeTranslation: "I like to drink coffee in the morning.",
    notes: "Accusative case of 'kawa'.",
    status: 'graduated',
    interval: 10,
    easeFactor: 2.7,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Due in 5 days
  },
  {
    id: '5',
    targetSentence: "Wszystko w porządku?",
    // No targetWord here implies pure sentence mining
    nativeTranslation: "Is everything okay?",
    notes: "Common phrase used to ask if someone is fine or if a situation is resolved.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
];

// Generate some fake history for the last year
const generateMockHistory = (): ReviewHistory => {
  const history: ReviewHistory = {};
  const today = new Date();
  for (let i = 0; i < 100; i++) {
    // Random days in the past year
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));
    const dateKey = pastDate.toISOString().split('T')[0];
    
    // Add random reviews (1-15)
    history[dateKey] = (history[dateKey] || 0) + Math.floor(Math.random() * 10) + 1;
  }
  return history;
};

export const MOCK_HISTORY = generateMockHistory();

export const STORAGE_KEY = 'polski_mining_deck_v1';
export const HISTORY_KEY = 'polski_mining_history_v1';

export const SRS_CONFIG = {
  CUTOFF_HOUR: 4,
};

export const FSRS_DEFAULTS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzzing: true,
  w: [0.40255, 1.18385, 3.173, 15.69105, 7.19605, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 2.9605, 2.27315, 0.20375, 0.37325, 0.89045, 0.02495],
};
