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
