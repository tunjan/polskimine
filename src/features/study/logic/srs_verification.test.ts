import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateNextReview } from './srs';
import { Card, UserSettings } from '@/types';
import { sortCards } from './cardSorter';
import { State } from 'ts-fsrs';
import { addMinutes } from 'date-fns';

describe('SRS Optimization Verification', () => {
    const mockCard: Card = {
        id: '1',
        targetSentence: 'test',
        nativeTranslation: 'test',
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        notes: '',
        reps: 0,
        lapses: 0,
        state: State.New
    };

    const mockSettings: UserSettings['fsrs'] = {
        request_retention: 0.9,
        maximum_interval: 365,
        enable_fuzzing: false
    };

    it('should implement explicit learning steps (1m)', () => {
        const result = calculateNextReview(mockCard, 'Again', mockSettings, [1, 10]);
        const now = new Date(result.last_review || new Date());
        const due = new Date(result.dueDate);
        const diffMinutes = (due.getTime() - now.getTime()) / 60000;

        expect(result.status).toBe('learning');
        expect(result.learningStep).toBe(0);
        expect(Math.round(diffMinutes)).toBe(1);
        expect(result.scheduled_days).toBe(0);
        expect(result.precise_interval).toBeCloseTo(1 / (24 * 60));
    });

    it('should graduate to second step (10m) on Good', () => {
        const step0Card: Card = { ...mockCard, status: 'learning', learningStep: 0, state: State.Learning };

        const result = calculateNextReview(step0Card, 'Good', mockSettings, [1, 10]);

        const now = new Date(result.last_review || new Date());
        const due = new Date(result.dueDate);
        const diffMinutes = (due.getTime() - now.getTime()) / 60000;

        expect(result.status).toBe('learning');
        expect(result.learningStep).toBe(1);
        expect(Math.round(diffMinutes)).toBe(10);
        expect(result.scheduled_days).toBe(0);
        expect(result.precise_interval).toBeCloseTo(10 / (24 * 60));
    });

    it('should graduate to FSRS Review on finishing steps', () => {
        const step1Card: Card = { ...mockCard, status: 'learning', learningStep: 1, state: State.Learning };

        const result = calculateNextReview(step1Card, 'Good', mockSettings, [1, 10]);


        expect(result.scheduled_days).toBeGreaterThan(0);
        expect(Number.isInteger(result.scheduled_days)).toBe(true); expect(result.precise_interval).toBeGreaterThan(0);

        expect(result.learningStep).toBeUndefined();
    });

    it('should fallback to 1st step on Again during learning', () => {
        const step1Card: Card = { ...mockCard, status: 'learning', learningStep: 1, state: State.Learning };
        const result = calculateNextReview(step1Card, 'Again', mockSettings, [1, 10]);

        expect(result.learningStep).toBe(0);
        expect(result.scheduled_days).toBe(0);
    });

    it('should interleave cards in mixed mode', () => {
        const cards: Card[] = Array.from({ length: 100 }, (_, i) => ({
            ...mockCard,
            id: String(i),
            dueDate: '2023-01-01T00:00:00Z'
        }));

        const sorted = sortCards(cards, 'mixed');

        const isSameOrder = sorted.every((c, i) => c.id === String(i));
        expect(isSameOrder).toBe(false);

        expect(sorted.length).toBe(100);
        const ids = new Set(sorted.map(c => c.id));
        expect(ids.size).toBe(100);
    });

    it('should not crash when calculating review with invalid inputs (regression test)', () => {
        // Trigger NaN interval by graduating to a NaN step
        // [1, NaN]: First step is 1, second is NaN.
        // Card starts at step 0 (implicit). 'Good' moves to step 1 (NaN).
        const result = calculateNextReview(mockCard, 'Good', mockSettings, [1, NaN]);

        // Should return a valid date (fallback to now/safe default) and not throw
        expect(new Date(result.dueDate).toString()).not.toBe('Invalid Date');
        expect(() => new Date(result.dueDate).toISOString()).not.toThrow();
    });
});
