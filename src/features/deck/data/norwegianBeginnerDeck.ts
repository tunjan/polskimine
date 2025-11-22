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
  // --- GREETINGS & ESSENTIALS ---
  createCard("Hei, hvordan går det?", "Hi, how is it going?", "Hei", "Common informal greeting."),
  createCard("God morgen.", "Good morning.", "morgen", ""),
  createCard("Takk skal du ha.", "Thank you.", "Takk", "Literally: Thanks shall you have."),
  createCard("Unnskyld, jeg forstår ikke.", "Excuse me, I don't understand.", "forstår", "Verb: å forstå."),
  createCard("Snakker du engelsk?", "Do you speak English?", "Snakker", ""),
  createCard("Ha det bra!", "Goodbye!", "Ha", "Literally: Have it good."),
  createCard("Vær så snill.", "Please.", "snill", "Literally: Be so kind."),
  createCard("Ja, gjerne.", "Yes, gladly / please.", "gjerne", ""),
  createCard("Nei, takk.", "No, thanks.", "Nei", ""),
  createCard("Hva heter du?", "What is your name?", "heter", "Verb: å hete (to be called)."),

  // --- TO BE (VÆRE) ---
  createCard("Jeg er trøtt.", "I am tired.", "er", "Verb: å være (to be)."),
  createCard("Det er kaldt i dag.", "It is cold today.", "er", ""),
  createCard("Hvor er toalettet?", "Where is the toilet?", "er", ""),
  createCard("Vi er fra Norge.", "We are from Norway.", "er", ""),
  createCard("Er du sulten?", "Are you hungry?", "Er", ""),
  createCard("Det er min venn.", "That is my friend.", "er", ""),
  createCard("Er det sant?", "Is that true?", "Er", ""),

  // --- TO HAVE (HA) ---
  createCard("Jeg har en bil.", "I have a car.", "har", "Verb: å ha (to have)."),
  createCard("Har du tid?", "Do you have time?", "Har", ""),
  createCard("Vi har ikke penger.", "We don't have money.", "har", ""),
  createCard("Hun har lyst på kaffe.", "She wants coffee.", "lyst", "Idiom: Ha lyst på (want/crave)."),
  createCard("Jeg har vondt i hodet.", "I have a headache.", "vondt", "Idiom: Ha vondt (have pain)."),

  // --- COMMON VERBS ---
  createCard("Hva gjør du?", "What are you doing?", "gjør", "Verb: å gjøre (to do)."),
  createCard("Jeg går på jobb.", "I am going to work.", "går", "Verb: å gå (to go/walk)."),
  createCard("Kan du si det igjen?", "Can you say that again?", "si", "Verb: å si (to say)."),
  createCard("Jeg vet ikke.", "I don't know.", "vet", "Verb: å vite (to know)."),
  createCard("Hva tenker du på?", "What are you thinking about?", "tenker", "Verb: å tenke (to think)."),
  createCard("Jeg tar bussen.", "I am taking the bus.", "tar", "Verb: å ta (to take)."),
  createCard("Kan jeg få en øl?", "Can I get a beer?", "få", "Verb: å få (to get/receive)."),
  createCard("Jeg liker å lese.", "I like to read.", "liker", "Verb: å like (to like)."),
  createCard("Vi må dra nå.", "We have to leave now.", "må", "Modal verb: måtte (must)."),
  createCard("Jeg kommer snart.", "I am coming soon.", "kommer", "Verb: å komme (to come)."),
  createCard("Jeg ser deg.", "I see you.", "ser", "Verb: å se (to see)."),
  createCard("Hører du meg?", "Do you hear me?", "Hører", "Verb: å høre (to hear)."),
  createCard("Jeg tror det.", "I think so / I believe so.", "tror", "Verb: å tro (to believe)."),

  // --- PRONOUNS & QUESTIONS ---
  createCard("Hvem er det?", "Who is that?", "Hvem", ""),
  createCard("Hva er dette?", "What is this?", "Hva", ""),
  createCard("Hvor bor du?", "Where do you live?", "Hvor", ""),
  createCard("Når kommer toget?", "When is the train coming?", "Når", ""),
  createCard("Hvorfor gråter du?", "Why are you crying?", "Hvorfor", ""),
  createCard("Hvordan kommer jeg dit?", "How do I get there?", "Hvordan", ""),
  createCard("Hvilken liker du?", "Which one do you like?", "Hvilken", ""),

  // --- SURVIVAL & COMMON PHRASES ---
  createCard("Hjelp!", "Help!", "Hjelp", ""),
  createCard("Jeg trenger en lege.", "I need a doctor.", "trenger", "Verb: å trenge (to need)."),
  createCard("Hvor mye koster det?", "How much does it cost?", "koster", ""),
  createCard("Jeg elsker deg.", "I love you.", "elsker", ""),
  createCard("Bare hyggelig.", "You're welcome.", "hyggelig", "Response to thank you."),
  createCard("Unnskyld meg.", "Excuse me.", "Unnskyld", ""),
  createCard("Jeg er enig.", "I agree.", "enig", ""),
  createCard("Det går bra.", "It's going well / It's fine.", "går", ""),

  // --- ADJECTIVES & DESCRIBING ---
  createCard("Norge er et vakkert land.", "Norway is a beautiful country.", "vakkert", ""),
  createCard("Det er veldig bra.", "That is very good.", "bra", ""),
  createCard("Jeg er glad.", "I am happy.", "glad", ""),
  createCard("Det er vanskelig.", "It is difficult.", "vanskelig", ""),
  createCard("Maten er god.", "The food is good.", "god", ""),
  createCard("Jeg er opptatt.", "I am busy.", "opptatt", ""),

  // --- TIME & PLACE ---
  createCard("Vi ses i morgen.", "See you tomorrow.", "morgen", ""),
  createCard("Nå eller aldri.", "Now or never.", "Nå", ""),
  createCard("Det er her.", "It is here.", "her", ""),
  createCard("Det er der borte.", "It is over there.", "der", "")
];
