import { Card } from '@/types';

export type CardOrder = 'newFirst' | 'reviewFirst' | 'mixed';

import { isNewCard } from '@/services/studyLimits';

export const sortCards = (cards: Card[], order: CardOrder): Card[] => {
    if (cards.length === 0) return [];

    const dateSorted = [...cards].sort((a, b) => {
        const dateComparison = (a.dueDate || '').localeCompare(b.dueDate || '');
        if (dateComparison !== 0) return dateComparison;
        return (a.id || '').localeCompare(b.id || '');
    });

    if (order === 'mixed') {
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

    return [...newCards, ...reviewCards];
};
