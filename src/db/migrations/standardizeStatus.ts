import { db } from '@/db/dexie';
import { CardStatus } from '@/types/cardStatus';

export const migrateCardStatuses = async () => {
  await db.transaction('rw', db.cards, async () => {
    await db.cards.toCollection().modify(card => {
                  if (card.status === 'graduated') {
        card.status = CardStatus.REVIEW;
      }
      
                  if (card.status !== CardStatus.KNOWN) {
        if (card.state !== undefined) {
                      if (card.state === 0) card.status = CardStatus.NEW;
           if (card.state === 1 || card.state === 3) card.status = CardStatus.LEARNING;
           if (card.state === 2) card.status = CardStatus.REVIEW;
        }
      }
    });
  });
  console.log("Card statuses standardized.");
};
