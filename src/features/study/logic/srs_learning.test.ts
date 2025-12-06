import { calculateNextReview } from './srs';
import { Card, Grade } from '@/types';
import { differenceInMinutes, parseISO } from 'date-fns';

const createMockCard = (status: Card['status'], learningStep = 0): Card => ({
    id: 'test-card',
    targetSentence: 'test',
    nativeTranslation: 'test',
    notes: '',
    status,
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    learningStep,
    reps: 0,
    lapses: 0,
    language: 'polish',
    last_review: new Date().toISOString(), // Ensure last_review exists
    stability: 1, // Provide stability
    difficulty: 5 // Provide difficulty
});

describe('calculateNextReview - Custom Learning Steps', () => {
    const learningSteps = [1, 10, 60]; // 1m, 10m, 60m

    it('should schedule New card to Step 0 on Again', () => {
        const card = createMockCard('new');
        const result = calculateNextReview(card, 'Again', undefined, learningSteps);

        expect(result.status).toBe('learning');
        expect(result.learningStep).toBe(0);

        // Use getTime to avoid rounding down issues
        const now = new Date();
        const due = parseISO(result.dueDate);
        const diffMs = due.getTime() - now.getTime();
        // 1 minute = 60000ms. Allow slight delay
        expect(diffMs).toBeGreaterThan(50000);
        expect(diffMs).toBeLessThan(70000);
    });

    it('should schedule New card to Step 1 on Good', () => {
        const card = createMockCard('new');
        const result = calculateNextReview(card, 'Good', undefined, learningSteps);

        expect(result.status).toBe('learning');
        expect(result.learningStep).toBe(1);

        const now = new Date();
        const due = parseISO(result.dueDate);
        const diffMs = due.getTime() - now.getTime();
        // 10 minutes = 600000ms
        expect(diffMs).toBeGreaterThan(590000);
        expect(diffMs).toBeLessThan(610000);
    });

    it('should graduate card when steps completed', () => {
        const card = createMockCard('learning', 2); // At step 2 (60m)
        // Next "Good" should graduate (index 3 >= length 3)

        const result = calculateNextReview(card, 'Good', undefined, learningSteps);

        expect(result.status).toBe('graduated');
        expect(result.learningStep).toBeUndefined();

        // Interval should be > 0 (days) set by FSRS
        expect(result.interval).toBeGreaterThan(0);
    });

    it('should handle Easy immediate graduation', () => {
        const card = createMockCard('new');
        const result = calculateNextReview(card, 'Easy', undefined, learningSteps);

        expect(result.status).toBe('graduated');
        expect(result.learningStep).toBeUndefined();
    });

    it('should reset to Step 0 on Again during learning', () => {
        const card = createMockCard('learning', 2);
        const result = calculateNextReview(card, 'Again', undefined, learningSteps);

        expect(result.status).toBe('learning');
        expect(result.learningStep).toBe(0);

        const now = new Date();
        const due = parseISO(result.dueDate);
        const diffMs = due.getTime() - now.getTime();
        // 1 minute
        expect(diffMs).toBeGreaterThan(50000);
    });

    it('should repeat step on Hard', () => {
        const card = createMockCard('learning', 1); // Step 1 (10m)
        const result = calculateNextReview(card, 'Hard', undefined, learningSteps);

        expect(result.status).toBe('learning');
        expect(result.learningStep).toBe(1); // Stay at step 1

        const now = new Date();
        const due = parseISO(result.dueDate);
        const diffMs = due.getTime() - now.getTime();
        // 10 minutes
        expect(diffMs).toBeGreaterThan(590000);
    });
});
