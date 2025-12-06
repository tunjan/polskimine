import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/services/db/dexie';
import { addReviewLog } from './revlogRepository';
import { Card, Grade } from '@/types';

describe('revlogRepository Transaction Safety', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
    });

    it('should successfully add review log within a transaction', async () => {
        const card: Card = {
            id: 'test-card-1',
            status: 'learning',
            language: 'pl',
            dueDate: new Date().toISOString(),
            isBookmarked: false,
            interval: 1,
            easeFactor: 2.5,
            state: 0 // New
        } as unknown as Card;

        await db.cards.add(card);

        // Simulate the transaction structure from useDeckQueries.ts
        await db.transaction('rw', [db.cards, db.revlog, db.aggregated_stats, db.history], async () => {
            // This call was previously failing because of dynamic import await
            await addReviewLog(card, 'Good', 1, 3);
        });

        // Verify log exists
        const logs = await db.revlog.where('card_id').equals(card.id).toArray();
        expect(logs).toHaveLength(1);
        expect(logs[0].grade).toBe(3); // 'Good' -> 3

        // Verify stats updated (implicit check that code ran)
        const stats = await db.aggregated_stats.where('id').equals('pl:total_reviews').first();
        expect(stats?.value).toBe(1);
    });
});
