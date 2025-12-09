import { reducer, SessionState } from "./sessionReducer";
import { Card, CardStatus } from "@/types";

describe("sessionReducer", () => {
  const createCard = (id: string, status: CardStatus): Card => ({
    id,
    status,
        targetSentence: "test",
    nativeTranslation: "test",
    notes: "",
    language: "es",     interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  } as any);

  it("should insert replacement new card after the last new card in the queue", () => {
    const card1 = createCard("c1", CardStatus.NEW);
    const card2 = createCard("c2", CardStatus.NEW);
    const card3 = createCard("c3", CardStatus.REVIEW);
    const card4 = createCard("c4", CardStatus.REVIEW);
    const reserveCard = createCard("r1", CardStatus.NEW);

    const initialState: SessionState = {
      status: "IDLE",
      cards: [card1, card2, card3, card4],
      reserveCards: [reserveCard],
      currentIndex: 0,
      history: [],
    };

    const action = {
      type: "REMOVE_CARD" as const,
      cardId: "c1",
      newCardFromReserve: reserveCard,
      now: new Date(),
      ignoreLearningSteps: false,
    };

    const newState = reducer(initialState, action);

            
    expect(newState.cards.map(c => c.id)).toEqual(["c2", "r1", "c3", "c4"]);
  });

  it("should insert replacement new card at the beginning if no other new cards exist", () => {
    const card1 = createCard("c1", CardStatus.NEW);     const card3 = createCard("c3", CardStatus.REVIEW);
    const card4 = createCard("c4", CardStatus.REVIEW);
    const reserveCard = createCard("r1", CardStatus.NEW);

    const initialState: SessionState = {
      status: "IDLE",
      cards: [card1, card3, card4],
      reserveCards: [reserveCard],
      currentIndex: 0,
      history: [],
    };

    const action = {
      type: "REMOVE_CARD" as const,
      cardId: "c1",
      newCardFromReserve: reserveCard,
      now: new Date(),
      ignoreLearningSteps: false,
    };

    const newState = reducer(initialState, action);

        expect(newState.cards.map(c => c.id)).toEqual(["r1", "c3", "c4"]);
  });
});
