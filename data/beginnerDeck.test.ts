import { describe, it, expect } from 'vitest';
import { BEGINNER_DECK } from './beginnerDeck';

describe('beginnerDeck', () => {
  it('exports an array of cards', () => {
    expect(Array.isArray(BEGINNER_DECK)).toBe(true);
    expect(BEGINNER_DECK.length).toBeGreaterThan(0);
  });

  it('has at least 30 cards for comprehensive learning', () => {
    expect(BEGINNER_DECK.length).toBeGreaterThanOrEqual(30);
  });

  it('all cards have required properties', () => {
    BEGINNER_DECK.forEach(card => {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('targetSentence');
      expect(card).toHaveProperty('nativeTranslation');
      expect(card).toHaveProperty('notes');
      expect(card).toHaveProperty('status');
      expect(card).toHaveProperty('interval');
      expect(card).toHaveProperty('easeFactor');
      expect(card).toHaveProperty('dueDate');
    });
  });

  it('all cards have unique IDs', () => {
    const ids = BEGINNER_DECK.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(BEGINNER_DECK.length);
  });

  it('all cards start with new status', () => {
    BEGINNER_DECK.forEach(card => {
      expect(card.status).toBe('new');
    });
  });

  it('all cards have zero interval', () => {
    BEGINNER_DECK.forEach(card => {
      expect(card.interval).toBe(0);
    });
  });

  it('all cards have default ease factor of 2.5', () => {
    BEGINNER_DECK.forEach(card => {
      expect(card.easeFactor).toBe(2.5);
    });
  });

  it('all cards have valid due dates', () => {
    BEGINNER_DECK.forEach(card => {
      const date = new Date(card.dueDate);
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  it('contains non-empty target sentences', () => {
    BEGINNER_DECK.forEach(card => {
      expect(card.targetSentence).toBeTruthy();
      expect(card.targetSentence.length).toBeGreaterThan(0);
    });
  });

  it('contains non-empty translations', () => {
    BEGINNER_DECK.forEach(card => {
      expect(card.nativeTranslation).toBeTruthy();
      expect(card.nativeTranslation.length).toBeGreaterThan(0);
    });
  });

  it('includes cards with and without target words', () => {
    const withTarget = BEGINNER_DECK.filter(c => c.targetWord);
    const withoutTarget = BEGINNER_DECK.filter(c => !c.targetWord);
    
    expect(withTarget.length).toBeGreaterThan(0);
    expect(withoutTarget.length).toBeGreaterThan(0);
  });

  it('includes basic greetings', () => {
    const greetings = ['Cześć', 'Dzień dobry', 'Dobranoc'];
    const hasGreetings = greetings.some(greeting =>
      BEGINNER_DECK.some(card => card.targetSentence.includes(greeting))
    );
    expect(hasGreetings).toBe(true);
  });

  it('includes common verbs', () => {
    const commonVerbs = ['jestem', 'mam', 'chcę', 'lubię'];
    const hasVerbs = commonVerbs.some(verb =>
      BEGINNER_DECK.some(card => 
        card.targetSentence.toLowerCase().includes(verb.toLowerCase())
      )
    );
    expect(hasVerbs).toBe(true);
  });

  it('has notes field defined for all cards', () => {
    BEGINNER_DECK.forEach(card => {
      expect(card.notes).toBeDefined();
      expect(typeof card.notes).toBe('string');
    });
  });

  it('target word appears in target sentence when provided', () => {
    BEGINNER_DECK.forEach(card => {
      if (card.targetWord) {
        const sentenceLower = card.targetSentence.toLowerCase();
        const wordLower = card.targetWord.toLowerCase();
        expect(sentenceLower).toContain(wordLower);
      }
    });
  });

  it('includes various grammatical topics', () => {
    const topics = BEGINNER_DECK.map(c => c.notes.toLowerCase());
    const hasGrammar = topics.some(note => 
      note.includes('case') || 
      note.includes('accusative') ||
      note.includes('genitive') ||
      note.includes('nominative')
    );
    expect(hasGrammar).toBe(true);
  });

  it('uses Polish characters in sentences', () => {
    const polishChars = /[ąćęłńóśźż]/i;
    const hasPolishChars = BEGINNER_DECK.some(card =>
      polishChars.test(card.targetSentence)
    );
    expect(hasPolishChars).toBe(true);
  });

  it('includes numbers and time-related content', () => {
    const hasNumbers = BEGINNER_DECK.some(card =>
      card.targetSentence.toLowerCase().includes('godzina') ||
      card.targetSentence.includes('jeden') ||
      card.notes.toLowerCase().includes('time')
    );
    expect(hasNumbers).toBe(true);
  });

  it('includes family-related vocabulary', () => {
    const familyWords = ['matka', 'ojciec', 'rodzeństwo'];
    const hasFamily = familyWords.some(word =>
      BEGINNER_DECK.some(card => card.targetSentence.toLowerCase().includes(word))
    );
    expect(hasFamily).toBe(true);
  });
});
