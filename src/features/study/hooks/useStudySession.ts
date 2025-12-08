import { useCallback, useEffect, useReducer, useRef } from "react";
import { Card, CardStatus, Grade, UserSettings } from "@/types";
import { calculateNextReview } from "@/core/srs/scheduler";
import { isNewCard } from "@/services/studyLimits";
import { sortCards } from "@/core/srs/cardSorter";

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[];
  cardOrder: UserSettings["cardOrder"];
  ignoreLearningStepsWhenNoCards: boolean;
  fsrs: UserSettings["fsrs"];
  learningSteps: UserSettings["learningSteps"];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, updatedCard: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

import {
  SessionState,
  checkSchedule,
  getInitialStatus,
  reducer,
} from "../logic/sessionReducer";

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
  const initializeState = useCallback(
    (
      initialCards: Card[],
      initialReserve: Card[],
      initialOrder: UserSettings["cardOrder"],
      initialIgnoreLearningSteps: boolean,
    ): SessionState => {
      const order = initialOrder || "newFirst";
      const sortedCards =
        initialCards.length > 0 ? sortCards(initialCards, order) : [];

      const initialState: SessionState = {
        status: getInitialStatus(sortedCards),
        cards: sortedCards,
        reserveCards: initialReserve,
        currentIndex: 0,
        history: [],
      };

      return checkSchedule(
        initialState,
        new Date(),
        initialIgnoreLearningSteps,
      );
    },
    [],
  );

  const [state, dispatch] = useReducer(
    reducer,
    {
      status: "COMPLETE",
      cards: dueCards,
      reserveCards: initialReserve,
      currentIndex: 0,
      history: [],
    },
    () =>
      initializeState(
        dueCards,
        initialReserve,
        cardOrder,
        ignoreLearningStepsWhenNoCards,
      ),
  );

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (dueCards.length > 0) {
      const order = cardOrder || "newFirst";
      const sortedCards = sortCards(dueCards, order);

      dispatch({
        type: "INIT",
        cards: sortedCards,
        reserve: initialReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
      });
    }
  }, [dueCards, initialReserve, cardOrder, ignoreLearningStepsWhenNoCards]);

  useEffect(() => {
    if (state.status === "WAITING") {
      const timer = setTimeout(() => {
        dispatch({
          type: "TICK",
          now: new Date(),
          ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.status, ignoreLearningStepsWhenNoCards]);

  const currentCard = state.cards[state.currentIndex];

  const handleGrade = useCallback(
    async (grade: Grade) => {
      if (state.status !== "FLIPPED") return;

      dispatch({ type: "START_PROCESSING" });

      try {
        const updatedCard = calculateNextReview(
          currentCard,
          grade,
          fsrs,
          learningSteps,
        );
        await onRecordReview(currentCard, updatedCard, grade);

        const isLast = state.currentIndex === state.cards.length - 1;
        const addedCardId =
          updatedCard.status === "learning" && !isLast ? updatedCard.id : null;

        dispatch({
          type: "GRADE_SUCCESS",
          updatedCard,
          addedCardId,
          isLast,
          now: new Date(),
          ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
        });
      } catch (e) {
        console.error("Grade failed", e);
        dispatch({ type: "GRADE_FAILURE" });
      }
    },
    [
      state.status,
      state.currentIndex,
      state.cards,
      currentCard,
      fsrs,
      learningSteps,
      ignoreLearningStepsWhenNoCards,
      onRecordReview,
    ],
  );

  const handleMarkKnown = useCallback(async () => {
    if (state.status === "PROCESSING") return;

    dispatch({ type: "START_PROCESSING" });

    try {
      const wasNew = isNewCard(currentCard);
      const updatedCard: Card = { ...currentCard, status: CardStatus.KNOWN };

      await onUpdateCard(updatedCard);

      let newCardFromReserve: Card | null = null;
      if (wasNew && state.reserveCards.length > 0) {
        newCardFromReserve = state.reserveCards[0];
      }

      dispatch({
        type: "REMOVE_CARD",
        cardId: currentCard.id,
        newCardFromReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
      });
    } catch (e) {
      console.error("Mark Known failed", e);
      dispatch({ type: "GRADE_FAILURE" });
    }
  }, [
    state.status,
    currentCard,
    state.reserveCards,
    ignoreLearningStepsWhenNoCards,
    onUpdateCard,
  ]);

  const handleUndo = useCallback(() => {
    if (state.status === "PROCESSING" || !canUndo || !onUndo) return;
    onUndo();
    dispatch({ type: "UNDO" });
  }, [state.status, canUndo, onUndo]);

  const removeCardFromSession = useCallback(
    (cardId: string) => {
      const card = state.cards.find((c) => c.id === cardId);
      let newCardFromReserve: Card | null = null;
      if (card && isNewCard(card) && state.reserveCards.length > 0) {
        newCardFromReserve = state.reserveCards[0];
      }
      dispatch({
        type: "REMOVE_CARD",
        cardId,
        newCardFromReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
      });
    },
    [state.cards, state.reserveCards, ignoreLearningStepsWhenNoCards],
  );

  const updateCardInSession = useCallback((card: Card) => {
    dispatch({ type: "UPDATE_CARD", card });
  }, []);

  const setIsFlipped = (flipped: boolean) => {
    if (flipped) dispatch({ type: "FLIP" });
  };

  return {
    sessionCards: state.cards,
    currentCard,
    currentIndex: state.currentIndex,
    isFlipped: state.status === "FLIPPED",
    sessionComplete: state.status === "COMPLETE",
    isProcessing: state.status === "PROCESSING",
    isWaiting: state.status === "WAITING",
    handleGrade,
    handleMarkKnown,
    handleUndo,
    progress: state.cards.length
      ? (state.currentIndex / state.cards.length) * 100
      : 0,
    removeCardFromSession,
    updateCardInSession,
    setIsFlipped,
  };
};
