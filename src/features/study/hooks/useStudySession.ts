import { useCallback, useEffect, useReducer } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/core/srs/scheduler';
import { isNewCard } from '@/services/studyLimits';
import { sortCards } from "@/core/srs/cardSorter";

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[];
  cardOrder: UserSettings['cardOrder'];
  ignoreLearningStepsWhenNoCards: boolean;
  fsrs: UserSettings['fsrs'];
  learningSteps: UserSettings['learningSteps'];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, updatedCard: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

type SessionStatus = 'IDLE' | 'WAITING' | 'FLIPPED' | 'PROCESSING' | 'COMPLETE';

interface SessionState {
  status: SessionStatus;
  cards: Card[];
  reserveCards: Card[];
  currentIndex: number;
  history: { addedCardId: string | null }[];
}

type Action =
  | { type: 'INIT'; cards: Card[]; reserve: Card[]; now: Date; ignoreLearningSteps: boolean }
  | { type: 'FLIP' }
  | { type: 'START_PROCESSING' }
  | { type: 'GRADE_SUCCESS'; status?: SessionStatus; updatedCard?: Card | null; addedCardId?: string | null; isLast?: boolean; now: Date; ignoreLearningSteps: boolean }
  | { type: 'GRADE_FAILURE' }
  | { type: 'UNDO'; }
  | { type: 'TICK'; now: Date; ignoreLearningSteps: boolean }
  | { type: 'REMOVE_CARD'; cardId: string; newCardFromReserve?: Card | null; now: Date; ignoreLearningSteps: boolean }
  | { type: 'UPDATE_CARD'; card: Card };

const getInitialStatus = (cards: Card[]): SessionStatus => {
  return cards.length > 0 ? 'IDLE' : 'COMPLETE';
};

const checkSchedule = (state: SessionState, now: Date, ignoreLearningSteps: boolean): SessionState => {
  if (state.status === 'PROCESSING' || state.status === 'FLIPPED') return state;

  const current = state.cards[state.currentIndex];
  if (!current) {
    if (state.cards.length === 0) return { ...state, status: 'COMPLETE' };
    return state;
  }

  if (isCardDue(current, now)) {
    return { ...state, status: 'IDLE' };
  }

  const nextDueIndex = state.cards.findIndex((c, i) => i > state.currentIndex && isCardDue(c, now));
  if (nextDueIndex !== -1) {
    const newCards = [...state.cards];
    const [card] = newCards.splice(nextDueIndex, 1);
    newCards.splice(state.currentIndex, 0, card);
    return { ...state, cards: newCards, status: 'IDLE' };
  }

  if (ignoreLearningSteps) {
    return { ...state, status: 'IDLE' };
  }

  return { ...state, status: 'WAITING' };
};

const reducer = (state: SessionState, action: Action): SessionState => {
  switch (action.type) {
    case 'INIT': {
      const newState = {
        ...state,
        cards: action.cards,
        reserveCards: action.reserve,
        currentIndex: 0,
        status: getInitialStatus(action.cards),
        history: [],
      };
      return checkSchedule(newState, action.now, action.ignoreLearningSteps);
    }

    case 'FLIP':
      if (state.status !== 'IDLE') return state;
      return { ...state, status: 'FLIPPED' };

    case 'START_PROCESSING':
      if (state.status !== 'FLIPPED' && state.status !== 'IDLE') return state;
      return { ...state, status: 'PROCESSING' };

    case 'GRADE_SUCCESS': {
      const { updatedCard, addedCardId, isLast, now, ignoreLearningSteps } = action;
      let newCards = [...state.cards];
      let newIndex = state.currentIndex;
      let newHistory = [...state.history, { addedCardId: addedCardId ?? null }];

      if (updatedCard) {
        if (updatedCard.status === 'learning') {
          if (isLast) {
            newCards[state.currentIndex] = updatedCard;
            const newState = {
              ...state,
              cards: newCards,
              status: 'IDLE' as SessionStatus,
              history: newHistory
            };
            return checkSchedule(newState, now, ignoreLearningSteps);
          } else {
            newCards.push(updatedCard);
          }
        }
      } else if (addedCardId) {
      }

      if (newIndex < newCards.length - 1) {
        const newState = {
          ...state,
          cards: newCards,
          currentIndex: newIndex + 1,
          status: 'IDLE' as SessionStatus,
          history: newHistory
        };
        return checkSchedule(newState, now, ignoreLearningSteps);
      } else {
        return {
          ...state,
          cards: newCards,
          currentIndex: newIndex,
          status: 'COMPLETE',
          history: newHistory
        };
      }
    }

    case 'GRADE_FAILURE':
      return { ...state, status: state.history.length > 0 ? 'FLIPPED' : 'IDLE' };

    case 'UNDO':
      if (state.status === 'PROCESSING') return state;
      if (state.history.length === 0 && state.currentIndex === 0 && !state.status.match(/COMPLETE/)) return state;

      const history = state.history;
      const lastAction = history[history.length - 1];
      const newHistory = history.slice(0, -1);

      let undoCards = [...state.cards];
      if (lastAction?.addedCardId) {
        const lastCard = undoCards[undoCards.length - 1];
        if (lastCard && lastCard.id === lastAction.addedCardId) {
          undoCards.pop();
        }
      }

      const prevIndex = Math.max(0, state.currentIndex - 1);

      return {
        ...state,
        cards: undoCards,
        currentIndex: prevIndex,
        status: 'FLIPPED',
        history: newHistory,
      };

    case 'TICK':
      return checkSchedule(state, action.now, action.ignoreLearningSteps);

    case 'REMOVE_CARD': {
      const { cardId, newCardFromReserve, now, ignoreLearningSteps } = action;
      const index = state.cards.findIndex(c => c.id === cardId);
      if (index === -1) return state;

      let newCards = state.cards.filter(c => c.id !== cardId);
      let newReserve = [...state.reserveCards];

      if (newCardFromReserve) {
        newCards.push(newCardFromReserve);
        newReserve = newReserve.filter(c => c.id !== newCardFromReserve.id);
      }

      let newStatus = state.status;
      let newIndex = state.currentIndex;

      if (index < newIndex) {
        newIndex = Math.max(0, newIndex - 1);
      } else if (index === newIndex) {
        newStatus = 'IDLE';
        if (newIndex >= newCards.length) {
          newIndex = Math.max(0, newCards.length - 1);
        }
      }

      if (newCards.length === 0) newStatus = 'COMPLETE';

      const newState = {
        ...state,
        cards: newCards,
        reserveCards: newReserve,
        currentIndex: newIndex,
        status: newStatus,
      };
      
      if (newStatus === 'COMPLETE') return newState;
      
      return checkSchedule(newState, now, ignoreLearningSteps);
    }

    case 'UPDATE_CARD': {
      const { card } = action;
      const newCards = state.cards.map(c => c.id === card.id ? card : c);
      return { ...state, cards: newCards };
    }

    default:
      return state;
  }
};

export const useStudySession = ({
  dueCards,
  reserveCards: initialReserve = [],
  cardOrder,
  ignoreLearningStepsWhenNoCards,
  fsrs,
  learningSteps,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const [state, dispatch] = useReducer(reducer, {
    status: 'COMPLETE',
    cards: dueCards,
    reserveCards: initialReserve,
    currentIndex: 0,
    history: [],
  }, (initial) => ({
    ...initial,
    status: getInitialStatus(initial.cards)
  }));

  useEffect(() => {
    if (dueCards.length > 0) {
      const order = cardOrder || 'newFirst';
      const sortedCards = sortCards(dueCards, order);

      dispatch({ 
        type: 'INIT', 
        cards: sortedCards, 
        reserve: initialReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards
      });
    }
  }, [dueCards, initialReserve, cardOrder, ignoreLearningStepsWhenNoCards]);

  useEffect(() => {
    if (state.status === 'WAITING') {
      const timer = setTimeout(() => {
        dispatch({ 
          type: 'TICK',
          now: new Date(),
          ignoreLearningSteps: ignoreLearningStepsWhenNoCards
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.status, ignoreLearningStepsWhenNoCards]);

  const currentCard = state.cards[state.currentIndex];

  const handleGrade = useCallback(async (grade: Grade) => {
    if (state.status !== 'FLIPPED') return;

    dispatch({ type: 'START_PROCESSING' });

    try {
      const updatedCard = calculateNextReview(currentCard, grade, fsrs, learningSteps);
      await onRecordReview(currentCard, updatedCard, grade);

      const isLast = state.currentIndex === state.cards.length - 1;
      const addedCardId = updatedCard.status === 'learning' && !isLast ? updatedCard.id : null;

      dispatch({ 
        type: 'GRADE_SUCCESS', 
        updatedCard, 
        addedCardId, 
        isLast,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards
      });
    } catch (e) {
      console.error("Grade failed", e);
      dispatch({ type: 'GRADE_FAILURE' });
    }
  }, [state.status, state.currentIndex, state.cards, currentCard, fsrs, learningSteps, ignoreLearningStepsWhenNoCards, onRecordReview]);

  const handleMarkKnown = useCallback(async () => {
    if (state.status === 'PROCESSING') return;

    dispatch({ type: 'START_PROCESSING' });

    try {
      const wasNew = isNewCard(currentCard);
      const updatedCard: Card = { ...currentCard, status: 'known' };

      await onUpdateCard(updatedCard);

      let newCardFromReserve: Card | null = null;
      if (wasNew && state.reserveCards.length > 0) {
        newCardFromReserve = state.reserveCards[0];
      }

      dispatch({ 
        type: 'REMOVE_CARD', 
        cardId: currentCard.id, 
        newCardFromReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards
      });

    } catch (e) {
      console.error("Mark Known failed", e);
      dispatch({ type: 'GRADE_FAILURE' });
    }

  }, [state.status, currentCard, state.reserveCards, ignoreLearningStepsWhenNoCards, onUpdateCard]);


  const handleUndo = useCallback(() => {
    if (state.status === 'PROCESSING' || !canUndo || !onUndo) return;
    onUndo();
    dispatch({ type: 'UNDO' });
  }, [state.status, canUndo, onUndo]);

  const removeCardFromSession = useCallback((cardId: string) => {
    const card = state.cards.find(c => c.id === cardId);
    let newCardFromReserve: Card | null = null;
    if (card && isNewCard(card) && state.reserveCards.length > 0) {
      newCardFromReserve = state.reserveCards[0];
    }
    dispatch({ 
      type: 'REMOVE_CARD', 
      cardId, 
      newCardFromReserve,
      now: new Date(),
      ignoreLearningSteps: ignoreLearningStepsWhenNoCards
    });
  }, [state.cards, state.reserveCards, ignoreLearningStepsWhenNoCards]);

  const updateCardInSession = useCallback((card: Card) => {
    dispatch({ type: 'UPDATE_CARD', card });
  }, []);

  const setIsFlipped = (flipped: boolean) => {
    if (flipped) dispatch({ type: 'FLIP' });
  };

  return {
    sessionCards: state.cards,
    currentCard,
    currentIndex: state.currentIndex,
    isFlipped: state.status === 'FLIPPED',
    sessionComplete: state.status === 'COMPLETE',
    isProcessing: state.status === 'PROCESSING',
    isWaiting: state.status === 'WAITING',
    handleGrade,
    handleMarkKnown,
    handleUndo,
    progress: state.cards.length ? (state.currentIndex / state.cards.length) * 100 : 0,
    removeCardFromSession,
    updateCardInSession,
    setIsFlipped
  };
};
