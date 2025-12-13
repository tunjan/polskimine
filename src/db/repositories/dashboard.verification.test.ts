
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../dexie";
import { getDashboardCounts, saveCard } from "./cardRepository";
import { Card, LanguageId } from "../../types";
import { generateId } from "../../utils/ids";

describe("Dashboard Counts Verification", () => {
  const userId = "user_dashboard_test";
  const language = LanguageId.Polish;

  beforeEach(async () => {
    
    localStorage.setItem("linguaflow_current_user", userId);
    
    await db.cards.clear();
    await db.users.put({ id: userId, username: "test", created_at: new Date().toISOString(), passwordHash: "" });
  });

  it("should correctly aggregate counts in single pass", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const nowDays = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    
    let cardCounter = 0;
    const createCard = async (type: number, queue: number, due: number, ivl: number = 0) => {
        cardCounter++;
        const card: Card = {
            id: `card_${cardCounter}`,
            user_id: userId,
            language: language,
            type: type,
            queue: queue,
            due: due,
            interval: ivl,
            targetSentence: "Test",
            nativeTranslation: "Test",
            targetWord: "Test",
            notes: "",
            last_modified: nowSeconds,
            left: 0,
            easeFactor: 2500,
            reps: 0,
            lapses: 0,
            state: 0,
            isLeech: false,
            isBookmarked: false,
            created_at: nowSeconds,
            elapsed_days: 0,
            scheduled_days: 0,
        };
        await saveCard(card);
    };

    
    await createCard(0, 0, 0);

    
    await createCard(1, 1, nowSeconds - 100);

    
    await createCard(1, 1, nowSeconds + 10000);

    
    await createCard(2, 2, nowDays - 1);

    
    await createCard(2, 2, nowDays + 5);

    
    await createCard(2, 2, nowDays + 10, 25);

    
    await createCard(3, 3, nowDays - 1);
    
    
    const otherLangCard: Card = {
       id: `other_lang_card`,
       user_id: userId,
       language: LanguageId.Spanish,
       type: 0,
       queue: 0,
       due: 0,
       interval: 0,
       targetSentence: "Test",
       nativeTranslation: "Test",
       targetWord: "Test",
       notes: "",
       last_modified: nowSeconds,
       left: 0,
       easeFactor: 2500,
       reps: 0,
       lapses: 0,
       state: 0,
       isLeech: false,
       isBookmarked: false,
       created_at: nowSeconds,
       elapsed_days: 0,
       scheduled_days: 0,
    };
    await saveCard(otherLangCard);

    
    const stats = await getDashboardCounts(language);
    
    
    console.log("Stats:", stats);

    /* 
      Expected:
      Total: 7 (Polish cards)
      New: 1
      Learning: 2
      Review: 3 (Cards 4, 5, 6)
      Relearning: 1
      Known: 1 (Card 6)
      
      Due Counts:
      LearnDue: 1 (Card 2)
      ReviewDue: 1 (Card 4 only. Card 6 is future. Card 5 is future.)
      DayLearnDue: 1 (Card 7)
      
      Total HueDue = 1 + 1 + 1 = 3
    */

    expect(stats.total).toBe(7);
    expect(stats.new).toBe(1);
    expect(stats.learning).toBe(2);
    expect(stats.review).toBe(3);
    expect(stats.relearning).toBe(1);
    expect(stats.known).toBe(1);
    
    expect(stats.hueDue).toBe(3); 
    expect(stats.reviewDue).toBe(1);
  });
});
