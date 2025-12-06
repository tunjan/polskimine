import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto'; // Ensure indexedDB is mocked
import { LinguaFlowDB } from './dexie';

describe('LinguaFlowDB Cascade Delete', () => {
    let db: LinguaFlowDB;

    beforeEach(async () => {
        db = new LinguaFlowDB();
        await db.delete(); // clear previous data
        await db.open();
    });

    it('should delete associated revlogs when a card is deleted', async () => {
        const cardId = 'card-1';
        const cardData = {
            id: cardId,
            status: 'new',
            language: 'pl',
            dueDate: new Date().toISOString(),
            isBookmarked: false,
        } as any; // Cast to any to avoid full type matching if unnecessary for this test

        // Add card
        await db.cards.add(cardData);

        // Add review logs
        await db.revlog.bulkAdd([
            { id: 'log-1', card_id: cardId, created_at: '2023-01-01', grade: 1, state: 0, elapsed_days: 0, scheduled_days: 0, stability: 0, difficulty: 0 },
            { id: 'log-2', card_id: cardId, created_at: '2023-01-02', grade: 3, state: 1, elapsed_days: 1, scheduled_days: 1, stability: 1, difficulty: 1 },
        ]);

        // Add another card and log to ensure they are NOT deleted
        const otherCardId = 'card-2';
        await db.cards.add({ ...cardData, id: otherCardId });
        await db.revlog.add({ id: 'log-3', card_id: otherCardId, created_at: '2023-01-01', grade: 1, state: 0, elapsed_days: 0, scheduled_days: 0, stability: 0, difficulty: 0 });

        // Verify initial state
        expect(await db.cards.count()).toBe(2);
        expect(await db.revlog.count()).toBe(3);

        // ACT: Delete the first card
        await db.transaction('rw', [db.cards, db.revlog], async () => {
            await db.cards.delete(cardId);
        });

        // ASSERT
        // Card should be gone
        const deletedCard = await db.cards.get(cardId);
        expect(deletedCard).toBeUndefined();

        // Associated revlogs should be gone
        const associatedLogs = await db.revlog.where('card_id').equals(cardId).toArray();
        expect(associatedLogs).toHaveLength(0);

        // Other card and its log should remain
        expect(await db.cards.get(otherCardId)).toBeDefined();
        const otherLogs = await db.revlog.where('card_id').equals(otherCardId).toArray();
        expect(otherLogs).toHaveLength(1);
    });

    it('should delete associated revlogs when cards are bulk deleted', async () => {
        const cardId1 = 'card-1';
        const cardId2 = 'card-2';

        await db.cards.bulkAdd([
            { id: cardId1, status: 'new', language: 'pl', dueDate: new Date().toISOString() } as any,
            { id: cardId2, status: 'new', language: 'pl', dueDate: new Date().toISOString() } as any
        ]);

        await db.revlog.bulkAdd([
            { id: 'log-1', card_id: cardId1, created_at: '2023-01-01', grade: 1 } as any,
            { id: 'log-2', card_id: cardId2, created_at: '2023-01-02', grade: 1 } as any
        ]);

        // ACT: Bulk delete
        await db.transaction('rw', [db.cards, db.revlog], async () => {
            await db.cards.bulkDelete([cardId1, cardId2]);
        });

        // ASSERT
        expect(await db.revlog.count()).toBe(0);
    });
});
