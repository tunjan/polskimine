import { useCallback, useEffect, useReducer, useMemo } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/features/study/logic/srs';
import { isNewCard } from '@/services/studyLimits';
import { sortCards } from '../logic/cardSorter';

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[];
  settings: UserSettings;
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
  tick: number;
}

type Action =
  | { type: 'INIT'; cards: Card[]; reserve: Card[] }
  | { type: 'FLIP' }
  | { type: 'START_PROCESSING' }
  | { type: 'GRADE_SUCCESS'; status?: SessionStatus; updatedCard?: Card | null; addedCardId?: string | null; isLast?: boolean }
  | { type: 'GRADE_FAILURE' }
  | { type: 'UNDO'; }
  | { type: 'TICK' }
  | { type: 'REMOVE_CARD'; cardId: string; newCardFromReserve?: Card | null }
  | { type: 'CHECK_WAITING'; now: Date; ignoreLearningSteps: boolean }
  | { type: 'UPDATE_CARD'; card: Card };

const getInitialStatus = (cards: Card[]): SessionStatus => {
  return cards.length > 0 ? 'IDLE' : 'COMPLETE';
};

const reducer = (state: SessionState, action: Action): SessionState => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        cards: action.cards,
        reserveCards: action.reserve,
        currentIndex: 0,
        status: getInitialStatus(action.cards),
        history: [],
      };

    case 'FLIP':
      if (state.status !== 'IDLE') return state;
      return { ...state, status: 'FLIPPED' };

    case 'START_PROCESSING':
      if (state.status !== 'FLIPPED' && state.status !== 'IDLE') return state;
      return { ...state, status: 'PROCESSING' };

    case 'GRADE_SUCCESS': {
      const { updatedCard, addedCardId, isLast } = action;
      let newCards = [...state.cards];
      let newIndex = state.currentIndex;
      let newHistory = [...state.history, { addedCardId: addedCardId ?? null }];

      if (updatedCard) {
        if (updatedCard.status === 'learning') {
          if (isLast) {
            newCards[state.currentIndex] = updatedCard;
            return {
              ...state,
              cards: newCards,
              status: 'IDLE',
              history: newHistory
            };
          } else {
            newCards.push(updatedCard);
          }
        }
      } else if (addedCardId) {
      }

      if (newIndex < newCards.length - 1) {
        return {
          ...state,
          cards: newCards,
          currentIndex: newIndex + 1,
          status: 'IDLE',
          history: newHistory
        };
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

    case 'CHECK_WAITING': {
      if (state.status === 'PROCESSING' || state.status === 'FLIPPED') return state;

      const current = state.cards[state.currentIndex];
      if (!current) {
        if (state.cards.length === 0) return { ...state, status: 'COMPLETE' };
        return state;
      }

      if (isCardDue(current, action.now)) {
        return { ...state, status: 'IDLE' };
      }

      const nextDueIndex = state.cards.findIndex((c, i) => i > state.currentIndex && isCardDue(c, action.now));
      if (nextDueIndex !== -1) {
        const newCards = [...state.cards];
        const [card] = newCards.splice(nextDueIndex, 1);
        newCards.splice(state.currentIndex, 0, card);
        return { ...state, cards: newCards, status: 'IDLE' };
      }

      if (action.ignoreLearningSteps) {
        return { ...state, status: 'IDLE' };
      }

      return { ...state, status: 'WAITING' };
    }

    case 'TICK':
      return { ...state, tick: state.tick + 1 };

    case 'REMOVE_CARD': {
      const { cardId, newCardFromReserve } = action;
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

      return {
        ...state,
        cards: newCards,
        reserveCards: newReserve,
        currentIndex: newIndex,
        status: newStatus,
      };
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
  settings,
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
    tick: 0,
  }, (initial) => ({
    ...initial,
    status: getInitialStatus(initial.cards)
  }));

  useEffect(() => {
    if (dueCards.length > 0) {
      const order = settings.cardOrder || 'newFirst';
      const sortedCards = sortCards(dueCards, order);

      dispatch({ type: 'INIT', cards: sortedCards, reserve: initialReserve });
    }
  }, [dueCards, initialReserve, settings.cardOrder]);

  useEffect(() => {
    if (state.status === 'IDLE' || state.status === 'WAITING') {
      const now = new Date();
      dispatch({ type: 'CHECK_WAITING', now, ignoreLearningSteps: !!settings.ignoreLearningStepsWhenNoCards });
    }

    if (state.status === 'WAITING') {
      const timer = setTimeout(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.currentIndex, state.cards, settings.ignoreLearningStepsWhenNoCards, state.tick]);

  const currentCard = state.cards[state.currentIndex];

  const handleGrade = useCallback(async (grade: Grade) => {
    if (state.status !== 'FLIPPED') return;

    dispatch({ type: 'START_PROCESSING' });

    try {
      const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs, settings.learningSteps);
      await onRecordReview(currentCard, updatedCard, grade);

      const isLast = state.currentIndex === state.cards.length - 1;
      const addedCardId = updatedCard.status === 'learning' && !isLast ? updatedCard.id : null;

      dispatch({ type: 'GRADE_SUCCESS', updatedCard, addedCardId, isLast });
    } catch (e) {
      console.error("Grade failed", e);
      dispatch({ type: 'GRADE_FAILURE' });
    }
  }, [state.status, state.currentIndex, state.cards, currentCard, settings.fsrs, onRecordReview]);

  const handleMarkKnown = useCallback(async () => {
    if (state.status === 'PROCESSING') return;

    dispatch({ type: 'START_PROCESSING' });

    try {
      const wasNew = isNewCard(currentCard);
      const updatedCard: Card = { ...currentCard, status: 'known' };

      await onUpdateCard(updatedCard);

      let addedCardId: string | null = null;
      let newCardFromReserve: Card | null = null;

      if (wasNew && state.reserveCards.length > 0) {
        newCardFromReserve = state.reserveCards[0];
      }




      if (newCardFromReserve) {
        addedCardId = newCardFromReserve.id;
      }





      dispatch({ type: 'REMOVE_CARD', cardId: currentCard.id, newCardFromReserve });



    } catch (e) {
      console.error("Mark Known failed", e);
      dispatch({ type: 'GRADE_FAILURE' });
    }

  }, [state.status, currentCard, state.reserveCards, onUpdateCard]);


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
    dispatch({ type: 'REMOVE_CARD', cardId, newCardFromReserve });
  }, [state.cards, state.reserveCards]);

  const updateCardInSession = useCallback((card: Card) => {
    dispatch({ type: 'UPDATE_CARD', card });
  }, []);

  const setIsFlipped = (flipped: boolean) => {
    if (flipped) dispatch({ type: 'FLIP' });
  };

  const isCurrentCardDue = useMemo(() => {
    if (!currentCard) return false;
    return isCardDue(currentCard, new Date());
  }, [currentCard]);

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
