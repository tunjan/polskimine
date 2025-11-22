import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = ''): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: 'polish'
});

export const BEGINNER_DECK: Card[] = [
  // --- GREETINGS & ESSENTIALS ---
  createCard("Dzień dobry, poproszę kawę.", "Good morning, a coffee please.", "poproszę", "Polite way to ask for something."),
  createCard("Dziękuję bardzo.", "Thank you very much.", "Dziękuję", ""),
  createCard("Nie rozumiem.", "I don't understand.", "rozumiem", "Verb: rozumieć."),
  createCard("Przepraszam, gdzie jest toaleta?", "Excuse me, where is the toilet?", "gdzie", ""),
  createCard("Mówisz po angielsku?", "Do you speak English?", "Mówisz", "Informal singular."),

  // --- TO BE (BYĆ) ---
  createCard("Jestem zmęczony.", "I am tired (male).", "Jestem", ""),
  createCard("Ona jest bardzo miła.", "She is very nice.", "jest", ""),
  createCard("To jest mój dom.", "This is my house.", "To", "Used as a pointer here."),
  createCard("Jesteśmy w pracy.", "We are at work.", "pracy", "Locative case of 'praca'."),
  createCard("Gdzie oni są?", "Where are they?", "są", ""),

  // --- TO HAVE (MIEĆ) & NEGATION (GENITIVE) ---
  createCard("Mam pytanie.", "I have a question.", "Mam", ""),
  createCard("Nie mam czasu.", "I don't have time.", "czasu", "Genitive case of 'czas' (negation)."),
  createCard("Masz ochotę na piwo?", "Do you feel like having a beer?", "ochotę", "Idiom: Mieć ochotę na..."),
  createCard("On nie ma pieniędzy.", "He doesn't have money.", "pieniędzy", "Genitive plural."),

  // --- COMMON VERBS ---
  createCard("Co robisz?", "What are you doing?", "robisz", ""),
  createCard("Idę do sklepu.", "I am going to the store.", "Idę", "Directional movement."),
  createCard("Chcę kupić chleb.", "I want to buy bread.", "Chcę", "Verb: chcieć + infinitive."),
  createCard("Lubię czytać książki.", "I like reading books.", "Lubię", ""),
  createCard("Muszę już iść.", "I have to go now.", "Muszę", "Modal verb: musieć."),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?", "Wiesz", "Common phrase."),
  createCard("Mogę ci pomóc?", "Can I help you?", "pomóc", "Takes dative case (ci)."),

  // --- PRONOUNS & QUESTIONS ---
  createCard("Kto to jest?", "Who is this?", "Kto", ""),
  createCard("Dlaczego płaczesz?", "Why are you crying?", "Dlaczego", ""),
  createCard("Kiedy wracasz?", "When are you coming back?", "Kiedy", ""),
  createCard("Wszystko w porządku?", "Is everything in order/okay?", "porządku", ""),
  createCard("Nic się nie stało.", "Nothing happened.", "Nic", "Double negation is standard in Polish."),

  // --- ADJECTIVES & DESCRIBING ---
  createCard("Ten samochód jest szybki.", "This car is fast.", "szybki", ""),
  createCard("Pogoda jest dzisiaj ładna.", "The weather is nice today.", "ładna", ""),
  createCard("Jest mi zimno.", "I am cold.", "zimno", "Literally: 'It is cold to me'."),
  createCard("To jest za drogie.", "This is too expensive.", "drogie", ""),

  // --- TIME & PLACE ---
  createCard("Mieszkam w Polsce.", "I live in Poland.", "Polsce", "Locative case."),
  createCard("Widzimy się jutro.", "See you tomorrow.", "jutro", ""),
  createCard("Teraz czy później?", "Now or later?", "Teraz", ""),
  createCard("Jest blisko stąd.", "It is close to here.", "blisko", ""),
  createCard("To jest daleko.", "It is far.", "daleko", ""),
];