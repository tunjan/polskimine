
import { describe, it, expect } from "vitest";
import { sortCards, DisplayOrderSettings } from "./cardSorter";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const createCard = (id: string, overrides: Partial<Card> = {}): Card => ({
  id,
  targetSentence: `Sentence ${id}`,
  nativeTranslation: `Translation ${id}`,
  notes: "",
  status: CardStatus.REVIEW,   state: State.Review,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: "en" as any,
  ...overrides,
});

describe("sortByOverdueness Reproduction", () => {
    it("should prioritize 0-interval cards over small-interval cards", () => {
        const now = new Date();
        const due = new Date(now.getTime() - 1000 * 60 * 60 * 24); 
        const zeroIntervalCard = createCard("zero", {
            dueDate: due.toISOString(),
            interval: 0, 
        });

        const smallIntervalCard = createCard("small", {
            dueDate: due.toISOString(),
            interval: 0.1,         });

        const settings: DisplayOrderSettings = {
            reviewSortOrder: "overdueness",
            newReviewOrder: "reviewFirst",
        };

                                                
        const result = sortCards(
            [zeroIntervalCard, smallIntervalCard],
            "reviewFirst",
            settings
        );

                expect(result[0].id).toBe("zero");
    });

    it("should remain stable with multiple 0-interval cards (Checking for NaN behavior)", () => {
        const now = new Date();
         const due = new Date(now.getTime() - 1000 * 60 * 60 * 24); 

        const cardA = createCard("A", { dueDate: due.toISOString(), interval: 0 });
        const cardB = createCard("B", { dueDate: due.toISOString(), interval: 0 });
        const cardC = createCard("C", { dueDate: due.toISOString(), interval: 0 });

        const settings: DisplayOrderSettings = {
            reviewSortOrder: "overdueness",
            newReviewOrder: "reviewFirst",
        };

                                
        const result = sortCards([cardA, cardB, cardC], "reviewFirst", settings);
        
                        expect(result.length).toBe(3);
        const ids = result.map(c => c.id);
        expect(ids).toContain("A");
        expect(ids).toContain("B");
        expect(ids).toContain("C");
    });
});
