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
  // --- BASICS ---
  createCard("Hei, hvordan går det?", "Hi, how is it going?", "går", ""),
  createCard("Det går bra, takk.", "It goes well, thanks.", "bra", ""),
  createCard("Hva heter du?", "What are you called?", "heter", "Common way to ask for name."),
  createCard("Jeg heter Anna.", "My name is Anna.", "heter", ""),
  createCard("Hyggelig å hilse på deg.", "Nice to meet you.", "hilse", ""),

  // --- V2 RULE PRACTICE ---
  createCard("Jeg bor i Norge.", "I live in Norway.", "bor", ""),
  createCard("Nå bor jeg i Norge.", "Now I live in Norway.", "bor", "V2 Rule: Verb must be second element."),
  createCard("I dag er det kaldt.", "Today it is cold.", "er", "V2 Rule applied."),
  createCard("Hvor kommer du fra?", "Where do you come from?", "kommer", ""),
  createCard("Jeg kommer fra USA.", "I come from the USA.", "kommer", ""),

  // --- MODAL VERBS (Can, Will, Must) ---
  createCard("Kan du hjelpe meg?", "Can you help me?", "hjelpe", ""),
  createCard("Jeg vil gjerne ha en kaffe.", "I would like to have a coffee.", "vil", "Polite request."),
  createCard("Du må ikke gjøre det.", "You must not do that.", "må", ""),
  createCard("Skal vi gå på kino?", "Shall we go to the cinema?", "Skal", "Future/Suggestion."),
  createCard("Jeg forstår ikke.", "I don't understand.", "forstår", ""),

  // --- COMMON VERBS ---
  createCard("Hva gjør du?", "What are you doing?", "gjør", ""),
  createCard("Jeg liker å gå på tur.", "I like to go for a walk/hike.", "liker", "Very culturally important phrase."),
  createCard("Snakker du engelsk?", "Do you speak English?", "Snakker", ""),
  createCard("Jeg vet ikke.", "I don't know.", "vet", ""),
  createCard("Vi ses senere.", "See you later.", "ses", "Passive-s form used for reciprocity."),

  // --- FOOD & SHOPPING ---
  createCard("Hvor mye koster det?", "How much does it cost?", "koster", ""),
  createCard("Kan jeg få regningen?", "Can I get the bill?", "få", "Very common verb 'to get/receive'."),
  createCard("Jeg er sulten.", "I am hungry.", "sulten", ""),
  createCard("Er butikken åpen?", "Is the shop open?", "åpen", ""),
  createCard("Tusen takk.", "A thousand thanks.", "Tusen", ""),

  // --- PRONOUNS & PREPOSITIONS ---
  createCard("Hvem er det?", "Who is that?", "Hvem", ""),
  createCard("Det er min bil.", "That is my car.", "min", ""),
  createCard("Bilen står på gaten.", "The car stands on the street.", "på", ""),
  createCard("Jeg gleder meg.", "I am looking forward to it.", "gleder", "Reflexive verb."),
  createCard("Ha en fin dag!", "Have a nice day!", "fin", ""),
];