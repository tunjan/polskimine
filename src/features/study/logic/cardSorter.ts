import { Card } from '@/types';

export type CardOrder = 'newFirst' | 'reviewFirst' | 'mixed';

import { isNewCard } from '@/services/studyLimits';

export const sortCards = (cards: Card[], order: CardOrder): Card[] => {
    if (cards.length === 0) return [];

    // Always keep a stable sort for stability within groups (by due date)
    const dateSorted = [...cards].sort((a, b) => {
        // If due dates are equal, sort by ID for consistency
        const dateComparison = (a.dueDate || '').localeCompare(b.dueDate || '');
        if (dateComparison !== 0) return dateComparison;
        return (a.id || '').localeCompare(b.id || '');
    });

    if (order === 'mixed') {
        // Mixed usually implies "just let them mingle", but practically often means
        // "interleaved" or "randomized".
        // However, usually in SRS "mixed" just means "don't prioritize by type, just by due date".
        // Since `getDueCards` returns them sorted by date, `dateSorted` is effectively "mixed"
        // in terms of type, but strictly ordered by urgency.
        // If we wanted true randomization we'd shuffle, but SRS usually prioritizes urgency.
        // Let's stick with date-sorted for 'mixed' as it's the most sensible default.
        return dateSorted;
    }

    const newCards = dateSorted.filter(c => isNewCard(c));
    const reviewCards = dateSorted.filter(c => !isNewCard(c));

    if (order === 'newFirst') {
        return [...newCards, ...reviewCards];
    }

    if (order === 'reviewFirst') {
        return [...reviewCards, ...newCards];
    }

    return dateSorted;
};
