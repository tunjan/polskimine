export const CARD_ORDER = {
  NEW_FIRST: "newFirst",
  REVIEW_FIRST: "reviewFirst",
  MIXED: "mixed",
} as const;

export type CardOrderValue = (typeof CARD_ORDER)[keyof typeof CARD_ORDER];

export const TTS_PROVIDER = {
  BROWSER: "browser",
  GOOGLE: "google",
  AZURE: "azure",
} as const;

export type TTSProviderValue = (typeof TTS_PROVIDER)[keyof typeof TTS_PROVIDER];

// Display Order Settings
export const NEW_CARD_GATHER_ORDER = {
  ADDED: "added",
  RANDOM: "random",
} as const;

export type NewCardGatherOrderValue =
  (typeof NEW_CARD_GATHER_ORDER)[keyof typeof NEW_CARD_GATHER_ORDER];

export const NEW_CARD_SORT_ORDER = {
  DUE: "due",
  RANDOM: "random",
  CARD_TYPE: "cardType",
} as const;

export type NewCardSortOrderValue =
  (typeof NEW_CARD_SORT_ORDER)[keyof typeof NEW_CARD_SORT_ORDER];

export const NEW_REVIEW_ORDER = {
  MIXED: "mixed",
  NEW_FIRST: "newFirst",
  REVIEW_FIRST: "reviewFirst",
} as const;

export type NewReviewOrderValue =
  (typeof NEW_REVIEW_ORDER)[keyof typeof NEW_REVIEW_ORDER];

export const INTERDAY_LEARNING_ORDER = {
  MIXED: "mixed",
  BEFORE_REVIEWS: "before",
  AFTER_REVIEWS: "after",
} as const;

export type InterdayLearningOrderValue =
  (typeof INTERDAY_LEARNING_ORDER)[keyof typeof INTERDAY_LEARNING_ORDER];

export const REVIEW_SORT_ORDER = {
  DUE: "due",
  DUE_RANDOM: "dueRandom",
  OVERDUENESS: "overdueness",
  RANDOM: "random",
} as const;

export type ReviewSortOrderValue =
  (typeof REVIEW_SORT_ORDER)[keyof typeof REVIEW_SORT_ORDER];

// Lapses Settings
export const LEECH_ACTION = {
  TAG: "tag",
  SUSPEND: "suspend",
} as const;

export type LeechActionValue = (typeof LEECH_ACTION)[keyof typeof LEECH_ACTION];
