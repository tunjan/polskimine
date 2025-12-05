import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Card } from '@/types';
import { useReviewsTodayQuery } from '@/features/deck/hooks/useDeckQueries';

interface SessionState {
    reviewsToday: { newCards: number; reviewCards: number };
    lastReview: { card: Card; date: string; xpEarned: number } | null;
    canUndo: boolean;
    isLoading: boolean;
}

interface SessionDispatch {
    setLastReview: (review: { card: Card; date: string; xpEarned: number } | null) => void;
    getLastReview: () => { card: Card; date: string; xpEarned: number } | null;
    clearLastReview: () => void;
}

const SessionStateContext = createContext<SessionState | undefined>(undefined);
const SessionDispatchContext = createContext<SessionDispatch | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: reviewsToday, isLoading } = useReviewsTodayQuery();
    const [lastReview, setLastReviewState] = useState<{ card: Card; date: string; xpEarned: number } | null>(null);

    // We need a ref-like getter for actions to avoid circular dependencies or stale closures if we used state directly in callbacks
    // But since we are splitting contexts, we can just expose the setter.

    const setLastReview = useCallback((review: { card: Card; date: string; xpEarned: number } | null) => {
        setLastReviewState(review);
    }, []);

    const clearLastReview = useCallback(() => {
        setLastReviewState(null);
    }, []);

    // Helper to get current value imperatively if needed (though usually passed via state)
    // Actually, for the Actions context to use it without subscribing to State context updates, 
    // we might need a mutable ref approach or just accept that Actions context might need to read from State context?
    // No, Actions context shouldn't depend on State context values if we want to avoid re-renders.
    // But undoReview NEEDS lastReview.
    // So Actions context will likely need to consume SessionStateContext, which means it WILL re-render when session changes.
    // That's fine, as long as the *consumers* of Actions don't re-render if they only use the functions.
    // But if ActionsContext value depends on SessionState, then ActionsContext value changes, causing consumers to re-render.
    // Solution: Use a Ref for lastReview in the provider, and expose a getter.

    const lastReviewRef = React.useRef<{ card: Card; date: string; xpEarned: number } | null>(null);

    const setLastReviewWithRef = useCallback((review: { card: Card; date: string; xpEarned: number } | null) => {
        lastReviewRef.current = review;
        setLastReviewState(review);
    }, []);

    const clearLastReviewWithRef = useCallback(() => {
        lastReviewRef.current = null;
        setLastReviewState(null);
    }, []);

    const getLastReview = useCallback(() => {
        return lastReviewRef.current;
    }, []);

    const stateValue = useMemo(() => ({
        reviewsToday: reviewsToday || { newCards: 0, reviewCards: 0 },
        lastReview,
        canUndo: !!lastReview,
        isLoading
    }), [reviewsToday, lastReview, isLoading]);

    const dispatchValue = useMemo(() => ({
        setLastReview: setLastReviewWithRef,
        getLastReview,
        clearLastReview: clearLastReviewWithRef
    }), [setLastReviewWithRef, getLastReview, clearLastReviewWithRef]);

    return (
        <SessionStateContext.Provider value={stateValue}>
            <SessionDispatchContext.Provider value={dispatchValue}>
                {children}
            </SessionDispatchContext.Provider>
        </SessionStateContext.Provider>
    );
};

export const useSessionState = () => {
    const context = useContext(SessionStateContext);
    if (context === undefined) {
        throw new Error('useSessionState must be used within a SessionProvider');
    }
    return context;
};

export const useSessionDispatch = () => {
    const context = useContext(SessionDispatchContext);
    if (context === undefined) {
        throw new Error('useSessionDispatch must be used within a SessionProvider');
    }
    return context;
};
