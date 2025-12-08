import { Card, Language, LanguageId, CardStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Helper to create a card with defaults
const createCard = (
  language: Language,
  targetSentence: string,
  nativeTranslation: string,
  targetWord: string,
  targetWordTranslation: string,
  extras: Partial<Card> = {},
): Partial<Card> => ({
  id: uuidv4(),
  language,
  targetSentence,
  nativeTranslation,
  targetWord,
  targetWordTranslation,
  status: CardStatus.NEW,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  notes: "",
  tags: ["beginner", "default"],
  ...extras,
});

const germanCards: Partial<Card>[] = [
  createCard(
    "german",
    "Guten <b>Morgen</b>, wie geht es Ihnen?",
    "Good morning, how are you?",
    "Morgen",
    "Morning",
    { gender: "der" },
  ),
  createCard(
    "german",
    "Ich <b>heiße</b> Lukas.",
    "My name is Lukas.",
    "heiße",
    "am called",
  ),
  createCard(
    "german",
    "Vielen <b>Dank</b> für Ihre Hilfe.",
    "Thank you very much for your help.",
    "Dank",
    "Thanks",
    { gender: "der" },
  ),
  createCard(
    "german",
    "Entschuldigung, wo ist der <b>Bahnhof</b>?",
    "Excuse me, where is the train station?",
    "Bahnhof",
    "Train station",
    { gender: "der" },
  ),
  createCard(
    "german",
    "Ich <b>verstehe</b> nicht.",
    "I do not understand.",
    "verstehe",
    "understand",
  ),
];

const spanishCards: Partial<Card>[] = [
  createCard(
    "spanish",
    "<b>Hola</b>, ¿cómo estás?",
    "Hello, how are you?",
    "Hola",
    "Hello",
  ),
  createCard(
    "spanish",
    "<b>Me llamo</b> María.",
    "My name is Maria.",
    "Me llamo",
    "I call myself",
  ),
  createCard(
    "spanish",
    "Muchas <b>gracias</b> por todo.",
    "Thank you very much for everything.",
    "gracias",
    "thanks",
  ),
  createCard(
    "spanish",
    "¿Dónde está el <b>baño</b>?",
    "Where is the bathroom?",
    "baño",
    "bathroom",
    { gender: "el" },
  ),
  createCard(
    "spanish",
    "No <b>entiendo</b>.",
    "I don't understand.",
    "entiendo",
    "understand",
  ),
];

const norwegianCards: Partial<Card>[] = [
  createCard(
    "norwegian",
    "God <b>morgen</b>, hvordan har du det?",
    "Good morning, how are you?",
    "morgen",
    "morning",
    { gender: "en" },
  ),
  createCard(
    "norwegian",
    "Jeg <b>heter</b> Henrik.",
    "My name is Henrik.",
    "heter",
    "is called",
  ),
  createCard(
    "norwegian",
    "Tusen takk for <b>hjelpen</b>.",
    "Thank you very much for the help.",
    "hjelpen",
    "help",
    { gender: "ei" },
  ),
  createCard(
    "norwegian",
    "Unnskyld, hvor er <b>stasjonen</b>?",
    "Excuse me, where is the station?",
    "stasjonen",
    "station",
    { gender: "en" },
  ),
  createCard(
    "norwegian",
    "Jeg <b>forstår</b> ikke.",
    "I do not understand.",
    "forstår",
    "understand",
  ),
];

const polishCards: Partial<Card>[] = [
  createCard(
    "polish",
    "<b>Dzień dobry</b>, jak się masz?",
    "Good morning, how are you?",
    "Dzień dobry",
    "Good morning",
  ),
  createCard(
    "polish",
    "<b>Nazywam się</b> Anna.",
    "My name is Anna.",
    "Nazywam się",
    "My name is",
  ),
  createCard(
    "polish",
    "<b>Dziękuję</b> bardzo za pomoc.",
    "Thank you very much for the help.",
    "Dziękuję",
    "Thank you",
  ),
  createCard(
    "polish",
    "Przepraszam, gdzie jest <b>dworzec</b>?",
    "Excuse me, where is the station?",
    "dworzec",
    "station",
    { gender: "m" },
  ),
  createCard(
    "polish",
    "Nie <b>rozumiem</b>.",
    "I do not understand.",
    "rozumiem",
    "understand",
  ),
];

const japaneseCards: Partial<Card>[] = [
  createCard(
    "japanese",
    "<b>おはよう</b>ございます、お元気ですか？",
    "Good morning, how are you?",
    "おはよう",
    "Good morning",
    { furigana: "<b>おはよう</b>ございます、お元気[げんき]ですか？" },
  ),
  createCard(
    "japanese",
    "私の<b>名前</b>は田中です。",
    "My name is Tanaka.",
    "名前",
    "Name",
    { furigana: "私[わたし]の<b>名前[なまえ]</b>は田中[たなか]です。" },
  ),
  createCard(
    "japanese",
    "<b>手伝って</b>くれてありがとうございます。",
    "Thank you for helping me.",
    "手伝って",
    "Helping",
    { furigana: "<b>手伝[てつだ]って</b>くれてありがとうございます。" },
  ),
  createCard(
    "japanese",
    "すみません、<b>駅</b>はどこですか？",
    "Excuse me, where is the station?",
    "駅",
    "Station",
    { furigana: "すみません、<b>駅[えき]</b>はどこですか？" },
  ),
  createCard(
    "japanese",
    "<b>分かりません</b>。",
    "I do not understand.",
    "分かりません",
    "don't understand",
    { furigana: "<b>分[わ]かりません</b>。" },
  ),
];

export const getInitialCards = (language: Language): Partial<Card>[] => {
  switch (language) {
    case LanguageId.German:
      return germanCards;
    case LanguageId.Spanish:
      return spanishCards;
    case LanguageId.Norwegian:
      return norwegianCards;
    case LanguageId.Polish:
      return polishCards;
    case LanguageId.Japanese:
      return japaneseCards;
    default:
      return [];
  }
};

// Deprecated: kept for backward compatibility if needed, but should ideally rely on the function above
export const initialCards: any[] = [];
