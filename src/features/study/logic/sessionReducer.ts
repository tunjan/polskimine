import { Card, CardOrderValue } from "@/types";
import { isCardDue } from "@/core/srs/scheduler";

export type SessionStatus =
  | "IDLE"
  | "WAITING"
  | "FLIPPED"
  | "PROCESSING"
  | "COMPLETE";

export interface SessionState {
  status: SessionStatus;
  cards: Card[];
  reserveCards: Card[];
  currentIndex: number;
  history: { addedCardId: string | null; cardSnapshot?: Card | null }[];
}

export type Action =
  | {
      type: "INIT";
      cards: Card[];
      reserve: Card[];
      now: Date;
      ignoreLearningSteps: boolean;
    }
  | { type: "FLIP" }
  | { type: "START_PROCESSING" }
  | {
      type: "GRADE_SUCCESS";
      status?: SessionStatus;
      updatedCard?: Card | null;
      addedCardId?: string | null;
      isLast?: boolean;
      now: Date;
      ignoreLearningSteps: boolean;
    }
  | { type: "GRADE_FAILURE" }
  | { type: "UNDO" }
  | { type: "TICK"; now: Date; ignoreLearningSteps: boolean }
  | {
      type: "REMOVE_CARD";
      cardId: string;
      newCardFromReserve?: Card | null;
      now: Date;
      ignoreLearningSteps: boolean;
      cardOrder?: CardOrderValue;
    }
  | { type: "UPDATE_CARD"; card: Card };

export const getInitialStatus = (cards: Card[]): SessionStatus => {
  return cards.length > 0 ? "IDLE" : "COMPLETE";
};

export const checkSchedule = (
  state: SessionState,
  now: Date,
  ignoreLearningSteps: boolean,
): SessionState => {
  if (state.status === "PROCESSING" || state.status === "FLIPPED") return state;

  const current = state.cards[state.currentIndex];
  if (!current) {
    if (state.cards.length === 0) return { ...state, status: "COMPLETE" };
    return state;
  }

  if (isCardDue(current, now)) {
    return { ...state, status: "IDLE" };
  }

  const nextDueIndex = state.cards.findIndex(
    (c, i) => i > state.currentIndex && isCardDue(c, now),
  );
  if (nextDueIndex !== -1) {
    const newCards = [...state.cards];
    const [card] = newCards.splice(nextDueIndex, 1);
    newCards.splice(state.currentIndex, 0, card);
    return { ...state, cards: newCards, status: "IDLE" };
  }

  if (ignoreLearningSteps) {
    return { ...state, status: "IDLE" };
  }

  return { ...state, status: "WAITING" };
};

export const reducer = (state: SessionState, action: Action): SessionState => {
  switch (action.type) {
    case "INIT": {
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

    case "FLIP":
      if (state.status !== "IDLE") return state;
      return { ...state, status: "FLIPPED" };

    case "START_PROCESSING":
      if (state.status !== "FLIPPED" && state.status !== "IDLE") return state;
      return { ...state, status: "PROCESSING" };

    case "GRADE_SUCCESS": {
      const { updatedCard, addedCardId, isLast, now, ignoreLearningSteps } =
        action;
      let newCards = [...state.cards];
      let newIndex = state.currentIndex;
      const cardSnapshot = state.cards[state.currentIndex] ? { ...state.cards[state.currentIndex] } : null;
      let newHistory = [
        ...state.history,
        { addedCardId: addedCardId ?? null, cardSnapshot },
      ];

      if (updatedCard) {
        if (updatedCard.status === "learning") {
          if (isLast) {
            newCards[state.currentIndex] = updatedCard;
            const newState = {
              ...state,
              cards: newCards,
              status: "IDLE" as SessionStatus,
              history: newHistory,
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
          status: "IDLE" as SessionStatus,
          history: newHistory,
        };
        return checkSchedule(newState, now, ignoreLearningSteps);
      } else {
        return {
          ...state,
          cards: newCards,
          currentIndex: newIndex,
          status: "COMPLETE",
          history: newHistory,
        };
      }
    }

    case "GRADE_FAILURE":
      return {
        ...state,
        status: state.history.length > 0 ? "FLIPPED" : "IDLE",
      };

    case "UNDO":
      if (state.status === "PROCESSING") return state;
      if (
        state.history.length === 0 &&
        state.currentIndex === 0 &&
        !state.status.match(/COMPLETE/)
      )
        return state;

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

      if (lastAction?.cardSnapshot && undoCards[prevIndex]) {
        undoCards[prevIndex] = lastAction.cardSnapshot;
      }

      return {
        ...state,
        cards: undoCards,
        currentIndex: prevIndex,
        status: "FLIPPED",
        history: newHistory,
      };

    case "TICK":
      return checkSchedule(state, action.now, action.ignoreLearningSteps);

    case "REMOVE_CARD": {
      const { cardId, newCardFromReserve, now, ignoreLearningSteps, cardOrder } = action;
      const index = state.cards.findIndex((c) => c.id === cardId);
      if (index === -1) return state;

      let newCards = state.cards.filter((c) => c.id !== cardId);
      let newReserve = [...state.reserveCards];

      let newStatus = state.status;
      let newIndex = state.currentIndex;

      if (index < newIndex) {
        newIndex = Math.max(0, newIndex - 1);
      }

      // Handle insertion of new card
      if (newCardFromReserve) {
        let insertIndex = newIndex;

        if (cardOrder === "reviewFirst") {
          // For Review First, append to end (or after last review, simplified to end)
          insertIndex = newCards.length;
        } else {
            // Find insertion point:
            // We want to insert after the last "New" or "Learning" card in the active queue
            // to maintain the "New First" or "New Mix" flow.
            // If no New/Learning cards are ahead, we insert at the current position (to show it next).
            
            // Search from newIndex to the end
            for (let i = newCards.length - 1; i >= newIndex; i--) {
              const c = newCards[i];
              if (c.status === "new" || c.status === "learning") {
                insertIndex = i + 1;
                break;
              }
            }
        }
        
        newCards.splice(insertIndex, 0, newCardFromReserve);
        newReserve = newReserve.filter((c) => c.id !== newCardFromReserve.id);
      }

      if (index === newIndex) {
        newStatus = "IDLE";
        if (newIndex >= newCards.length) {
          newIndex = Math.max(0, newCards.length - 1);
        }
      }

      if (newCards.length === 0) newStatus = "COMPLETE";

      const newState = {
        ...state,
        cards: newCards,
        reserveCards: newReserve,
        currentIndex: newIndex,
        status: newStatus,
      };

      if (newStatus === "COMPLETE") return newState;

      return checkSchedule(newState, now, ignoreLearningSteps);
    }

    case "UPDATE_CARD": {
      const { card } = action;
      const newCards = state.cards.map((c) => (c.id === card.id ? card : c));
      return { ...state, cards: newCards };
    }

    default:
      return state;
  }
};
