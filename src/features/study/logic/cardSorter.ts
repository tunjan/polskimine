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
        // Mixed mode: Shuffle all cards to promote interleaving (Generative Learning).
        // This breaks up "blocks" of related cards (e.g. same topic/deck) 
        // and treats all due cards as a single pool.
        const shuffled = [...cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    const newCards = dateSorted.filter(c => isNewCard(c));
    const reviewCards = dateSorted.filter(c => !isNewCard(c));

    if (order === 'reviewFirst') {
        return [...reviewCards, ...newCards];
    }

    // Default to 'newFirst' for safety (and for 'newFirst' case)
    return [...newCards, ...reviewCards];
};
