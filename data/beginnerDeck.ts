import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = ''): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  status: 'learning',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
});

export const BEGINNER_DECK: Card[] = [
  // Greetings & Basics
  createCard("Dzień dobry.", "Good morning / Good afternoon.", undefined, "Formal greeting used during the day."),
  createCard("Dobry wieczór.", "Good evening.", undefined, "Formal greeting used in the evening."),
  createCard("Cześć.", "Hi / Bye.", undefined, "Informal greeting and farewell."),
  createCard("Do widzenia.", "Goodbye.", undefined, "Formal farewell."),
  createCard("Dobranoc.", "Good night.", undefined, "Used before going to sleep."),
  createCard("Dziękuję.", "Thank you.", undefined, ""),
  createCard("Proszę.", "Please / Here you go.", undefined, ""),
  createCard("Przepraszam.", "I'm sorry / Excuse me.", undefined, ""),
  createCard("Tak.", "Yes.", undefined, ""),
  createCard("Nie.", "No.", undefined, ""),

  // Introductions
  createCard("Jak masz na imię?", "What is your name?", "imię", "Informal."),
  createCard("Mam na imię Anna.", "My name is Anna.", "imię", ""),
  createCard("Miło mi cię poznać.", "Nice to meet you.", "poznać", "Informal."),
  createCard("Skąd jesteś?", "Where are you from?", "jesteś", "Informal."),
  createCard("Jestem z Polski.", "I am from Poland.", "Polski", "Genitive case of Polska."),
  createCard("Mieszkam w Warszawie.", "I live in Warsaw.", "Warszawie", "Locative case of Warszawa."),

  // Common Verbs (To be - Być)
  createCard("Jestem zmęczony.", "I am tired.", "Jestem", "Masculine form."),
  createCard("Jesteś głodna?", "Are you hungry?", "Jesteś", "Feminine form."),
  createCard("On jest w domu.", "He is at home.", "jest", ""),
  createCard("Ona jest w pracy.", "She is at work.", "jest", ""),
  createCard("To jest trudne.", "This is difficult.", "jest", ""),

  // Common Verbs (To have - Mieć)
  createCard("Mam pytanie.", "I have a question.", "Mam", ""),
  createCard("Masz czas?", "Do you have time?", "Masz", ""),
  createCard("On ma psa.", "He has a dog.", "ma", "Accusative: pies -> psa."),
  createCard("Ona ma kota.", "She has a cat.", "ma", "Accusative: kot -> kota."),
  createCard("Nie mam pieniędzy.", "I don't have money.", "mam", "Genitive required after negation."),

  // Common Verbs (To go - Iść/Jechać)
  createCard("Idę do sklepu.", "I am walking to the store.", "Idę", "Motion on foot."),
  createCard("Jadę do Krakowa.", "I am going (by vehicle) to Krakow.", "Jadę", "Motion by vehicle."),
  createCard("Gdzie idziesz?", "Where are you going?", "idziesz", ""),
  createCard("Idziemy na spacer.", "We are going for a walk.", "Idziemy", ""),

  // Common Verbs (To want - Chcieć)
  createCard("Chcę kawę.", "I want coffee.", "Chcę", "Accusative: kawa -> kawę."),
  createCard("Co chcesz robić?", "What do you want to do?", "chcesz", ""),
  createCard("On chce spać.", "He wants to sleep.", "chce", ""),

  // Common Verbs (To like - Lubić)
  createCard("Lubię Polskę.", "I like Poland.", "Lubię", "Accusative: Polska -> Polskę."),
  createCard("Lubisz czytać?", "Do you like reading?", "Lubisz", ""),
  createCard("Nie lubię tego.", "I don't like this.", "lubię", "Genitive after negation."),

  // Food & Drink
  createCard("Poproszę wodę.", "Water, please.", "wodę", "Accusative: woda -> wodę."),
  createCard("Smacznego!", "Bon appétit!", undefined, ""),
  createCard("To jest pyszne.", "This is delicious.", "pyszne", ""),
  createCard("Jestem głodny.", "I am hungry.", "głodny", "Masculine."),
  createCard("Chcę jeść.", "I want to eat.", "jeść", ""),

  // Numbers & Time
  createCard("Która jest godzina?", "What time is it?", "godzina", ""),
  createCard("Jest pierwsza.", "It is one o'clock.", "pierwsza", ""),
  createCard("Jeden, dwa, trzy.", "One, two, three.", undefined, ""),
  createCard("Ile to kosztuje?", "How much does this cost?", "kosztuje", ""),

  // Places & Directions
  createCard("Gdzie jest toaleta?", "Where is the toilet?", "toaleta", ""),
  createCard("Prosto i w prawo.", "Straight and to the right.", "prawo", ""),
  createCard("W lewo.", "To the left.", "lewo", ""),
  createCard("Szukam dworca.", "I am looking for the station.", "dworca", "Genitive: dworzec -> dworca."),

  // Family
  createCard("To jest moja matka.", "This is my mother.", "matka", ""),
  createCard("To jest mój ojciec.", "This is my father.", "ojciec", ""),
  createCard("Masz rodzeństwo?", "Do you have siblings?", "rodzeństwo", ""),

  // Weather
  createCard("Zimno mi.", "I am cold.", "Zimno", ""),
  createCard("Jest gorąco.", "It is hot.", "gorąco", ""),
  createCard("Pada deszcz.", "It is raining.", "Pada", ""),
  createCard("Świeci słońce.", "The sun is shining.", "słońce", ""),
];
