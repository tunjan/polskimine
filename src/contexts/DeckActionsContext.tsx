import React, { createContext, useContext, useCallback } from 'react';
import { Card, Grade } from '@/types';
import { CardXpPayload } from '@/features/xp/xpUtils';
import { useRecordReviewMutation, useUndoReviewMutation } from '@/features/deck/hooks/useDeckQueries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUTCDateString } from '@/constants';
import { getSRSDate } from '@/features/study/logic/srs';
import { useSessionDispatch } from './SessionContext';

interface DeckDispatch {
    recordReview: (card: Card, grade: Grade, xpPayload?: CardXpPayload) => Promise<void>;
    undoReview: () => Promise<void>;
    refreshDeckData: () => void;
}

const DeckActionsContext = createContext<DeckDispatch | undefined>(undefined);

export const DeckActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const recordReviewMutation = useRecordReviewMutation();
    const undoReviewMutation = useUndoReviewMutation();
    const { setLastReview, getLastReview, clearLastReview } = useSessionDispatch();

    const recordReview = useCallback(async (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => {
        const today = getUTCDateString(getSRSDate(new Date()));
        const xpEarned = xpPayload?.totalXp ?? 0;

        // Optimistically update session state
        setLastReview({ card: oldCard, date: today, xpEarned });

        try {
            await recordReviewMutation.mutateAsync({ card: oldCard, grade, xpPayload });
        } catch (error) {
            console.error("Failed to record review", error);
            toast.error("Failed to save review progress");
            // Revert session state if failed (check if it's still the same review)
            const currentLast = getLastReview();
            if (currentLast?.card.id === oldCard.id) {
                clearLastReview();
            }
        }
    }, [recordReviewMutation, setLastReview, getLastReview, clearLastReview]);

    const undoReview = useCallback(async () => {
        const lastReview = getLastReview();
        if (!lastReview) return;
        const { card, date, xpEarned } = lastReview;

        try {
            await undoReviewMutation.mutateAsync({ card, date, xpEarned });
            clearLastReview();
            toast.success('Review undone');
        } catch (error) {
            console.error("Failed to undo review", error);
            toast.error("Failed to undo review");
        }
    }, [getLastReview, undoReviewMutation, clearLastReview]);

    const refreshDeckData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['deckStats'] });
        queryClient.invalidateQueries({ queryKey: ['dueCards'] });
        queryClient.invalidateQueries({ queryKey: ['reviewsToday'] });
        queryClient.invalidateQueries({ queryKey: ['history'] });
        queryClient.invalidateQueries({ queryKey: ['cards'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardCards'] });
    }, [queryClient]);

    const value = {
        recordReview,
        undoReview,
        refreshDeckData,
    };

    return (
        <DeckActionsContext.Provider value={value}>
            {children}
        </DeckActionsContext.Provider>
    );
};

export const useDeckActions = () => {
    const context = useContext(DeckActionsContext);
    if (context === undefined) {
        throw new Error('useDeckActions must be used within a DeckActionsProvider');
    }
    return context;
};
