import { useCallback, useEffect, useReducer, useRef } from "react";
import { Card, CardStatus, Grade, UserSettings } from "@/types";
import { calculateNextReview, LapsesSettings } from "@/core/srs/scheduler";
import { isNewCard } from "@/services/studyLimits";
import { sortCards } from "@/core/srs/cardSorter";
import {
  SessionState,
  checkSchedule,
  getInitialStatus,
  reducer,
} from "../logic/sessionReducer";
import { useXpSession } from "./useXpSession";
import { CardXpPayload, CardRating } from "@/core/gamification/xp";
import { State } from "ts-fsrs";

interface UseStudyQueueParams {
  dueCards: Card[];
  reserveCards?: Card[];
  cardOrder: UserSettings["cardOrder"];
  ignoreLearningStepsWhenNoCards: boolean;
  fsrs: UserSettings["fsrs"];
  learningSteps: UserSettings["learningSteps"];
  lapsesSettings?: LapsesSettings;
  onUpdateCard: (card: Card) => void;
  onRecordReview: (
    oldCard: Card,
    newCard: Card,
    grade: Grade,
    xpPayload?: CardXpPayload,
  ) => void;
  canUndo?: boolean;
  onUndo?: () => void;
  dailyStreak: number;
  isCramMode?: boolean;
}

const gradeToRatingMap: Record<Grade, CardRating> = {
  Again: "again",
  Hard: "hard",
  Good: "good",
  Easy: "easy",
};

const mapGradeToRating = (grade: Grade): CardRating => gradeToRatingMap[grade];

const getQueueCounts = (cards: Card[]) => {
  return cards.reduce(
    (acc, card) => {
      const state = card.state;
      if (state === State.New || (state === undefined && card.status === "new"))
        acc.unseen++;
      else if (
        state === State.Learning ||
        (state === undefined && card.status === "learning")
      )
        acc.learning++;
      else if (state === State.Relearning) acc.lapse++;
      else acc.mature++;
      return acc;
    },
    { unseen: 0, learning: 0, lapse: 0, mature: 0 },
  );
};

export const useStudyQueue = ({
  dueCards,
  reserveCards: initialReserve = [],
  cardOrder,
  ignoreLearningStepsWhenNoCards,
  fsrs,
  learningSteps,
  lapsesSettings,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
  dailyStreak,
  isCramMode = false,
}: UseStudyQueueParams) => {
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

  const {
    sessionXp,
    sessionStreak,
    multiplierInfo,

    processCardResult,
    subtractXp,
  } = useXpSession(dailyStreak, isCramMode);
  const lastXpEarnedRef = useRef<number>(0);

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

  const gradeCard = useCallback(
    async (grade: Grade) => {
      if (state.status !== "FLIPPED") return;

      dispatch({ type: "START_PROCESSING" });

      try {
        const updatedCard = calculateNextReview(
          currentCard,
          grade,
          fsrs,
          learningSteps,
          lapsesSettings,
        );

        const rating = mapGradeToRating(grade);
        const xpResult = processCardResult(rating);
        lastXpEarnedRef.current = xpResult.totalXp;

        const payload: CardXpPayload = {
          ...xpResult,
          rating,
          streakAfter: rating === "again" ? 0 : sessionStreak + 1,
          isCramMode,
          dailyStreak,
          multiplierLabel: multiplierInfo.label,
        };

        await onRecordReview(currentCard, updatedCard, grade, payload);

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
      state.cards.length,
      currentCard,
      fsrs,
      learningSteps,
      ignoreLearningStepsWhenNoCards,
      onRecordReview,
      processCardResult,
      sessionStreak,
      isCramMode,
      dailyStreak,
      multiplierInfo,
    ],
  );

  const undo = useCallback(() => {
    if (state.status === "PROCESSING" || !canUndo || !onUndo) return;

    if (lastXpEarnedRef.current > 0) {
      subtractXp(lastXpEarnedRef.current);
      lastXpEarnedRef.current = 0;
    }

    onUndo();
    dispatch({ type: "UNDO" });
  }, [state.status, canUndo, onUndo, subtractXp]);

  const markKnown = useCallback(async () => {
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

  const removeCard = useCallback(
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

  const updateCard = useCallback((card: Card) => {
    dispatch({ type: "UPDATE_CARD", card });
  }, []);

  const setIsFlipped = useCallback((flipped: boolean) => {
    if (flipped) dispatch({ type: "FLIP" });
  }, []);

  const counts = getQueueCounts(state.cards.slice(state.currentIndex));

  return {
    currentCard,
    stats: {
      progress: state.cards.length
        ? (state.currentIndex / state.cards.length) * 100
        : 0,
      counts,
      sessionXp,
      sessionStreak,
      multiplierInfo,

      isProcessing: state.status === "PROCESSING",
      isWaiting: state.status === "WAITING",
      isFinished: state.status === "COMPLETE",
      currentIndex: state.currentIndex,
      totalCards: state.cards.length,
    },
    actions: {
      gradeCard,
      undo,
      markKnown,
      removeCard,
      updateCard,
    },
    uiState: {
      isFlipped: state.status === "FLIPPED",
      setIsFlipped,
    },
  };
};
