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
  language: 'norwegian'
});

export const NORWEGIAN_BEGINNER_DECK: Card[] = [

  createCard("God morgen.", "Good morning.", undefined, "Formal morning greeting."),
  createCard("God dag.", "Good day.", undefined, "Formal daytime greeting."),
  createCard("God kveld.", "Good evening.", undefined, "Formal evening greeting."),
  createCard("Hei.", "Hi.", undefined, "Informal greeting."),
  createCard("Ha det.", "Goodbye.", undefined, "Informal farewell."),
  createCard("God natt.", "Good night.", undefined, "Used before going to sleep."),
  createCard("Takk.", "Thank you.", undefined, ""),
  createCard("Vær så snill.", "Please.", undefined, "Literally 'be so kind'."),
  createCard("Unnskyld.", "Excuse me / I'm sorry.", undefined, ""),
  createCard("Ja.", "Yes.", undefined, ""),
  createCard("Nei.", "No.", undefined, ""),


  
];