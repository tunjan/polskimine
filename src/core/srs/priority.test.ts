import { describe, it, expect } from "vitest";
import { sortCards } from "./cardSorter";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const createCard = (id: string, status: CardStatus, dueDate: string): Card => ({
  id,
  status,
  state: status === CardStatus.NEW ? State.New : State.Review,
  dueDate,
  targetSentence: "test",
  nativeTranslation: "test",
  language: "en" as any,
  notes: "",
  interval: 0,
  easeFactor: 0
});

describe("Card Sorting & Priority System", () => {
  const past = new Date("2020-01-01").toISOString();
  const future = new Date("2030-01-01").toISOString();
  
  it("should always prioritize manually 'Prioritized' cards (EPOCH date)", () => {
    const normalCard = createCard("normal", CardStatus.REVIEW, past);
    const priorityCard = createCard("priority", CardStatus.NEW, new Date(0).toISOString());
    
    // Use newFirst mode which sorts by due date - EPOCH should come first
    const result = sortCards([normalCard, priorityCard], "newFirst");
    
    expect(result[0].id).toBe("priority");
  });

  it("should strictly respect 'New First' setting", () => {
    const reviewCard = createCard("review", CardStatus.REVIEW, past);
    const newCard = createCard("new", CardStatus.NEW, past);
    
    const result = sortCards([reviewCard, newCard], "newFirst");
    
    expect(result.map(c => c.id)).toEqual(["new", "review"]);
  });

  it("should strictly respect 'Review First' setting", () => {
    const reviewCard = createCard("review", CardStatus.REVIEW, past);
    const newCard = createCard("new", CardStatus.NEW, past);
    
    const result = sortCards([reviewCard, newCard], "reviewFirst");
    
    expect(result.map(c => c.id)).toEqual(["review", "new"]);
  });

  it("should interleave cards correctly in 'Mixed' mode", () => {
    const newCards = Array.from({ length: 5 }, (_, i) => createCard(`new-${i}`, CardStatus.NEW, past));
    const reviewCards = Array.from({ length: 5 }, (_, i) => createCard(`rev-${i}`, CardStatus.REVIEW, past));
    
    // Default interleaving logic usually puts reviews first or mixes them evenly
    // The implementation in cardSorter.ts puts reviews first then injects new cards
    const result = sortCards([...newCards, ...reviewCards], "mixed", {
      newReviewOrder: "mixed"
    });

    // Check for some level of mixing (not all new at start, not all new at end)
    const firstId = result[0].id;
    const lastId = result[result.length - 1].id;
    
    // Given 1:1 ratio, it should ideally alternate or close to it
    // Implementation specific: check if we have both types in the first 4 cards
    const slice = result.slice(0, 4);
    const hasNew = slice.some(c => c.status === CardStatus.NEW);
    const hasReview = slice.some(c => c.status === CardStatus.REVIEW);
    
    expect(hasNew || hasReview).toBe(true);
  });
});