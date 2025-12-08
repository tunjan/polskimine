import { Card } from '@/types';
import { createGermanCard as createCard } from '@/features/collection/utils/createCard';

export const GERMAN_BEGINNER_DECK: Card[] = [
    // Greetings & Politeness
    createCard("Guten Morgen, einen Kaffee bitte.", "Good morning, a coffee please.", "bitte", "Polite request word.", "please", "adverb"),
    createCard("Danke schön.", "Thank you very much.", "Danke", "", "thanks", "interjection"),
    createCard("Ich verstehe nicht.", "I don't understand.", "verstehe", "Verb: verstehen.", "understand", "verb"),
    createCard("Entschuldigung, wo ist die Toilette?", "Excuse me, where is the toilet?", "wo", "", "where", "adverb"),
    createCard("Sprechen Sie Englisch?", "Do you speak English?", "Sprechen", "Formal form.", "speak", "verb"),
    createCard("Hallo, wie geht's?", "Hi, how are you?", "Hallo", "Informal greeting.", "hello", "interjection"),
    createCard("Gute Nacht.", "Good night.", "Nacht", "", "night", "noun"),
    createCard("Auf Wiedersehen.", "Goodbye.", "Wiedersehen", "Formal.", "goodbye", "interjection"),
    createCard("Bitte schön.", "You're welcome / Here you go.", "Bitte", "", "please", "interjection"),
    createCard("Ja, bitte.", "Yes, please.", "Ja", "", "yes", "adverb"),
    createCard("Nein, danke.", "No, thank you.", "Nein", "", "no", "adverb"),

    // Being & State
    createCard("Ich bin müde.", "I am tired.", "bin", "", "am", "verb"),
    createCard("Sie ist sehr nett.", "She is very nice.", "ist", "", "is", "verb"),
    createCard("Das ist mein Haus.", "This is my house.", "Das", "Demonstrative pronoun.", "this/that", "pronoun"),
    createCard("Wir sind bei der Arbeit.", "We are at work.", "Arbeit", "", "work", "noun"),
    createCard("Wo sind sie?", "Where are they?", "sind", "", "are", "verb"),
    createCard("Bist du hungrig?", "Are you hungry?", "bist", "Informal form.", "are", "verb"),
    createCard("Ich war gestern dort.", "I was there yesterday.", "war", "Past tense.", "was", "verb"),

    // Having
    createCard("Ich habe eine Frage.", "I have a question.", "habe", "", "have", "verb"),
    createCard("Ich habe keine Zeit.", "I don't have time.", "Zeit", "", "time", "noun"),
    createCard("Hast du Lust auf ein Bier?", "Do you feel like having a beer?", "Lust", "Idiom: Lust haben auf...", "desire", "noun"),
    createCard("Er hat kein Geld.", "He doesn't have money.", "Geld", "", "money", "noun"),
    createCard("Wir haben ein neues Auto.", "We have a new car.", "haben", "", "have", "verb"),

    // Common Actions
    createCard("Was machst du?", "What are you doing?", "machst", "", "do/make", "verb"),
    createCard("Ich gehe zum Laden.", "I am going to the store.", "gehe", "Directional movement.", "go", "verb"),
    createCard("Ich möchte Brot kaufen.", "I want to buy bread.", "möchte", "Modal verb: mögen (conditional).", "would like", "verb"),
    createCard("Ich lese gern Bücher.", "I like reading books.", "gern", "", "gladly/like", "adverb"),
    createCard("Ich muss jetzt gehen.", "I have to go now.", "muss", "Modal verb: müssen.", "must", "verb"),
    createCard("Weißt du, worum es geht?", "Do you know what it's about?", "Weißt", "", "know", "verb"),
    createCard("Kann ich dir helfen?", "Can I help you?", "helfen", "Takes dative case.", "help", "verb"),
    createCard("Ich denke, ja.", "I think so.", "denke", "", "think", "verb"),
    createCard("Ich weiß nicht.", "I don't know.", "weiß", "", "know", "verb"),
    createCard("Ich mache Mittagessen.", "I am making lunch.", "mache", "", "make", "verb"),
    createCard("Nimm das.", "Take this.", "Nimm", "Imperative.", "take", "verb"),
    createCard("Gib mir das.", "Give me that.", "Gib", "Imperative.", "give", "verb"),
    createCard("Ich sehe dich.", "I see you.", "sehe", "", "see", "verb"),
    createCard("Hörst du mich?", "Do you hear me?", "Hörst", "", "hear", "verb"),

    // Questions
    createCard("Wer ist das?", "Who is this?", "Wer", "", "who", "pronoun"),
    createCard("Warum weinst du?", "Why are you crying?", "Warum", "", "why", "adverb"),
    createCard("Wann kommst du zurück?", "When are you coming back?", "Wann", "", "when", "adverb"),
    createCard("Wo wohnst du?", "Where do you live?", "wohnst", "", "live", "verb"),
    createCard("Wie heißt du?", "What is your name?", "heißt", "Literally: How are you called?", "called", "verb"),
    createCard("Was ist das?", "What is this?", "Was", "", "what", "pronoun"),
    createCard("Wie viel kostet das?", "How much does it cost?", "kostet", "", "costs", "verb"),

    // Common Phrases
    createCard("Alles in Ordnung?", "Is everything okay?", "Ordnung", "", "order", "noun"),
    createCard("Es ist nichts passiert.", "Nothing happened.", "nichts", "", "nothing", "pronoun"),
    createCard("Prost!", "Cheers!", "Prost", "", "cheers", "interjection"),
    createCard("Guten Appetit.", "Bon appétit.", "Appetit", "", "appetite", "noun"),
    createCard("Hilfe!", "Help!", "Hilfe", "", "help", "noun"),
    createCard("Ich habe mich verlaufen.", "I am lost.", "verlaufen", "Reflexive verb.", "lost", "verb"),
    createCard("Ich brauche einen Arzt.", "I need a doctor.", "brauche", "", "need", "verb"),

    // Adjectives & Descriptions
    createCard("Das Auto ist schnell.", "The car is fast.", "schnell", "", "fast", "adjective"),
    createCard("Das Wetter ist heute schön.", "The weather is nice today.", "schön", "", "nice/beautiful", "adjective"),
    createCard("Mir ist kalt.", "I am cold.", "kalt", "Literally: 'To me it is cold'.", "cold", "adjective"),
    createCard("Das ist zu teuer.", "This is too expensive.", "teuer", "", "expensive", "adjective"),
    createCard("Ich bin glücklich.", "I am happy.", "glücklich", "", "happy", "adjective"),
    createCard("Das ist schwierig.", "This is difficult.", "schwierig", "", "difficult", "adjective"),

    // Time & Place
    createCard("Ich wohne in Deutschland.", "I live in Germany.", "Deutschland", "", "Germany", "noun"),
    createCard("Wir sehen uns morgen.", "See you tomorrow.", "morgen", "", "tomorrow", "adverb"),
    createCard("Jetzt oder später?", "Now or later?", "Jetzt", "", "now", "adverb"),
    createCard("Es ist nah von hier.", "It is close from here.", "nah", "", "close/near", "adverb"),
    createCard("Das ist weit.", "It is far.", "weit", "", "far", "adverb")
];
