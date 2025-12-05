import { useDeckActions } from './DeckActionsContext';
import { useDeckStats } from './DeckStatsContext';
import { useSessionState } from './SessionContext';

// Re-export new hooks for direct usage
export { useDeckActions } from './DeckActionsContext';
export { useDeckStats } from './DeckStatsContext';
export { useSessionState } from './SessionContext';

/**
 * @deprecated Use useDeckStats, useDeckActions, or useSessionState instead.
 * This hook combines all contexts and will cause re-renders on any change.
 */
export const useDeck = () => {
  const stats = useDeckStats();
  const actions = useDeckActions();
  const session = useSessionState();

  return {
    ...stats,
    ...actions,
    ...session,
    // Map legacy properties if needed
    reviewsToday: session.reviewsToday,
    dataVersion: 0, // Legacy
  };
};

/**
 * @deprecated Use useDeckStats or useSessionState instead.
 */
export const useDeckState = () => {
  const stats = useDeckStats();
  const session = useSessionState();
  return { ...stats, ...session, dataVersion: 0 };
};

/**
 * @deprecated Use useDeckActions instead.
 */
export const useDeckDispatch = () => {
  return useDeckActions();
};
