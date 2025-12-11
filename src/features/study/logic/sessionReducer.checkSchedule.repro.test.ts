import { checkSchedule, SessionState } from "./sessionReducer";
import { Card, CardStatus } from "@/types";
import { addMinutes } from "date-fns";

describe("sessionReducer checkSchedule - Skip Learning Wait", () => {
  const now = new Date();
  const futureDue = addMinutes(now, 10).toISOString();

  const learningCard: Card = {
    id: "1",
    status: CardStatus.LEARNING,
    dueDate: futureDue,
    targetSentence: "test",
    nativeTranslation: "test",
    interval: 0,
    easeFactor: 0,
    notes: "",
    language: "pl",
    reps: 1, 
  };

  const reviewCard: Card = {
    id: "2",
    status: CardStatus.REVIEW,
    dueDate: futureDue,
    targetSentence: "review",
    nativeTranslation: "review",
    interval: 1,
    easeFactor: 2.5,
    notes: "",
    language: "pl",
    reps: 5, 
  };

  it("should wait for learning card when ignoreLearningSteps is false", () => {
    const state: SessionState = {
      status: "IDLE",
      cards: [learningCard],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, false);
    expect(newState.status).toBe("WAITING");
  });

  it("should skip wait for learning card when ignoreLearningSteps is true", () => {
    const state: SessionState = {
      status: "IDLE",
      cards: [learningCard],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, true);
    expect(newState.status).toBe("IDLE");
  });

  it("should NOT skip wait for review card even if ignoreLearningSteps is true", () => {
    
    
    
    const notDueReviewCard = {
      ...reviewCard,
      dueDate: addMinutes(now, 24 * 60 * 2).toISOString(), 
    };

    const state: SessionState = {
      status: "IDLE",
      cards: [notDueReviewCard],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, true);
    expect(newState.status).toBe("WAITING");
  });

  it("should find and show waiting learning card if head is waiting review card", () => {
    
    
    
    

    const reviewCardFuture = {
      ...reviewCard,
      id: "rev1",
      dueDate: addMinutes(now, 24 * 60 + 10).toISOString(), 
    };

    

    const learningCardFuture = { ...learningCard, id: "learn1" };

    const state: SessionState = {
      status: "IDLE",
      cards: [reviewCardFuture, learningCardFuture],
      reserveCards: [],
      currentIndex: 0,
      history: [],
    };

    const newState = checkSchedule(state, now, true);

    expect(newState.status).toBe("IDLE");
    expect(newState.cards[0].id).toBe("learn1");
  });
});
