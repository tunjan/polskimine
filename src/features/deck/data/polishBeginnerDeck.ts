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

export const POLISH_BEGINNER_DECK: Card[] = [

  createCard("Dzień dobry, poproszę kawę.", "Good morning, a coffee please.", "poproszę", "Polite way to ask for something."),
  createCard("Dziękuję bardzo.", "Thank you very much.", "Dziękuję", ""),
  createCard("Nie rozumiem.", "I don't understand.", "rozumiem", "Verb: rozumieć."),
  createCard("Przepraszam, gdzie jest toaleta?", "Excuse me, where is the toilet?", "gdzie", ""),
  createCard("Mówisz po angielsku?", "Do you speak English?", "Mówisz", "Informal singular."),
  createCard("Cześć, jak się masz?", "Hi, how are you?", "Cześć", "Informal greeting."),
  createCard("Dobranoc.", "Good night.", "Dobranoc", ""),
  createCard("Do widzenia.", "Goodbye.", "widzenia", "Formal."),
  createCard("Proszę.", "Please / Here you go.", "Proszę", ""),
  createCard("Tak, poproszę.", "Yes, please.", "Tak", ""),
  createCard("Nie, dziękuję.", "No, thank you.", "Nie", ""),


  createCard("Jestem zmęczony.", "I am tired (male).", "Jestem", ""),
  createCard("Ona jest bardzo miła.", "She is very nice.", "jest", ""),
  createCard("To jest mój dom.", "This is my house.", "To", "Used as a pointer here."),
  createCard("Jesteśmy w pracy.", "We are at work.", "pracy", "Locative case of 'praca'."),
  createCard("Gdzie oni są?", "Where are they?", "są", ""),
  createCard("Czy jesteś głodny?", "Are you hungry?", "jesteś", ""),
  createCard("Byłem tam wczoraj.", "I was there yesterday (male).", "Byłem", "Past tense."),


  createCard("Mam pytanie.", "I have a question.", "Mam", ""),
  createCard("Nie mam czasu.", "I don't have time.", "czasu", "Genitive case of 'czas' (negation)."),
  createCard("Masz ochotę na piwo?", "Do you feel like having a beer?", "ochotę", "Idiom: Mieć ochotę na..."),
  createCard("On nie ma pieniędzy.", "He doesn't have money.", "pieniędzy", "Genitive plural."),
  createCard("Mamy nowy samochód.", "We have a new car.", "Mamy", ""),


  createCard("Co robisz?", "What are you doing?", "robisz", ""),
  createCard("Idę do sklepu.", "I am going to the store.", "Idę", "Directional movement."),
  createCard("Chcę kupić chleb.", "I want to buy bread.", "Chcę", "Verb: chcieć + infinitive."),
  createCard("Lubię czytać książki.", "I like reading books.", "Lubię", ""),
  createCard("Muszę już iść.", "I have to go now.", "Muszę", "Modal verb: musieć."),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?", "Wiesz", "Common phrase."),
  createCard("Mogę ci pomóc?", "Can I help you?", "pomóc", "Takes dative case (ci)."),
  createCard("Myślę, że tak.", "I think so.", "Myślę", ""),
  createCard("Nie wiem.", "I don't know.", "wiem", ""),
  createCard("Robię obiad.", "I am making lunch.", "Robię", ""),
  createCard("Weź to.", "Take this.", "Weź", "Imperative."),
  createCard("Daj mi to.", "Give me that.", "Daj", "Imperative."),
  createCard("Widzę cię.", "I see you.", "Widzę", ""),
  createCard("Słyszysz mnie?", "Do you hear me?", "Słyszysz", ""),


  createCard("Kto to jest?", "Who is this?", "Kto", ""),
  createCard("Dlaczego płaczesz?", "Why are you crying?", "Dlaczego", ""),
  createCard("Kiedy wracasz?", "When are you coming back?", "Kiedy", ""),
  createCard("Gdzie mieszkasz?", "Where do you live?", "Gdzie", ""),
  createCard("Jak się nazywasz?", "What is your name?", "Jak", "Literally: How do you call yourself?"),
  createCard("Co to jest?", "What is this?", "Co", ""),
  createCard("Ile to kosztuje?", "How much does it cost?", "Ile", ""),


  createCard("Wszystko w porządku?", "Is everything in order/okay?", "porządku", ""),
  createCard("Nic się nie stało.", "Nothing happened.", "Nic", "Double negation is standard."),
  createCard("Na zdrowie!", "Cheers! / Bless you!", "zdrowie", ""),
  createCard("Smacznego.", "Bon appétit.", "Smacznego", ""),
  createCard("Pomocy!", "Help!", "Pomocy", ""),
  createCard("Zgubiłem się.", "I am lost (male).", "Zgubiłem", ""),
  createCard("Potrzebuję lekarza.", "I need a doctor.", "Potrzebuję", ""),


  createCard("Ten samochód jest szybki.", "This car is fast.", "szybki", ""),
  createCard("Pogoda jest dzisiaj ładna.", "The weather is nice today.", "ładna", ""),
  createCard("Jest mi zimno.", "I am cold.", "zimno", "Literally: 'It is cold to me'."),
  createCard("To jest za drogie.", "This is too expensive.", "drogie", ""),
  createCard("Jestem szczęśliwy.", "I am happy (male).", "szczęśliwy", ""),
  createCard("To jest trudne.", "This is difficult.", "trudne", ""),


  createCard("Mieszkam w Polsce.", "I live in Poland.", "Polsce", "Locative case."),
  createCard("Widzimy się jutro.", "See you tomorrow.", "jutro", ""),
  createCard("Teraz czy później?", "Now or later?", "Teraz", ""),
  createCard("Jest blisko stąd.", "It is close to here.", "blisko", ""),
  createCard("To jest daleko.", "It is far.", "daleko", "")
];
