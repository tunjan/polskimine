
import { checkSchedule, SessionState } from './sessionReducer';
import { Card, CardStatus } from '@/types';
import { addMinutes } from 'date-fns';

describe('sessionReducer checkSchedule - Skip Learning Wait', () => {
  const now = new Date();
  const futureDue = addMinutes(now, 10).toISOString();

  const learningCard: Card = {
    id: '1',
    status: CardStatus.LEARNING,
    dueDate: futureDue,
    targetSentence: 'test',
    nativeTranslation: 'test',
    interval: 0,
    easeFactor: 0,
    notes: '',
    language: 'pl',
    reps: 1, // Important: must be > 0 otherwise treated as new
  };

  const reviewCard: Card = {
    id: '2',
    status: CardStatus.REVIEW,
    dueDate: futureDue,
    targetSentence: 'review',
    nativeTranslation: 'review',
    interval: 1,
    easeFactor: 2.5,
    notes: '',
    language: 'pl',
    reps: 5, // Important: must be > 0
  };

  it('should wait for learning card when ignoreLearningSteps is false', () => {
    const state: SessionState = {
      status: 'IDLE',
      cards: [learningCard],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, false);
    expect(newState.status).toBe('WAITING');
  });

  it('should skip wait for learning card when ignoreLearningSteps is true', () => {
    const state: SessionState = {
      status: 'IDLE',
      cards: [learningCard],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, true);
    expect(newState.status).toBe('IDLE');
  });

  it('should NOT skip wait for review card even if ignoreLearningSteps is true', () => {
    // This assumes ignoreLearningSteps ONLY applies to learning cards
    // Review card must not be due today for it to be "Waiting"
    // interval >= 1 day means "due today" check uses date comparison.
    const notDueReviewCard = {
        ...reviewCard,
        dueDate: addMinutes(now, 24 * 60 * 2).toISOString() // 2 days in future
    };

    const state: SessionState = {
      status: 'IDLE',
      cards: [notDueReviewCard],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, true);
    expect(newState.status).toBe('WAITING');
  });


  it('should find and show waiting learning card if head is waiting review card', () => {
    // Card 1: Review card due tomorrow (Waiting)
    // Card 2: Learning card due in 10 mins (Waiting)
    // ignoreLearningSteps = true
    // Expected: Swap to Card 2 and IDLE.

    const reviewCardFuture = { 
        ...reviewCard, 
        id: 'rev1', 
        dueDate: addMinutes(now, 24 * 60 + 10).toISOString() // Tomorrow
    };
    
    // Check scheduler logic: review card interval 1 day. due tomorrow. isCardDue -> false.
    
    const learningCardFuture = { ...learningCard, id: 'learn1' };

    const state: SessionState = {
      status: 'IDLE',
      cards: [reviewCardFuture, learningCardFuture],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, true);
    
    expect(newState.status).toBe('IDLE');
    expect(newState.cards[0].id).toBe('learn1');
  });
});

