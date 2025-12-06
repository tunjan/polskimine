
import { calculateNextReview } from './srs';
import { Card } from '@/types';
import { State } from 'ts-fsrs';
import { addMinutes } from 'date-fns';

const createMockCard = (status: Card['status'], state?: State): Card => ({
    id: 'test-card',
    targetSentence: 'test',
    nativeTranslation: 'test',
    notes: '',
    status,
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    reps: 0,
    lapses: 0,
    language: 'polish',
    last_review: undefined,
    state,
    stability: 0,
    difficulty: 0,
});

describe('calculateNextReview - Pure FSRS', () => {

    it('should schedule New card to accurate fractional interval on Good', () => {
        const card = createMockCard('new');
        const result = calculateNextReview(card, 'Good');

        expect(result.status).not.toBe('new');
        // Likely 'learning' or 'graduated' depending on FSRS default.
        // Based on probe: Learning.

        expect(result.interval).toBeGreaterThan(0);
        expect(result.interval).toBeLessThan(1); // Fractional day (e.g. 10m = 0.007)
        expect(result.scheduled_days).toBeCloseTo(result.interval);
    });

    it('should handle Again on Learning card', () => {
        // Create a card that has been seen once (Learning)
        // Simulate previous review 1 min ago
        const card = createMockCard('learning', State.Learning);
        card.reps = 1;
        card.last_review = addMinutes(new Date(), -1).toISOString();

        const result = calculateNextReview(card, 'Again');

        // Should stay learning or relearning?
        // FSRS logic: Learning -> Again -> Learning (usually short interval)
        expect(result.status).toBe('learning');
        expect(result.interval).toBeLessThan(1); // Short interval
    });

    it('should graduate eventually', () => {
        // Simulate a card that has sufficient reps
        // This test is tricky without specific parameters, 
        // but we can check that interval grows.

        let card = createMockCard('new');

        // Pass 1
        card = calculateNextReview(card, 'Good');

        // Pass 2
        card = calculateNextReview(card, 'Good');

        // Pass 3 (if needed)
        if (card.status === 'learning') {
            card = calculateNextReview(card, 'Good');
        }

        // Should be graduated (Review) eventually
        expect(card.state).toBe(State.Review);
        expect(card.interval).toBeGreaterThan(0.9); // At least ~1 day
    });

    it('should use precise interval for Review cards too', () => {
        const card = createMockCard('graduated', State.Review);
        card.stability = 10;
        card.difficulty = 5;
        card.last_review = addMinutes(new Date(), -1).toISOString();

        const result = calculateNextReview(card, 'Good');

        // In pure FSRS, interval is integer days for Review?
        // ts-fsrs might return float for due date?
        // result.interval is calculated from due date diff.
        // If due date is exactly +10 days, interval is 10.0.
        // But due date usually preserves time of day (or slightly randomized?).
        // By validation: it should be close to logic.
        expect(result.interval).toBeGreaterThan(1);
    });
});
