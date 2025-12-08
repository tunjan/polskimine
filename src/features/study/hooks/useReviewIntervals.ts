import { useMemo } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview } from '@/core/srs/scheduler';
import { formatInterval } from '@/utils/formatInterval';
import { parseISO, differenceInMilliseconds } from 'date-fns';

export const useReviewIntervals = (
    card: Card | undefined,
    fsrs: UserSettings['fsrs'],
    learningSteps: number[]
): Record<Grade, string> => {
    return useMemo(() => {
        if (!card) {
            return { Again: '', Hard: '', Good: '', Easy: '' };
        }

        const now = new Date();
        const calculate = (grade: Grade) => {
            try {
                const next = calculateNextReview(card, grade, fsrs, learningSteps);
                const due = parseISO(next.dueDate);
                if (isNaN(due.getTime())) {
                    console.warn('[useReviewIntervals] Invalid dueDate from calculateNextReview:', next.dueDate);
                    return '<1m';
                }
                const diff = differenceInMilliseconds(due, now);
                return formatInterval(Math.max(0, diff));
            } catch (error) {
                console.error('[useReviewIntervals] Error calculating interval:', error);
                return '<1m';
            }
        };

        return {
            Again: calculate('Again'),
            Hard: calculate('Hard'),
            Good: calculate('Good'),
            Easy: calculate('Easy'),
        };
    }, [card, fsrs, learningSteps]);
};
