import { describe, it, expect, vi } from 'vitest';
import { sortCards } from './cardSorter';
import { Card } from '@/types';

// Mock isNewCard to avoid importing the real one which might have other deps, 
// OR just trust the real one works. 
// Given the simplicity of isNewCard, using real one is better integration test.
// But we need to make sure the import in cardSorter works.
// Since we are running vitest in the project root, alias '@/' should work.


// Mock Card Factory
const createCard = (overrides: Partial<Card> = {}): Card => ({
    id: 'test-id',
    targetSentence: 'test',
    nativeTranslation: 'test',
    notes: '',
    status: 'new',
    interval: 0,
    easeFactor: 0,
    dueDate: new Date().toISOString(),
    ...overrides,
});

describe('sortCards', () => {
    const newCard1 = createCard({ id: 'n1', status: 'new', dueDate: '2023-01-01', reps: 0 });
    const newCard2 = createCard({ id: 'n2', status: 'new', dueDate: '2023-01-02', reps: 0 });
    const reviewCard1 = createCard({ id: 'r1', status: 'learning', dueDate: '2023-01-01', reps: 5 }); // status !== 'new', reps > 0
    const reviewCard2 = createCard({ id: 'r2', status: 'graduated', dueDate: '2023-01-02', reps: 10 }); // status !== 'new', reps > 0

    const allCards = [newCard2, reviewCard2, newCard1, reviewCard1];

    it('should sort newFirst correctly', () => {
        const sorted = sortCards(allCards, 'newFirst');
        // Expect: All new cards first (sorted by date), then review cards (sorted by date)
        // newCard1 (n1, 01-01) -> newCard2 (n2, 01-02) -> reviewCard1 (r1, 01-01) -> reviewCard2 (r2, 01-02)

        expect(sorted.map(c => c.id)).toEqual(['n1', 'n2', 'r1', 'r2']);
    });

    it('should sort reviewFirst correctly', () => {
        const sorted = sortCards(allCards, 'reviewFirst');
        // Expect: All review cards first (sorted by date), then new cards (sorted by date)
        // reviewCard1 (r1, 01-01) -> reviewCard2 (r2, 01-02) -> newCard1 (n1, 01-01) -> newCard2 (n2, 01-02)

        expect(sorted.map(c => c.id)).toEqual(['r1', 'r2', 'n1', 'n2']);
    });

    it('should sort mixed correctly (date based)', () => {
        const sorted = sortCards(allCards, 'mixed');
        // Expect: All cards sorted by date.
        // n1 (01-01), r1 (01-01) -> order between these two is stable sort (original order or id?)
        // The implementation sorts by dueDate then ID.
        // n1 vs r1: same date. n1 < r1.
        // n2 vs r2: same date. n2 < r2.

        expect(sorted.map(c => c.id)).toEqual(['n1', 'r1', 'n2', 'r2']);
    });

    it('should correctly classify cards with inconsistent status as new if they meet new criteria', () => {
        // Create a card that looks "new" (0 reps) but has invalid status (e.g. undefined or 'learning' erroneously)
        // In current logic, anything !== 'new' is review.
        // So if we have a "glitched" new card, it appears in logic as review.
        const glitchedNewCard = createCard({ id: 'g1', status: 'learning', reps: 0, dueDate: '2023-01-01' });
        const realReviewCard = createCard({ id: 'r1', status: 'learning', reps: 5, dueDate: '2023-01-01' });

        const cards = [glitchedNewCard, realReviewCard];

        // 'reviewFirst' -> All reviews first.
        // Both are "reviews" according to current logic (status !== 'new').
        // So they sort by date/ID.
        const sorted = sortCards(cards, 'reviewFirst');

        expect(sorted.map(c => c.id)).toEqual(['r1', 'g1']);
        // r1 comes first because it IS a review card.
        // g1 comes second because it is now correctly identified as "New" (via isNewCard logic) despite status='learning'.
        // So it goes to the "New" bucket, which is second in ReviewFirst.
    });


    it('should handle undefined dates gracefully', () => {
        const c1 = createCard({ id: 'a', status: 'new', dueDate: undefined, reps: 0 });
        const c2 = createCard({ id: 'b', status: 'learning', dueDate: '2023-01-01', reps: 5 });

        // reviewFirst: c2 then c1
        const sorted = sortCards([c1, c2], 'reviewFirst');
        expect(sorted.map(c => c.id)).toEqual(['b', 'a']);
    });
});
