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


  createCard("Jak masz na imię?", "What is your name?", "imię", "Informal."),
  createCard("Mam na imię Anna.", "My name is Anna.", "imię", ""),
  createCard("Miło mi cię poznać.", "Nice to meet you.", "poznać", "Informal."),
  createCard("Skąd jesteś?", "Where are you from?", "jesteś", "Informal."),
  createCard("Jestem z Polski.", "I am from Poland.", "Polski", "Genitive case of Polska."),
  createCard("Mieszkam w Warszawie.", "I live in Warsaw.", "Warszawie", "Locative case of Warszawa."),


  createCard("Jestem zmęczony.", "I am tired.", "Jestem", "Masculine form."),
  createCard("Jesteś głodna?", "Are you hungry?", "Jesteś", "Feminine form."),
  createCard("On jest w domu.", "He is at home.", "jest", ""),
  createCard("Ona jest w pracy.", "She is at work.", "jest", ""),
  createCard("To jest trudne.", "This is difficult.", "jest", ""),
];
