import { useMemo } from 'react';
import { Card, UserSettings, Grade } from '@/types';
import { calculateNextReview } from '@/features/study/logic/srs';
import { formatInterval } from '@/utils/formatInterval';
import { parseISO, differenceInMilliseconds } from 'date-fns';

export const useReviewIntervals = (
    card: Card | undefined,
    settings: UserSettings
): Record<Grade, string> => {
    return useMemo(() => {
        if (!card) {
            return { Again: '', Hard: '', Good: '', Easy: '' };
        }

        const now = new Date();
        const calculate = (grade: Grade) => {
            const next = calculateNextReview(card, grade, settings.fsrs, settings.learningSteps);
            const due = parseISO(next.dueDate);
            const diff = differenceInMilliseconds(due, now);
            return formatInterval(Math.max(0, diff));
        };

        return {
            Again: calculate('Again'),
            Hard: calculate('Hard'),
            Good: calculate('Good'),
            Easy: calculate('Easy'),
        };
    }, [card, settings.fsrs, settings.learningSteps]);
};
