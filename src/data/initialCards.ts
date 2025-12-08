/**
 * Starter deck cards for each language.
 * Uses cardFactory for consistent card creation with staggered due dates.
 */
import { Card, Language, LanguageId } from "@/types";
import {
  createNewCardWithOffset,
  CreateCardParams,
} from "@/features/collection/utils/cardFactory";

// Card data without runtime-generated fields (id, dueDate)
interface StarterCardData {
  targetSentence: string;
  nativeTranslation: string;
  targetWord: string;
  targetWordTranslation: string;
  extras?: Partial<CreateCardParams>;
}

// Stagger due dates by 10 seconds per card to control introduction order
const DUE_DATE_OFFSET_MS = 10_000;

/**
 * Creates a batch of cards from starter data with staggered due dates.
 * Cards are created lazily (when this function is called) to avoid
 * module-load-time issues with duplicate IDs across sessions.
 */
const createStarterDeck = (
  language: Language,
  cardsData: StarterCardData[],
): Card[] => {
  return cardsData.map((cardData, index) =>
    createNewCardWithOffset(
      {
        language,
        targetSentence: cardData.targetSentence,
        nativeTranslation: cardData.nativeTranslation,
        targetWord: cardData.targetWord,
        targetWordTranslation: cardData.targetWordTranslation,
        tags: ["beginner", "starter-deck"],
        ...cardData.extras,
      },
      index * DUE_DATE_OFFSET_MS,
    ),
  );
};

// Starter card data for each language (static, no generated fields)
const germanCardsData: StarterCardData[] = [
  {
    targetSentence: "Guten <b>Morgen</b>, wie geht es Ihnen?",
    nativeTranslation: "Good morning, how are you?",
    targetWord: "Morgen",
    targetWordTranslation: "Morning",
    extras: { gender: "der" },
  },
  {
    targetSentence: "Ich <b>heiße</b> Lukas.",
    nativeTranslation: "My name is Lukas.",
    targetWord: "heiße",
    targetWordTranslation: "am called",
  },
  {
    targetSentence: "Vielen <b>Dank</b> für Ihre Hilfe.",
    nativeTranslation: "Thank you very much for your help.",
    targetWord: "Dank",
    targetWordTranslation: "Thanks",
    extras: { gender: "der" },
  },
  {
    targetSentence: "Entschuldigung, wo ist der <b>Bahnhof</b>?",
    nativeTranslation: "Excuse me, where is the train station?",
    targetWord: "Bahnhof",
    targetWordTranslation: "Train station",
    extras: { gender: "der" },
  },
  {
    targetSentence: "Ich <b>verstehe</b> nicht.",
    nativeTranslation: "I do not understand.",
    targetWord: "verstehe",
    targetWordTranslation: "understand",
  },
];

const spanishCardsData: StarterCardData[] = [
  {
    targetSentence: "<b>Hola</b>, ¿cómo estás?",
    nativeTranslation: "Hello, how are you?",
    targetWord: "Hola",
    targetWordTranslation: "Hello",
  },
  {
    targetSentence: "<b>Me llamo</b> María.",
    nativeTranslation: "My name is Maria.",
    targetWord: "Me llamo",
    targetWordTranslation: "I call myself",
  },
  {
    targetSentence: "Muchas <b>gracias</b> por todo.",
    nativeTranslation: "Thank you very much for everything.",
    targetWord: "gracias",
    targetWordTranslation: "thanks",
  },
  {
    targetSentence: "¿Dónde está el <b>baño</b>?",
    nativeTranslation: "Where is the bathroom?",
    targetWord: "baño",
    targetWordTranslation: "bathroom",
    extras: { gender: "el" },
  },
  {
    targetSentence: "No <b>entiendo</b>.",
    nativeTranslation: "I don't understand.",
    targetWord: "entiendo",
    targetWordTranslation: "understand",
  },
];

const norwegianCardsData: StarterCardData[] = [
  {
    targetSentence: "God <b>morgen</b>, hvordan har du det?",
    nativeTranslation: "Good morning, how are you?",
    targetWord: "morgen",
    targetWordTranslation: "morning",
    extras: { gender: "en" },
  },
  {
    targetSentence: "Jeg <b>heter</b> Henrik.",
    nativeTranslation: "My name is Henrik.",
    targetWord: "heter",
    targetWordTranslation: "is called",
  },
  {
    targetSentence: "Tusen takk for <b>hjelpen</b>.",
    nativeTranslation: "Thank you very much for the help.",
    targetWord: "hjelpen",
    targetWordTranslation: "help",
    extras: { gender: "ei" },
  },
  {
    targetSentence: "Unnskyld, hvor er <b>stasjonen</b>?",
    nativeTranslation: "Excuse me, where is the station?",
    targetWord: "stasjonen",
    targetWordTranslation: "station",
    extras: { gender: "en" },
  },
  {
    targetSentence: "Jeg <b>forstår</b> ikke.",
    nativeTranslation: "I do not understand.",
    targetWord: "forstår",
    targetWordTranslation: "understand",
  },
];

const polishCardsData: StarterCardData[] = [
  {
    targetSentence: "<b>Dzień dobry</b>, jak się masz?",
    nativeTranslation: "Good morning, how are you?",
    targetWord: "Dzień dobry",
    targetWordTranslation: "Good morning",
  },
  {
    targetSentence: "<b>Nazywam się</b> Anna.",
    nativeTranslation: "My name is Anna.",
    targetWord: "Nazywam się",
    targetWordTranslation: "My name is",
  },
  {
    targetSentence: "<b>Dziękuję</b> bardzo za pomoc.",
    nativeTranslation: "Thank you very much for the help.",
    targetWord: "Dziękuję",
    targetWordTranslation: "Thank you",
  },
  {
    targetSentence: "Przepraszam, gdzie jest <b>dworzec</b>?",
    nativeTranslation: "Excuse me, where is the station?",
    targetWord: "dworzec",
    targetWordTranslation: "station",
    extras: { gender: "m" },
  },
  {
    targetSentence: "Nie <b>rozumiem</b>.",
    nativeTranslation: "I do not understand.",
    targetWord: "rozumiem",
    targetWordTranslation: "understand",
  },
];

const japaneseCardsData: StarterCardData[] = [
  {
    targetSentence: "<b>おはよう</b>ございます、お元気ですか？",
    nativeTranslation: "Good morning, how are you?",
    targetWord: "おはよう",
    targetWordTranslation: "Good morning",
    extras: { furigana: "<b>おはよう</b>ございます、お元気[げんき]ですか？" },
  },
  {
    targetSentence: "私の<b>名前</b>は田中です。",
    nativeTranslation: "My name is Tanaka.",
    targetWord: "名前",
    targetWordTranslation: "Name",
    extras: { furigana: "私[わたし]の<b>名前[なまえ]</b>は田中[たなか]です。" },
  },
  {
    targetSentence: "<b>手伝って</b>くれてありがとうございます。",
    nativeTranslation: "Thank you for helping me.",
    targetWord: "手伝って",
    targetWordTranslation: "Helping",
    extras: { furigana: "<b>手伝[てつだ]って</b>くれてありがとうございます。" },
  },
  {
    targetSentence: "すみません、<b>駅</b>はどこですか？",
    nativeTranslation: "Excuse me, where is the station?",
    targetWord: "駅",
    targetWordTranslation: "Station",
    extras: { furigana: "すみません、<b>駅[えき]</b>はどこですか？" },
  },
  {
    targetSentence: "<b>分かりません</b>。",
    nativeTranslation: "I do not understand.",
    targetWord: "分かりません",
    targetWordTranslation: "don't understand",
    extras: { furigana: "<b>分[わ]かりません</b>。" },
  },
];

/**
 * Get initial starter cards for a language.
 * Cards are created fresh each time to avoid ID collisions and
 * have properly staggered due dates.
 */
export const getInitialCards = (language: Language): Card[] => {
  switch (language) {
    case LanguageId.German:
      return createStarterDeck(LanguageId.German, germanCardsData);
    case LanguageId.Spanish:
      return createStarterDeck(LanguageId.Spanish, spanishCardsData);
    case LanguageId.Norwegian:
      return createStarterDeck(LanguageId.Norwegian, norwegianCardsData);
    case LanguageId.Polish:
      return createStarterDeck(LanguageId.Polish, polishCardsData);
    case LanguageId.Japanese:
      return createStarterDeck(LanguageId.Japanese, japaneseCardsData);
    default:
      return [];
  }
};

// Deprecated: kept for backward compatibility if needed
export const initialCards: Card[] = [];
