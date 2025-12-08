import { Card } from '@/types';
import { createPolishCard as createCard } from '@/features/collection/utils/createCard';

export const POLISH_BEGINNER_DECK: Card[] = [

  createCard("Dzień dobry, poproszę kawę.", "Good morning, a coffee please.", "poproszę", "Polite way to ask for something.", "please", "adverb"),
  createCard("Dziękuję bardzo.", "Thank you very much.", "Dziękuję", "", "I thank", "verb"),
  createCard("Nie rozumiem.", "I don't understand.", "rozumiem", "Verb: rozumieć.", "I understand", "verb"),
  createCard("Przepraszam, gdzie jest toaleta?", "Excuse me, where is the toilet?", "gdzie", "", "where", "adverb"),
  createCard("Mówisz po angielsku?", "Do you speak English?", "Mówisz", "Informal singular.", "you speak", "verb"),
  createCard("Cześć, jak się masz?", "Hi, how are you?", "Cześć", "Informal greeting.", "hello", "interjection"),
  createCard("Dobranoc.", "Good night.", "Dobranoc", "", "good night", "interjection"),
  createCard("Do widzenia.", "Goodbye.", "widzenia", "Formal.", "goodbye", "interjection"),
  createCard("Proszę.", "Please / Here you go.", "Proszę", "", "please", "interjection"),
  createCard("Tak, poproszę.", "Yes, please.", "Tak", "", "yes", "adverb"),
  createCard("Nie, dziękuję.", "No, thank you.", "Nie", "", "no", "adverb"),


  createCard("Jestem zmęczony.", "I am tired (male).", "Jestem", "", "I am", "verb"),
  createCard("Ona jest bardzo miła.", "She is very nice.", "jest", "", "is", "verb"),
  createCard("To jest mój dom.", "This is my house.", "To", "Used as a pointer here.", "this/that", "pronoun"),
  createCard("Jesteśmy w pracy.", "We are at work.", "pracy", "Locative case of 'praca'.", "work", "noun"),
  createCard("Gdzie oni są?", "Where are they?", "są", "", "are", "verb"),
  createCard("Czy jesteś głodny?", "Are you hungry?", "jesteś", "", "you are", "verb"),
  createCard("Byłem tam wczoraj.", "I was there yesterday (male).", "Byłem", "Past tense.", "I was", "verb"),


  createCard("Mam pytanie.", "I have a question.", "Mam", "", "I have", "verb"),
  createCard("Nie mam czasu.", "I don't have time.", "czasu", "Genitive case of 'czas' (negation).", "time", "noun"),
  createCard("Masz ochotę na piwo?", "Do you feel like having a beer?", "ochotę", "Idiom: Mieć ochotę na...", "desire", "noun"),
  createCard("On nie ma pieniędzy.", "He doesn't have money.", "pieniędzy", "Genitive plural.", "money", "noun"),
  createCard("Mamy nowy samochód.", "We have a new car.", "Mamy", "", "we have", "verb"),


  createCard("Co robisz?", "What are you doing?", "robisz", "", "you do", "verb"),
  createCard("Idę do sklepu.", "I am going to the store.", "Idę", "Directional movement.", "I go", "verb"),
  createCard("Chcę kupić chleb.", "I want to buy bread.", "Chcę", "Verb: chcieć + infinitive.", "I want", "verb"),
  createCard("Lubię czytać książki.", "I like reading books.", "Lubię", "", "I like", "verb"),
  createCard("Muszę już iść.", "I have to go now.", "Muszę", "Modal verb: musieć.", "I must", "verb"),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?", "Wiesz", "Common phrase.", "you know", "verb"),
  createCard("Mogę ci pomóc?", "Can I help you?", "pomóc", "Takes dative case (ci).", "to help", "verb"),
  createCard("Myślę, że tak.", "I think so.", "Myślę", "", "I think", "verb"),
  createCard("Nie wiem.", "I don't know.", "wiem", "", "I know", "verb"),
  createCard("Robię obiad.", "I am making lunch.", "Robię", "", "I make", "verb"),
  createCard("Weź to.", "Take this.", "Weź", "Imperative.", "take", "verb"),
  createCard("Daj mi to.", "Give me that.", "Daj", "Imperative.", "give", "verb"),
  createCard("Widzę cię.", "I see you.", "Widzę", "", "I see", "verb"),
  createCard("Słyszysz mnie?", "Do you hear me?", "Słyszysz", "", "you hear", "verb"),


  createCard("Kto to jest?", "Who is this?", "Kto", "", "who", "pronoun"),
  createCard("Dlaczego płaczesz?", "Why are you crying?", "Dlaczego", "", "why", "adverb"),
  createCard("Kiedy wracasz?", "When are you coming back?", "Kiedy", "", "when", "adverb"),
  createCard("Gdzie mieszkasz?", "Where do you live?", "Gdzie", "", "where", "adverb"),
  createCard("Jak się nazywasz?", "What is your name?", "Jak", "Literally: How do you call yourself?", "how", "adverb"),
  createCard("Co to jest?", "What is this?", "Co", "", "what", "pronoun"),
  createCard("Ile to kosztuje?", "How much does it cost?", "Ile", "", "how much", "pronoun"),


  createCard("Wszystko w porządku?", "Is everything in order/okay?", "porządku", "", "order", "noun"),
  createCard("Nic się nie stało.", "Nothing happened.", "Nic", "Double negation is standard.", "nothing", "pronoun"),
  createCard("Na zdrowie!", "Cheers! / Bless you!", "zdrowie", "", "health", "noun"),
  createCard("Smacznego.", "Bon appétit.", "Smacznego", "", "tasty", "adjective"),
  createCard("Pomocy!", "Help!", "Pomocy", "", "help", "noun"),
  createCard("Zgubiłem się.", "I am lost (male).", "Zgubiłem", "", "I lost", "verb"),
  createCard("Potrzebuję lekarza.", "I need a doctor.", "Potrzebuję", "", "I need", "verb"),


  createCard("Ten samochód jest szybki.", "This car is fast.", "szybki", "", "fast", "adjective"),
  createCard("Pogoda jest dzisiaj ładna.", "The weather is nice today.", "ładna", "", "nice", "adjective"),
  createCard("Jest mi zimno.", "I am cold.", "zimno", "Literally: 'It is cold to me'.", "cold", "adjective"),
  createCard("To jest za drogie.", "This is too expensive.", "drogie", "", "expensive", "adjective"),
  createCard("Jestem szczęśliwy.", "I am happy (male).", "szczęśliwy", "", "happy", "adjective"),
  createCard("To jest trudne.", "This is difficult.", "trudne", "", "difficult", "adjective"),


  createCard("Mieszkam w Polsce.", "I live in Poland.", "Polsce", "Locative case.", "Poland", "noun"),
  createCard("Widzimy się jutro.", "See you tomorrow.", "jutro", "", "tomorrow", "noun"),
  createCard("Teraz czy później?", "Now or later?", "Teraz", "", "now", "adverb"),
  createCard("Jest blisko stąd.", "It is close to here.", "blisko", "", "close", "adverb"),
  createCard("To jest daleko.", "It is far.", "daleko", "", "far", "adverb")
];

